import type { Db } from './db.js'
import type { Storage } from './storage.js'
import type { CallRow, EventRow } from './context.js'
import { applyAssignments, createEventFromTemplate, createOrganization, findOrCreatePerson, inviteReviewer, respondInvite, submitReview, submitWork, suggest } from './services.js'
import { samplePdf } from './pdf.js'

/**
 * Dados de demonstração: uma universidade, uma Mostra de IC com chamada aberta, 4 avaliadores (3 aceitos),
 * 8 trabalhos e parte dos pareceres feitos. Todos os e-mails terminam em @demo.cienvia.app.
 */
export async function seedDemo(db: Db, storage: Storage, baseUrl: string) {
  if (await db.one(`SELECT 1 FROM person WHERE email='organizacao@demo.cienvia.app'`)) return false
  const D = '@demo.cienvia.app'
  const org = await findOrCreatePerson(db, `organizacao${D}`, 'Profa. Helena Duarte', 'Universidade Federal Demo')
  const o = await createOrganization(db, org, 'Universidade Federal Demo')
  const now = Date.now()
  const ev = await createEventFromTemplate(db, org, o.id, {
    title: 'Mostra de Iniciação Científica',
    edition: '2027',
    template: 'mostra-ic',
    opensAt: new Date(now - 10 * 86400000),
    closesAt: new Date(now + 20 * 86400000),
    startsOn: new Date(now + 60 * 86400000).toISOString().slice(0, 10),
    endsOn: new Date(now + 62 * 86400000).toISOString().slice(0, 10),
  })
  await db.query(`UPDATE event SET status='published', location='Campus Central, Auditório 2' WHERE id=$1`, [ev.id])
  const load = async () => {
    const e = (await db.one<EventRow>(`SELECT e.*, o.slug AS org_slug, o.name AS org_name FROM event e JOIN organization o ON o.id=e.org_id WHERE e.id=$1`, [ev.id]))!
    const c = (await db.one<CallRow>('SELECT * FROM call WHERE event_id=$1', [ev.id]))!
    return { e, c }
  }
  let { e, c } = await load()
  const tracks = await db.query('SELECT id, name FROM track WHERE event_id=$1 ORDER BY position', [ev.id])
  const types = await db.query('SELECT id FROM submission_type WHERE event_id=$1 ORDER BY position', [ev.id])

  const reviewers = [
    ['avaliador1', 'Dr. Carlos Menezes', 'Instituto de Pesquisa do Norte', [0, 2]],
    ['avaliador2', 'Dra. Fernanda Lima', 'Universidade Estadual Demo', [1, 3]],
    ['avaliador3', 'Dr. Rafael Souza', 'Universidade Federal Demo', [0, 1, 2]],
    ['avaliador4', 'Dra. Patrícia Gomes', 'Faculdade Demo de Letras', [3, 4]],
  ] as const
  for (const [i, [u, n, a, tr]] of reviewers.entries()) {
    const r = await inviteReviewer(db, baseUrl, e, org, { email: `${u}${D}`, name: n, affiliation: a, trackIds: tr.map((x) => tracks[x].id), maxLoad: 6 })
    if (i < 3) await respondInvite(db, (await findOrCreatePerson(db, `${u}${D}`))!, r.id, true)
  }

  const works = [
    ['autora1', 'Ana Beatriz Rocha', 0, 'Modelagem de chuvas extremas no semiárido com dados de satélite'],
    ['autor2', 'Bruno Costa', 1, 'Atividade antimicrobiana de extratos de plantas do cerrado'],
    ['autora1', 'Ana Beatriz Rocha', 2, 'Sensor de baixo custo para monitoramento da qualidade do ar'],
    ['autora3', 'Camila Nunes', 3, 'Memória e território: narrativas de moradores de bairros periféricos'],
    ['autor4', 'Diego Ferreira', 0, 'Algoritmos de otimização para rotas de coleta seletiva'],
    ['autora3', 'Camila Nunes', 4, 'Literatura de cordel como recurso didático no ensino fundamental'],
    ['autor2', 'Bruno Costa', 1, 'Prevalência de sedentarismo em estudantes universitários'],
    ['autor4', 'Diego Ferreira', 2, 'Reaproveitamento de resíduos da construção civil em blocos de concreto'],
  ] as const
  const abstract =
    'Este trabalho apresenta os resultados parciais de um projeto de iniciação científica. Descrevemos o problema, os objetivos, a metodologia empregada e os principais resultados obtidos até o momento, discutindo limitações e próximos passos.'
  for (const [u, n, t, title] of works) {
    const p = await findOrCreatePerson(db, `${u}${D}`, n, 'Universidade Federal Demo')
    await submitWork(db, storage, e, c, p, {
      trackId: tracks[t].id,
      typeId: types[0].id,
      title,
      abstract,
      keywords: 'iniciação científica; demonstração',
      authors: [
        { name: n, email: p.email, affiliation: 'Universidade Federal Demo' },
        { name: `Prof. Orientador(a) de ${n.split(' ')[0]}`, email: `orientador.${u}${D}`, affiliation: 'Universidade Federal Demo' },
      ],
      correspondingIndex: 0,
      file: await samplePdf(title, 3, n),
      acceptRules: true,
    })
  }
  // encerra a chamada para a demonstração da avaliação ficar natural: aplica a sugestão e faz alguns pareceres
  ;({ e, c } = await load())
  const sug = await suggest(db, e, c)
  await applyAssignments(db, baseUrl, e, c, org, sug.proposals)
  const r1 = await findOrCreatePerson(db, `avaliador1${D}`)
  const pend = await db.query(
    `SELECT a.id FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id WHERE r.person_id=$1 AND a.status='pending' ORDER BY a.created_at LIMIT 2`,
    [r1.id],
  )
  const crit = await db.query('SELECT id FROM review_criterion WHERE event_id=$1', [ev.id])
  for (const [i, a] of pend.entries())
    await submitReview(db, r1, a.id, {
      scores: Object.fromEntries(crit.map((x) => [x.id, i === 0 ? 5 : 3])),
      recommendation: i === 0 ? 'accept' : 'accept_with_corrections',
      commentAuthor: i === 0 ? 'Trabalho bem estruturado, metodologia adequada e resultados claros.' : 'Bom trabalho, mas a seção de metodologia precisa detalhar a amostra e os instrumentos.',
      commentCommittee: '',
    })
  return true
}
