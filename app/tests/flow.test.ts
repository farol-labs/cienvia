import { beforeAll, describe, expect, it } from 'vitest'
import { openDb, type Db } from '../src/db.js'
import { memoryStorage } from '../src/storage.js'
import { createApp } from '../src/app.js'
import { samplePdf } from '../src/pdf.js'

process.env.NODE_ENV = 'test'
const BASE = 'http://cienvia.test'
let db: Db
let app: ReturnType<typeof createApp>

type Client = { cookie: string; get: (p: string) => Promise<Response>; post: (p: string, body: Record<string, any> | FormData) => Promise<Response> }

async function login(email: string): Promise<Client> {
  await app.request(`${BASE}/entrar`, { method: 'POST', body: new URLSearchParams({ email }) })
  const t = await db.one<{ token: string }>('SELECT token FROM login_token WHERE email=$1 ORDER BY expires_at DESC LIMIT 1', [email])
  const res = await app.request(`${BASE}/entrar/${t!.token}`)
  const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]
  expect(cookie).toMatch(/^cv_session=/)
  // link mágico é de uso único
  const again = await app.request(`${BASE}/entrar/${t!.token}`)
  expect(again.headers.get('location')).toMatch(/erro=/)
  const client: Client = {
    cookie,
    get: async (p) => app.request(`${BASE}${p}`, { headers: { cookie } }),
    post: async (p, body) => {
      let b: any = body
      if (!(body instanceof FormData)) {
        const u = new URLSearchParams()
        for (const [k, v] of Object.entries(body)) for (const x of [].concat(v as any)) u.append(k, String(x))
        b = u
      }
      return app.request(`${BASE}${p}`, { method: 'POST', body: b, headers: { cookie } })
    },
  }
  await client.post('/perfil', { name: email.split('@')[0].toUpperCase(), affiliation: email.includes('rival') ? 'Outra Univ' : 'Univ A' })
  return client
}
const loc = (r: Response) => r.headers.get('location') ?? ''
const text = (r: Response) => r.text()
const localInput = (d: Date) => new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 16)

let org: Client, author: Client, rev1: Client, rev2: Client, outsider: Client
let eventId = '', eventPath = '', submissionId = '', fileId = ''

beforeAll(async () => {
  db = await openDb()
  app = createApp({ db, storage: memoryStorage(), dev: false, baseUrl: BASE })
  org = await login('org@univa.br')
  author = await login('autora@aluno.br')
  rev1 = await login('rev1@rival.br')
  rev2 = await login('rev2@rival.br')
  outsider = await login('curioso@rival.br')
})

