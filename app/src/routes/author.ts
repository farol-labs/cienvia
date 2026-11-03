import { Hono } from 'hono'
import { html } from 'hono/html'
import { type Env, HttpError, back, callState, db, deps, publicEvent, render, requireUser } from '../context.js'
import { audit } from '../db.js'
import { submitWork, uploadCorrection, ValidationError, withdrawSubmission } from '../services.js'
import { fmtDate, fmtDateTime, OUTCOME_LABEL, STATUS_LABEL } from '../util.js'
import { statusBadge } from '../views/layout.js'

const r = new Hono<Env>()
const DECIDED = ['accepted', 'accepted_with_corrections', 'corrected', 'rejected']

/** Antes da divulgação, o autor vê "Em avaliação" mesmo que a decisão já exista. */
const authorStatus = (status: string, released: boolean) => (!released && ['accepted', 'accepted_with_corrections', 'rejected'].includes(status) ? 'under_review' : status)

const fileBytes = async (v: unknown) => (v instanceof File && v.size > 0 ? new Uint8Array(await v.arrayBuffer()) : null)

r.get('/perfil', (c) => {
  const u = requireUser(c)
  const voltar = c.req.query('voltar') ?? '/minha-area'
  return render(
    c,
    'Perfil',
    html`<div class="card" style="max-width:640px"><h1>Seu perfil</h1>
    <p class="muted">Usado em todas as submissões, avaliações e certificados. Preencha uma vez.</p>
    <form method="post" action="/perfil"><input type="hidden" name="voltar" value="${voltar}">
      <label for="name">Nome completo <span class="muted">(como deve aparecer no certificado)</span></label><input id="name" name="name" type="text" value="${u.name}" required>
      <label for="aff">Instituição</label><input id="aff" name="affiliation" type="text" value="${u.affiliation}">
      <label for="orcid">ORCID iD <span class="muted">(opcional, ex.: 0000-0002-1825-0097)</span></label><input id="orcid" name="orcid" type="text" value="${(u as any).orcid ?? ''}" pattern="\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dX]">
      <label for="lattes">Link do Currículo Lattes <span class="muted">(opcional)</span></label><input id="lattes" name="lattes_url" type="url" value="${(u as any).lattes_url ?? ''}" placeholder="http://lattes.cnpq.br/...">
      <p><button class="btn">Salvar</button></p></form></div>`,
  )
})

