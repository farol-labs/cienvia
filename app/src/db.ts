import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

export type Db = {
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>
  one<T = any>(sql: string, params?: unknown[]): Promise<T | undefined>
  exec(sql: string): Promise<void>
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>
}

function wrap(q: { query: PGlite['query']; exec: PGlite['exec'] }, pg: PGlite): Db {
  const db: Db = {
    async query(sql, params = []) {
      const r = await q.query(sql, params as any[])
      return r.rows as any[]
    },
    async one(sql, params = []) {
      const r = await q.query(sql, params as any[])
      return r.rows[0] as any
    },
    async exec(sql) {
      await q.exec(sql)
    },
    async tx(fn) {
      return pg.transaction(async (t) => fn(wrap(t as any, pg)))
    },
  }
  return db
}

/** Abre o banco. dataDir indefinido = memória (testes). Em produção: trocar por um driver PostgreSQL (ver ADR 0002). */
export async function openDb(dataDir?: string): Promise<Db> {
  const pg = dataDir ? new PGlite(dataDir) : new PGlite()
  await pg.waitReady
  await pg.exec(readFileSync(join(here, 'schema.sql'), 'utf8'))
  return wrap(pg as any, pg)
}

export async function audit(db: Db, a: { orgId?: string | null; actorId?: string | null; action: string; entity: string; entityId?: string; data?: unknown }) {
  await db.query(
    'INSERT INTO audit_log (org_id, actor_id, action, entity, entity_id, data) VALUES ($1,$2,$3,$4,$5,$6)',
    [a.orgId ?? null, a.actorId ?? null, a.action, a.entity, a.entityId ?? null, JSON.stringify(a.data ?? {})],
  )
}
