/**
 * Sugestão de atribuição de avaliadores (regra simples, sem IA).
 * Critérios, em ordem: sem conflito > mesmo eixo > menor carga atual. Respeita a capacidade de cada avaliador.
 */
export type AsgSubmission = { id: string; trackId: string; authorEmails: string[]; authorAffiliations: string[] }
export type AsgReviewer = {
  id: string
  personId: string
  email: string
  affiliation: string
  trackIds: string[]
  maxLoad: number
  currentLoad: number
}
export type AsgInput = {
  submissions: AsgSubmission[]
  reviewers: AsgReviewer[]
  existing: { submissionId: string; reviewerId: string }[]
  declaredConflicts: { submissionId: string; personId: string }[]
  perSubmission: number
  sameInstitutionConflict: boolean
}
export type Proposal = { submissionId: string; reviewerId: string; outsideTrack: boolean }
export type Shortfall = { submissionId: string; missing: number; reason: string }

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

export function conflictReason(
  sub: AsgSubmission,
  rev: AsgReviewer,
  declared: Set<string>,
  sameInstitutionConflict: boolean,
): string | null {
  if (sub.authorEmails.some((e) => norm(e) === norm(rev.email))) return 'é autor(a) do trabalho'
  if (declared.has(`${sub.id}:${rev.personId}`)) return 'conflito declarado'
  if (sameInstitutionConflict && rev.affiliation && sub.authorAffiliations.some((a) => a && norm(a) === norm(rev.affiliation)))
    return 'mesma instituição de um(a) autor(a)'
  return null
}

export function suggestAssignments(input: AsgInput): { proposals: Proposal[]; shortfalls: Shortfall[] } {
  const declared = new Set(input.declaredConflicts.map((c) => `${c.submissionId}:${c.personId}`))
  const load = new Map(input.reviewers.map((r) => [r.id, r.currentLoad]))
  const taken = new Set(input.existing.map((e) => `${e.submissionId}:${e.reviewerId}`))
  const countFor = (sid: string) => input.existing.filter((e) => e.submissionId === sid).length

  const eligible = (s: AsgSubmission) =>
    input.reviewers.filter((r) => !conflictReason(s, r, declared, input.sameInstitutionConflict))

  // Submissões com menos avaliadores elegíveis no eixo primeiro (mais difíceis).
  const ordered = [...input.submissions].sort(
    (a, b) =>
      eligible(a).filter((r) => r.trackIds.includes(a.trackId)).length -
      eligible(b).filter((r) => r.trackIds.includes(b.trackId)).length,
  )

  const proposals: Proposal[] = []
  const shortfalls: Shortfall[] = []
  for (const s of ordered) {
    let need = input.perSubmission - countFor(s.id)
    if (need <= 0) continue
    const candidates = eligible(s)
      .filter((r) => !taken.has(`${s.id}:${r.id}`) && (load.get(r.id) ?? 0) < r.maxLoad)
      .sort((a, b) => {
        const ta = a.trackIds.includes(s.trackId) ? 0 : 1
        const tb = b.trackIds.includes(s.trackId) ? 0 : 1
        if (ta !== tb) return ta - tb
        return (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0)
      })
    for (const r of candidates) {
      if (need === 0) break
      proposals.push({ submissionId: s.id, reviewerId: r.id, outsideTrack: !r.trackIds.includes(s.trackId) })
      taken.add(`${s.id}:${r.id}`)
      load.set(r.id, (load.get(r.id) ?? 0) + 1)
      need--
    }
    if (need > 0)
      shortfalls.push({
        submissionId: s.id,
        missing: need,
        reason: 'Não há avaliadores suficientes sem conflito e com capacidade livre. Convide mais avaliadores ou aumente a capacidade.',
      })
  }
  return { proposals, shortfalls }
}