r.post('/perfil', async (c) => {
  const u = requireUser(c)
  const b = await c.req.parseBody()
  const name = String(b.name ?? '').trim()
  if (name.length < 3) return back(c, '/perfil', 'Informe seu nome completo.', true)
  const lattes = String(b.lattes_url ?? '').trim()
  if (lattes && !/^https?:\/\/(www\.)?lattes\.cnpq\.br\//.test(lattes)) return back(c, '/perfil', 'O link do Lattes deve começar com http://lattes.cnpq.br/', true)
  await db(c).query('UPDATE person SET name=$2, affiliation=$3, orcid=NULLIF($4,\'\'), lattes_url=NULLIF($5,\'\') WHERE id=$1', [
    u.id,
    name,
    String(b.affiliation ?? '').trim(),
    String(b.orcid ?? '').trim(),
    lattes,
  ])
  const voltar = String(b.voltar ?? '/minha-area')
  return back(c, voltar.startsWith('/') ? voltar : '/minha-area', 'Perfil salvo.')
})

r.get('/minha-area', async (c) => {
  const u = requireUser(c)
  const subs = await db(c).query(
    `SELECT DISTINCT s.id, s.code, s.title, s.status, s.submitted_at, e.title AS event_title, e.edition, c.results_released_at, c.closes_at
     FROM submission s JOIN submission_author sa ON sa.submission_id=s.id JOIN event e ON e.id=s.event_id JOIN call c ON c.event_id=e.id
     WHERE lower(sa.email)=$1 ORDER BY s.submitted_at DESC`,
    [u.email],
  )
  const certs = await db(c).query(
    `SELECT ce.code, ce.kind, ce.subject, e.title, e.edition FROM certificate ce JOIN event e ON e.id=ce.event_id WHERE ce.person_email=$1 ORDER BY ce.issued_at DESC`,
    [u.email],
  )
  const pending = await db(c).one<{ n: number }>(
    `SELECT count(*)::int AS n FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id WHERE r.person_id=$1 AND a.status='pending'`,
    [u.id],
  )
  const invites = await db(c).one<{ n: number }>(`SELECT count(*)::int AS n FROM reviewer WHERE person_id=$1 AND status='invited'`, [u.id])
  return render(
    c,
    'Minha área',
    html`<h1>Olá, ${u.name || u.email}</h1>
    ${(pending?.n ?? 0) + (invites?.n ?? 0) > 0
      ? html`<div class="alert">Você tem ${invites?.n ? `${invites.n} convite(s) para avaliar e ` : ''}${pending?.n ?? 0} parecer(es) pendente(s). <a href="/avaliacoes">Ir para Avaliações</a></div>`
      : ''}
    <h2>Meus trabalhos</h2>
    ${subs.length
      ? html`<div class="grid g2">${subs.map((s) => {
          const st = authorStatus(s.status, !!s.results_released_at)
          return html`<a class="card" style="text-decoration:none;color:inherit" href="/submissoes/${s.id}">
            <div class="row" style="justify-content:space-between"><span class="small muted">${s.code} · ${s.event_title} ${s.edition}</span>${statusBadge(st, STATUS_LABEL[st])}</div>
            <strong>${s.title}</strong>
            <div class="small muted">Enviado em ${fmtDateTime(s.submitted_at)}${st === 'accepted_with_corrections' ? ' · ação necessária: enviar correção' : ''}</div></a>`
        })}</div>`
      : html`<p class="muted">Você ainda não tem trabalhos. Coautores veem aqui os trabalhos em que foram incluídos.</p>`}
    <h2>Certificados</h2>
    ${certs.length
      ? html`<ul>${certs.map((ce) => html`<li><a href="/certificados/${ce.code}">${ce.kind === 'author' ? 'Autoria' : 'Avaliação'} · ${ce.title} ${ce.edition}</a> <span class="muted small">${ce.subject}</span></li>`)}</ul>`
      : html`<p class="muted">Nenhum certificado ainda.</p>`}
    <p class="small"><a href="/perfil">Editar perfil</a></p>`,
  )
})

async function submitPage(c: any, orgSlug: string, evSlug: string, errors: string[] = [], warnings: string[] = [], values: Record<string, any> = {}) {
  const u = requireUser(c)
  const { ev, call } = await publicEvent(c, orgSlug, evSlug)
  if (ev.status !== 'published') throw new HttpError(404, 'Evento não encontrado')
  if (callState(call) !== 'open') return render(c, 'Submissão', html`<h1>${ev.title}</h1><p>A chamada de trabalhos não está aberta.</p>`)
  const tracks = await db(c).query('SELECT id, name FROM track WHERE event_id=$1 ORDER BY position', [ev.id])
  const types = await db(c).query('SELECT id, name FROM submission_type WHERE event_id=$1 ORDER BY position', [ev.id])
  const authors: { name: string; email: string; affiliation: string }[] = values.authors ?? [{ name: u.name, email: u.email, affiliation: u.affiliation }]
  while (authors.length < 4) authors.push({ name: '', email: '', affiliation: '' })
  const v = (k: string) => values[k] ?? ''
  return render(
    c,
    `Submeter · ${ev.title}`,
    html`<p class="small"><a href="/e/${ev.org_slug}/${ev.slug}">← ${ev.title} ${ev.edition}</a></p>
    <h1>Submeter trabalho</h1>
    <p class="muted">Prazo: ${fmtDateTime(call.closes_at)} · PDF até ${call.max_pages} páginas e ${call.max_mb} MB · avaliação ${call.review_mode === 'double' ? 'duplo-cega: não identifique os autores no arquivo' : 'simples-cega'}.</p>
    ${errors.length ? html`<div class="flash err" role="alert"><strong>Corrija antes de enviar:</strong><ul>${errors.map((e) => html`<li>${e}</li>`)}</ul></div>` : ''}
    ${warnings.length ? html`<div class="alert">${warnings.map((w) => html`<div>${w}</div>`)}</div>` : ''}
    <form method="post" enctype="multipart/form-data" class="card">
      <h2>1. Modalidade e eixo</h2>
      <div class="grid g2">
        <div><label for="type">Modalidade</label><select id="type" name="type_id" required><option value="">Escolha</option>${types.map((t) => html`<option value="${t.id}" ${v('type_id') === t.id ? 'selected' : ''}>${t.name}</option>`)}</select></div>
        <div><label for="track">Eixo temático</label><select id="track" name="track_id" required><option value="">Escolha</option>${tracks.map((t) => html`<option value="${t.id}" ${v('track_id') === t.id ? 'selected' : ''}>${t.name}</option>`)}</select></div>
      </div>
      <h2>2. Dados do trabalho</h2>
      <label for="title">Título</label><input id="title" name="title" type="text" value="${v('title')}" required minlength="5">
      <label for="abstract">Resumo <span class="muted">(50 a 3.000 caracteres)</span></label><textarea id="abstract" name="abstract" required minlength="50" maxlength="3000">${v('abstract')}</textarea>
      <label for="kw">Palavras-chave <span class="muted">(separadas por ponto e vírgula)</span></label><input id="kw" name="keywords" type="text" value="${v('keywords')}">
      <h2>3. Autores</h2>
      <p class="small muted">Na ordem de autoria. Coautores não precisam ter conta: eles recebem um e-mail e podem acompanhar o trabalho entrando com o mesmo endereço. Deixe linhas extras em branco.</p>
      ${authors.map(
        (a, i) => html`<fieldset><legend>Autor(a) ${i + 1}${i === 0 ? ' (você)' : ''}</legend><div class="grid g2">
          <div><label for="an${i}">Nome</label><input id="an${i}" name="author_name" type="text" value="${a.name}" autocomplete="${i === 0 ? 'name' : 'off'}"></div>
          <div><label for="ae${i}">E-mail</label><input id="ae${i}" name="author_email" type="email" value="${a.email}"></div>
          <div><label for="aa${i}">Instituição</label><input id="aa${i}" name="author_aff" type="text" value="${a.affiliation}"></div>
          <div><label class="chk" style="margin-top:34px"><input type="radio" name="corresponding" value="${i}" ${String(values.corresponding ?? 0) === String(i) ? 'checked' : ''}> Autor(a) correspondente</label></div>
        </div></fieldset>`,
      )}
      <h2>4. Arquivo e confirmação</h2>
      <label for="file">Arquivo PDF</label><input id="file" name="arquivo" type="file" accept="application/pdf" required>
      <p class="small muted">Ao enviar, removemos automaticamente os metadados de autoria do PDF.</p>
      <label class="chk"><input type="checkbox" name="accept" value="1" required> Li as regras da chamada e confirmo que todos os autores concordam com a submissão.</label>
      <p><button class="btn teal">Enviar trabalho</button></p>
    </form>`,
  )
}

r.get('/e/:org/:ev/submeter', (c) => submitPage(c, c.req.param('org'), c.req.param('ev')))

r.post('/e/:org/:ev/submeter', async (c) => {
  const u = requireUser(c)
  const { ev, call } = await publicEvent(c, c.req.param('org'), c.req.param('ev'))
  const b = await c.req.parseBody({ all: true })
  const arr = (k: string) => ([] as unknown[]).concat(b[k] ?? []).map((x) => String(x))
  const names = arr('author_name'),
    emails = arr('author_email'),
    affs = arr('author_aff')
  const authors = names.map((n, i) => ({ name: n, email: emails[i] ?? '', affiliation: affs[i] ?? '' }))
  const form = {
    trackId: String(b.track_id ?? ''),
    typeId: String(b.type_id ?? ''),
    title: String(b.title ?? ''),
    abstract: String(b.abstract ?? ''),
    keywords: String(b.keywords ?? ''),
    authors,
    correspondingIndex: Number(b.corresponding ?? 0),
    file: await fileBytes(Array.isArray(b.arquivo) ? b.arquivo[0] : b.arquivo),
    acceptRules: b.accept === '1',
  }
  if (ev.status !== 'published') throw new HttpError(404, 'Evento não encontrado')
  try {
    const s = await submitWork(db(c), deps(c).storage, ev, call, u, form)
    const msg = `Trabalho ${s.code} enviado. Todos os autores receberam o recibo por e-mail.${s.warnings.length ? ' Atenção: ' + s.warnings.join(' ') : ''}`
    return back(c, `/submissoes/${s.id}`, msg)
  } catch (e) {
    if (e instanceof ValidationError)
      return submitPage(c, ev.org_slug, ev.slug, e.errors, e.warnings, {
        ...form,
        track_id: form.trackId,
        type_id: form.typeId,
        corresponding: form.correspondingIndex,
        authors: authors.filter((a) => a.name || a.email),
      })
    throw e
  }
})

async function loadAuthorSubmission(c: any, id: string) {
  const u = requireUser(c)
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, 'Trabalho não encontrado')
  const s = await db(c).one(
    `SELECT s.*, e.title AS event_title, e.edition, e.slug AS event_slug, e.org_id, o.slug AS org_slug, o.name AS org_name, t.name AS track, ty.name AS type,
       c.results_released_at, c.closes_at, c.review_due_at
     FROM submission s JOIN event e ON e.id=s.event_id JOIN organization o ON o.id=e.org_id JOIN call c ON c.event_id=e.id
     JOIN track t ON t.id=s.track_id JOIN submission_type ty ON ty.id=s.type_id
     WHERE s.id=$1 AND EXISTS (SELECT 1 FROM submission_author sa WHERE sa.submission_id=s.id AND lower(sa.email)=$2)`,
    [id, u.email],
  )
  if (!s) throw new HttpError(404, 'Trabalho não encontrado')
  return { s, u }
}

