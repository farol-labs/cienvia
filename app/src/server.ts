import { serve } from '@hono/node-server'
import { mkdirSync } from 'node:fs'
import { openDb } from './db.js'
import { localStorage } from './storage.js'
import { createApp } from './app.js'
import { seedDemo } from './seed.js'

const port = Number(process.env.PORT ?? 3000)
const dev = process.env.DEV !== '0'
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`
const dataDir = process.env.DATA_DIR ?? './data'
mkdirSync(`${dataDir}/files`, { recursive: true })

const db = await openDb(`${dataDir}/db`)
const storage = localStorage(`${dataDir}/files`)
if (dev && (await seedDemo(db, storage, baseUrl))) console.log('Dados de demonstração criados.')

serve({ fetch: createApp({ db, storage, dev, baseUrl }).fetch, port })
console.log(`Cienvia rodando em ${baseUrl}${dev ? ' (modo demonstração: e-mails em /dev/emails, acesso rápido em /dev/entrar)' : ''}`)
