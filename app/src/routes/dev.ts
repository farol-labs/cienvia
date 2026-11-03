import { Hono } from 'hono'
import { html } from 'hono/html'
import { setCookie } from 'hono/cookie'
import { type Env, db, deps, render } from '../context.js'
import { token } from '../util.js'
import { fmtDateTime } from '../util.js'

/** Rotas exclusivas do modo demonstração (DEV=1). Nunca habilitar em produção. */
const r = new Hono<Env>()

r.get('/dev/emails', async (c) => {
  const to = c.req.query('para') ?? ''
  const rows = await db(c).query(
    `SELECT * FROM email_message WHERE ($1='' OR to_email=$1) ORDER BY created_at DESC LIMIT 200`,
    [to.toLowerCase()],
  )
  const linkify = (s: string) => s.split(/(https?:\/\/\S+)/g).map((p) => (/^https?:\/\//.test(p) ? html`<a href="${p}">${p}</a>` : p))
  return render(
    c,
    'E-mails (dev)',
    html`<h1>Caixa de saída (modo demonstração)</h1>
    <p class="muted">Nenhum e-mail é enviado de verdade. Aqui aparecem todos os e-mails que o sistema enviaria.</p>
    <form class="row" method="get"><label for="p">Destinatário</label><input id="p" name="para" type="text" value="${to}" style="max-width:320px"><button class="btn sm">Filtrar</button></form>
    ${rows.map((m) => html`<details class="card"><summary><strong>${m.subject}</strong> <span class="muted small">para ${m.to_email} · ${fmtDateTime(m.created_at)}</span></summary>
      <pre style="white-space:pre-wrap;font-family:inherit">${linkify(m.body)}</pre></details>`)}`,
  )
})

r.get('/dev/entrar', async (c) => {
  const people = await db(c).query(`SELECT email, name FROM person WHERE email LIKE '%@demo.cienvia.app' ORDER BY email`)
  return render(
    c,
    'Acesso rápido',
    html`<h1>Acesso rápido (demonstração)</h1><p class="muted">Entre como um dos usuários de exemplo, sem link por e-mail.</p>
    <div class="grid g2">${people.map((p) => html`<form class="card" method="post" action="/dev/entrar"><input type="hidden" name="email" value="${p.email}"><strong>${p.name}</strong><div class="small muted">${p.email}</div><p><button class="btn sm">Entrar como</button></p></form>`)}</div>`,
  )
})

r.post('/dev/entrar', async (c) => {
  const b = await c.req.parseBody()
  const p = await db(c).one(`SELECT id, email FROM person WHERE email=$1 AND email LIKE '%@demo.cienvia.app'`, [String(b.email ?? '')])
  if (!p) return c.redirect('/dev/entrar', 303)
  const sid = token(32)
  await db(c).query(`INSERT INTO session (id, person_id, expires_at) VALUES ($1,$2, now() + interval '1 day')`, [sid, p.id])
  setCookie(c, 'cv_session', sid, { httpOnly: true, sameSite: 'Lax', path: '/', secure: deps(c).baseUrl.startsWith('https') })
  return c.redirect(p.email.startsWith('organizacao') ? '/org' : p.email.startsWith('avaliador') ? '/avaliacoes' : '/minha-area', 303)
})

export default r
