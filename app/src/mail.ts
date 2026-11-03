import type { Db } from './db.js'

/**
 * Envio de e-mail. No protótipo, todo e-mail vai para a caixa de saída (tabela email_message),
 * visível em /dev/emails, e é registrado no console. Em produção: provedor transacional (Postmark, SES, Resend).
 */
export async function sendEmail(db: Db, m: { orgId?: string | null; to: string; subject: string; body: string }) {
  await db.query('INSERT INTO email_message (org_id, to_email, subject, body) VALUES ($1,$2,$3,$4)', [
    m.orgId ?? null,
    m.to.toLowerCase(),
    m.subject,
    m.body,
  ])
  if (process.env.NODE_ENV !== 'test') console.log(`[e-mail] para ${m.to}: ${m.subject}`)
}
