import { Hono } from 'hono'
import { html } from 'hono/html'
import { type CallRow, type Env, type EventRow, HttpError, back, db, deps, eventForOrganizer, orgRole, render, requireUser } from '../context.js'
import { audit } from '../db.js'
import { sendEmail } from '../mail.js'
import {
  applyAssignments, cloneEvent, confirmCorrection, createEventFromTemplate, createOrganization, decide, inviteReviewer,
  releaseResults, removeAssignment, sendInvite, suggest, TEMPLATES, ValidationError,
} from '../services.js'
import { csv, fmtDateTime, fromLocalInput, OUTCOME_LABEL, STATUS_LABEL, toLocalInput } from '../util.js'
import { statusBadge, type H } from '../views/layout.js'

const r = new Hono<Env>()

function tabs(ev: EventRow, active: string): H {
  const items: [string, string][] = [
    ['painel', 'Painel'],
    ['configuracao', 'Configuração'],
    ['submissoes', 'Submissões'],
    ['avaliadores', 'Avaliadores'],
    ['atribuicao', 'Atribuição'],
    ['decisoes', 'Decisões'],
  ]
  return html`<p class="small"><a href="/org">← ${ev.org_name}</a></p>
  <div class="row" style="justify-content:space-between"><h1 style="margin-bottom:.2em">${ev.title} ${ev.edition}</h1>
    <span>${ev.status === 'published' ? html`<span class="badge b-ok">Publicado</span>` : html`<span class="badge b-warn">Rascunho</span>`} <a class="small" href="/e/${ev.org_slug}/${ev.slug}">ver página pública</a></span></div>
  <nav class="row" aria-label="Seções do evento" style="border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:16px">
    ${items.map(([k, l]) => (k === active ? html`<strong>${l}</strong>` : html`<a href="/gestao/${ev.id}/${k === 'painel' ? '' : k}">${l}</a>`))}
  </nav>`
}

// ------------------------------------------------------------- organizações
r.get('/org', async (c) => {
  const u = requireUser(c)
  const orgs = await db(c).query(
    `SELECT o.* FROM organization o JOIN org_member m ON m.org_id=o.id WHERE m.person_id=$1 ORDER BY o.name`,
    [u.id],
  )
  const events = await db(c).query(
    `SELECT e.id, e.org_id, e.title, e.edition, e.status, c.closes_at,
       (SELECT count(*)::int FROM submission s WHERE s.event_id=e.id AND s.status<>'withdrawn') AS n
     FROM event e JOIN call c ON c.event_id=e.id WHERE e.org_id = ANY($1) ORDER BY e.created_at DESC`,
    [orgs.map((o) => o.id)],
  )
  return render(
    c,
    'Organização',
    html`<h1>Organização</h1>
    ${orgs.map(
      (o) => html`<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${o.name}</h2><a class="btn teal sm" href="/org/${o.id}/eventos/novo">Novo evento</a></div>
        ${events.filter((e) => e.org_id === o.id).length
          ? html`<div class="tw" style="margin-top:12px"><table><thead><tr><th>Evento</th><th>Estado</th><th>Submissões</th><th>Prazo</th></tr></thead><tbody>
            ${events.filter((e) => e.org_id === o.id).map((e) => html`<tr><td><a href="/gestao/${e.id}">${e.title} ${e.edition}</a></td><td>${e.status === 'published' ? 'Publicado' : 'Rascunho'}</td><td>${e.n}</td><td>${fmtDateTime(e.closes_at)}</td></tr>`)}
            </tbody></table></div>`
          : html`<p class="muted">Nenhum evento ainda.</p>`}</div>`,
    )}
    <form class="card" method="post" action="/org" style="max-width:560px"><h2>${orgs.length ? 'Criar outra organização' : 'Crie sua organização'}</h2>
      <p class="muted small">Universidade, programa de pós-graduação, departamento ou sociedade científica.</p>
      <label for="on">Nome</label><input id="on" name="name" type="text" required minlength="3"><p><button class="btn">Criar</button></p></form>`,
  )
})

r.post('/org', async (c) => {
  const u = requireUser(c)
  const b = await c.req.parseBody()
  const org = await createOrganization(db(c), u, String(b.name ?? ''))
  return back(c, `/org/${org.id}/eventos/novo`, 'Organização criada. Agora crie o primeiro evento.')
})

async function requireOrg(c: any, orgId: string) {
  const u = requireUser(c)
  if (!/^[0-9a-f-]{36}$/.test(orgId)) throw new HttpError(404, 'Organização não encontrada')
  const role = await orgRole(db(c), orgId, u.id)
  if (!role) throw new HttpError(403, 'Você não faz parte desta organização.')
  return { u, org: (await db(c).one('SELECT * FROM organization WHERE id=$1', [orgId]))! }
}

r.get('/org/:orgId/eventos/novo', async (c) => {
  const { org } = await requireOrg(c, c.req.param('orgId'))
  const previous = await db(c).query('SELECT id, title, edition FROM event WHERE org_id=$1 ORDER BY created_at DESC', [org.id])
  const d = new Date()
  const open = toLocalInput(d)
  const close = toLocalInput(new Date(d.getTime() + 30 * 86400000))
  return render(
    c,
    'Novo evento',
    html`<p class="small"><a href="/org">← ${org.name}</a></p><h1>Novo evento</h1>
    ${previous.length
      ? html`<form class="card" method="post" action="/org/${org.id}/eventos/clonar"><h2>Repetir uma edição anterior</h2>
          <p class="muted small">Copia eixos, modalidades, critérios, regras e convida de novo os avaliadores que aceitaram. Datas avançam um ano.</p>
          <div class="grid g2"><div><label for="src">Edição de origem</label><select id="src" name="source_id">${previous.map((p) => html`<option value="${p.id}">${p.title} ${p.edition}</option>`)}</select></div>
          <div><label for="ced">Nova edição</label><input id="ced" name="edition" type="text" placeholder="2028" required></div></div>
          <p><button class="btn teal">Clonar edição</button></p></form>`
      : ''}
    <form class="card" method="post" action="/org/${org.id}/eventos"><h2>Começar por um modelo</h2>
      <fieldset><legend>Modelo</legend>${Object.entries(TEMPLATES).map(
        ([k, t], i) => html`<label class="chk"><input type="radio" name="template" value="${k}" ${i === 0 ? 'checked' : ''}> <span><strong>${t.label}</strong><br><span class="small muted">${t.description}</span></span></label>`,
      )}</fieldset>
      <div class="grid g2">
        <div><label for="t">Título</label><input id="t" name="title" type="text" required placeholder="Mostra de Iniciação Científica"></div>
        <div><label for="ed">Edição</label><input id="ed" name="edition" type="text" placeholder="2027"></div>
        <div><label for="oa">Abertura das submissões</label><input id="oa" name="opens_at" type="datetime-local" value="${open}" required></div>
        <div><label for="ca">Fim das submissões</label><input id="ca" name="closes_at" type="datetime-local" value="${close}" required></div>
        <div><label for="so">Início do evento</label><input id="so" name="starts_on" type="date"></div>
        <div><label for="eo">Fim do evento</label><input id="eo" name="ends_on" type="date"></div>
      </div>
      <p class="small muted">Você poderá ajustar eixos, modalidades, critérios e regras na próxima tela.</p>
      <p><button class="btn">Criar evento</button></p></form>`,
  )
})

