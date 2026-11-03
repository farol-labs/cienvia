import { Hono } from 'hono'
import { html } from 'hono/html'
import { type Env, callState, db, publicEvent, render } from '../context.js'
import { fmtDate, fmtDateTime } from '../util.js'

const r = new Hono<Env>()

r.get('/', async (c) => {
  const events = await db(c).query(
    `SELECT e.title, e.edition, e.slug, o.slug AS org_slug, o.name AS org_name, c.closes_at FROM event e
     JOIN organization o ON o.id=e.org_id JOIN call c ON c.event_id=e.id WHERE e.status='published' ORDER BY c.closes_at DESC LIMIT 20`,
  )
  return render(
    c,
    'Início',
    html`<section class="hero"><h1>O caminho da ciência, simplificado.</h1>
      <p>Chamada de trabalhos, avaliação por pares e resultados do seu evento científico em um só lugar.</p>
      <p class="row"><a class="btn teal" href="/org">Organizar um evento</a> <a class="btn ghost" style="color:#fff;border-color:#fff" href="/minha-area">Minha área</a></p></section>
      <h2>Eventos</h2>
      ${events.length
        ? html`<div class="grid g2">${events.map(
            (e) => html`<a class="card" style="text-decoration:none;color:inherit" href="/e/${e.org_slug}/${e.slug}">
              <strong>${e.title} ${e.edition}</strong><div class="muted small">${e.org_name} · submissões até ${fmtDateTime(e.closes_at)}</div></a>`,
          )}</div>`
        : html`<p class="muted">Nenhum evento publicado ainda.</p>`}`,
  )
})

r.get('/e/:org/:ev', async (c) => {
  const { ev, call } = await publicEvent(c, c.req.param('org'), c.req.param('ev'))
  const user = c.get('user')
  const isMember = user && (await db(c).one('SELECT 1 FROM org_member WHERE org_id=$1 AND person_id=$2', [ev.org_id, user.id]))
  if (ev.status !== 'published' && !isMember) return render(c, 'Não encontrado', html`<h1>Evento não encontrado</h1>`, 404)
  const tracks = await db(c).query('SELECT name FROM track WHERE event_id=$1 ORDER BY position', [ev.id])
  const types = await db(c).query('SELECT name FROM submission_type WHERE event_id=$1 ORDER BY position', [ev.id])
  const st = callState(call)
  return render(
    c,
    ev.title,
    html`${ev.status !== 'published' ? html`<div class="alert">Prévia: este evento ainda não está publicado.</div>` : ''}
    <section class="hero" style="--hero:${/^#[0-9a-fA-F]{6}$/.test(ev.primary_color) ? ev.primary_color : '#0B2545'}">
      <div class="small">${ev.org_name}</div><h1>${ev.title} ${ev.edition}</h1>
      <p>${ev.starts_on ? `${fmtDate(ev.starts_on)}${ev.ends_on ? ` a ${fmtDate(ev.ends_on)}` : ''}` : 'Datas a definir'} · ${{ presencial: 'Presencial', online: 'Online', hibrido: 'Híbrido' }[ev.format] ?? ev.format}${ev.location ? ` · ${ev.location}` : ''}</p>
      ${st === 'open'
        ? html`<a class="btn teal" href="/e/${ev.org_slug}/${ev.slug}/submeter">Submeter trabalho</a>`
        : st === 'before'
          ? html`<span class="badge">Submissões abrem em ${fmtDateTime(call.opens_at)}</span>`
          : html`<span class="badge">Submissões encerradas</span>`}
      ${call.results_released_at ? html` <a class="btn ghost" style="color:#fff;border-color:#fff" href="/e/${ev.org_slug}/${ev.slug}/aprovados">Trabalhos aprovados</a>` : ''}
    </section>
    <div class="grid g2">
      <div class="card"><h2>Sobre</h2><p>${ev.description}</p></div>
      <div class="card"><h2>Datas importantes</h2><ul class="timeline">
        <li>Abertura das submissões: <strong>${fmtDateTime(call.opens_at)}</strong></li>
        <li>Fim das submissões: <strong>${fmtDateTime(call.closes_at)}</strong></li>
        <li>Avaliação até: <strong>${fmtDateTime(call.review_due_at)}</strong></li>
        <li>Resultado: <strong>${call.results_released_at ? fmtDateTime(call.results_released_at) : 'a divulgar'}</strong></li></ul></div>
      <div class="card"><h2>Chamada de trabalhos</h2><p>${call.guidelines}</p>
        <p class="small muted">Avaliação ${call.review_mode === 'double' ? 'duplo-cega' : 'simples-cega'} · ${call.reviews_per_submission} pareceres por trabalho · PDF até ${call.max_pages} páginas e ${call.max_mb} MB · até ${call.max_per_author} trabalhos por autor.</p></div>
      <div class="card"><h2>Eixos e modalidades</h2><h3>Eixos temáticos</h3><ul>${tracks.map((t) => html`<li>${t.name}</li>`)}</ul>
        <h3>Modalidades</h3><ul>${types.map((t) => html`<li>${t.name}</li>`)}</ul></div>
    </div>`,
  )
})

