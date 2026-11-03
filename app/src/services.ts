import type { Db } from './db.js'
import { audit } from './db.js'
import type { Storage } from './storage.js'
import type { CallRow, EventRow } from './context.js'
import type { Person } from './views/layout.js'
import { sendEmail } from './mail.js'
import { checkPdf } from './pdf.js'
import { certCode, fmtDateTime, OUTCOME_LABEL, slugify, token } from './util.js'
import { suggestAssignments, conflictReason, type Proposal, type Shortfall } from './assignment.js'

export class ValidationError extends Error {
  constructor(public errors: string[], public warnings: string[] = []) {
    super(errors.join(' '))
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const isEmail = (e: string) => EMAIL_RE.test(e.trim())
export const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

// ---------------------------------------------------------------- pessoas e login
export async function findOrCreatePerson(db: Db, email: string, name = '', affiliation = ''): Promise<Person> {
  const e = email.trim().toLowerCase()
  const existing = await db.one<Person>('SELECT * FROM person WHERE email=$1', [e])
  if (existing) {
    if ((!existing.name && name) || (!existing.affiliation && affiliation)) {
      return (await db.one<Person>(
        `UPDATE person SET name=COALESCE(NULLIF(name,''),$2), affiliation=COALESCE(NULLIF(affiliation,''),$3) WHERE id=$1 RETURNING *`,
        [existing.id, name, affiliation],
      ))!
    }
    return existing
  }
  const p = (await db.one<Person>('INSERT INTO person (email, name, affiliation) VALUES ($1,$2,$3) RETURNING *', [e, name, affiliation]))!
  // vincula coautorias anteriores feitas com este e-mail
  await db.query('UPDATE submission_author SET person_id=$1 WHERE lower(email)=$2 AND person_id IS NULL', [p.id, e])
  return p
}

export async function createLoginLink(db: Db, baseUrl: string, email: string, redirectTo = '/minha-area') {
  const t = token()
  await db.query(`INSERT INTO login_token (token, email, redirect_to, expires_at) VALUES ($1,$2,$3, now() + interval '15 minutes')`, [
    t,
    email.trim().toLowerCase(),
    redirectTo.startsWith('/') ? redirectTo : '/minha-area',
  ])
  return `${baseUrl}/entrar/${t}`
}

/** Consome o link mágico (uso único, 15 min). Retorna a sessão criada. */
export async function consumeLoginToken(db: Db, t: string) {
  const row = await db.one<{ email: string; redirect_to: string }>(
    `UPDATE login_token SET used_at=now() WHERE token=$1 AND used_at IS NULL AND expires_at > now() RETURNING email, redirect_to`,
    [t],
  )
  if (!row) return null
  const person = await findOrCreatePerson(db, row.email)
  const sid = token(32)
  await db.query(`INSERT INTO session (id, person_id, expires_at) VALUES ($1,$2, now() + interval '14 days')`, [sid, person.id])
  return { sid, person, redirectTo: row.redirect_to }
}

// ---------------------------------------------------------------- organizações e eventos
export async function createOrganization(db: Db, user: Person, name: string) {
  if (name.trim().length < 3) throw new ValidationError(['Informe o nome da organização.'])
  let slug = slugify(name) || 'org'
  if (await db.one('SELECT 1 FROM organization WHERE slug=$1', [slug])) slug = `${slug}-${token(3).toLowerCase()}`
  return db.tx(async (t) => {
    const org = (await t.one<{ id: string; slug: string }>('INSERT INTO organization (name, slug) VALUES ($1,$2) RETURNING id, slug', [name.trim(), slug]))!
    await t.query(`INSERT INTO org_member (org_id, person_id, role) VALUES ($1,$2,'owner')`, [org.id, user.id])
    await audit(t, { orgId: org.id, actorId: user.id, action: 'org.create', entity: 'organization', entityId: org.id })
    return org
  })
}

export const TEMPLATES: Record<
  string,
  { label: string; description: string; tracks: string[]; types: string[]; criteria: [string, number][]; reviewMode: 'single' | 'double'; perSub: number; maxPages: number; guidelines: string }
> = {
  'mostra-ic': {
    label: 'Mostra de Iniciação Científica',
    description: 'Trabalhos de estudantes de graduação orientados por docentes. Resumos expandidos, avaliação simples-cega.',
    tracks: ['Ciências Exatas e da Terra', 'Ciências Biológicas e da Saúde', 'Engenharias e Tecnologia', 'Ciências Humanas e Sociais', 'Linguística, Letras e Artes'],
    types: ['Resumo expandido', 'Pôster'],
    criteria: [['Clareza e organização do texto', 5], ['Metodologia', 5], ['Resultados e discussão', 5], ['Relevância', 5]],
    reviewMode: 'single',
    perSub: 2,
    maxPages: 4,
    guidelines: 'Resumo expandido de até 4 páginas em PDF, com introdução, objetivos, metodologia, resultados e referências. Até 3 trabalhos por autor.',
  },
  'seminario-ppg': {
    label: 'Seminário de Pós-Graduação',
    description: 'Trabalhos de mestrandos e doutorandos de um programa. Artigos completos, avaliação duplo-cega.',
    tracks: ['Linha de pesquisa 1', 'Linha de pesquisa 2', 'Linha de pesquisa 3'],
    types: ['Artigo completo', 'Resumo'],
    criteria: [['Originalidade', 5], ['Fundamentação teórica', 5], ['Rigor metodológico', 5], ['Contribuição para a área', 5]],
    reviewMode: 'double',
    perSub: 2,
    maxPages: 15,
    guidelines: 'Artigo completo de até 15 páginas, sem identificação dos autores no arquivo (avaliação duplo-cega).',
  },
  congresso: {
    label: 'Congresso ou simpósio',
    description: 'Evento aberto à comunidade, com eixos temáticos e avaliação duplo-cega.',
    tracks: ['Eixo temático 1', 'Eixo temático 2', 'Eixo temático 3', 'Eixo temático 4'],
    types: ['Resumo', 'Resumo expandido', 'Artigo completo'],
    criteria: [['Aderência ao eixo', 5], ['Qualidade científica', 5], ['Clareza', 5]],
    reviewMode: 'double',
    perSub: 2,
    maxPages: 12,
    guidelines: 'Siga o modelo do evento. O arquivo não deve conter nomes dos autores.',
  },
}

export async function createEventFromTemplate(
  db: Db,
  user: Person,
  orgId: string,
  f: { title: string; edition: string; template: string; opensAt: Date; closesAt: Date; startsOn?: string; endsOn?: string },
) {
  const tpl = TEMPLATES[f.template]
  const errors: string[] = []
  if (!tpl) errors.push('Escolha um modelo.')
  if (f.title.trim().length < 3) errors.push('Informe o título do evento.')
  if (!(f.opensAt < f.closesAt)) errors.push('O fim das submissões precisa ser depois da abertura.')
  if (errors.length) throw new ValidationError(errors)
  let slug = slugify(`${f.title} ${f.edition}`)
  if (await db.one('SELECT 1 FROM event WHERE org_id=$1 AND slug=$2', [orgId, slug])) slug = `${slug}-${token(3).toLowerCase()}`
  return db.tx(async (t) => {
    const ev = (await t.one<{ id: string }>(
      `INSERT INTO event (org_id, slug, title, edition, description, starts_on, ends_on) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [orgId, slug, f.title.trim(), f.edition.trim(), tpl.description, f.startsOn || null, f.endsOn || null],
    ))!
    const reviewDue = new Date(f.closesAt.getTime() + 21 * 86400000)
    await t.query(
      `INSERT INTO call (event_id, org_id, opens_at, closes_at, review_due_at, review_mode, reviews_per_submission, max_pages, guidelines)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [ev.id, orgId, f.opensAt, f.closesAt, reviewDue, tpl.reviewMode, tpl.perSub, tpl.maxPages, tpl.guidelines],
    )
    for (const [i, n] of tpl.tracks.entries()) await t.query('INSERT INTO track (event_id, name, position) VALUES ($1,$2,$3)', [ev.id, n, i])
    for (const [i, n] of tpl.types.entries()) await t.query('INSERT INTO submission_type (event_id, name, position) VALUES ($1,$2,$3)', [ev.id, n, i])
    for (const [i, [n, m]] of tpl.criteria.entries())
      await t.query('INSERT INTO review_criterion (event_id, name, max_score, position) VALUES ($1,$2,$3,$4)', [ev.id, n, m, i])
    await audit(t, { orgId, actorId: user.id, action: 'event.create', entity: 'event', entityId: ev.id, data: { template: f.template } })
    return ev
  })
}

/** Clona a configuração de uma edição (eixos, modalidades, critérios, regras e avaliadores convidáveis), com datas +1 ano. */
export async function cloneEvent(db: Db, user: Person, src: EventRow, call: CallRow, f: { title: string; edition: string }) {
  const shift = (d: Date | string | null) => (d ? new Date(new Date(d).getTime() + 365 * 86400000) : null)
  let slug = slugify(`${f.title} ${f.edition}`)
  if (await db.one('SELECT 1 FROM event WHERE org_id=$1 AND slug=$2', [src.org_id, slug])) slug = `${slug}-${token(3).toLowerCase()}`
  return db.tx(async (t) => {
    const ev = (await t.one<{ id: string }>(
      `INSERT INTO event (org_id, slug, title, edition, description, format, location, primary_color, cloned_from, starts_on, ends_on)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [src.org_id, slug, f.title, f.edition, src.description, src.format, src.location, src.primary_color, src.id, shift(src.starts_on), shift(src.ends_on)],
    ))!
    await t.query(
      `INSERT INTO call (event_id, org_id, opens_at, closes_at, review_due_at, review_mode, reviews_per_submission, max_per_author, max_pages, max_mb, same_institution_conflict, guidelines)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [ev.id, src.org_id, shift(call.opens_at), shift(call.closes_at), shift(call.review_due_at), call.review_mode, call.reviews_per_submission, call.max_per_author, call.max_pages, call.max_mb, call.same_institution_conflict, call.guidelines],
    )
    const trackMap = new Map<string, string>()
    for (const tr of await t.query('SELECT * FROM track WHERE event_id=$1 ORDER BY position', [src.id])) {
      const n = (await t.one<{ id: string }>('INSERT INTO track (event_id, name, position) VALUES ($1,$2,$3) RETURNING id', [ev.id, tr.name, tr.position]))!
      trackMap.set(tr.id, n.id)
    }
    await t.query('INSERT INTO submission_type (event_id, name, position) SELECT $1, name, position FROM submission_type WHERE event_id=$2', [ev.id, src.id])
    await t.query('INSERT INTO review_criterion (event_id, name, max_score, position) SELECT $1, name, max_score, position FROM review_criterion WHERE event_id=$2', [ev.id, src.id])
    // avaliadores que aceitaram na edição anterior entram como "convidados" na nova (precisam aceitar de novo)
    for (const r of await t.query(`SELECT * FROM reviewer WHERE event_id=$1 AND status='accepted'`, [src.id])) {
      const nr = (await t.one<{ id: string }>('INSERT INTO reviewer (event_id, person_id, max_load) VALUES ($1,$2,$3) RETURNING id', [ev.id, r.person_id, r.max_load]))!
      for (const rt of await t.query('SELECT track_id FROM reviewer_track WHERE reviewer_id=$1', [r.id])) {
        const nt = trackMap.get(rt.track_id)
        if (nt) await t.query('INSERT INTO reviewer_track VALUES ($1,$2)', [nr.id, nt])
      }
    }
    await audit(t, { orgId: src.org_id, actorId: user.id, action: 'event.clone', entity: 'event', entityId: ev.id, data: { from: src.id } })
    return ev
  })
}

// ---------------------------------------------------------------- submissão
export type AuthorInput = { name: string; email: string; affiliation: string }

export async function submitWork(
  db: Db,
  storage: Storage,
  ev: EventRow,
  call: CallRow,
  user: Person,
  f: { trackId: string; typeId: string; title: string; abstract: string; keywords: string; authors: AuthorInput[]; correspondingIndex: number; file: Uint8Array | null; acceptRules: boolean },
  now = new Date(),
) {
  const errors: string[] = []
  if (now < new Date(call.opens_at) || now > new Date(call.closes_at)) errors.push('A chamada de trabalhos não está aberta.')
  if (!isUuid(f.trackId) || !(await db.one('SELECT 1 FROM track WHERE id=$1 AND event_id=$2', [f.trackId, ev.id]))) errors.push('Escolha um eixo temático.')
  if (!isUuid(f.typeId) || !(await db.one('SELECT 1 FROM submission_type WHERE id=$1 AND event_id=$2', [f.typeId, ev.id]))) errors.push('Escolha uma modalidade.')
  if (f.title.trim().length < 5) errors.push('Informe o título (mínimo de 5 caracteres).')
  if (f.abstract.trim().length < 50) errors.push('O resumo precisa ter pelo menos 50 caracteres.')
  if (f.abstract.length > 3000) errors.push('O resumo pode ter no máximo 3.000 caracteres.')
  const authors = f.authors.filter((a) => a.name.trim() || a.email.trim())
  if (authors.length === 0) errors.push('Informe pelo menos um autor.')
  authors.forEach((a, i) => {
    if (!a.name.trim()) errors.push(`Autor ${i + 1}: informe o nome.`)
    if (!isEmail(a.email)) errors.push(`Autor ${i + 1}: e-mail inválido.`)
  })
  const emails = authors.map((a) => a.email.trim().toLowerCase())
  if (new Set(emails).size !== emails.length) errors.push('Há autores repetidos (mesmo e-mail).')
  if (!emails.includes(user.email)) errors.push('Você precisa estar na lista de autores (com o e-mail da sua conta).')
  if (!f.acceptRules) errors.push('Confirme que leu e aceita as regras da chamada.')
  if (!f.file) errors.push('Envie o arquivo do trabalho em PDF.')

  // limite de trabalhos por autor
  for (const e of emails) {
    const n = await db.one<{ n: number }>(
      `SELECT count(*)::int AS n FROM submission_author sa JOIN submission s ON s.id=sa.submission_id
       WHERE s.event_id=$1 AND lower(sa.email)=$2 AND s.status<>'withdrawn'`,
      [ev.id, e],
    )
    if ((n?.n ?? 0) >= call.max_per_author) errors.push(`${e} já atingiu o limite de ${call.max_per_author} trabalhos neste evento.`)
  }

  let check: Awaited<ReturnType<typeof checkPdf>> | null = null
  if (f.file) {
    check = await checkPdf(f.file, {
      maxPages: call.max_pages,
      maxMb: call.max_mb,
      authorNames: authors.map((a) => a.name),
      doubleBlind: call.review_mode === 'double',
    })
    errors.push(...check.blocking)
  }
  if (errors.length) throw new ValidationError(errors, check?.warnings ?? [])

  const key = await storage.put(`org/${ev.org_id}/sub`, check!.cleaned)
  return db.tx(async (t) => {
    const seq = await t.one<{ n: number }>('SELECT count(*)::int + 1 AS n FROM submission WHERE event_id=$1', [ev.id])
    const prefix = (ev.slug.replace(/[^a-z]/g, '').slice(0, 4) || 'cv').toUpperCase()
    const code = `${prefix}-${String(seq!.n).padStart(4, '0')}`
    const s = (await t.one<{ id: string; code: string }>(
      `INSERT INTO submission (org_id, event_id, code, track_id, type_id, title, abstract, keywords, submitter_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, code`,
      [ev.org_id, ev.id, code, f.trackId, f.typeId, f.title.trim(), f.abstract.trim(), f.keywords.trim(), user.id],
    ))!
    for (const [i, a] of authors.entries()) {
      const p = await t.one<{ id: string }>('SELECT id FROM person WHERE email=$1', [a.email.trim().toLowerCase()])
      await t.query(
        'INSERT INTO submission_author (submission_id, position, person_id, name, email, affiliation, is_corresponding) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [s.id, i + 1, p?.id ?? null, a.name.trim(), a.email.trim().toLowerCase(), a.affiliation.trim(), i === f.correspondingIndex],
      )
    }
    await t.query(
      `INSERT INTO submission_file (org_id, submission_id, version, storage_key, bytes, pages, sha256, check_report) VALUES ($1,$2,1,$3,$4,$5,$6,$7)`,
      [ev.org_id, s.id, key, check!.bytes, check!.pages, check!.sha256, JSON.stringify({ warnings: check!.warnings, metadataRemoved: check!.metadataRemoved })],
    )
    await audit(t, { orgId: ev.org_id, actorId: user.id, action: 'submission.create', entity: 'submission', entityId: s.id })
    for (const a of authors)
      await sendEmail(t, {
        orgId: ev.org_id,
        to: a.email,
        subject: `[${ev.title}] Trabalho recebido: ${s.code}`,
        body: `Olá, ${a.name}.\n\nRecebemos o trabalho "${f.title.trim()}" (código ${s.code}), submetido por ${user.name || user.email}.\n\nVocê pode acompanhar o andamento em Minha área, entrando com este e-mail.\nPrazo de submissão: ${fmtDateTime(call.closes_at)}.\n\nCienvia`,
      })
    return { ...s, warnings: check!.warnings }
  })
}

export async function withdrawSubmission(db: Db, user: Person, submissionId: string) {
  if (!isUuid(submissionId)) throw new ValidationError(['Trabalho não encontrado.'])
  const s = await db.one(
    `SELECT s.* FROM submission s JOIN submission_author sa ON sa.submission_id=s.id WHERE s.id=$1 AND lower(sa.email)=$2`,
    [submissionId, user.email],
  )
  if (!s) throw new ValidationError(['Trabalho não encontrado.'])
  if (!['submitted', 'under_review'].includes(s.status)) throw new ValidationError(['Este trabalho não pode mais ser retirado.'])
  await db.query(`UPDATE submission SET status='withdrawn', updated_at=now() WHERE id=$1`, [s.id])
  await db.query(`DELETE FROM assignment WHERE submission_id=$1 AND status='pending'`, [s.id])
  await audit(db, { orgId: s.org_id, actorId: user.id, action: 'submission.withdraw', entity: 'submission', entityId: s.id })
}

export async function uploadCorrection(db: Db, storage: Storage, user: Person, submissionId: string, file: Uint8Array | null, note: string) {
  if (!isUuid(submissionId)) throw new ValidationError(['Trabalho não encontrado.'])
  const s = await db.one(
    `SELECT s.*, c.max_pages, c.max_mb, c.review_mode FROM submission s JOIN call c ON c.event_id=s.event_id
     JOIN submission_author sa ON sa.submission_id=s.id WHERE s.id=$1 AND lower(sa.email)=$2`,
    [submissionId, user.email],
  )
  if (!s) throw new ValidationError(['Trabalho não encontrado.'])
  if (s.status !== 'accepted_with_corrections') throw new ValidationError(['Este trabalho não aguarda correções.'])
  if (!file) throw new ValidationError(['Envie o arquivo corrigido em PDF.'])
  const names = (await db.query('SELECT name FROM submission_author WHERE submission_id=$1', [s.id])).map((r) => r.name)
  const check = await checkPdf(file, { maxPages: s.max_pages, maxMb: s.max_mb, authorNames: names, doubleBlind: s.review_mode === 'double' })
  if (!check.ok) throw new ValidationError(check.blocking, check.warnings)
  const key = await storage.put(`org/${s.org_id}/sub`, check.cleaned)
  await db.tx(async (t) => {
    const v = await t.one<{ n: number }>('SELECT max(version)+1 AS n FROM submission_file WHERE submission_id=$1', [s.id])
    await t.query(
      `INSERT INTO submission_file (org_id, submission_id, version, reason, storage_key, bytes, pages, sha256, check_report) VALUES ($1,$2,$3,'correction',$4,$5,$6,$7,$8)`,
      [s.org_id, s.id, v!.n, key, check.bytes, check.pages, check.sha256, JSON.stringify({ warnings: check.warnings, note })],
    )
    await t.query(`UPDATE submission SET status='corrected', updated_at=now() WHERE id=$1`, [s.id])
    await audit(t, { orgId: s.org_id, actorId: user.id, action: 'submission.correction', entity: 'submission', entityId: s.id })
  })
}

// ---------------------------------------------------------------- avaliadores
export async function inviteReviewer(
  db: Db,
  baseUrl: string,
  ev: EventRow,
  user: Person,
  f: { email: string; name: string; affiliation: string; trackIds: string[]; maxLoad: number },
) {
  if (!isEmail(f.email)) throw new ValidationError(['E-mail do avaliador inválido.'])
  if (!f.name.trim()) throw new ValidationError(['Informe o nome do avaliador.'])
  const p = await findOrCreatePerson(db, f.email, f.name.trim(), f.affiliation.trim())
  const existing = await db.one('SELECT id FROM reviewer WHERE event_id=$1 AND person_id=$2', [ev.id, p.id])
  if (existing) throw new ValidationError(['Esta pessoa já foi convidada para este evento.'])
  const r = (await db.one<{ id: string }>(
    'INSERT INTO reviewer (event_id, person_id, max_load) VALUES ($1,$2,$3) RETURNING id',
    [ev.id, p.id, Math.max(1, Math.min(50, f.maxLoad || 5))],
  ))!
  for (const tid of f.trackIds.filter(isUuid)) {
    if (await db.one('SELECT 1 FROM track WHERE id=$1 AND event_id=$2', [tid, ev.id])) await db.query('INSERT INTO reviewer_track VALUES ($1,$2)', [r.id, tid])
  }
  await sendInvite(db, baseUrl, ev, p)
  await audit(db, { orgId: ev.org_id, actorId: user.id, action: 'reviewer.invite', entity: 'reviewer', entityId: r.id })
  return r
}

export async function sendInvite(db: Db, baseUrl: string, ev: EventRow, p: Person) {
  const link = await createLoginLink(db, baseUrl, p.email, '/avaliacoes')
  await sendEmail(db, {
    orgId: ev.org_id,
    to: p.email,
    subject: `[${ev.title}] Convite para avaliar trabalhos`,
    body: `Olá, ${p.name}.\n\nA comissão científica de "${ev.title}" convida você para avaliar trabalhos.\n\nPara aceitar ou recusar, acesse (link válido por 15 minutos; depois disso, entre com seu e-mail em ${baseUrl}/entrar):\n${link}\n\nCienvia`,
  })
}

export async function respondInvite(db: Db, user: Person, reviewerId: string, accept: boolean, maxLoad?: number) {
  if (!isUuid(reviewerId)) throw new ValidationError(['Convite não encontrado.'])
  const r = await db.one('SELECT r.*, e.org_id FROM reviewer r JOIN event e ON e.id=r.event_id WHERE r.id=$1 AND r.person_id=$2', [reviewerId, user.id])
  if (!r) throw new ValidationError(['Convite não encontrado.'])
  await db.query('UPDATE reviewer SET status=$2, max_load=COALESCE($3, max_load) WHERE id=$1', [r.id, accept ? 'accepted' : 'declined', maxLoad ?? null])
  await audit(db, { orgId: r.org_id, actorId: user.id, action: accept ? 'reviewer.accept' : 'reviewer.decline', entity: 'reviewer', entityId: r.id })
}

// ---------------------------------------------------------------- atribuição
export async function assignmentContext(db: Db, ev: EventRow, call: CallRow) {
  const subs = await db.query(`SELECT id, code, title, track_id FROM submission WHERE event_id=$1 AND status IN ('submitted','under_review') ORDER BY code`, [ev.id])
  const authors = await db.query(
    `SELECT sa.submission_id, sa.email, sa.affiliation FROM submission_author sa JOIN submission s ON s.id=sa.submission_id WHERE s.event_id=$1`,
    [ev.id],
  )
  const revs = await db.query(
    `SELECT r.id, r.person_id, r.max_load, p.email, p.name, p.affiliation,
       COALESCE(array_agg(rt.track_id) FILTER (WHERE rt.track_id IS NOT NULL), '{}') AS track_ids,
       (SELECT count(*)::int FROM assignment a WHERE a.reviewer_id=r.id AND a.status<>'declined_conflict') AS load
     FROM reviewer r JOIN person p ON p.id=r.person_id LEFT JOIN reviewer_track rt ON rt.reviewer_id=r.id
     WHERE r.event_id=$1 AND r.status='accepted' GROUP BY r.id, p.id ORDER BY p.name`,
    [ev.id],
  )
  const existing = await db.query(
    `SELECT a.submission_id, a.reviewer_id FROM assignment a JOIN submission s ON s.id=a.submission_id WHERE s.event_id=$1 AND a.status<>'declined_conflict'`,
    [ev.id],
  )
  const declared = await db.query(
    `SELECT c.submission_id, c.person_id FROM conflict c JOIN submission s ON s.id=c.submission_id WHERE s.event_id=$1`,
    [ev.id],
  )
  const input = {
    submissions: subs.map((s) => ({
      id: s.id,
      trackId: s.track_id,
      authorEmails: authors.filter((a) => a.submission_id === s.id).map((a) => a.email),
      authorAffiliations: authors.filter((a) => a.submission_id === s.id).map((a) => a.affiliation),
    })),
    reviewers: revs.map((r) => ({ id: r.id, personId: r.person_id, email: r.email, affiliation: r.affiliation, trackIds: r.track_ids, maxLoad: r.max_load, currentLoad: r.load })),
    existing: existing.map((e) => ({ submissionId: e.submission_id, reviewerId: e.reviewer_id })),
    declaredConflicts: declared.map((d) => ({ submissionId: d.submission_id, personId: d.person_id })),
    perSubmission: call.reviews_per_submission,
    sameInstitutionConflict: call.same_institution_conflict,
  }
  return { subs, revs, input }
}

export async function suggest(db: Db, ev: EventRow, call: CallRow): Promise<{ proposals: Proposal[]; shortfalls: Shortfall[]; subs: any[]; revs: any[] }> {
  const { subs, revs, input } = await assignmentContext(db, ev, call)
  return { ...suggestAssignments(input), subs, revs }
}

export async function applyAssignments(db: Db, baseUrl: string, ev: EventRow, call: CallRow, user: Person, pairs: { submissionId: string; reviewerId: string }[]) {
  const { input } = await assignmentContext(db, ev, call)
  const declared = new Set(input.declaredConflicts.map((c) => `${c.submissionId}:${c.personId}`))
  pairs = pairs.filter((p) => isUuid(p.submissionId) && isUuid(p.reviewerId))
  const notified = new Set<string>()
  let created = 0
  const errors: string[] = []
  await db.tx(async (t) => {
    for (const p of pairs) {
      const sub = input.submissions.find((s) => s.id === p.submissionId)
      const rev = input.reviewers.find((r) => r.id === p.reviewerId)
      if (!sub || !rev) continue
      const reason = conflictReason(sub, rev, declared, input.sameInstitutionConflict)
      if (reason) {
        errors.push(`Atribuição ignorada: avaliador ${rev.email} ${reason}.`)
        continue
      }
      const r = await t.one(
        `INSERT INTO assignment (submission_id, reviewer_id, due_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`,
        [p.submissionId, p.reviewerId, call.review_due_at],
      )
      if (r) {
        created++
        notified.add(rev.email)
        await t.query(`UPDATE submission SET status='under_review', updated_at=now() WHERE id=$1 AND status='submitted'`, [p.submissionId])
      }
    }
    await audit(t, { orgId: ev.org_id, actorId: user.id, action: 'assignment.apply', entity: 'event', entityId: ev.id, data: { created } })
    for (const email of notified)
      await sendEmail(t, {
        orgId: ev.org_id,
        to: email,
        subject: `[${ev.title}] Você tem trabalhos para avaliar`,
        body: `Olá.\n\nNovos trabalhos foram atribuídos a você em "${ev.title}". Prazo dos pareceres: ${fmtDateTime(call.review_due_at)}.\n\nAcesse ${baseUrl}/avaliacoes (entre com seu e-mail).\n\nCienvia`,
      })
  })
  return { created, errors }
}

export async function removeAssignment(db: Db, ev: EventRow, user: Person, assignmentId: string) {
  if (!isUuid(assignmentId)) throw new ValidationError(['Atribuição não encontrada.'])
  const a = await db.one(
    `SELECT a.id FROM assignment a JOIN submission s ON s.id=a.submission_id WHERE a.id=$1 AND s.event_id=$2 AND a.status='pending'`,
    [assignmentId, ev.id],
  )
  if (!a) throw new ValidationError(['Atribuição não encontrada ou já concluída.'])
  await db.query('DELETE FROM assignment WHERE id=$1', [a.id])
  await audit(db, { orgId: ev.org_id, actorId: user.id, action: 'assignment.remove', entity: 'assignment', entityId: a.id })
}

// ---------------------------------------------------------------- parecer
export async function assignmentForReviewer(db: Db, user: Person, assignmentId: string) {
  if (!/^[0-9a-f-]{36}$/.test(assignmentId)) return undefined
  return db.one(
    `SELECT a.*, r.event_id, e.title AS event_title, e.org_id, c.review_mode, c.review_due_at
     FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id JOIN event e ON e.id=r.event_id JOIN call c ON c.event_id=e.id
     WHERE a.id=$1 AND r.person_id=$2`,
    [assignmentId, user.id],
  )
}

/**
 * Visão do trabalho para o avaliador. Em duplo-cego, NENHUM dado de autoria sai daqui (RNF-03).
 * Em simples-cego, o avaliador vê os autores, mas os autores não veem o avaliador.
 */
export async function reviewerSubmissionView(db: Db, submissionId: string, reviewMode: 'single' | 'double') {
  const s = await db.one(
    `SELECT s.id, s.code, s.title, s.abstract, s.keywords, s.status, t.name AS track, ty.name AS type
     FROM submission s JOIN track t ON t.id=s.track_id JOIN submission_type ty ON ty.id=s.type_id WHERE s.id=$1`,
    [submissionId],
  )
  const files = await db.query('SELECT id, version, reason, pages, created_at FROM submission_file WHERE submission_id=$1 ORDER BY version', [submissionId])
  const view: Record<string, unknown> = {
    id: s.id,
    code: s.code,
    title: s.title,
    abstract: s.abstract,
    keywords: s.keywords,
    track: s.track,
    type: s.type,
    files,
  }
  if (reviewMode === 'single') {
    view.authors = await db.query('SELECT name, affiliation FROM submission_author WHERE submission_id=$1 ORDER BY position', [submissionId])
  }
  return view
}

export async function submitReview(
  db: Db,
  user: Person,
  assignmentId: string,
  f: { scores: Record<string, number>; recommendation: string; commentAuthor: string; commentCommittee: string },
) {
  const a = await assignmentForReviewer(db, user, assignmentId)
  if (!a) throw new ValidationError(['Avaliação não encontrada.'])
  if (a.status !== 'pending') throw new ValidationError(['Este parecer já foi enviado.'])
  const criteria = await db.query('SELECT id, name, max_score FROM review_criterion WHERE event_id=$1 ORDER BY position', [a.event_id])
  const errors: string[] = []
  for (const c of criteria) {
    const v = f.scores[c.id]
    if (!Number.isInteger(v) || v < 1 || v > c.max_score) errors.push(`Dê uma nota de 1 a ${c.max_score} para "${c.name}".`)
  }
  if (!['accept', 'accept_with_corrections', 'reject'].includes(f.recommendation)) errors.push('Escolha uma recomendação.')
  if (f.commentAuthor.trim().length < 20) errors.push('Escreva um comentário ao autor com pelo menos 20 caracteres.')
  if (errors.length) throw new ValidationError(errors)
  await db.tx(async (t) => {
    for (const c of criteria) await t.query('INSERT INTO review_score VALUES ($1,$2,$3)', [a.id, c.id, f.scores[c.id]])
    await t.query('INSERT INTO review (assignment_id, recommendation, comment_author, comment_committee) VALUES ($1,$2,$3,$4)', [
      a.id,
      f.recommendation,
      f.commentAuthor.trim(),
      f.commentCommittee.trim(),
    ])
    await t.query(`UPDATE assignment SET status='done' WHERE id=$1`, [a.id])
    await audit(t, { orgId: a.org_id, actorId: user.id, action: 'review.submit', entity: 'assignment', entityId: a.id })
  })
}

export async function declareConflict(db: Db, user: Person, assignmentId: string, note: string) {
  const a = await assignmentForReviewer(db, user, assignmentId)
  if (!a || a.status !== 'pending') throw new ValidationError(['Avaliação não encontrada.'])
  await db.tx(async (t) => {
    await t.query(`UPDATE assignment SET status='declined_conflict' WHERE id=$1`, [a.id])
    await t.query(`INSERT INTO conflict (submission_id, person_id, source, note) VALUES ($1,$2,'declared',$3) ON CONFLICT DO NOTHING`, [a.submission_id, user.id, note.trim()])
    await audit(t, { orgId: a.org_id, actorId: user.id, action: 'review.conflict', entity: 'assignment', entityId: a.id })
  })
}

// ---------------------------------------------------------------- decisão e resultados
export async function decide(db: Db, baseUrl: string, ev: EventRow, call: CallRow, user: Person, submissionId: string, outcome: string, note: string) {
  if (!['accepted', 'accepted_with_corrections', 'rejected'].includes(outcome)) throw new ValidationError(['Escolha uma decisão.'])
  if (!isUuid(submissionId)) throw new ValidationError(['Trabalho não encontrado.'])
  const s = await db.one('SELECT * FROM submission WHERE id=$1 AND event_id=$2', [submissionId, ev.id])
  if (!s) throw new ValidationError(['Trabalho não encontrado.'])
  if (!['submitted', 'under_review', 'accepted', 'accepted_with_corrections', 'rejected'].includes(s.status))
    throw new ValidationError(['Este trabalho não aceita nova decisão.'])
  if (call.results_released_at && s.status !== 'submitted' && s.status !== 'under_review')
    throw new ValidationError(['Resultado já divulgado. Alterar decisões publicadas não é permitido no protótipo.'])
  await db.tx(async (t) => {
    await t.query('INSERT INTO decision (submission_id, outcome, note_to_author, decided_by) VALUES ($1,$2,$3,$4)', [s.id, outcome, note.trim(), user.id])
    await t.query('UPDATE submission SET status=$2, updated_at=now() WHERE id=$1', [s.id, outcome])
    await audit(t, { orgId: ev.org_id, actorId: user.id, action: 'decision.record', entity: 'submission', entityId: s.id, data: { outcome } })
    // decisões tomadas depois da divulgação geral são comunicadas na hora
    if (call.results_released_at) await notifyDecision(t, baseUrl, ev, s.id)
  })
}

async function notifyDecision(db: Db, baseUrl: string, ev: EventRow, submissionId: string) {
  const s = await db.one('SELECT * FROM submission WHERE id=$1', [submissionId])
  const authors = await db.query('SELECT name, email FROM submission_author WHERE submission_id=$1 ORDER BY position', [submissionId])
  const reviews = await db.query(
    `SELECT rv.comment_author FROM review rv JOIN assignment a ON a.id=rv.assignment_id WHERE a.submission_id=$1 ORDER BY rv.submitted_at`,
    [submissionId],
  )
  const dec = await db.one('SELECT note_to_author FROM decision WHERE submission_id=$1 ORDER BY decided_at DESC LIMIT 1', [submissionId])
  const parecer = reviews.map((r, i) => `Parecer ${i + 1}:\n${r.comment_author}`).join('\n\n')
  const next =
    s.status === 'accepted_with_corrections'
      ? '\nEnvie a versão corrigida pela sua área no site.'
      : s.status === 'accepted'
        ? '\nA carta de aceite e o certificado estão disponíveis na sua área.'
        : ''
  for (const a of authors)
    await sendEmail(db, {
      orgId: ev.org_id,
      to: a.email,
      subject: `[${ev.title}] Resultado do trabalho ${s.code}: ${OUTCOME_LABEL[s.status]}`,
      body: `Olá, ${a.name}.\n\nResultado da avaliação do trabalho "${s.title}" (${s.code}): ${OUTCOME_LABEL[s.status]}.\n${dec?.note_to_author ? `\nMensagem da comissão:\n${dec.note_to_author}\n` : ''}\n${parecer}\n${next}\n\nDetalhes: ${baseUrl}/minha-area\n\nCienvia`,
    })
}

export async function issueAuthorCertificates(db: Db, ev: EventRow, submissionId: string) {
  const s = await db.one('SELECT title FROM submission WHERE id=$1', [submissionId])
  for (const a of await db.query('SELECT name, email FROM submission_author WHERE submission_id=$1', [submissionId]))
    await db.query(
      `INSERT INTO certificate (event_id, person_email, person_name, kind, subject, code) VALUES ($1,$2,$3,'author',$4,$5) ON CONFLICT DO NOTHING`,
      [ev.id, a.email, a.name, s.title, certCode()],
    )
}

export async function releaseResults(db: Db, baseUrl: string, ev: EventRow, call: CallRow, user: Person) {
  if (call.results_released_at) throw new ValidationError(['Os resultados já foram divulgados.'])
  const decided = await db.query(`SELECT id, status FROM submission WHERE event_id=$1 AND status IN ('accepted','accepted_with_corrections','rejected')`, [ev.id])
  if (decided.length === 0) throw new ValidationError(['Nenhum trabalho tem decisão registrada.'])
  await db.tx(async (t) => {
    await t.query('UPDATE call SET results_released_at=now() WHERE event_id=$1', [ev.id])
    for (const s of decided) {
      await notifyDecision(t, baseUrl, ev, s.id)
      if (s.status === 'accepted') await issueAuthorCertificates(t, ev, s.id)
    }
    const reviewers = await t.query(
      `SELECT p.name, p.email, count(*)::int AS n FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id JOIN person p ON p.id=r.person_id
       WHERE r.event_id=$1 AND a.status='done' GROUP BY p.id`,
      [ev.id],
    )
    for (const r of reviewers)
      await t.query(
        `INSERT INTO certificate (event_id, person_email, person_name, kind, subject, code) VALUES ($1,$2,$3,'reviewer',$4,$5) ON CONFLICT DO NOTHING`,
        [ev.id, r.email, r.name, `${r.n} parecer(es)`, certCode()],
      )
    await audit(t, { orgId: ev.org_id, actorId: user.id, action: 'results.release', entity: 'event', entityId: ev.id, data: { decided: decided.length } })
  })
  return decided.length
}

export async function confirmCorrection(db: Db, baseUrl: string, ev: EventRow, user: Person, submissionId: string) {
  if (!isUuid(submissionId)) throw new ValidationError(['Trabalho não encontrado.'])
  const s = await db.one(`SELECT * FROM submission WHERE id=$1 AND event_id=$2 AND status='corrected'`, [submissionId, ev.id])
  if (!s) throw new ValidationError(['Trabalho não está aguardando confirmação de correção.'])
  await db.tx(async (t) => {
    await t.query('INSERT INTO decision (submission_id, outcome, note_to_author, decided_by) VALUES ($1,$2,$3,$4)', [s.id, 'accepted', 'Correções aceitas.', user.id])
    await t.query(`UPDATE submission SET status='accepted', updated_at=now() WHERE id=$1`, [s.id])
    await issueAuthorCertificates(t, ev, s.id)
    await notifyDecision(t, baseUrl, ev, s.id)
    await audit(t, { orgId: ev.org_id, actorId: user.id, action: 'decision.correction_ok', entity: 'submission', entityId: s.id })
  })
}