r.post('/org/:orgId/eventos', async (c) => {
  const { u, org } = await requireOrg(c, c.req.param('orgId'))
  const b = await c.req.parseBody()
  const ev = await createEventFromTemplate(db(c), u, org.id, {
    title: String(b.title ?? ''),
    edition: String(b.edition ?? ''),
    template: String(b.template ?? ''),
    opensAt: fromLocalInput(String(b.opens_at ?? '')),
    closesAt: fromLocalInput(String(b.closes_at ?? '')),
    startsOn: String(b.starts_on ?? ''),
    endsOn: String(b.ends_on ?? ''),
  })
  return back(c, `/gestao/${ev.id}/configuracao`, 'Evento criado a partir do modelo. Revise e publique.')
})

r.post('/org/:orgId/eventos/clonar', async (c) => {
  await requireOrg(c, c.req.param('orgId'))
  const b = await c.req.parseBody()
  const { ev, call, user } = await eventForOrganizer(c, String(b.source_id ?? ''))
  const n = await cloneEvent(db(c), user, ev, call, { title: ev.title, edition: String(b.edition ?? '').trim() })
  return back(c, `/gestao/${n.id}/configuracao`, 'Edição clonada. Revise as datas e publique.')
})

// ------------------------------------------------------------- painel
r.get('/gestao/:id', async (c) => {
  const { ev, call } = await eventForOrganizer(c, c.req.param('id'))
  const d = db(c)
  const byStatus = await d.query(`SELECT status, count(*)::int AS n FROM submission WHERE event_id=$1 GROUP BY status`, [ev.id])
  const n = (s: string) => byStatus.find((x) => x.status === s)?.n ?? 0
  const total = byStatus.filter((x) => x.status !== 'withdrawn').reduce((a, x) => a + x.n, 0)
  const byTrack = await d.query(
    `SELECT t.name, count(s.id)::int AS n,
       count(s.id) FILTER (WHERE s.status IN ('submitted','under_review') AND (SELECT count(*) FROM assignment a WHERE a.submission_id=s.id AND a.status<>'declined_conflict') < $2)::int AS missing
     FROM track t LEFT JOIN submission s ON s.track_id=t.id AND s.status<>'withdrawn' WHERE t.event_id=$1 GROUP BY t.id ORDER BY t.position`,
    [ev.id, call.reviews_per_submission],
  )
  const asg = await d.one(
    `SELECT count(*) FILTER (WHERE a.status='done')::int AS done, count(*) FILTER (WHERE a.status='pending')::int AS pending,
       count(*) FILTER (WHERE a.status='pending' AND a.due_at < now())::int AS late
     FROM assignment a JOIN submission s ON s.id=a.submission_id WHERE s.event_id=$1 AND s.status<>'withdrawn'`,
    [ev.id],
  )
  const lateReviewers = await d.query(
    `SELECT p.name, p.email, count(*)::int AS n FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id JOIN person p ON p.id=r.person_id JOIN submission s ON s.id=a.submission_id
     WHERE r.event_id=$1 AND a.status='pending' AND a.due_at < now() AND s.status<>'withdrawn' GROUP BY p.id ORDER BY n DESC`,
    [ev.id],
  )
  const invited = await d.one(`SELECT count(*) FILTER (WHERE status='invited')::int AS inv, count(*) FILTER (WHERE status='accepted')::int AS acc FROM reviewer WHERE event_id=$1`, [ev.id])
  const awaitingDecision = await d.one(
    `SELECT count(*)::int AS n FROM submission s WHERE s.event_id=$1 AND s.status='under_review'
       AND (SELECT count(*) FROM assignment a WHERE a.submission_id=s.id AND a.status='done') >= $2`,
    [ev.id, call.reviews_per_submission],
  )
  const totalAsg = (asg.done ?? 0) + (asg.pending ?? 0)
  const pct = totalAsg ? Math.round((asg.done / totalAsg) * 100) : 0
  const now = new Date()
  const phase =
    now < new Date(call.opens_at) ? `Submissões abrem em ${fmtDateTime(call.opens_at)}`
      : now <= new Date(call.closes_at) ? `Submissões abertas até ${fmtDateTime(call.closes_at)}`
        : call.results_released_at ? `Resultado divulgado em ${fmtDateTime(call.results_released_at)}`
          : `Avaliação: pareceres até ${fmtDateTime(call.review_due_at)}`
  const alerts: H[] = []
  if (ev.status !== 'published') alerts.push(html`<div class="alert">O evento está em rascunho. <a href="/gestao/${ev.id}/configuracao">Revise e publique</a> para receber submissões.</div>`)
  const missing = byTrack.reduce((a, t) => a + t.missing, 0)
  if (missing) alerts.push(html`<div class="alert">${missing} trabalho(s) ainda sem o número mínimo de avaliadores. <a href="/gestao/${ev.id}/atribuicao">Distribuir</a></div>`)
  if ((invited?.inv ?? 0) > 0) alerts.push(html`<div class="alert">${invited.inv} avaliador(es) ainda não responderam ao convite. <a href="/gestao/${ev.id}/avaliadores">Ver avaliadores</a></div>`)
  if (lateReviewers.length) alerts.push(html`<div class="alert err">${lateReviewers.length} avaliador(es) com pareceres atrasados. <form method="post" action="/gestao/${ev.id}/lembretes" style="display:inline"><button class="btn sm">Enviar lembrete agora</button></form></div>`)
  if (awaitingDecision?.n) alerts.push(html`<div class="alert ok">${awaitingDecision.n} trabalho(s) com pareceres completos aguardando decisão. <a href="/gestao/${ev.id}/decisoes">Decidir</a></div>`)
  if (n('corrected')) alerts.push(html`<div class="alert ok">${n('corrected')} correção(ões) enviada(s) aguardando conferência. <a href="/gestao/${ev.id}/decisoes">Conferir</a></div>`)

  return render(
    c,
    `Painel · ${ev.title}`,
    html`${tabs(ev, 'painel')}
    <p><strong>${phase}</strong></p>
    ${alerts}
    <div class="grid g4" style="margin-top:12px">
      <div class="card"><div class="muted small">Submissões</div><div class="stat">${total}</div><div class="small muted">${n('withdrawn')} retirada(s)</div></div>
      <div class="card"><div class="muted small">Pareceres concluídos</div><div class="stat">${pct}%</div><div class="small muted">${asg.done ?? 0} de ${totalAsg}</div></div>
      <div class="card"><div class="muted small">Pareceres atrasados</div><div class="stat" style="color:${asg.late ? 'var(--err)' : 'inherit'}">${asg.late ?? 0}</div></div>
      <div class="card"><div class="muted small">Avaliadores</div><div class="stat">${invited?.acc ?? 0}</div><div class="small muted">${invited?.inv ?? 0} convite(s) pendente(s)</div></div>
    </div>
    <div class="grid g2">
      <div class="card"><h2>Por eixo</h2><div class="tw"><table><thead><tr><th>Eixo</th><th>Trabalhos</th><th>Sem avaliadores suficientes</th></tr></thead><tbody>
        ${byTrack.map((t) => html`<tr><td>${t.name}</td><td>${t.n}</td><td>${t.missing ? html`<span class="badge b-warn">${t.missing}</span>` : '0'}</td></tr>`)}</tbody></table></div></div>
      <div class="card"><h2>Por situação</h2><ul>${Object.entries(STATUS_LABEL).map(([k, l]) => html`<li>${l}: <strong>${n(k)}</strong></li>`)}</ul>
        <p><a class="btn ghost sm" href="/gestao/${ev.id}/exportar.csv">Exportar planilha (CSV)</a></p></div>
    </div>`,
  )
})