r.get('/submissoes/:id', async (c) => {
  const { s } = await loadAuthorSubmission(c, c.req.param('id'))
  const released = !!s.results_released_at
  const st = authorStatus(s.status, released)
  const authors = await db(c).query('SELECT * FROM submission_author WHERE submission_id=$1 ORDER BY position', [s.id])
  const files = await db(c).query('SELECT * FROM submission_file WHERE submission_id=$1 ORDER BY version', [s.id])
  const showResult = released && DECIDED.includes(s.status)
  const reviews = showResult
    ? await db(c).query(
        `SELECT rv.recommendation, rv.comment_author FROM review rv JOIN assignment a ON a.id=rv.assignment_id WHERE a.submission_id=$1 ORDER BY rv.submitted_at`,
        [s.id],
      )
    : []
  const dec = showResult ? await db(c).one('SELECT * FROM decision WHERE submission_id=$1 ORDER BY decided_at DESC LIMIT 1', [s.id]) : null
  const nextStep: Record<string, string> = {
    submitted: `Aguardando o fim das submissões (${fmtDateTime(s.closes_at)}) e a distribuição aos avaliadores.`,
    under_review: `Em avaliação. Pareceres previstos até ${fmtDateTime(s.review_due_at)}. O resultado será divulgado pela comissão.`,
    accepted: 'Trabalho aprovado. Baixe a carta de aceite e o certificado.',
    accepted_with_corrections: 'Envie a versão corrigida abaixo.',
    corrected: 'Correção enviada. A comissão vai conferir as alterações.',
    rejected: 'Trabalho não aprovado. Veja os pareceres abaixo.',
    withdrawn: 'Você retirou este trabalho.',
  }
  return render(
    c,
    s.code,
    html`<p class="small"><a href="/minha-area">← Minha área</a></p>
    <div class="row" style="justify-content:space-between"><span class="muted">${s.code} · ${s.event_title} ${s.edition}</span>${statusBadge(st, STATUS_LABEL[st])}</div>
    <h1>${s.title}</h1>
    <div class="alert ${st === 'accepted' ? 'ok' : st === 'rejected' ? 'err' : ''}"><strong>Próximo passo:</strong> ${nextStep[st]}</div>
    <div class="split">
      <div>
        <div class="card"><h2>Resumo</h2><p>${s.abstract}</p><p class="small muted">Palavras-chave: ${s.keywords || '-'} · Eixo: ${s.track} · Modalidade: ${s.type}</p></div>
        ${showResult
          ? html`<div class="card"><h2>Resultado: ${OUTCOME_LABEL[s.status] ?? STATUS_LABEL[s.status]}</h2>
            ${dec?.note_to_author ? html`<p><strong>Mensagem da comissão:</strong> ${dec.note_to_author}</p>` : ''}
            ${reviews.map((rv, i) => html`<h3>Parecer ${i + 1}</h3><p style="white-space:pre-wrap">${rv.comment_author}</p>`)}
            ${s.status === 'accepted' ? html`<p class="row"><a class="btn" href="/submissoes/${s.id}/carta">Carta de aceite</a> <a class="btn ghost" href="/minha-area">Certificados</a></p>` : ''}
            </div>`
          : ''}
        ${st === 'accepted_with_corrections'
          ? html`<form class="card" method="post" action="/submissoes/${s.id}/correcao" enctype="multipart/form-data"><h2>Enviar versão corrigida</h2>
              <label for="f">PDF corrigido</label><input id="f" type="file" name="arquivo" accept="application/pdf" required>
              <label for="n">O que foi alterado</label><textarea id="n" name="note" required></textarea><p><button class="btn teal">Enviar correção</button></p></form>`
          : ''}
      </div>
      <div>
        <div class="card"><h2>Autores</h2><ol>${authors.map((a) => html`<li>${a.name}${a.is_corresponding ? ' (correspondente)' : ''}<div class="small muted">${a.affiliation} · ${a.email}</div></li>`)}</ol></div>
        <div class="card"><h2>Linha do tempo</h2><ul class="timeline">
          <li>Enviado em ${fmtDateTime(s.submitted_at)}</li>
          ${files.map((f) => html`<li>Versão ${f.version} (${f.reason === 'initial' ? 'original' : 'correção'}), ${f.pages} páginas · <a href="/arquivos/${f.id}">baixar</a>
            ${(f.check_report?.warnings ?? []).length ? html`<div class="small muted">${f.check_report.warnings.join(' ')}</div>` : ''}</li>`)}
          ${showResult ? html`<li>Resultado divulgado em ${fmtDateTime(s.results_released_at)}</li>` : ''}
        </ul></div>
        ${['submitted', 'under_review'].includes(s.status)
          ? html`<form method="post" action="/submissoes/${s.id}/retirar" onsubmit="return confirm('Retirar este trabalho? Esta ação não pode ser desfeita.')"><button class="btn danger sm">Retirar trabalho</button></form>`
          : ''}
      </div>
    </div>`,
  )
})

