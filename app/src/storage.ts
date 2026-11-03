import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Armazenamento de arquivos. No protótipo: disco local (pasta data/files), fora da pasta pública.
 * Em produção: Cloudflare R2 / S3 com URL assinada (ADR 0003). Chaves aleatórias, sem dados pessoais.
 */
export interface Storage {
  put(prefix: string, data: Uint8Array): Promise<string>
  get(key: string): Promise<Uint8Array>
}

export function localStorage(root: string): Storage {
  const base = resolve(root)
  const pathOf = (key: string) => {
    const p = resolve(join(base, key))
    if (!p.startsWith(base)) throw new Error('chave inválida')
    return p
  }
  return {
    async put(prefix, data) {
      const key = `${prefix}/${randomUUID()}.pdf`
      const p = pathOf(key)
      await mkdir(dirname(p), { recursive: true })
      await writeFile(p, data)
      return key
    },
    async get(key) {
      return new Uint8Array(await readFile(pathOf(key)))
    },
  }
}

export function memoryStorage(): Storage {
  const m = new Map<string, Uint8Array>()
  return {
    async put(prefix, data) {
      const key = `${prefix}/${randomUUID()}.pdf`
      m.set(key, data)
      return key
    },
    async get(key) {
      const d = m.get(key)
      if (!d) throw new Error('não encontrado')
      return d
    },
  }
}
