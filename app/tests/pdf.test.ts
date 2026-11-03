import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { checkPdf, samplePdf } from '../src/pdf.js'

describe('checagem formal do PDF', () => {
  it('bloqueia arquivo que não é PDF', async () => {
    const r = await checkPdf(new TextEncoder().encode('olá'), { maxPages: 5, maxMb: 1, authorNames: [], doubleBlind: false })
    expect(r.ok).toBe(false)
  })
  it('bloqueia excesso de páginas', async () => {
    const r = await checkPdf(await samplePdf('X', 6), { maxPages: 4, maxMb: 5, authorNames: [], doubleBlind: false })
    expect(r.blocking.join()).toMatch(/6 páginas/)
  })
  it('remove metadados de autoria e avisa em duplo-cego', async () => {
    const r = await checkPdf(await samplePdf('Meu trabalho', 2, 'Maria Silva'), { maxPages: 4, maxMb: 5, authorNames: ['Maria Silva'], doubleBlind: true })
    expect(r.ok).toBe(true)
    expect(r.warnings.join()).toMatch(/metadados/)
    const cleaned = await PDFDocument.load(r.cleaned)
    expect(cleaned.getAuthor() ?? '').toBe('')
    expect(cleaned.getTitle() ?? '').toBe('')
  })
})