r.post('/gestao/:id/lembretes', async (c) => {
  const { ev, call, user } = await eventForOrganizer(c, c.req.param('id'))
  const rows = await db(c).query(
    `SELECT p.name, p.email, count(*)::int AS n, bool_or(a.due_at < now()) AS late FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id JOIN person p ON p.id=r.person_id
     JOIN submission s ON s.id=a.submission_id WHERE r.event_id=$1 AND a.status='pending' AND s.status<>'withdrawn' GROUP BY p.id`,
    [ev.id],
  )
  for (const x of rows)
    await sendEmail(db(c), {
      orgId: ev.org_id,
      to: x.email,
      subject: `[${ev.title}] ${x.late ? 'Pareceres atrasados' : 'Lembrete'}: ${x.n} trabalho(s) aguardando sua avaliação`,
      body: `Olá, ${x.name}.\n\nVocê tem ${x.n} parecer(es) pendente(s) em "${ev.title}". Prazo: ${fmtDateTime(call.review_due_at)}.\n\nAcesse ${deps(c).baseUrl}/avaliacoes\n\nSe não puder concluir, responda a este e-mail para a comissão redistribuir.\n\nCienvia`,
    })
  await audit(db(c), { orgId: ev.org_id, actorId: user.id, action: 'reminder.send', entity: 'event', entityId: ev.id, data: { count: rows.length } })
  return back(c, `/gestao/${ev.id}`, `Lembrete enviado para ${rows.length} avaliador(es) com pendências.`)
})

// ------------------------------------------------------------- configuração
r.get('/gestao/:id/configuracao', async (c) => {
  const { ev, call } = await eventForOrganizer(c, c.req.param('id'))
  const tracks = await db(c).query('SELECT name FROM track WHERE event_id=$1 ORDER BY position', [ev.id])
  const types = await db(c).query('SELECT name FROM submission_type WHERE event_id=$1 ORDER BY position', [ev.id])
  const crit = await db(c).query('SELECT name, max_score FROM review_criterion WHERE event_id=$1 ORDER BY position', [ev.id])
  return render(
    c,
    `Configuração · ${ev.title}`,
    html`${tabs(ev, 'configuracao')}
    <form method="post" action="/gestao/${ev.id}/configuracao">
      <div class="card"><h2>Evento</h2><div class="grid g2">
        <div><label for="t">Título</label><input id="t" name="title" type="text" value="${ev.title}" required></div>
        <div><label for="ed">Edição</label><input id="ed" name="edition" type="text" value="${ev.edition}"></div>
        <div><label for="fm">Formato</label><select id="fm" name="format">${[['presencial', 'Presencial'], ['online', 'Online'], ['hibrido', 'Híbrido']].map(([k, l]) => html`<option value="${k}" ${ev.format === k ? 'selected' : ''}>${l}</option>`)}</select></div>
        <div><label for="lo">Local</label><input id="lo" name="location" type="text" value="${ev.location}"></div>
        <div><label for="so">Início do evento</label><input id="so" name="starts_on" type="date" value="${ev.starts_on ? new Date(ev.starts_on).toISOString().slice(0, 10) : ''}"></div>
        <div><label for="eo">Fim do evento</label><input id="eo" name="ends_on" type="date" value="${ev.ends_on ? new Date(ev.ends_on).toISOString().slice(0, 10) : ''}"></div>
        <div><label for="pc">Cor principal</label><input id="pc" name="primary_color" type="color" value="${ev.primary_color}"></div>
      </div><label for="ds">Descrição</label><textarea id="ds" name="description">${ev.description}</textarea></div>
      <div class="card"><h2>Chamada de trabalhos</h2><div class="grid g2">
        <div><label for="oa">Abertura</label><input id="oa" name="opens_at" type="datetime-local" value="${toLocalInput(call.opens_at)}" required></div>
        <div><label for="ca">Encerramento</label><input id="ca" name="closes_at" type="datetime-local" value="${toLocalInput(call.closes_at)}" required></div>
        <div><label for="rd">Prazo dos pareceres</label><input id="rd" name="review_due_at" type="datetime-local" value="${toLocalInput(call.review_due_at)}"></div>
        <div><label for="rm">Tipo de avaliação</label><select id="rm" name="review_mode"><option value="double" ${call.review_mode === 'double' ? 'selected' : ''}>Duplo-cega (avaliador não vê autores)</option><option value="single" ${call.review_mode === 'single' ? 'selected' : ''}>Simples-cega (autor não vê avaliador)</option></select></div>
        <div><label for="rp">Pareceres por trabalho</label><input id="rp" name="reviews_per_submission" type="number" min="1" max="5" value="${call.reviews_per_submission}"></div>
        <div><label for="mpa">Máximo de trabalhos por autor</label><input id="mpa" name="max_per_author" type="number" min="1" max="20" value="${call.max_per_author}"></div>
        <div><label for="mp">Máximo de páginas</label><input id="mp" name="max_pages" type="number" min="1" max="100" value="${call.max_pages}"></div>
        <div><label for="mm">Tamanho máximo (MB)</label><input id="mm" name="max_mb" type="number" min="1" max="50" value="${call.max_mb}"></div>
      </div>
      <label class="chk"><input type="checkbox" name="same_institution_conflict" value="1" ${call.same_institution_conflict ? 'checked' : ''}> Considerar conflito quando avaliador e autor são da mesma instituição</label>
      <label for="gl">Regras e orientações aos autores</label><textarea id="gl" name="guidelines">${call.guidelines}</textarea></div>
      <div class="card"><h2>Eixos, modalidades e critérios</h2><p class="small muted">Um item por linha. Itens já usados por trabalhos não podem ser removidos, apenas renomeados.</p><div class="grid g2">
        <div><label for="tr">Eixos temáticos</label><textarea id="tr" name="tracks">${tracks.map((t) => t.name).join('\n')}</textarea></div>
        <div><label for="ty">Modalidades</label><textarea id="ty" name="types">${types.map((t) => t.name).join('\n')}</textarea></div>
        <div><label for="cr">Critérios de avaliação <span class="muted">(nome | nota máxima)</span></label><textarea id="cr" name="criteria">${crit.map((x) => `${x.name} | ${x.max_score}`).join('\n')}</textarea></div>
      </div></div>
      <p class="row"><button class="btn">Salvar configuração</button></p>
    </form>
    ${ev.status !== 'published'
      ? html`<form method="post" action="/gestao/${ev.id}/publicar" class="card"><h2>Publicar</h2><p>Torna a página do evento pública e abre a submissão nas datas configuradas.</p><button class="btn teal">Publicar evento</button></form>`
      : ''}`,
  )
})

