import { randomBytes } from 'node:crypto'

export const token = (bytes = 24) => randomBytes(bytes).toString('base64url')

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

export const certCode = () => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const b = randomBytes(12)
  let s = ''
  for (let i = 0; i < 12; i++) s += a[b[i] % a.length]
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`
}

const tz = 'America/Sao_Paulo'
export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: tz }) : '-'
export const fmtDateTime = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString('pt-BR', { timeZone: tz, dateStyle: 'short', timeStyle: 'short' }) : '-'

/** Converte valor de <input type="datetime-local"> (horário de Brasília) para Date. */
export const fromLocalInput = (v: string) => new Date(`${v}:00-03:00`)
export const toLocalInput = (d: Date | string | null | undefined) => {
  if (!d) return ''
  const x = new Date(new Date(d).getTime() - 3 * 3600 * 1000)
  return x.toISOString().slice(0, 16)
}

export const csv = (rows: (string | number | null | undefined)[][]) =>
  '﻿' +
  rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n')

export const STATUS_LABEL: Record<string, string> = {
  submitted: 'Recebido',
  under_review: 'Em avaliação',
  accepted: 'Aprovado',
  accepted_with_corrections: 'Aprovado com correções',
  corrected: 'Correção enviada',
  rejected: 'Não aprovado',
  withdrawn: 'Retirado',
}
export const OUTCOME_LABEL: Record<string, string> = {
  accepted: 'Aprovado',
  accepted_with_corrections: 'Aprovado com correções',
  rejected: 'Não aprovado',
  accept: 'Aprovar',
  accept_with_corrections: 'Aprovar com correções',
  reject: 'Não aprovar',
}
