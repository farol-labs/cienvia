import type { Context } from 'hono'
import type { Db } from './db.js'
import type { Storage } from './storage.js'
import { layout, type H, type Person } from './views/layout.js'

export type Deps = { db: Db; storage: Storage; dev: boolean; baseUrl: string }
export type Env = { Variables: { deps: Deps; user: Person | null } }
export type C = Context<Env>

export class HttpError extends Error {
  constructor(public status: number, msg: string) {
    super(msg)
  }
}

export const deps = (c: C) => c.get('deps')
export const db = (c: C) => c.get('deps').db

export function render(c: C, title: string, body: H, status = 200) {
  const flash = c.req.query('ok') ?? null
  const error = c.req.query('erro') ?? null
  return c.html(layout({ title, body, user: c.get('user'), flash, error, dev: c.get('deps').dev }), status as any)
}

export function requireUser(c: C): Person {
  const u = c.get('user')
  if (!u) throw new HttpError(401, 'login')
  return u
}

export const back = (c: C, path: string, msg?: string, isError = false) => {
  const sep = path.includes('?') ? '&' : '?'
  return c.redirect(msg ? `${path}${sep}${isError ? 'erro' : 'ok'}=${encodeURIComponent(msg)}` : path, 303)
}

export type EventRow = {
  id: string
  org_id: string
  slug: string
  title: string
  edition: string
  description: string
  format: string
  location: string
  starts_on: string | null
  ends_on: string | null
  primary_color: string
  status: string
  org_slug: string
  org_name: string
}

export type CallRow = {
  event_id: string
  opens_at: Date
  closes_at: Date
  review_due_at: Date | null
  review_mode: 'single' | 'double'
  reviews_per_submission: number
  max_per_author: number
  max_pages: number
  max_mb: number
  same_institution_conflict: boolean
  guidelines: string
  results_released_at: Date | null
}

export async function orgRole(d: Db, orgId: string, personId: string): Promise<string | null> {
  const r = await d.one<{ role: string }>('SELECT role FROM org_member WHERE org_id=$1 AND person_id=$2', [orgId, personId])
  return r?.role ?? null
}

/** Carrega o evento e exige que o usuário seja organizador (membro da organização). Isolamento por organização. */
export async function eventForOrganizer(c: C, eventId: string): Promise<{ ev: EventRow; call: CallRow; user: Person }> {
  const user = requireUser(c)
  if (!/^[0-9a-f-]{36}$/.test(eventId)) throw new HttpError(404, 'Evento não encontrado')
  const ev = await db(c).one<EventRow>(
    `SELECT e.*, o.slug AS org_slug, o.name AS org_name FROM event e JOIN organization o ON o.id=e.org_id WHERE e.id=$1`,
    [eventId],
  )
  if (!ev) throw new HttpError(404, 'Evento não encontrado')
  const role = await orgRole(db(c), ev.org_id, user.id)
  if (!role && !user.is_platform_admin) throw new HttpError(403, 'Você não tem acesso a este evento.')
  const call = (await db(c).one<CallRow>('SELECT * FROM call WHERE event_id=$1', [ev.id]))!
  return { ev, call, user }
}

export async function publicEvent(c: C, orgSlug: string, eventSlug: string) {
  const ev = await db(c).one<EventRow>(
    `SELECT e.*, o.slug AS org_slug, o.name AS org_name FROM event e JOIN organization o ON o.id=e.org_id
     WHERE o.slug=$1 AND e.slug=$2`,
    [orgSlug, eventSlug],
  )
  if (!ev) throw new HttpError(404, 'Evento não encontrado')
  const call = (await db(c).one<CallRow>('SELECT * FROM call WHERE event_id=$1', [ev.id]))!
  return { ev, call }
}

export const callState = (call: CallRow, now = new Date()) =>
  now < new Date(call.opens_at) ? 'before' : now > new Date(call.closes_at) ? 'closed' : 'open'