async function syncList(d: any, table: string, eventId: string, names: { name: string; max?: number }[], usedSql: string) {
  const existing = await d.query(`SELECT id FROM ${table} WHERE event_id=$1 ORDER BY position`, [eventId])
  for (const [i, it] of names.entries()) {
    if (existing[i]) {
      if (table === 'review_criterion') await d.query(`UPDATE review_criterion SET name=$2, max_score=$3, position=$4 WHERE id=$1`, [existing[i].id, it.name, it.max ?? 5, i])
      else await d.query(`UPDATE ${table} SET name=$2, position=$3 WHERE id=$1`, [existing[i].id, it.name, i])
    } else if (table === 'review_criterion') await d.query('INSERT INTO review_criterion (event_id, name, max_score, position) VALUES ($1,$2,$3,$4)', [eventId, it.name, it.max ?? 5, i])
    else await d.query(`INSERT INTO ${table} (event_id, name, position) VALUES ($1,$2,$3)`, [eventId, it.name, i])
  }
  for (const ex of existing.slice(names.length)) {
    if (await d.one(usedSql, [ex.id])) throw new ValidationError(['Não é possível remover um item já usado por trabalhos ou pareceres.'])
    await d.query(`DELETE FROM ${table} WHERE id=$1`, [ex.id])
  }
}