describe('fluxo central de ponta a ponta', () => {
  it('organizador cria organização e evento a partir de modelo, e publica', async () => {
    let r = await org.post('/org', { name: 'Universidade A' })
    const orgId = loc(r).split('/')[2]
    r = await org.post(`/org/${orgId}/eventos`, {
      template: 'seminario-ppg', title: 'Seminário PPG', edition: '2027',
      opens_at: localInput(new Date(Date.now() - 86400e3)), closes_at: localInput(new Date(Date.now() + 86400e3)),
    })
    eventId = loc(r).split('/')[2]
    expect(eventId).toMatch(/^[0-9a-f-]{36}$/)
    r = await org.post(`/gestao/${eventId}/publicar`, {})
    expect(r.status).toBe(303)
    const ev = await db.one('SELECT e.slug, o.slug AS org FROM event e JOIN organization o ON o.id=e.org_id WHERE e.id=$1', [eventId])
    eventPath = `/e/${ev.org}/${ev.slug}`
    expect((await app.request(`${BASE}${eventPath}`)).status).toBe(200)
  })

  it('outra pessoa não acessa a gestão do evento (isolamento)', async () => {
    expect((await outsider.get(`/gestao/${eventId}`)).status).toBe(403)
    expect((await outsider.post(`/gestao/${eventId}/publicar`, {})).status).toBe(403)
  })

  it('autora submete com coautor; validações bloqueiam envio incompleto', async () => {
    const tracks = await db.query('SELECT id FROM track WHERE event_id=$1 ORDER BY position', [eventId])
    const types = await db.query('SELECT id FROM submission_type WHERE event_id=$1 ORDER BY position', [eventId])
    const bad = new FormData()
    bad.append('title', 'X')
    const r0 = await author.post(`${eventPath}/submeter`, bad)
    expect(r0.status).toBe(200)
    expect(await text(r0)).toMatch(/Corrija antes de enviar/)

    const f = new FormData()
    f.append('track_id', tracks[0].id)
    f.append('type_id', types[0].id)
    f.append('title', 'Um estudo sobre avaliação por pares em eventos')
    f.append('abstract', 'Resumo com mais de cinquenta caracteres para passar na validação do formulário de submissão.')
    f.append('keywords', 'avaliação; eventos')
    for (const [n, e, a] of [['Autora', 'autora@aluno.br', 'Univ A'], ['Coautor Orientador', 'orientador@univa.br', 'Univ A']]) {
      f.append('author_name', n); f.append('author_email', e); f.append('author_aff', a)
    }
    f.append('corresponding', '0')
    f.append('accept', '1')
    f.append('arquivo', new Blob([(await samplePdf('Um estudo', 3, 'Autora')) as BlobPart], { type: 'application/pdf' }), 'trabalho.pdf')
    const r = await author.post(`${eventPath}/submeter`, f)
    expect(r.status).toBe(303)
    submissionId = loc(r).split('/')[2].split('?')[0]
    const recibos = await db.query(`SELECT to_email FROM email_message WHERE subject LIKE '%Trabalho recebido%'`)
    expect(recibos.map((x) => x.to_email).sort()).toEqual(['autora@aluno.br', 'orientador@univa.br'])
    fileId = (await db.one('SELECT id FROM submission_file WHERE submission_id=$1', [submissionId])).id
  })

  it('arquivo inédito só é acessível a quem tem permissão', async () => {
    expect((await author.get(`/arquivos/${fileId}`)).status).toBe(200)
    expect((await org.get(`/arquivos/${fileId}`)).status).toBe(200)
    expect((await outsider.get(`/arquivos/${fileId}`)).status).toBe(403)
    expect((await app.request(`${BASE}/arquivos/${fileId}`)).status).toBe(303) // sem login
  })

  it('convite, aceite, atribuição sugerida e parecer duplo-cego', async () => {
    const tracks = await db.query('SELECT id FROM track WHERE event_id=$1 ORDER BY position', [eventId])
    for (const e of ['rev1@rival.br', 'rev2@rival.br', 'orientador@univa.br'])
      expect((await org.post(`/gestao/${eventId}/avaliadores`, { name: e, email: e, affiliation: e.includes('rival') ? 'Outra Univ' : 'Univ A', track_ids: tracks[0].id, max_load: 3 })).status).toBe(303)
    const orient = await login('orientador@univa.br')
    for (const c of [rev1, rev2, orient]) {
      const rid = (await db.one(`SELECT r.id FROM reviewer r JOIN person p ON p.id=r.person_id WHERE p.email=$1 AND r.event_id=$2`, [c === rev1 ? 'rev1@rival.br' : c === rev2 ? 'rev2@rival.br' : 'orientador@univa.br', eventId])).id
      await c.post(`/convites/${rid}`, { resposta: 'aceitar', max_load: 3 })
    }
    const page = await text(await org.get(`/gestao/${eventId}/atribuicao`))
    expect(page).toMatch(/Sugestão \(2 atribuições\)/) // o coautor-orientador é excluído por conflito
    const pairs = [...page.matchAll(/name="pair" value="([^"]+)"/g)].map((m) => m[1])
    await org.post(`/gestao/${eventId}/atribuicao`, { pair: pairs })
    const asg = await db.query(`SELECT a.id, p.email FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id JOIN person p ON p.id=r.person_id WHERE a.submission_id=$1`, [submissionId])
    expect(asg.map((a) => a.email).sort()).toEqual(['rev1@rival.br', 'rev2@rival.br'])

    // duplo-cego: a tela do avaliador não mostra nenhum dado de autoria
    const a1 = asg.find((a) => a.email === 'rev1@rival.br')!.id
    const html = await text(await rev1.get(`/avaliacoes/${a1}`))
    expect(html).toContain('Um estudo sobre avaliação')
    for (const leak of ['autora@aluno.br', 'orientador@univa.br', 'Coautor Orientador', 'AUTORA']) expect(html).not.toContain(leak)
    // avaliador acessa o arquivo, mas não a avaliação de outro
    expect((await rev1.get(`/arquivos/${fileId}`)).status).toBe(200)
    const a2 = asg.find((a) => a.email === 'rev2@rival.br')!.id
    expect((await rev1.get(`/avaliacoes/${a2}`)).status).toBe(404)

    const crit = await db.query('SELECT id FROM review_criterion WHERE event_id=$1', [eventId])
    for (const [c, id, rec] of [[rev1, a1, 'accept'], [rev2, a2, 'accept_with_corrections']] as const) {
      const body: Record<string, any> = { recommendation: rec, comment_author: `Parecer detalhado do avaliador para o autor (${rec}).` }
      for (const cr of crit) body[`score_${cr.id}`] = 4
      expect((await c.post(`/avaliacoes/${id}`, body)).status).toBe(303)
    }
    expect((await db.one(`SELECT count(*)::int AS n FROM assignment WHERE submission_id=$1 AND status='done'`, [submissionId])).n).toBe(2)
  })

  it('decisão fica oculta até a divulgação; depois o autor recebe pareceres e certificado', async () => {
    await org.post(`/gestao/${eventId}/decisoes`, { submission_id: submissionId, outcome: 'accepted', note: 'Parabéns.' })
    let html = await text(await author.get(`/submissoes/${submissionId}`))
    expect(html).toContain('Em avaliação')
    expect(html).not.toContain('Parecer detalhado')
    expect(await text(await app.request(`${BASE}${eventPath}/aprovados`))).toMatch(/ainda não foi divulgado/)

    expect((await org.post(`/gestao/${eventId}/liberar`, {})).status).toBe(303)
    html = await text(await author.get(`/submissoes/${submissionId}`))
    expect(html).toContain('Aprovado')
    expect(html).toContain('Parecer detalhado')
    expect(html).not.toContain('rev1@rival.br') // avaliador não é identificado ao autor
    expect(await text(await app.request(`${BASE}${eventPath}/aprovados`))).toContain('Um estudo sobre avaliação')
    expect((await author.get(`/submissoes/${submissionId}/carta`)).status).toBe(200)

    const certs = await db.query(`SELECT kind, code, person_email FROM certificate WHERE event_id=$1 ORDER BY kind, person_email`, [eventId])
    expect(certs.map((c) => `${c.kind}:${c.person_email}`)).toEqual(['author:autora@aluno.br', 'author:orientador@univa.br', 'reviewer:rev1@rival.br', 'reviewer:rev2@rival.br'])
    expect(await text(await app.request(`${BASE}/validar?codigo=${certs[0].code}`))).toContain('Certificado válido')
    expect(await text(await app.request(`${BASE}/validar?codigo=XXXX-XXXX-XXXX`))).toContain('Nenhum certificado')
    const resultMails = await db.query(`SELECT body FROM email_message WHERE subject LIKE '%Resultado%'`)
    expect(resultMails).toHaveLength(2)
    expect(resultMails[0].body).not.toContain('rev1@rival.br')
  })

  it('auditoria registra ações sensíveis', async () => {
    const actions = (await db.query(`SELECT DISTINCT action FROM audit_log`)).map((x) => x.action)
    for (const a of ['event.create', 'submission.create', 'assignment.apply', 'review.submit', 'decision.record', 'results.release', 'file.download'])
      expect(actions).toContain(a)
  })
})
