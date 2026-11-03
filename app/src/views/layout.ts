import { html, raw } from 'hono/html'
import type { HtmlEscapedString } from 'hono/utils/html'

export type H = HtmlEscapedString | Promise<HtmlEscapedString>
export type Person = { id: string; email: string; name: string; affiliation: string; is_platform_admin: boolean }

const css = `
:root{--navy:#0B2545;--navy-2:#13315C;--teal:#2EC4B6;--teal-d:#1A8F84;--bg:#F5F7FA;--card:#fff;--text:#1B2430;--muted:#5B6675;--line:#DDE3EA;--ok:#1F7A4D;--warn:#9A6200;--err:#B42318;--radius:10px}
*{box-sizing:border-box}html{font-size:16px}
body{margin:0;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.5}
a{color:var(--navy-2)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--teal);outline-offset:2px}
header.top{background:var(--navy);color:#fff}
header.top .in{max-width:1100px;margin:0 auto;padding:10px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
header.top a{color:#fff;text-decoration:none}header.top nav{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-left:auto;font-size:.95rem}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.15rem}
.logo{width:30px;height:30px;border-radius:8px;background:var(--navy-2);display:grid;place-items:center}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:1.6rem;margin:.2em 0 .6em;color:var(--navy)}h2{font-size:1.2rem;margin:1.4em 0 .5em;color:var(--navy)}h3{font-size:1.05rem;margin:1em 0 .4em}
.card>h2:first-child,.card>h3:first-child{margin-top:0}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:18px;margin:0 0 16px}
.grid{display:grid;gap:16px}.g2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}.g4{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.stat{font-size:1.9rem;font-weight:700;color:var(--navy)}.muted{color:var(--muted)}.small{font-size:.875rem}
label{display:block;font-weight:600;margin:12px 0 4px}label .muted{font-weight:400}
input[type=text],input[type=email],input[type=number],input[type=datetime-local],input[type=date],input[type=url],select,textarea{width:100%;padding:10px 12px;border:1px solid #B8C2CE;border-radius:8px;font:inherit;background:#fff}
textarea{min-height:120px}
.btn{display:inline-block;background:var(--navy);color:#fff;border:0;border-radius:8px;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none}
.btn.teal{background:var(--teal-d)}.btn.ghost{background:transparent;color:var(--navy);border:1px solid var(--navy)}.btn.danger{background:var(--err)}.btn.sm{padding:6px 10px;font-size:.875rem}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:.85rem;color:var(--muted);font-weight:600}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius)}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.8rem;font-weight:600;background:#E8EEF5;color:var(--navy-2);white-space:nowrap}
.b-ok{background:#E3F4EA;color:var(--ok)}.b-warn{background:#FFF4DB;color:var(--warn)}.b-err{background:#FDE8E7;color:var(--err)}.b-teal{background:#DDF6F3;color:var(--teal-d)}
.flash{padding:12px 14px;border-radius:8px;margin-bottom:16px;background:#DDF6F3;border:1px solid var(--teal)}
.flash.err{background:#FDE8E7;border-color:var(--err)}
.alert{padding:10px 12px;border-left:4px solid var(--warn);background:#FFF8E6;margin:8px 0;border-radius:4px}
.alert.err{border-color:var(--err);background:#FDECEC}.alert.ok{border-color:var(--ok);background:#EAF6EF}
.timeline{list-style:none;padding:0;margin:0}.timeline li{padding:6px 0 6px 18px;border-left:2px solid var(--line);position:relative}
.timeline li:before{content:"";position:absolute;left:-6px;top:12px;width:10px;height:10px;border-radius:50%;background:var(--teal)}
.split{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:960px){.split{grid-template-columns:1.2fr 1fr}}
iframe.pdf{width:100%;height:70vh;border:1px solid var(--line);border-radius:8px;background:#fff}
.hero{background:var(--hero,#0B2545);color:#fff;border-radius:var(--radius);padding:28px 22px;margin-bottom:18px}.hero h1{color:#fff}
fieldset{border:1px solid var(--line);border-radius:8px;padding:10px 14px;margin:12px 0}legend{font-weight:600}
.chk{display:flex;gap:8px;align-items:center;font-weight:400;margin:6px 0}
footer{color:var(--muted);font-size:.85rem;text-align:center;padding:24px}
.dev{background:#FFF4DB;border:1px dashed var(--warn);padding:10px;border-radius:8px}
@media print{header.top,footer,.noprint{display:none}body{background:#fff}}
`

const logo = raw(
  `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6.5A8 8 0 1 0 18 17.5" fill="none" stroke="#2EC4B6" stroke-width="3" stroke-linecap="round"/><path d="M12 12h7" stroke="#2EC4B6" stroke-width="2.4" stroke-linecap="round"/><circle cx="19.5" cy="12" r="2.2" fill="#fff"/></svg>`,
)

export function layout(opts: { title: string; user?: Person | null; body: H; flash?: string | null; error?: string | null; dev?: boolean }) {
  const u = opts.user
  return html`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.title} · Cienvia</title><style>${raw(css)}</style></head>
<body>
<header class="top"><div class="in">
  <a class="brand" href="/"><span class="logo">${logo}</span>Cienvia</a>
  <nav aria-label="Principal">
    ${u
      ? html`<a href="/minha-area">Minha área</a><a href="/avaliacoes">Avaliações</a><a href="/org">Organização</a>${opts.dev ? html`<a href="/dev/emails">E-mails (dev)</a>` : ''}<form method="post" action="/sair" style="display:inline"><button class="btn sm ghost" style="color:#fff;border-color:#fff">Sair</button></form>`
      : html`${opts.dev ? html`<a href="/dev/emails">E-mails (dev)</a>` : ''}<a href="/entrar">Entrar</a>`}
  </nav>
</div></header>
<main id="conteudo">
${opts.flash ? html`<div class="flash" role="status">${opts.flash}</div>` : ''}
${opts.error ? html`<div class="flash err" role="alert">${opts.error}</div>` : ''}
${opts.body}
</main>
<footer>Cienvia · O caminho da ciência, simplificado · protótipo</footer>
</body></html>`
}

export const statusBadge = (status: string, label: string) => {
  const cls: Record<string, string> = {
    accepted: 'b-ok',
    accepted_with_corrections: 'b-warn',
    corrected: 'b-teal',
    rejected: 'b-err',
    withdrawn: 'b-err',
    under_review: 'b-teal',
  }
  return html`<span class="badge ${cls[status] ?? ''}">${label}</span>`
}
