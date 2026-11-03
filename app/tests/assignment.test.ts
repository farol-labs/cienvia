import { describe, expect, it } from 'vitest'
import { suggestAssignments, type AsgReviewer, type AsgSubmission } from '../src/assignment.js'

const rev = (id: string, o: Partial<AsgReviewer> = {}): AsgReviewer => ({
  id, personId: `p-${id}`, email: `${id}@x.org`, affiliation: `Inst ${id}`, trackIds: ['T1'], maxLoad: 10, currentLoad: 0, ...o,
})
const sub = (id: string, o: Partial<AsgSubmission> = {}): AsgSubmission => ({
  id, trackId: 'T1', authorEmails: [`autor-${id}@y.org`], authorAffiliations: ['Univ Autor'], ...o,
})
const base = { existing: [], declaredConflicts: [], perSubmission: 2, sameInstitutionConflict: true }

describe('sugestão de atribuição', () => {
  it('nunca atribui o próprio autor', () => {
    const r = suggestAssignments({ ...base, submissions: [sub('s1', { authorEmails: ['A@x.org'] })], reviewers: [rev('a'), rev('b'), rev('c')] })
    expect(r.proposals.map((p) => p.reviewerId)).not.toContain('a')
    expect(r.proposals).toHaveLength(2)
  })

  it('respeita conflito por mesma instituição (ignorando acento e caixa) e conflito declarado', () => {
    const r = suggestAssignments({
      ...base,
      submissions: [sub('s1', { authorAffiliations: ['Universidade São Paulo'] })],
      reviewers: [rev('a', { affiliation: 'universidade sao  paulo' }), rev('b'), rev('c')],
      declaredConflicts: [{ submissionId: 's1', personId: 'p-b' }],
    })
    expect(r.proposals.map((p) => p.reviewerId)).toEqual(['c'])
    expect(r.shortfalls[0]).toMatchObject({ submissionId: 's1', missing: 1 })
  })

  it('permite mesma instituição quando a regra está desligada', () => {
    const r = suggestAssignments({ ...base, sameInstitutionConflict: false, perSubmission: 1, submissions: [sub('s1', { authorAffiliations: ['Inst a'] })], reviewers: [rev('a')] })
    expect(r.proposals).toHaveLength(1)
  })

  it('prefere avaliadores do mesmo eixo e marca os de fora', () => {
    const r = suggestAssignments({ ...base, perSubmission: 2, submissions: [sub('s1', { trackId: 'T2' })], reviewers: [rev('a'), rev('b', { trackIds: ['T2'] })] })
    expect(r.proposals[0]).toMatchObject({ reviewerId: 'b', outsideTrack: false })
    expect(r.proposals[1]).toMatchObject({ reviewerId: 'a', outsideTrack: true })
  })

  it('balanceia carga e respeita capacidade', () => {
    const subs = Array.from({ length: 6 }, (_, i) => sub(`s${i}`))
    const r = suggestAssignments({ ...base, perSubmission: 1, submissions: subs, reviewers: [rev('a', { maxLoad: 2 }), rev('b', { maxLoad: 2 }), rev('c', { maxLoad: 1 })] })
    const count = (id: string) => r.proposals.filter((p) => p.reviewerId === id).length
    expect(count('a')).toBe(2)
    expect(count('b')).toBe(2)
    expect(count('c')).toBe(1)
    expect(r.shortfalls).toHaveLength(1)
  })

  it('não duplica atribuições existentes e completa só o que falta', () => {
    const r = suggestAssignments({ ...base, submissions: [sub('s1')], reviewers: [rev('a'), rev('b')], existing: [{ submissionId: 's1', reviewerId: 'a' }] })
    expect(r.proposals).toEqual([{ submissionId: 's1', reviewerId: 'b', outsideTrack: false }])
  })
})
