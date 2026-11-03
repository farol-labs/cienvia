import { Hono } from 'hono'
import { html } from 'hono/html'
import { type Env, HttpError, back, db, render, requireUser } from '../context.js'
import { assignmentForReviewer, declareConflict, respondInvite, reviewerSubmissionView, submitReview, ValidationError } from '../services.js'
import { fmtDateTime, OUTCOME_LABEL } from '../util.js'

const r = new Hono<Env>()

r.get('/avaliacoes', async (c) => {
  const u = requireUser(c)
  const invites = await db(c).query(
    `SELECT r.id, r.max_load, e.title, e.edition, o.name AS org_name,
       (SELECT string_agg(t.name, ', ') FROM reviewer_track rt JOIN track t ON t.id=rt.track_id WHERE rt.reviewer_id=r.id) AS tracks
     FROM reviewer r JOIN event e ON e.id=r.event_id JOIN organization o ON o.id=e.org_id WHERE r.person_id=$1 AND r.status='invited'`,
    [u.id],
  )
  const tasks = await db(c).query(
    `SELECT a.id, a.status, a.due_at, s.code, s.title, e.title AS event_title, e.edition
     FROM assignment a JOIN reviewer r ON r.id=a.reviewer_id JOIN submission s ON s.id=a.submission_id JOIN event e ON e.id=r.event_id
     WHERE r.person_id=$1 AND s.status<>'withdrawn' ORDER BY a.status='pending' DESC, a.due_at NULLS LAST, s.code`,
    [u.id],
  )
  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => t.status === 'done')
  const late = (d: string | null) => d && new Date(d) < new Date()
  return render(
    c,
    'Avaliações',
    html`<h1>Avaliações</h1>
    ${invites.map(
      (i) => html`<form class="card" method="post" action="/convites/${i.id}">
        <h2>Convite: ${i.title} ${i.edition}</h2><p class="muted">${i.org_name} · Eixos: ${i.tracks || 'a definir'}</p>
        <label for="ml-${i.id}">Quantos trabalhos você pode avaliar, no máximo?</label><input id="ml-${i.id}" name="max_load" type="number" min="1" max="50" value="${i.max_load}" style="max-width:120px">
        <p class="row"><button class="btn teal" name="resposta" value="aceitar">Aceitar</button> <button class="btn ghost" name="resposta" value="recusar">Recusar</button></p></form>`,
    )}
    <h2>Pendentes (${pending.length})</h2>
    ${pending.length
      ? html`<div class="tw"><table><thead><tr><th>Trabalho</th><th>Evento</th><th>Prazo</th><th></th></tr></thead><tbody>
        ${pending.map((t) => html`<tr><td><strong>${t.code}</strong> ${t.title}</td><td>${t.event_title} ${t.edition}</td>
          <td>${late(t.due_at) ? html`<span class="badge b-err">Atrasado · ${fmtDateTime(t.due_at)}</span>` : fmtDateTime(t.due_at)}</td>
          <td><a class="btn sm" href="/avaliacoes/${t.id}">Avaliar</a></td></tr>`)}</tbody></table></div>`
      : html`<p class="muted">Nenhum parecer pendente.</p>`}
    <h2>Concluídas (${done.length})</h2>
    ${done.length ? html`<ul>${done.map((t) => html`<li>${t.code} · ${t.title}</li>`)}</ul>` : html`<p class="muted">-</p>`}`,
  )
})

r.post('/convites/:id', async (c) => {
  const u = requireUser(c)
  const b = await c.req.parseBody()
  const accept = b.resposta === 'aceitar'
  await respondInvite(db(c), u, c.req.param('id'), accept, Number(b.max_load) || undefined)
  return back(c, '/avaliacoes', accept ? 'Convite aceito. Você será avisado por e-mail quando receber trabalhos.' : 'Convite recusado.')
})

