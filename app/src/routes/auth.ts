import { Hono } from 'hono'
import { html } from 'hono/html'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { type Env, back, db, deps, render } from '../context.js'
import { consumeLoginToken, createLoginLink, isEmail } from '../services.js'
import { sendEmail } from '../mail.js'

const r = new Hono<Env>()

r.get('/entrar', (c) => {
  const voltar = c.req.query('voltar') ?? '/minha-area'
  return render(
    c,
    'Entrar',
    html`<div class="card" style="max-width:520px;margin:auto">
      <h1>Entrar na Cienvia</h1>
      <p class="muted">Sem senha: enviamos um link de acesso para o seu e-mail. O link vale por 15 minutos e só pode ser usado uma vez.</p>
      <form method="post" action="/entrar">
        <input type="hidden" name="voltar" value="${voltar}">
        <label for="email">E-mail</label>
        <input id="email" name="email" type="email" autocomplete="email" required>
        <p><button class="btn">Enviar link de acesso</button></p>
      </form>
      ${deps(c).dev
        ? html`<div class="dev small"><strong>Modo demonstração:</strong> os e-mails não são enviados de verdade. Depois de pedir o link, ele aparece nesta tela e em <a href="/dev/emails">E-mails (dev)</a>. Para entrar direto com os usuários de exemplo, use <a href="/dev/entrar">acesso rápido</a>.</div>`
        : ''}
    </div>`,
  )
})

r.post('/entrar', async (c) => {
  const body = await c.req.parseBody()
  const email = String(body.email ?? '').trim().toLowerCase()
  const voltar = String(body.voltar ?? '/minha-area')
  if (!isEmail(email)) return back(c, '/entrar', 'Informe um e-mail válido.', true)
  const link = await createLoginLink(db(c), deps(c).baseUrl, email, voltar)
  await sendEmail(db(c), { to: email, subject: 'Seu link de acesso à Cienvia', body: `Use este link para entrar (válido por 15 minutos):\n${link}\n\nSe você não pediu, ignore este e-mail.` })
  return render(
    c,
    'Verifique seu e-mail',
    html`<div class="card" style="max-width:520px;margin:auto"><h1>Verifique seu e-mail</h1>
      <p>Enviamos um link de acesso para <strong>${email}</strong>.</p>
      ${deps(c).dev ? html`<div class="dev small">Modo demonstração: <a href="${link}">clique aqui para entrar</a>.</div>` : ''}</div>`,
  )
})

r.get('/entrar/:token', async (c) => {
  const res = await consumeLoginToken(db(c), c.req.param('token'))
  if (!res) return back(c, '/entrar', 'Link inválido, expirado ou já usado. Peça um novo.', true)
  setCookie(c, 'cv_session', res.sid, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 14 * 86400, secure: deps(c).baseUrl.startsWith('https') })
  if (!res.person.name) return c.redirect(`/perfil?voltar=${encodeURIComponent(res.redirectTo)}`, 303)
  return c.redirect(res.redirectTo, 303)
})

r.post('/sair', async (c) => {
  const sid = getCookie(c, 'cv_session')
  if (sid) await db(c).query('DELETE FROM session WHERE id=$1', [sid])
  deleteCookie(c, 'cv_session', { path: '/' })
  return c.redirect('/', 303)
})

export default r
