import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { html } from 'hono/html'
import { type Deps, type Env, HttpError, render } from './context.js'
import { ValidationError } from './services.js'
import type { Person } from './views/layout.js'
import authRoutes from './routes/auth.js'
import publicRoutes from './routes/public.js'
import authorRoutes from './routes/author.js'
import reviewerRoutes from './routes/reviewer.js'
import orgRoutes from './routes/org.js'
import devRoutes from './routes/dev.js'

export function createApp(deps: Deps) {
  const app = new Hono<Env>()

  app.use('*', async (c, next) => {
    c.set('deps', deps)
    c.set('user', null)
    const sid = getCookie(c, 'cv_session')
    if (sid) {
      const u = await deps.db.one<Person>(
        'SELECT p.* FROM session s JOIN person p ON p.id=s.person_id WHERE s.id=$1 AND s.expires_at > now()',
        [sid],
      )
      if (u) c.set('user', u)
    }
    await next()
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'same-origin')
    if (!c.res.headers.get('X-Frame-Options')) c.header('X-Frame-Options', 'SAMEORIGIN')
  })

  // Proteção CSRF simples: formulários POST precisam vir do mesmo host.
  app.use('*', async (c, next) => {
    if (c.req.method === 'POST') {
      const origin = c.req.header('origin')
      const host = c.req.header('host')
      if (origin && host && new URL(origin).host !== host) return c.text('Origem inválida', 403)
    }
    await next()
  })

  app.route('/', authRoutes)
  app.route('/', publicRoutes)
  app.route('/', authorRoutes)
  app.route('/', reviewerRoutes)
  app.route('/', orgRoutes)
  if (deps.dev) app.route('/', devRoutes)

  app.notFound((c) => render(c as any, 'Não encontrado', html`<h1>Página não encontrada</h1><p><a href="/">Voltar ao início</a></p>`, 404))

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      if (err.status === 401) return c.redirect(`/entrar?voltar=${encodeURIComponent(c.req.path)}`, 303)
      return render(c as any, 'Erro', html`<h1>${err.status === 403 ? 'Acesso negado' : 'Não encontrado'}</h1><p>${err.message}</p>`, err.status)
    }
    if (err instanceof ValidationError) return render(c as any, 'Erro', html`<h1>Não foi possível concluir</h1><ul>${err.errors.map((e) => html`<li>${e}</li>`)}</ul><p><a href="javascript:history.back()">Voltar</a></p>`, 422)
    console.error(err)
    return render(c as any, 'Erro', html`<h1>Erro inesperado</h1><p>Tente novamente. Se persistir, contate o suporte.</p>`, 500)
  })
  return app
}