async function reviewPage(c: any, id: string, errors: string[] = [], values: Record<string, any> = {}) {
  const u = requireUser(c)
  const a = await assignmentForReviewer(db(c), u, id)
  if (!a || a.status === 'declined_conflict') throw new HttpError(404, 'Avaliação não encontrada')
  const view: any = await reviewerSubmissionView(db(c), a.submission_id, a.review_mode)
  const criteria = await db(c).query('SELECT id, name, max_score FROM review_criterion WHERE event_id=$1 ORDER BY position', [a.event_id])
  const file = view.files[view.files.length - 1]
  const done = a.status === 'done'
  const existing = done ? await db(c).one('SELECT * FROM review WHERE assignment_id=$1', [a.id]) : null
  const scores = done ? await db(c).query('SELECT criterion_id, score FROM review_score WHERE assignment_id=$1', [a.id]) : []
  const sv = (cid: string) => values.scores?.[cid] ?? scores.find((s) => s.criterion_id === cid)?.score
  return render(
    c,
    `Avaliar ${view.code}`,
    html`<p class="small"><a href="/avaliacoes">← Avaliações</a></p>
    <h1>${view.code} · ${view.title}</h1>
    <p class="muted small">${a.event_title} · ${view.track} · ${view.type} · Avaliação ${a.review_mode === 'double' ? 'duplo-cega: a identidade dos autores não é exibida' : 'simples-cega'} · Prazo ${fmtDateTime(a.review_due_at)}</p>
    ${view.authors ? html`<p class="small">Autores: ${view.authors.map((x: any) => `${x.name}${x.affiliation ? ` (${x.affiliation})` : ''}`).join('; ')}</p>` : ''}
    <div class="split">
      <div><details class="card" open><summary><strong>Resumo</strong></summary><p>${view.abstract}</p><p class="small muted">Palavras-chave: ${view.keywords}</p></details>
        ${file ? html`<iframe class="pdf" title="Arquivo do trabalho" src="/arquivos/${file.id}"></iframe><p class="small"><a href="/arquivos/${file.id}" target="_blank" rel="noopener">Abrir PDF em nova aba</a> · versão ${file.version}, ${file.pages} páginas</p>` : ''}</div>
      <div>
        ${errors.length ? html`<div class="flash err" role="alert"><ul>${errors.map((e) => html`<li>${e}</li>`)}</ul></div>` : ''}
        ${done
          ? html`<div class="card"><h2>Parecer enviado</h2><p>Recomendação: <strong>${OUTCOME_LABEL[existing.recommendation]}</strong></p>
              <ul>${criteria.map((cr) => html`<li>${cr.name}: ${sv(cr.id)}/${cr.max_score}</li>`)}</ul>
              <h3>Ao autor</h3><p style="white-space:pre-wrap">${existing.comment_author}</p>
              ${existing.comment_committee ? html`<h3>À comissão (confidencial)</h3><p style="white-space:pre-wrap">${existing.comment_committee}</p>` : ''}</div>`
          : html`<form class="card" method="post" action="/avaliacoes/${a.id}"><h2>Parecer</h2>
              ${criteria.map(
                (cr) => html`<fieldset><legend>${cr.name}</legend><div class="row">
                  ${Array.from({ length: cr.max_score }, (_, i) => i + 1).map(
                    (n) => html`<label class="chk"><input type="radio" name="score_${cr.id}" value="${n}" ${String(sv(cr.id)) === String(n) ? 'checked' : ''} required> ${n}</label>`,
                  )}</div></fieldset>`,
              )}
              <fieldset><legend>Recomendação</legend>
                ${['accept', 'accept_with_corrections', 'reject'].map(
                  (k) => html`<label class="chk"><input type="radio" name="recommendation" value="${k}" ${values.recommendation === k ? 'checked' : ''} required> ${OUTCOME_LABEL[k]}</label>`,
                )}</fieldset>
              <label for="ca">Comentários ao autor <span class="muted">(enviados ao autor sem sua identificação)</span></label>
              <textarea id="ca" name="comment_author" required minlength="20">${values.commentAuthor ?? ''}</textarea>
              <label for="cc">Comentários à comissão <span class="muted">(confidenciais, opcional)</span></label>
              <textarea id="cc" name="comment_committee" style="min-height:70px">${values.commentCommittee ?? ''}</textarea>
              <p><button class="btn teal">Enviar parecer</button></p></form>
            <form class="card" method="post" action="/avaliacoes/${a.id}/conflito" onsubmit="return confirm('Declarar conflito de interesse e devolver este trabalho à comissão?')">
              <h3>Conflito de interesse</h3><p class="small muted">Se você reconhece a autoria, orientou ou colabora com os autores, devolva o trabalho.</p>
              <label for="nt">Motivo (visível só para a comissão)</label><input id="nt" name="note" type="text">
              <p><button class="btn ghost sm">Declarar conflito</button></p></form>`}
      </div>
    </div>`,
  )
}

r.get('/avaliacoes/:id', (c) => reviewPage(c, c.req.param('id')))

r.post('/avaliacoes/:id', async (c) => {
  const u = requireUser(c)
  const b = await c.req.parseBody()
  const scores: Record<string, number> = {}
  for (const [k, v] of Object.entries(b)) if (k.startsWith('score_')) scores[k.slice(6)] = Number(v)
  const f = { scores, recommendation: String(b.recommendation ?? ''), commentAuthor: String(b.comment_author ?? ''), commentCommittee: String(b.comment_committee ?? '') }
  try {
    await submitReview(db(c), u, c.req.param('id'), f)
  } catch (e) {
    if (e instanceof ValidationError) return reviewPage(c, c.req.param('id'), e.errors, f)
    throw e
  }
  return back(c, '/avaliacoes', 'Parecer enviado. Obrigado!')
})

r.post('/avaliacoes/:id/conflito', async (c) => {
  const u = requireUser(c)
  const b = await c.req.parseBody()
  await declareConflict(db(c), u, c.req.param('id'), String(b.note ?? ''))
  return back(c, '/avaliacoes', 'Conflito registrado. O trabalho voltou para a comissão redistribuir.')
})

export default r