r.post('/submissoes/:id/retirar', async (c) => {
  const u = requireUser(c)
  await withdrawSubmission(db(c), u, c.req.param('id'))
  return back(c, `/submissoes/${c.req.param('id')}`, 'Trabalho retirado.')
})

r.post('/submissoes/:id/correcao', async (c) => {
  const u = requireUser(c)
  const b = await c.req.parseBody()
  await uploadCorrection(db(c), deps(c).storage, u, c.req.param('id'), await fileBytes(b.arquivo), String(b.note ?? ''))
  return back(c, `/submissoes/${c.req.param('id')}`, 'Correção enviada. A comissão será avisada no painel.')
})

r.get('/submissoes/:id/carta', async (c) => {
  const { s } = await loadAuthorSubmission(c, c.req.param('id'))
  if (s.status !== 'accepted' || !s.results_released_at) throw new HttpError(404, 'Carta indisponível')
  const authors = await db(c).query('SELECT name, affiliation FROM submission_author WHERE submission_id=$1 ORDER BY position', [s.id])
  return render(
    c,
    'Carta de aceite',
    html`<p class="noprint"><button class="btn" onclick="window.print()">Imprimir / salvar em PDF</button></p>
    <div class="card" style="max-width:800px;margin:auto;padding:40px">
      <p class="muted">${s.org_name}</p><h1>Carta de aceite</h1><p>${fmtDate(new Date())}</p>
      <p>Prezados(as) ${authors.map((a) => a.name).join(', ')},</p>
      <p>Temos a satisfação de comunicar que o trabalho <strong>"${s.title}"</strong> (código ${s.code}), na modalidade ${s.type}, eixo ${s.track}, foi <strong>aprovado</strong> pela comissão científica de <strong>${s.event_title} ${s.edition}</strong>, após avaliação por pares.</p>
      <p>Atenciosamente,<br>Comissão Científica · ${s.event_title}</p>
    </div>`,
  )
})

