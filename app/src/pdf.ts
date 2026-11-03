import { PDFDocument } from 'pdf-lib'
import { createHash } from 'node:crypto'

export type PdfCheck = {
  ok: boolean
  blocking: string[]
  warnings: string[]
  pages: number
  bytes: number
  sha256: string
  metadataRemoved: string[]
  cleaned: Uint8Array
}

/**
 * Checagem formal do arquivo. Bloqueia: não é PDF, excede páginas ou tamanho.
 * Remove metadados de autoria (essencial para avaliação duplo-cega) e avisa quando havia nomes neles.
 */
export async function checkPdf(
  data: Uint8Array,
  opts: { maxPages: number; maxMb: number; authorNames: string[]; doubleBlind: boolean },
): Promise<PdfCheck> {
  const blocking: string[] = []
  const warnings: string[] = []
  const sha256 = createHash('sha256').update(data).digest('hex')
  const base = { pages: 0, bytes: data.byteLength, sha256, metadataRemoved: [] as string[], cleaned: data }
  const head = Buffer.from(data.slice(0, 5)).toString('latin1')
  if (head !== '%PDF-') return { ok: false, blocking: ['O arquivo não é um PDF válido.'], warnings, ...base }
  if (data.byteLength > opts.maxMb * 1024 * 1024)
    blocking.push(`O arquivo tem ${(data.byteLength / 1024 / 1024).toFixed(1)} MB; o limite é ${opts.maxMb} MB.`)
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(data, { updateMetadata: false })
  } catch {
    return { ok: false, blocking: ['Não foi possível ler o PDF. Ele pode estar corrompido ou protegido por senha.'], warnings, ...base }
  }
  const pages = doc.getPageCount()
  if (pages > opts.maxPages) blocking.push(`O arquivo tem ${pages} páginas; o limite é ${opts.maxPages}.`)

  const metadataRemoved: string[] = []
  const meta: Record<string, string | undefined> = {
    Autor: doc.getAuthor(),
    Criador: doc.getCreator(),
    Produtor: doc.getProducer(),
    Título: doc.getTitle(),
    Assunto: doc.getSubject(),
    'Palavras-chave': doc.getKeywords(),
  }
  const names = opts.authorNames.map((n) => n.toLowerCase()).filter((n) => n.length > 2)
  for (const [k, v] of Object.entries(meta)) {
    if (!v) continue
    metadataRemoved.push(k)
    if (opts.doubleBlind && names.some((n) => v.toLowerCase().includes(n.split(' ')[0])))
      warnings.push(`Os metadados do PDF (${k}) continham um nome de autor. Eles foram removidos, mas confira se o texto do arquivo também está sem identificação.`)
  }
  doc.setAuthor('')
  doc.setCreator('')
  doc.setProducer('')
  doc.setTitle('')
  doc.setSubject('')
  doc.setKeywords([])
  const cleaned = await doc.save({ updateFieldAppearances: false })
  if (opts.doubleBlind)
    warnings.push('Avaliação duplo-cega: confirme que nomes, instituições e agradecimentos não aparecem no texto do arquivo.')
  return { ok: blocking.length === 0, blocking, warnings, pages, bytes: data.byteLength, sha256, metadataRemoved, cleaned }
}

/** Gera um PDF simples (usado no seed de demonstração e nos testes). */
export async function samplePdf(title: string, pages = 3, author?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  if (author) doc.setAuthor(author)
  doc.setTitle(title)
  for (let i = 0; i < pages; i++) {
    const p = doc.addPage([595, 842])
    p.drawText(i === 0 ? title.slice(0, 70) : `Página ${i + 1}`, { x: 50, y: 780, size: 14 })
    p.drawText('Texto de exemplo do trabalho para demonstração da Cienvia.', { x: 50, y: 740, size: 11 })
  }
  return doc.save()
}