r.get('/e/:org/:ev/aprovados', async (c) => {
  const { ev, call } = await publicEvent(c, c.req.param('org'), c.req.param('ev'))
  if (!call.results_released_at) return render(c, 'Aprovados', html`<h1>${ev.title}</h1><p>O resultado ainda não foi divulgado.</p>`)
  const subs = await db(c).query(
    `SELECT s.id, s.code, s.title, t.name AS track, ty.name AS type,
       (SELECT string_agg(sa.name || CASE WHEN sa.affiliation<>'' THEN ' (' || sa.affiliation || ')' ELSE '' END, '; ' ORDER BY sa.position) FROM submission_author sa WHERE sa.submission_id=s.id) AS authors
     FROM submission s JOIN track t ON t.id=s.track_id JOIN submission_type ty ON ty.id=s.type_id
     WHERE s.event_id=$1 AND s.status IN ('accepted','accepted_with_corrections','corrected') ORDER BY t.position, s.title`,
    [ev.id],
  )
  return render(
    c,
    `Aprovados · ${ev.title}`,
    html`<p class="small"><a href="/e/${ev.org_slug}/${ev.slug}">← ${ev.title} ${ev.edition}</a></p><h1>Trabalhos aprovados</h1>
    <p class="muted">${subs.length} trabalho(s). Resultado divulgado em ${fmtDateTime(call.results_released_at)}.</p>
    <div class="tw"><table><thead><tr><th>Código</th><th>Título</th><th>Autores</th><th>Eixo</th><th>Modalidade</th></tr></thead><tbody>
    ${subs.map((s) => html`<tr><td>${s.code}</td><td>${s.title}</td><td>${s.authors}</td><td>${s.track}</td><td>${s.type}</td></tr>`)}
    </tbody></table></div>`,
  )
})

r.get('/validar', async (c) => {
  const code = (c.req.query('codigo') ?? '').trim().toUpperCase()
  const cert = code
    ? await db(c).one(
        `SELECT ce.*, e.title, e.edition, o.name AS org_name FROM certificate ce JOIN event e ON e.id=ce.event_id JOIN organization o ON o.id=e.org_id WHERE ce.code=$1`,
        [code],
      )
    : null
  return render(
    c,
    'Validar certificado',
    html`<div class="card" style="max-width:640px;margin:auto"><h1>Validar certificado</h1>
    <form method="get" action="/validar" class="row"><label for="codigo" class="sr">Código</label>
      <input id="codigo" name="codigo" type="text" value="${code}" placeholder="XXXX-XXXX-XXXX" style="max-width:260px"><button class="btn">Validar</button></form>
    ${code
      ? cert
        ? html`<div class="alert ok"><strong>Certificado válido.</strong><br>${cert.person_name} · ${cert.kind === 'author' ? `Autoria do trabalho "${cert.subject}"` : `Avaliação de trabalhos (${cert.subject})`}<br>${cert.title} ${cert.edition} · ${cert.org_name} · emitido em ${fmtDate(cert.issued_at)}</div>
          <p><a href="/certificados/${cert.code}">Ver certificado</a></p>`
        : html`<div class="alert err">Nenhum certificado encontrado com este código.</div>`
      : ''}</div>`,
  )
})

r.get('/certificados/:code', async (c) => {
  const cert = await db(c).one(
    `SELECT ce.*, e.title, e.edition, e.primary_color, o.name AS org_name FROM certificate ce JOIN event e ON e.id=ce.event_id JOIN organization o ON o.id=e.org_id WHERE ce.code=$1`,
    [c.req.param('code').toUpperCase()],
  )
  if (!cert) return render(c, 'Certificado', html`<h1>Certificado não encontrado</h1>`, 404)
  const url = `${c.get('deps').baseUrl}/validar?codigo=${cert.code}`
  const text =
    cert.kind === 'author'
      ? html`é autor(a) do trabalho <strong>"${cert.subject}"</strong>, aprovado em`
      : html`atuou como avaliador(a) de trabalhos científicos (${cert.subject}) em`
  return render(
    c,
    'Certificado',
    html`<p class="noprint row"><button class="btn" onclick="window.print()">Imprimir / salvar em PDF</button></p>
    <div class="card" style="border:6px double var(--navy);padding:48px 32px;text-align:center;max-width:900px;margin:auto">
      <div class="muted">${cert.org_name}</div>
      <h1 style="font-size:2.2rem;margin:.4em 0">Certificado</h1>
      <p style="font-size:1.15rem">Certificamos que <strong>${cert.person_name}</strong> ${text} <strong>${cert.title} ${cert.edition}</strong>.</p>
      <p class="muted">Emitido em ${fmtDate(cert.issued_at)}</p>
      <p class="small">Código de verificação: <strong>${cert.code}</strong><br>Valide em ${url}</p>
    </div>`,
  )
})

export default r