/** Download de arquivo com checagem de permissão e registro em auditoria (RNF-02, RNF-05). */
r.get('/arquivos/:id', async (c) => {
  const u = requireUser(c)
  const id = c.req.param('id')
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, 'Arquivo não encontrado')
  const f = await db(c).one('SELECT f.*, s.event_id FROM submission_file f JOIN submission s ON s.id=f.submission_id WHERE f.id=$1', [id])
  if (!f) throw new HttpError(404, 'Arquivo não encontrado')
  const isAuthor = await db(c).one('SELECT 1 FROM submission_author WHERE submission_id=$1 AND lower(email)=$2', [f.submission_id, u.email])
  const isOrg = await db(c).one('SELECT 1 FROM org_member WHERE org_id=$1 AND person_id=$2', [f.org_id, u.id])
  const isReviewer = await db(c).one(
    `SELECT 1 FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id WHERE a.submission_id=$1 AND r.person_id=$2 AND a.status<>'declined_conflict'`,
    [f.submission_id, u.id],
  )
  if (!isAuthor && !isOrg && !isReviewer && !u.is_platform_admin) throw new HttpError(403, 'Você não tem acesso a este arquivo.')
  await audit(db(c), { orgId: f.org_id, actorId: u.id, action: 'file.download', entity: 'submission_file', entityId: f.id })
  const data = await deps(c).storage.get(f.storage_key)
  return c.body(data as any, 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="trabalho-v${f.version}.pdf"`,
    'Cache-Control': 'private, no-store',
  })
})

export default r