r.post('/gestao/:id/configuracao', async (c) => {
  const { ev, user } = await eventForOrganizer(c, c.req.param('id'))
  const b = await c.req.parseBody()
  const s = (k: string) => String(b[k] ?? '').trim()
  const lines = (k: string) => s(k).split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
  const opens = fromLocalInput(s('opens_at')),
    closes = fromLocalInput(s('closes_at'))
  const errors: string[] = []
  if (!(opens < closes)) errors.push('O encerramento precisa ser depois da abertura.')
  if (s('title').length < 3) errors.push('Informe o título.')
  const tracks = lines('tracks'),
    types = lines('types')
  const criteria = lines('criteria').map((l) => {
    const [n, m] = l.split('|').map((x) => x.trim())
    return { name: n, max: Math.max(2, Math.min(10, Number(m) || 5)) }
  })
  if (!tracks.length) errors.push('Informe pelo menos um eixo.')
  if (!types.length) errors.push('Informe pelo menos uma modalidade.')
  if (!criteria.length) errors.push('Informe pelo menos um critério de avaliação.')
  if (!/^#[0-9a-fA-F]{6}$/.test(s('primary_color'))) errors.push('Cor inválida.')
  if (errors.length) throw new ValidationError(errors)
  await db(c).tx(async (t) => {
    await t.query(
      `UPDATE event SET title=$2, edition=$3, format=$4, location=$5, starts_on=NULLIF($6,'')::date, ends_on=NULLIF($7,'')::date, primary_color=$8, description=$9 WHERE id=$1`,
      [ev.id, s('title'), s('edition'), ['presencial', 'online', 'hibrido'].includes(s('format')) ? s('format') : 'presencial', s('location'), s('starts_on'), s('ends_on'), s('primary_color'), s('description')],
    )
    await t.query(
      `UPDATE call SET opens_at=$2, closes_at=$3, review_due_at=$4, review_mode=$5, reviews_per_submission=$6, max_per_author=$7, max_pages=$8, max_mb=$9, same_institution_conflict=$10, guidelines=$11 WHERE event_id=$1`,
      [ev.id, opens, closes, s('review_due_at') ? fromLocalInput(s('review_due_at')) : null, s('review_mode') === 'single' ? 'single' : 'double',
        Math.max(1, Math.min(5, Number(s('reviews_per_submission')) || 2)), Math.max(1, Number(s('max_per_author')) || 3),
        Math.max(1, Number(s('max_pages')) || 10), Math.max(1, Math.min(50, Number(s('max_mb')) || 10)), b.same_institution_conflict === '1', s('guidelines')],
    )
    await syncList(t, 'track', ev.id, tracks.map((name) => ({ name })), 'SELECT 1 FROM submission WHERE track_id=$1 LIMIT 1')
    await syncList(t, 'submission_type', ev.id, types.map((name) => ({ name })), 'SELECT 1 FROM submission WHERE type_id=$1 LIMIT 1')
    await syncList(t, 'review_criterion', ev.id, criteria, 'SELECT 1 FROM review_score WHERE criterion_id=$1 LIMIT 1')
    await audit(t, { orgId: ev.org_id, actorId: user.id, action: 'event.configure', entity: 'event', entityId: ev.id })
  })
  return back(c, `/gestao/${ev.id}/configuracao`, 'Configuração salva.')
})

r.post('/gestao/:id/publicar', async (c) => {
  const { ev, user } = await eventForOrganizer(c, c.req.param('id'))
  await db(c).query(`UPDATE event SET status='published' WHERE id=$1`, [ev.id])
  await audit(db(c), { orgId: ev.org_id, actorId: user.id, action: 'event.publish', entity: 'event', entityId: ev.id })
  return back(c, `/gestao/${ev.id}`, 'Evento publicado.')
})

// ------------------------------------------------------------- submissões
r.get('/gestao/:id/submissoes', async (c) => {
  const { ev } = await eventForOrganizer(c, c.req.param('id'))
  const status = c.req.query('status') ?? ''
  const subs = await db(c).query(
    `SELECT s.id, s.code, s.title, s.status, s.submitted_at, t.name AS track, ty.name AS type,
       (SELECT string_agg(sa.name, '; ' ORDER BY sa.position) FROM submission_author sa WHERE sa.submission_id=s.id) AS authors,
       (SELECT count(*) FILTER (WHERE a.status='done')::int || '/' || count(*) FILTER (WHERE a.status<>'declined_conflict')::int FROM assignment a WHERE a.submission_id=s.id) AS reviews
     FROM submission s JOIN track t ON t.id=s.track_id JOIN submission_type ty ON ty.id=s.type_id
     WHERE s.event_id=$1 AND ($2='' OR s.status=$2) ORDER BY s.code`,
    [ev.id, status],
  )
  return render(
    c,
    `Submissões · ${ev.title}`,
    html`${tabs(ev, 'submissoes')}
    <form method="get" class="row"><label for="st">Situação</label><select id="st" name="status" style="max-width:240px" onchange="this.form.submit()"><option value="">Todas</option>
      ${Object.entries(STATUS_LABEL).map(([k, l]) => html`<option value="${k}" ${status === k ? 'selected' : ''}>${l}</option>`)}</select>
      <noscript><button class="btn sm">Filtrar</button></noscript><a class="btn ghost sm" href="/gestao/${ev.id}/exportar.csv">Exportar CSV</a></form>
    <p class="muted">${subs.length} trabalho(s)</p>
    <div class="tw"><table><thead><tr><th>Código</th><th>Título</th><th>Autores</th><th>Eixo</th><th>Pareceres</th><th>Situação</th></tr></thead><tbody>
    ${subs.map((s) => html`<tr><td><a href="/gestao/${ev.id}/submissoes/${s.id}">${s.code}</a></td><td>${s.title}<div class="small muted">${s.type}</div></td><td class="small">${s.authors}</td><td class="small">${s.track}</td><td>${s.reviews}</td><td>${statusBadge(s.status, STATUS_LABEL[s.status])}</td></tr>`)}
    </tbody></table></div>`,
  )
})

r.get('/gestao/:id/submissoes/:sid', async (c) => {
  const { ev, call } = await eventForOrganizer(c, c.req.param('id'))
  if (!/^[0-9a-f-]{36}$/.test(c.req.param('sid'))) throw new HttpError(404, 'Trabalho não encontrado')
  const s = await db(c).one(
    `SELECT s.*, t.name AS track, ty.name AS type FROM submission s JOIN track t ON t.id=s.track_id JOIN submission_type ty ON ty.id=s.type_id WHERE s.id=$1 AND s.event_id=$2`,
    [c.req.param('sid'), ev.id],
  )
  if (!s) throw new HttpError(404, 'Trabalho não encontrado')
  const authors = await db(c).query('SELECT * FROM submission_author WHERE submission_id=$1 ORDER BY position', [s.id])
  const files = await db(c).query('SELECT * FROM submission_file WHERE submission_id=$1 ORDER BY version', [s.id])
  const reviews = await db(c).query(
    `SELECT a.id, a.status, a.due_at, p.name AS reviewer, rv.recommendation, rv.comment_author, rv.comment_committee,
       (SELECT round(avg(rs.score::numeric / rc.max_score) * 10, 1) FROM review_score rs JOIN review_criterion rc ON rc.id=rs.criterion_id WHERE rs.assignment_id=a.id) AS score10
     FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id JOIN person p ON p.id=r.person_id LEFT JOIN review rv ON rv.assignment_id=a.id
     WHERE a.submission_id=$1 ORDER BY a.created_at`,
    [s.id],
  )
  const decisions = await db(c).query('SELECT d.*, p.name FROM decision d JOIN person p ON p.id=d.decided_by WHERE submission_id=$1 ORDER BY decided_at', [s.id])
  const canDecide = ['submitted', 'under_review'].includes(s.status) || (!call.results_released_at && ['accepted', 'accepted_with_corrections', 'rejected'].includes(s.status))
  return render(
    c,
    s.code,
    html`${tabs(ev, 'submissoes')}
    <div class="row" style="justify-content:space-between"><span class="muted">${s.code} · ${s.track} · ${s.type}</span>${statusBadge(s.status, STATUS_LABEL[s.status])}</div>
    <h2>${s.title}</h2>
    <div class="split"><div>
      <div class="card"><h3>Resumo</h3><p>${s.abstract}</p><p class="small muted">Palavras-chave: ${s.keywords}</p>
        <h3>Arquivos</h3><ul>${files.map((f) => html`<li><a href="/arquivos/${f.id}">Versão ${f.version}</a> (${f.reason === 'initial' ? 'original' : 'correção'}, ${f.pages} p., ${fmtDateTime(f.created_at)})
          ${(f.check_report?.warnings ?? []).length ? html`<div class="small muted">Alertas: ${f.check_report.warnings.join(' ')}</div>` : ''}${f.check_report?.note ? html`<div class="small">Nota do autor: ${f.check_report.note}</div>` : ''}</li>`)}</ul></div>
      <div class="card"><h3>Pareceres</h3>
        ${reviews.length
          ? reviews.map((rv) => html`<div style="border-top:1px solid var(--line);padding:8px 0"><strong>${rv.reviewer}</strong>
              ${rv.status === 'done' ? html` · ${OUTCOME_LABEL[rv.recommendation]} · nota ${rv.score10}/10` : rv.status === 'declined_conflict' ? html` · <span class="badge b-err">conflito declarado</span>` : html` · <span class="badge">pendente até ${fmtDateTime(rv.due_at)}</span>`}
              ${rv.comment_author ? html`<p class="small" style="white-space:pre-wrap"><strong>Ao autor:</strong> ${rv.comment_author}</p>` : ''}
              ${rv.comment_committee ? html`<p class="small" style="white-space:pre-wrap"><strong>À comissão:</strong> ${rv.comment_committee}</p>` : ''}</div>`)
          : html`<p class="muted">Sem avaliadores atribuídos. <a href="/gestao/${ev.id}/atribuicao">Distribuir</a></p>`}</div>
    </div><div>
      <div class="card"><h3>Autores</h3><ol>${authors.map((a) => html`<li>${a.name}${a.is_corresponding ? ' (correspondente)' : ''}<div class="small muted">${a.affiliation} · ${a.email}</div></li>`)}</ol></div>
      ${canDecide ? decisionForm(ev, s.id) : ''}
      ${s.status === 'corrected' ? html`<form class="card" method="post" action="/gestao/${ev.id}/correcoes/${s.id}/confirmar"><h3>Correção enviada</h3><p class="small">Confira a versão mais recente. Ao confirmar, o trabalho fica aprovado e o certificado é emitido.</p><button class="btn teal">Confirmar correções</button></form>` : ''}
      <div class="card"><h3>Histórico de decisões</h3>${decisions.length ? html`<ul class="small">${decisions.map((d) => html`<li>${OUTCOME_LABEL[d.outcome]} por ${d.name} em ${fmtDateTime(d.decided_at)}</li>`)}</ul>` : html`<p class="muted small">Nenhuma.</p>`}</div>
    </div></div>`,
  )
})

const decisionForm = (ev: EventRow, sid: string) =>
  html`<form class="card" method="post" action="/gestao/${ev.id}/decisoes"><h3>Decisão</h3><input type="hidden" name="submission_id" value="${sid}">
    ${(['accepted', 'accepted_with_corrections', 'rejected'] as const).map((k) => html`<label class="chk"><input type="radio" name="outcome" value="${k}" required> ${OUTCOME_LABEL[k]}</label>`)}
    <label for="nt-${sid}">Mensagem ao autor <span class="muted">(opcional)</span></label><textarea id="nt-${sid}" name="note" style="min-height:70px"></textarea>
    <p class="small muted">A decisão só é comunicada ao autor quando você divulgar os resultados.</p><button class="btn">Registrar decisão</button></form>`

r.get('/gestao/:id/exportar.csv', async (c) => {
  const { ev, user } = await eventForOrganizer(c, c.req.param('id'))
  const rows = await db(c).query(
    `SELECT s.code, s.title, t.name AS track, ty.name AS type, s.status, s.submitted_at, s.keywords,
       (SELECT string_agg(sa.name || ' <' || sa.email || '> ' || sa.affiliation, ' | ' ORDER BY sa.position) FROM submission_author sa WHERE sa.submission_id=s.id) AS authors,
       (SELECT count(*) FROM assignment a WHERE a.submission_id=s.id AND a.status='done') AS done,
       (SELECT round(avg(rs.score::numeric / rc.max_score) * 10, 2) FROM assignment a JOIN review_score rs ON rs.assignment_id=a.id JOIN review_criterion rc ON rc.id=rs.criterion_id WHERE a.submission_id=s.id) AS score10
     FROM submission s JOIN track t ON t.id=s.track_id JOIN submission_type ty ON ty.id=s.type_id WHERE s.event_id=$1 ORDER BY s.code`,
    [ev.id],
  )
  await audit(db(c), { orgId: ev.org_id, actorId: user.id, action: 'export.csv', entity: 'event', entityId: ev.id })
  const out = csv([
    ['Código', 'Título', 'Eixo', 'Modalidade', 'Situação', 'Enviado em', 'Palavras-chave', 'Autores', 'Pareceres concluídos', 'Nota média (0-10)'],
    ...rows.map((x) => [x.code, x.title, x.track, x.type, STATUS_LABEL[x.status], fmtDateTime(x.submitted_at), x.keywords, x.authors, x.done, x.score10]),
  ])
  return c.body(out, 200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="submissoes-${ev.slug}.csv"` })
})

// ------------------------------------------------------------- avaliadores
r.get('/gestao/:id/avaliadores', async (c) => {
  const { ev } = await eventForOrganizer(c, c.req.param('id'))
  const tracks = await db(c).query('SELECT id, name FROM track WHERE event_id=$1 ORDER BY position', [ev.id])
  const revs = await db(c).query(
    `SELECT r.id, r.status, r.max_load, p.name, p.email, p.affiliation,
       (SELECT string_agg(t.name, ', ' ORDER BY t.position) FROM reviewer_track rt JOIN track t ON t.id=rt.track_id WHERE rt.reviewer_id=r.id) AS tracks,
       (SELECT count(*) FILTER (WHERE a.status<>'declined_conflict')::int FROM assignment a WHERE a.reviewer_id=r.id) AS load,
       (SELECT count(*) FILTER (WHERE a.status='done')::int FROM assignment a WHERE a.reviewer_id=r.id) AS done
     FROM reviewer r JOIN person p ON p.id=r.person_id WHERE r.event_id=$1 ORDER BY r.status, p.name`,
    [ev.id],
  )
  const label: Record<string, string> = { invited: 'Convidado', accepted: 'Aceitou', declined: 'Recusou' }
  return render(
    c,
    `Avaliadores · ${ev.title}`,
    html`${tabs(ev, 'avaliadores')}
    <div class="split"><div>
      <div class="tw"><table><thead><tr><th>Avaliador</th><th>Eixos</th><th>Carga</th><th>Situação</th><th></th></tr></thead><tbody>
      ${revs.map((x) => html`<tr><td>${x.name}<div class="small muted">${x.email} · ${x.affiliation}</div></td><td class="small">${x.tracks ?? '-'}</td>
        <td>${x.done}/${x.load} de ${x.max_load}</td><td><span class="badge ${x.status === 'accepted' ? 'b-ok' : x.status === 'declined' ? 'b-err' : ''}">${label[x.status]}</span></td>
        <td>${x.status === 'invited' ? html`<form method="post" action="/gestao/${ev.id}/avaliadores/${x.id}/reenviar"><button class="btn ghost sm">Reenviar</button></form>` : ''}</td></tr>`)}
      </tbody></table></div>${revs.length ? '' : html`<p class="muted">Nenhum avaliador convidado.</p>`}</div>
      <form class="card" method="post" action="/gestao/${ev.id}/avaliadores"><h2>Convidar avaliador</h2>
        <label for="rn">Nome</label><input id="rn" name="name" type="text" required>
        <label for="re">E-mail</label><input id="re" name="email" type="email" required>
        <label for="ra">Instituição <span class="muted">(usada para detectar conflitos)</span></label><input id="ra" name="affiliation" type="text">
        <fieldset><legend>Eixos de especialidade</legend>${tracks.map((t) => html`<label class="chk"><input type="checkbox" name="track_ids" value="${t.id}"> ${t.name}</label>`)}</fieldset>
        <label for="rl">Capacidade máxima de trabalhos</label><input id="rl" name="max_load" type="number" min="1" max="50" value="5">
        <p><button class="btn teal">Enviar convite</button></p></form></div>`,
  )
})

r.post('/gestao/:id/avaliadores', async (c) => {
  const { ev, user } = await eventForOrganizer(c, c.req.param('id'))
  const b = await c.req.parseBody({ all: true })
  await inviteReviewer(db(c), deps(c).baseUrl, ev, user, {
    name: String(b.name ?? ''),
    email: String(b.email ?? ''),
    affiliation: String(b.affiliation ?? ''),
    trackIds: ([] as unknown[]).concat(b.track_ids ?? []).map(String),
    maxLoad: Number(b.max_load ?? 5),
  })
  return back(c, `/gestao/${ev.id}/avaliadores`, 'Convite enviado.')
})

r.post('/gestao/:id/avaliadores/:rid/reenviar', async (c) => {
  const { ev } = await eventForOrganizer(c, c.req.param('id'))
  if (!/^[0-9a-f-]{36}$/.test(c.req.param('rid'))) throw new HttpError(404, 'Avaliador não encontrado')
  const p = await db(c).one(`SELECT p.* FROM reviewer r JOIN person p ON p.id=r.person_id WHERE r.id=$1 AND r.event_id=$2`, [c.req.param('rid'), ev.id])
  if (!p) throw new HttpError(404, 'Avaliador não encontrado')
  await sendInvite(db(c), deps(c).baseUrl, ev, p)
  return back(c, `/gestao/${ev.id}/avaliadores`, 'Convite reenviado.')
})

// ------------------------------------------------------------- atribuição
r.get('/gestao/:id/atribuicao', async (c) => {
  const { ev, call } = await eventForOrganizer(c, c.req.param('id'))
  const { proposals, shortfalls, subs, revs } = await suggest(db(c), ev, call)
  const sub = (id: string) => subs.find((s) => s.id === id)
  const rev = (id: string) => revs.find((r) => r.id === id)
  const current = await db(c).query(
    `SELECT a.id, a.status, s.code, s.title, p.name FROM assignment a JOIN submission s ON s.id=a.submission_id JOIN reviewer r ON r.id=a.reviewer_id JOIN person p ON p.id=r.person_id
     WHERE s.event_id=$1 AND s.status<>'withdrawn' ORDER BY s.code, p.name`,
    [ev.id],
  )
  return render(
    c,
    `Atribuição · ${ev.title}`,
    html`${tabs(ev, 'atribuicao')}
    <p class="muted">Regra: ${call.reviews_per_submission} avaliador(es) por trabalho, sem conflito (autor, conflito declarado${call.same_institution_conflict ? ', mesma instituição' : ''}), priorizando o mesmo eixo e a menor carga. ${revs.length} avaliador(es) disponíveis.</p>
    ${shortfalls.length ? html`<div class="alert err"><strong>${shortfalls.length} trabalho(s) sem avaliadores suficientes:</strong> ${shortfalls.map((s) => `${sub(s.submissionId)?.code} (faltam ${s.missing})`).join(', ')}. Convide mais avaliadores ou aumente a capacidade.</div>` : ''}
    ${proposals.length
      ? html`<form method="post" action="/gestao/${ev.id}/atribuicao" class="card"><h2>Sugestão (${proposals.length} atribuições)</h2>
        <p class="small muted">Desmarque o que não quiser aplicar. Os avaliadores recebem um e-mail.</p>
        <div class="tw"><table><thead><tr><th></th><th>Trabalho</th><th>Avaliador</th><th>Observação</th></tr></thead><tbody>
        ${proposals.map((p) => html`<tr><td><input type="checkbox" name="pair" value="${p.submissionId}:${p.reviewerId}" checked aria-label="Aplicar"></td>
          <td><strong>${sub(p.submissionId)?.code}</strong> ${sub(p.submissionId)?.title}</td><td>${rev(p.reviewerId)?.name}</td>
          <td>${p.outsideTrack ? html`<span class="badge b-warn">fora do eixo</span>` : html`<span class="badge b-ok">mesmo eixo</span>`}</td></tr>`)}
        </tbody></table></div><p><button class="btn teal">Aplicar atribuições selecionadas</button></p></form>`
      : html`<div class="card"><p>Nenhuma atribuição nova a sugerir.</p></div>`}
    <div class="card"><h2>Atribuições atuais (${current.length})</h2>
    ${current.length
      ? html`<div class="tw"><table><thead><tr><th>Trabalho</th><th>Avaliador</th><th>Situação</th><th></th></tr></thead><tbody>
        ${current.map((a) => html`<tr><td>${a.code} ${a.title}</td><td>${a.name}</td><td>${{ pending: 'Pendente', done: 'Concluído', declined_conflict: 'Conflito declarado' }[a.status as string]}</td>
          <td>${a.status === 'pending' ? html`<form method="post" action="/gestao/${ev.id}/atribuicao/${a.id}/remover"><button class="btn ghost sm">Remover</button></form>` : ''}</td></tr>`)}
        </tbody></table></div>`
      : html`<p class="muted">Nenhuma.</p>`}</div>`,
  )
})

r.post('/gestao/:id/atribuicao', async (c) => {
  const { ev, call, user } = await eventForOrganizer(c, c.req.param('id'))
  const b = await c.req.parseBody({ all: true })
  const pairs = ([] as unknown[]).concat(b.pair ?? []).map((x) => {
    const [submissionId, reviewerId] = String(x).split(':')
    return { submissionId, reviewerId }
  })
  const res = await applyAssignments(db(c), deps(c).baseUrl, ev, call, user, pairs)
  return back(c, `/gestao/${ev.id}/atribuicao`, `${res.created} atribuição(ões) aplicada(s). ${res.errors.join(' ')}`)
})

r.post('/gestao/:id/atribuicao/:aid/remover', async (c) => {
  const { ev, user } = await eventForOrganizer(c, c.req.param('id'))
  await removeAssignment(db(c), ev, user, c.req.param('aid'))
  return back(c, `/gestao/${ev.id}/atribuicao`, 'Atribuição removida.')
})

// ------------------------------------------------------------- decisões e resultado
r.get('/gestao/:id/decisoes', async (c) => {
  const { ev, call } = await eventForOrganizer(c, c.req.param('id'))
  const subs = await db(c).query(
    `SELECT s.id, s.code, s.title, s.status, t.name AS track,
       count(a.id) FILTER (WHERE a.status='done')::int AS done,
       count(a.id) FILTER (WHERE a.status='pending')::int AS pending,
       round(avg(x.score10), 1) AS score10,
       round(coalesce(stddev_pop(x.score10), 0), 1) AS spread,
       string_agg(rv.recommendation, ',') AS recs
     FROM submission s JOIN track t ON t.id=s.track_id
     LEFT JOIN assignment a ON a.submission_id=s.id
     LEFT JOIN review rv ON rv.assignment_id=a.id
     LEFT JOIN LATERAL (SELECT avg(rs.score::numeric / rc.max_score) * 10 AS score10 FROM review_score rs JOIN review_criterion rc ON rc.id=rs.criterion_id WHERE rs.assignment_id=a.id) x ON a.status='done'
     WHERE s.event_id=$1 AND s.status<>'withdrawn'
     GROUP BY s.id, t.name ORDER BY (s.status IN ('submitted','under_review')) DESC, coalesce(stddev_pop(x.score10),0) DESC, s.code`,
    [ev.id],
  )
  const undecided = subs.filter((s) => ['submitted', 'under_review'].includes(s.status)).length
  const decided = subs.filter((s) => ['accepted', 'accepted_with_corrections', 'rejected', 'corrected'].includes(s.status)).length
  const recLabel = (r: string | null) =>
    (r ?? '').split(',').filter(Boolean).map((x) => ({ accept: 'A', accept_with_corrections: 'C', reject: 'R' })[x as 'accept']).join(' ')
  return render(
    c,
    `Decisões · ${ev.title}`,
    html`${tabs(ev, 'decisoes')}
    <p class="muted">Ordenado por trabalhos sem decisão e maior divergência entre avaliadores. Recomendações: A = aprovar, C = aprovar com correções, R = não aprovar.</p>
    <div class="tw"><table><thead><tr><th>Trabalho</th><th>Eixo</th><th>Pareceres</th><th>Nota média</th><th>Divergência</th><th>Recomendações</th><th>Situação</th></tr></thead><tbody>
    ${subs.map((s) => html`<tr><td><a href="/gestao/${ev.id}/submissoes/${s.id}">${s.code}</a> ${s.title}</td><td class="small">${s.track}</td><td>${s.done}${s.pending ? html` <span class="small muted">(+${s.pending} pend.)</span>` : ''}</td>
      <td>${s.score10 ?? '-'}</td><td>${Number(s.spread) >= 2 ? html`<span class="badge b-warn">${s.spread}</span>` : s.spread ?? '-'}</td><td>${recLabel(s.recs)}</td><td>${statusBadge(s.status, STATUS_LABEL[s.status])}</td></tr>`)}
    </tbody></table></div>
    <p class="small muted">Para decidir, abra o trabalho. A decisão fica registrada e só é comunicada na divulgação.</p>
    ${call.results_released_at
      ? html`<div class="alert ok">Resultados divulgados em ${fmtDateTime(call.results_released_at)}. <a href="/e/${ev.org_slug}/${ev.slug}/aprovados">Ver lista pública</a></div>`
      : html`<form class="card" method="post" action="/gestao/${ev.id}/liberar" onsubmit="return confirm('Divulgar os resultados? Os autores serão avisados por e-mail e a lista de aprovados ficará pública. Não é possível desfazer.')">
          <h2>Divulgar resultados</h2><p>${decided} trabalho(s) com decisão serão comunicados por e-mail, com os pareceres (sem identificar avaliadores). Certificados de autoria e de avaliação serão emitidos.</p>
          ${undecided ? html`<div class="alert">${undecided} trabalho(s) ainda sem decisão. Eles serão comunicados quando você decidir.</div>` : ''}
          <button class="btn teal" ${decided ? '' : 'disabled'}>Divulgar resultados</button></form>`}`,
  )
})

r.post('/gestao/:id/decisoes', async (c) => {
  const { ev, call, user } = await eventForOrganizer(c, c.req.param('id'))
  const b = await c.req.parseBody()
  const sid = String(b.submission_id ?? '')
  await decide(db(c), deps(c).baseUrl, ev, call, user, sid, String(b.outcome ?? ''), String(b.note ?? ''))
  return back(c, `/gestao/${ev.id}/submissoes/${sid}`, call.results_released_at ? 'Decisão registrada e comunicada ao autor.' : 'Decisão registrada. Será comunicada na divulgação dos resultados.')
})

r.post('/gestao/:id/liberar', async (c) => {
  const { ev, call, user } = await eventForOrganizer(c, c.req.param('id'))
  const n = await releaseResults(db(c), deps(c).baseUrl, ev, call, user)
  return back(c, `/gestao/${ev.id}/decisoes`, `Resultados divulgados: ${n} trabalho(s) comunicados.`)
})

r.post('/gestao/:id/correcoes/:sid/confirmar', async (c) => {
  const { ev, user } = await eventForOrganizer(c, c.req.param('id'))
  await confirmCorrection(db(c), deps(c).baseUrl, ev, user, c.req.param('sid'))
  return back(c, `/gestao/${ev.id}/submissoes/${c.req.param('sid')}`, 'Correções confirmadas. Trabalho aprovado e certificado emitido.')
})

export default r
