/* Cienvia · protótipo da página pública de evento.
   JavaScript sem dependências. Cada visão é uma função render que lê EVENTO, PROGRAMACAO e o estado. */
(function () {
  "use strict";
  const E = window.EVENTO;
  const P = window.PROGRAMACAO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const TZ = "America/Sao_Paulo";

  /* ---------- Ícones ---------- */
  const I = {
    cal: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    star: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    file: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v4h4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    ext: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    list: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    grid: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 4v16M15 4v16M3.5 10h17" stroke="currentColor" stroke-width="1.8"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const GT_GLYPH = {
    // Pictogramas discretos: fluxo (migração), isolinhas (ambiente), pirâmide etária (trabalho/proteção), curva de projeção
    mig: '<svg class="glyph-gt" viewBox="0 0 40 40" aria-hidden="true"><circle cx="9" cy="28" r="3" fill="currentColor"/><circle cx="31" cy="12" r="3" fill="currentColor"/><path d="M11 25C16 14 22 22 28 14" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/></svg>',
    amb: '<svg class="glyph-gt" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 26c5-8 10 2 14-6s10-4 14-10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 32c5-7 10 2 14-5s10-4 14-9" fill="none" stroke="currentColor" stroke-width="2" opacity=".55"/></svg>',
    trab: '<svg class="glyph-gt" viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor"><rect x="14" y="8" width="12" height="4"/><rect x="11" y="14" width="18" height="4"/><rect x="8" y="20" width="24" height="4"/><rect x="6" y="26" width="28" height="4"/></g></svg>',
    proj: '<svg class="glyph-gt" viewBox="0 0 40 40" aria-hidden="true"><path d="M6 30C12 28 16 22 22 18" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 18c4-3 8-5 12-6M22 18c4-1 8-1 12 0M22 18c4-5 8-9 12-12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.5 2.5"/><circle cx="22" cy="18" r="2.4" fill="currentColor"/></svg>'
  };

  /* ---------- Datas ---------- */
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const parseD = (iso) => { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; };
  const dCurta = (iso) => { const { m, d } = parseD(iso); return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`; };
  const dLonga = (iso) => { const { y, m, d } = parseD(iso); return `${d} ${MESES[m - 1]} ${y}`; };
  const diaSemana = (iso) => { const { y, m, d } = parseD(iso); return SEMANA[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()]; };
  const periodo = (a, b) => (a === b ? dLonga(a) : `${dCurta(a)} a ${dLonga(b)}`);
  const isoBR = (date) => date.toLocaleDateString("sv-SE", { timeZone: TZ });
  const hmBR = (date) => date.toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
  const toMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
  const diasEntre = (aIso, bIso) => { const a = parseD(aIso), b = parseD(bIso); return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5); };
  const DIAS = [...new Set(P.map((a) => a.dia))];

  /* ---------- Fases do evento ---------- */
  // Data simulada de cada fase (horário de Brasília). "real" usa o relógio do visitante.
  const SIM = { breve: "2025-05-20T10:00:00-03:00", submissao: "2025-07-10T10:00:00-03:00", avaliacao: "2025-08-20T10:00:00-03:00", final: "2025-10-20T10:00:00-03:00", andamento: "2025-12-02T11:00:00-03:00", encerrado: "2025-12-10T10:00:00-03:00" };
  function faseDe(iso) {
    if (iso < "2025-06-04") return "breve";
    if (iso <= "2025-08-03") return "submissao";
    if (iso < "2025-09-15") return "avaliacao";
    if (iso <= "2025-11-30") return "final";
    if (iso <= E.fim) return "andamento";
    return "encerrado";
  }
  const FASES = {
    breve: { s: "aval", label: "Inscrições abrem em 04/06/2025" },
    submissao: { s: "aberto", label: "Inscrições e submissões abertas" },
    avaliacao: { s: "aval", label: "Trabalhos em avaliação" },
    final: { s: "aberto", label: "Inscrições abertas · envio da versão final" },
    andamento: { s: "vivo", label: "Evento em andamento" },
    encerrado: { s: "fim", label: "Evento encerrado" }
  };
  function ctas(f) {
    const C = {
      breve: [["Conhecer a chamada", "participar"], ["Datas importantes", "inicio", "datas"]],
      submissao: [["Inscrever-se", "participar", "inscricao"], ["Submeter trabalho", "participar", "submissao"], ["Normas de apresentação", "participar", "normas"]],
      avaliacao: [["Inscrever-se", "participar", "inscricao"], ["Acompanhar meu trabalho", "participar", "autor"], ["Programação", "programacao"]],
      final: [["Inscrever-se até 30/11", "participar", "inscricao"], ["Enviar versão final", "participar", "autor"], ["Programação", "programacao"]],
      andamento: [["Programação de hoje", "programacao"], ["Como chegar", "local"], ["Minha agenda", "programacao", "agenda"]],
      encerrado: [["Trabalhos apresentados", "acervo"], ["Programação completa", "programacao"], ["Certificados", "participar", "certificados"]]
    };
    return C[f];
  }

  /* ---------- Estado ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("cienvia:" + E.slug + ":" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("cienvia:" + E.slug + ":" + k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } }
  };
  const S = {
    simKey: store.get("fase", "real"),
    now: new Date(),
    fase: "encerrado",
    dia: DIAS[0],
    tipos: new Set(),
    gt: "",
    sala: "",
    q: "",
    modo: "lista",
    abertos: new Set(),
    favs: new Set(store.get("favs", [])),
    acervo: { q: "", gt: "", fmt: "", limite: 30 }
  };
  function aplicarFase() {
    S.now = S.simKey === "real" ? new Date() : new Date(SIM[S.simKey]);
    S.fase = faseDe(isoBR(S.now));
    if (S.fase === "andamento") { const hoje = isoBR(S.now); if (DIAS.includes(hoje)) S.dia = hoje; }
  }

  /* ---------- Derivados ---------- */
  const TIPOS = { abertura: "Abertura", mesa: "Mesa", sessao: "Sessão temática", minicurso: "Minicurso", poster: "Pôster", intervalo: "Intervalo" };
  const gtNome = (id) => (E.gts.find((g) => g.id === id) || {}).nome || id;
  const POSTER_GT = { "Estimativas e Projeções": ["proj"], "Migrações": ["mig"], "Migrações, Espaço e Ambiente": ["mig", "amb"], "Migrações e Trabalho": ["mig", "trab"], "População, Espaço e Ambiente": ["amb"], "População, Trabalho e Proteção Social": ["trab"] };
  const TRABALHOS = [];
  P.forEach((a) => (a.trabalhos || []).forEach((w) => TRABALHOS.push({ t: w[0], a: w[1], grupo: w[2] || null, act: a, fmt: a.tipo === "poster" ? "Pôster" : "Oral", gt: a.tipo === "poster" ? POSTER_GT[w[2]] || [] : a.gt })));
  const ATIVIDADES = P.filter((a) => a.tipo !== "intervalo");
  const SALAS = [...new Set(ATIVIDADES.map((a) => a.sala).filter(Boolean))].sort((a, b) => (a.startsWith("Aud") === b.startsWith("Aud") ? a.localeCompare(b, "pt") : a.startsWith("Aud") ? -1 : 1));
  const INSTITUICOES = (() => {
    const set = new Set();
    const add = (s) => String(s || "").replace("Instituto Clima e Sociedade (iCS)", "iCS").split(/[;/]| e /).map((x) => x.trim()).forEach((x) => { if (/^[A-Z][A-Za-zÀ-ú]*/.test(x) && x.length <= 40 && x !== "SP" && !/^Presiden|^Consultor/.test(x)) set.add(x.replace(/^Instituto Clima e Sociedade \(iCS\)$/, "iCS").replace(/^Fundação /, "Fundação ")); });
    P.forEach((a) => (a.pessoas || []).forEach((p) => add(p[2])));
    E.comissaoOrganizadora.forEach((p) => add(p[1]));
    E.comiteCientifico.forEach((p) => add(p[1]));
    return [...set].sort((a, b) => a.localeCompare(b, "pt"));
  })();
  const CONVIDADOS = (() => {
    const m = new Map();
    P.filter((a) => a.tipo === "mesa").forEach((a) => a.pessoas.forEach((p) => { if (p[0] === "Palestrante" && !m.has(p[1])) m.set(p[1], p[2]); }));
    return [...m.entries()];
  })();
  const iniciais = (n) => { const w = n.replace(/[^A-Za-zÀ-ú\s]/g, " ").split(/\s+/).filter((x) => x && !/^(de|da|do|dos|das|e)$/i.test(x)); return ((w[0] || "")[0] + ((w.length > 1 ? w[w.length - 1] : "")[0] || "")).toUpperCase(); };

  function estadoAtividade(a) {
    if (S.fase !== "andamento" || a.dia !== isoBR(S.now)) return null;
    const m = toMin(hmBR(S.now));
    if (m >= toMin(a.ini) && m < toMin(a.fim)) return "agora";
    return null;
  }

  /* ---------- Destaque de busca sem acento ---------- */
  function hl(text, q) {
    const src = String(text ?? "");
    const nq = norm(q).trim();
    if (!nq) return esc(src);
    let n = "", map = [];
    for (let i = 0; i < src.length; i++) { const c = norm(src[i]); for (let j = 0; j < c.length; j++) { n += c[j]; map.push(i); } }
    let out = "", last = 0, idx = n.indexOf(nq);
    while (idx !== -1) {
      const s = map[idx], e = map[idx + nq.length - 1] + 1;
      out += esc(src.slice(last, s)) + "<mark>" + esc(src.slice(s, e)) + "</mark>";
      last = e; idx = n.indexOf(nq, idx + nq.length);
    }
    return out + esc(src.slice(last));
  }

  /* ---------- Utilidades de UI ---------- */
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600); }
  function anunciar(msg) { const l = $("#live"); l.textContent = ""; setTimeout(() => (l.textContent = msg), 60); }
  async function copiar(texto, alvo) {
    try { await navigator.clipboard.writeText(texto); toast("Copiado"); }
    catch (e) { if (alvo && alvo.select) { alvo.focus(); alvo.select(); toast("Selecionado. Use Ctrl+C para copiar."); } else toast("Não foi possível copiar automaticamente."); }
  }
  const statusPill = () => `<span class="status" data-s="${FASES[S.fase].s}">${esc(FASES[S.fase].label)}</span>`;
  const linkBtn = ([txt, view, alvo], i) => `<a class="btn ${i ? "secondary" : ""}" href="#${view}" ${alvo ? `data-alvo="${alvo}"` : ""}>${esc(txt)}${i ? "" : " " + I.arrow}</a>`;
  const pageTitle = (id, eyebrow, titulo, sub, extra = "") => `<div class="page-title"><div class="wrap"><p class="eyebrow">${esc(eyebrow)}</p><h1 id="h-${id}" tabindex="-1">${esc(titulo)}</h1>${sub ? `<p>${sub}</p>` : ""}${extra}</div></div>`;
  const naoInformado = (txt = "Não informado na página do evento") => `<span class="na">${esc(txt)}</span>`;

  /* ============ INÍCIO ============ */
  function renderInicio() {
    const f = S.fase;
    const hoje = isoBR(S.now);
    const prox = E.marcos.filter((m) => m.id !== "evento" && m.fim >= hoje).sort((a, b) => (a.fim < b.fim ? -1 : 1))[0];
    let painel = "";
    if (f === "encerrado") {
      painel = `<div class="recap" aria-label="O encontro em números">
        <div><b>${DIAS.length}</b><span>dias de programação</span></div>
        <div><b>${P.filter((a) => a.tipo === "sessao").length}</b><span>sessões temáticas</span></div>
        <div><b>${TRABALHOS.length}</b><span>trabalhos apresentados</span></div>
        <div><b>${INSTITUICOES.length}</b><span>instituições citadas</span></div></div>`;
    } else if (f === "andamento") {
      const dia = isoBR(S.now), m = toMin(hmBR(S.now));
      const agora = P.filter((a) => a.dia === dia && toMin(a.ini) <= m && toMin(a.fim) > m);
      const prox2 = P.filter((a) => a.dia === dia && toMin(a.ini) > m).slice(0, 3);
      const li = (a) => `<li><time>${a.ini}</time><span>${esc(a.titulo)}${a.sala ? ` <span class="muted">· ${esc(a.sala)}</span>` : ""}</span></li>`;
      painel = `<div class="live-now"><p class="eyebrow">Agora · ${hmBR(S.now)}</p><ul>${agora.map(li).join("") || "<li><span>Nenhuma atividade neste horário.</span></li>"}</ul>${prox2.length ? `<p class="eyebrow" style="margin-top:.5rem">A seguir</p><ul>${prox2.map(li).join("")}</ul>` : ""}</div>`;
    } else if (prox) {
      const d = diasEntre(hoje, prox.fim);
      painel = `<div class="live-now"><p class="eyebrow">Próximo prazo</p><p><b>${esc(prox.titulo)}</b>: ${prox.inicio > hoje ? `abre em ${dLonga(prox.inicio)}` : `até ${dLonga(prox.fim)}`} <span class="muted">(${prox.inicio > hoje ? `em ${diasEntre(hoje, prox.inicio)} dias` : d === 0 ? "termina hoje" : `faltam ${d} dias`})</span></p></div>`;
    }

    const porGT = (id) => ({ s: P.filter((a) => a.tipo === "sessao" && a.gt.includes(id)).length, t: TRABALHOS.filter((w) => w.gt.includes(id)).length });
    const gtCards = E.gts.map((g) => { const c = porGT(g.id); return `<article class="card gt-card" data-gt="${g.id}">
      <div class="top">${GT_GLYPH[g.id]}</div>
      <h3>${esc(g.nome)}</h3><p class="ed">${esc(g.edicao)}</p>
      <div class="stats"><span><b>${c.s}</b> sessões</span><span><b>${c.t}</b> trabalhos</span></div>
      <a class="btn ghost sm" href="#programacao" data-gtfiltro="${g.id}">Ver na programação ${I.arrow}</a></article>`; }).join("");

    const timeline = E.marcos.map((m) => {
      const st = m.fim < hoje ? "done" : m.inicio <= hoje ? "now" : "next";
      return `<li data-st="${st}"><span class="dot">${st === "done" ? I.check : ""}</span><div><div class="when"><time datetime="${m.inicio}">${periodo(m.inicio, m.fim)}</time>${st === "now" ? '<span class="badge">em curso</span>' : ""}</div><h3>${esc(m.titulo)}</h3>${m.nota ? `<p class="small muted">${esc(m.nota)}</p>` : ""}</div></li>`;
    }).join("");

    const mesas = P.filter((a) => a.tipo === "mesa").map((a) => {
      const pal = a.pessoas.filter((p) => p[0] === "Palestrante").map((p) => p[1]);
      const [rot, ...resto] = a.titulo.split(": ");
      return `<article class="card stack" style="gap:.6rem"><p class="eyebrow">${esc(rot)} · ${dCurta(a.dia)} · ${a.ini}</p><h3 style="font-size:var(--t-md)">${esc(resto.join(": "))}</h3><p class="small muted">${esc(pal.join(", "))}</p></article>`;
    }).join("");

    const minis = E.minicursos.map((m) => `<li class="card" style="display:grid;gap:.4rem">
      <div class="act-meta"><span class="type">Minicurso</span><span>${dLonga(m.data)}</span>${m.status === "cancelado" ? '<span class="badge cancel">Cancelado</span>' : ""}</div>
      <p style="font:600 var(--t-md)/1.35 var(--f-display);${m.status === "cancelado" ? "text-decoration:line-through;color:var(--ink-2)" : ""}">${esc(m.titulo)}</p>
      ${m.ref ? `<a class="small" href="#programacao" data-abrir="${m.ref}">Detalhes e ministrantes</a>` : '<span class="small muted">Atividade cancelada pela organização.</span>'}</li>`).join("");

    $("#v-inicio").innerHTML = `
      <div class="hero">
        <div class="wrap">
          <div class="stack" style="gap:var(--s-5)">
            <div>${statusPill()}</div>
            <h1 id="h-inicio" tabindex="-1">${esc(E.nome)}</h1>
            <p class="tema">${esc(E.tema)}</p>
            <ul class="hero-meta">
              <li><span class="k">Quando</span><span class="v">1 a 4 de dezembro de 2025</span></li>
              <li><span class="k">Onde</span><span class="v">UERJ, Campus Maracanã</span></li>
              <li><span class="k">Inscrição</span><span class="v">Gratuita</span></li>
            </ul>
            <div class="btn-row">${ctas(f).map(linkBtn).join("")}</div>
            ${painel}
          </div>
          <figure class="hero-art" style="margin:0">
            <canvas id="art" aria-hidden="true"></canvas>
            <div class="stamp" aria-hidden="true"><span>22°54′S 43°14′W</span><span>Censo 2022 · Cairo+30 · COP30</span></div>
            <figcaption>Ilustração temática: isolinhas e densidade. Não representa dados reais.</figcaption>
          </figure>
        </div>
      </div>

      <div class="wrap">
        <section class="section" aria-labelledby="h-gts">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">Quatro encontros, um programa</p><h2 id="h-gts">Grupos de Trabalho</h2></div>
          <p class="muted small">Cada GT realiza a sua edição dentro do mesmo encontro. As contagens vêm da programação publicada.</p></div>
          <div class="grid g4">${gtCards}</div>
        </section>

        <section class="section" aria-labelledby="h-sobre">
          <div class="grid g2" style="gap:var(--s-6);align-items:start">
            <div class="prose"><p class="eyebrow">Sobre o encontro</p><h2 id="h-sobre">Demografia no debate sobre desenvolvimento sustentável</h2><p>${esc(E.resumo)}</p></div>
            <div class="stack">
              <p class="eyebrow">Contexto citado pela organização</p>
              <dl class="kv">
                <div><dt>Censo 2022</dt><dd>Divulgação dos resultados</dd></div>
                <div><dt>Cairo+30</dt><dd>30 anos da Conferência Internacional sobre População e Desenvolvimento</dd></div>
                <div><dt>COP30</dt><dd>Conferência do clima realizada no Brasil em 2025</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section class="section" id="datas" aria-labelledby="h-datas">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">Calendário</p><h2 id="h-datas">Datas importantes</h2></div><p class="muted small">Situação calculada em ${dLonga(hoje)}.</p></div>
          <ol class="timeline">${timeline}</ol>
        </section>

        <section class="section" aria-labelledby="h-mesas">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">Destaques da programação</p><h2 id="h-mesas">Mesas e conferências</h2></div><a class="btn secondary sm" href="#programacao">Programação completa</a></div>
          <div class="grid g3">${mesas}</div>
        </section>

        <section class="section" aria-labelledby="h-conv">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">${CONVIDADOS.length} pessoas</p><h2 id="h-conv">Palestrantes das mesas</h2></div><p class="muted small">Fotos não publicadas na fonte; iniciais no lugar.</p></div>
          <div class="people collapsed" id="convidados">${CONVIDADOS.map(([n, i]) => `<div class="person"><span class="avatar" aria-hidden="true">${esc(iniciais(n))}</span><div><b>${esc(n)}</b><span>${esc(i || "")}</span></div></div>`).join("")}</div><div class="btn-row" style="margin-top:var(--s-4)"><button class="btn secondary sm" id="ver-convidados" aria-expanded="false" aria-controls="convidados">Ver as ${CONVIDADOS.length} pessoas</button></div>
        </section>

        <section class="section" aria-labelledby="h-mini">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">Formação</p><h2 id="h-mini">Minicursos</h2></div><p class="muted small">Gratuitos, com vagas limitadas. Inscrição de 13/10 a 24/11/2025.</p></div>
          <ul class="grid g3" style="list-style:none;margin:0;padding:0">${minis}</ul>
        </section>

        <section class="section" aria-labelledby="h-inst">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">Rede</p><h2 id="h-inst">Instituições participantes</h2></div><p class="muted small">Vínculos citados na programação e nas comissões.</p></div>
          <ul class="inst-list">${INSTITUICOES.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        </section>

        <section class="section" aria-labelledby="h-local-teaser">
          <div class="grid g2" style="gap:var(--s-6)">
            <div class="stack"><p class="eyebrow">Local</p><h2 id="h-local-teaser">UERJ, Campus Maracanã</h2><p>${esc(E.local.endereco)}. Metrô Linha 2 e trem até a estação Maracanã.</p><div class="btn-row"><a class="btn secondary" href="#local">${I.pin} Como chegar</a></div></div>
            <div class="stack"><p class="eyebrow">Realização e apoio</p>
              <div class="partners" style="grid-template-columns:1fr 1fr">
                <div class="partner-slot"><span class="small muted">Realização</span><div class="logo-ph"><div><b>ABEP</b>Logotipo oficial aguarda autorização</div></div></div>
                <div class="partner-slot"><span class="small muted">Sede</span><div class="logo-ph"><div><b>UERJ</b>Logotipo oficial aguarda autorização</div></div></div>
              </div>
              <p class="note"><b>Apoio e patrocínio:</b> a página original mostra logotipos sem nome em texto. Os apoiadores não puderam ser identificados com segurança e foram omitidos.</p>
            </div>
          </div>
        </section>
      </div>`;
    desenharArte();
  }

  /* ---------- Ilustração do hero: isolinhas por marching squares ---------- */
  function desenharArte() {
    const cv = $("#art"); if (!cv) return;
    const box = cv.getBoundingClientRect(); if (!box.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const tk = (n) => css.getPropertyValue(n).trim();
    const W = box.width, H = box.height;
    ctx.fillStyle = tk("--petroleo"); ctx.fillRect(0, 0, W, H);
    const centros = [[.32, .58, .28], [.7, .34, .22], [.78, .8, .16], [.15, .2, .12]];
    const f = (x, y) => { let v = 0; for (const [cx, cy, r] of centros) { const dx = x - cx, dy = (y - cy) * 1.15; v += Math.exp(-(dx * dx + dy * dy) / (2 * r * r)); } return v + .05 * Math.sin(x * 11) * Math.cos(y * 9); };
    const N = 72, M = Math.round(N * H / W);
    const g = []; for (let j = 0; j <= M; j++) { g[j] = []; for (let i = 0; i <= N; i++) g[j][i] = f(i / N, j / M); }
    const sx = W / N, sy = H / M;
    // densidade: pontos discretos onde o campo é alto
    ctx.fillStyle = tk("--on-band-2");
    for (let j = 1; j < M; j += 2) for (let i = 1; i < N; i += 2) { const v = g[j][i]; if (v > .5) { ctx.globalAlpha = Math.min(.55, (v - .45) * .9); ctx.beginPath(); ctx.arc(i * sx, j * sy, 1.1, 0, 6.283); ctx.fill(); } }
    ctx.globalAlpha = 1; ctx.strokeStyle = tk("--agua"); ctx.lineWidth = 1;
    const lerp = (a, b, l) => (l - a) / (b - a || 1e-6);
    for (let k = 1; k <= 9; k++) {
      const L = k * .11; ctx.globalAlpha = .25 + k * .06; ctx.beginPath();
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
        const a = g[j][i], b = g[j][i + 1], c = g[j + 1][i + 1], d = g[j + 1][i];
        const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * sx, y = j * sy;
        const T = [x + sx * lerp(a, b, L), y], R = [x + sx, y + sy * lerp(b, c, L)], B = [x + sx * lerp(d, c, L), y + sy], Lf = [x, y + sy * lerp(a, d, L)];
        const seg = { 1: [Lf, B], 2: [B, R], 3: [Lf, R], 4: [T, R], 5: [Lf, T, B, R], 6: [T, B], 7: [Lf, T], 8: [Lf, T], 9: [T, B], 10: [Lf, B, T, R], 11: [T, R], 12: [Lf, R], 13: [B, R], 14: [Lf, B] }[idx];
        for (let s = 0; s < seg.length; s += 2) { ctx.moveTo(seg[s][0], seg[s][1]); ctx.lineTo(seg[s + 1][0], seg[s + 1][1]); }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // marcador do local
    ctx.fillStyle = tk("--destaque"); ctx.beginPath(); ctx.arc(W * .32, H * .58, 4, 0, 6.283); ctx.fill();
    ctx.strokeStyle = tk("--destaque"); ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(W * .32, H * .58, 10, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
  }

  /* ============ PROGRAMAÇÃO ============ */
  function filtrar(ignorarDia = false) {
    const q = norm(S.q).trim();
    return P.filter((a) => {
      if (!ignorarDia && S.dia !== "todos" && a.dia !== S.dia) return false;
      if (a.tipo === "intervalo") return !q && !S.tipos.size && !S.gt && !S.sala;
      if (S.tipos.size && !S.tipos.has(a.tipo)) return false;
      if (S.gt && !a.gt.includes(S.gt) && !(a.tipo === "poster" && (a.trabalhos || []).some((w) => (POSTER_GT[w[2]] || []).includes(S.gt)))) return false;
      if (S.sala && a.sala !== S.sala) return false;
      if (q) return norm([a.titulo, (a.pessoas || []).map((p) => p[1] + " " + (p[2] || "")).join(" "), (a.trabalhos || []).map((w) => w[0] + " " + w[1]).join(" ")].join(" ")).includes(q);
      return true;
    });
  }
  const corpoCasa = (a) => { const q = norm(S.q).trim(); return q && (a.trabalhos || []).some((w) => norm(w[0] + " " + w[1]).includes(q)); };

  function cardAtividade(a) {
    if (a.tipo === "intervalo") return `<div class="break">${esc(a.titulo)}${a.sala ? ` · ${esc(a.sala)}` : ""}</div>`;
    const aberto = S.abertos.has(a.id) || corpoCasa(a);
    const mod = (a.pessoas || []).filter((p) => p[0] === "Moderação");
    const outros = (a.pessoas || []).filter((p) => p[0] !== "Moderação");
    const nT = (a.trabalhos || []).length;
    const fav = S.favs.has(a.id);
    const agora = estadoAtividade(a) === "agora";
    let who = "";
    if (a.tipo === "mesa") who = `${outros.length} palestrantes${mod.length ? ` · Moderação: ${hl(mod[0][1], S.q)}` : ""}`;
    else if (a.tipo === "minicurso") who = "Ministrantes: " + outros.map((p) => hl(p[1], S.q)).join(", ");
    else if (mod.length) who = `Moderação: ${hl(mod[0][1], S.q)}${mod[0][2] ? ` (${esc(mod[0][2])})` : ""}`;
    else if (outros.length) who = hl(outros[0][1], S.q);
    const gts = (a.tipo === "poster" ? [] : a.gt).map((g) => `<span class="tagline" data-gt="${g}"><span class="gt-dot"></span>${esc(gtNome(g))}</span>`).join("");
    const rotulo = a.tipo === "mesa" ? "Detalhes" : nT ? `${nT} trabalhos` : "Detalhes";
    let gruposHtml = "";
    if (nT) {
      let ultimo = null;
      gruposHtml = (a.trabalhos || []).map((w) => { let g = ""; if (w[2] && w[2] !== ultimo) { ultimo = w[2]; g = `<li class="grp-row"><span class="grp">${esc(w[2])}</span></li>`; } return `${g}<li><div><div class="t">${hl(w[0], S.q)}</div><div class="a">${hl(w[1], S.q)}</div></div></li>`; }).join("");
    }
    return `<article class="act" id="a-${a.id}" ${agora ? 'data-now="true"' : ""}>
      <div class="act-head">
        <div class="act-meta"><span class="type">${TIPOS[a.tipo]}</span>${S.dia === "todos" ? `<span>${dCurta(a.dia)}</span>` : ""}<time>${a.ini}–${a.fim}</time>${a.sala ? `<span>${esc(a.sala)}${a.predio ? ` · ${esc(a.predio)}` : ""}</span>` : ""}${agora ? '<span class="status" data-s="vivo">Agora</span>' : ""}</div>
        <h3>${hl(a.titulo, S.q)}</h3>
        ${who ? `<p class="who">${who}</p>` : ""}
        ${gts ? `<div class="gts">${gts}</div>` : ""}
        <button class="toggle" aria-expanded="${aberto}" aria-controls="b-${a.id}" data-toggle="${a.id}">${rotulo} ${I.down}</button>
      </div>
      <button class="fav" aria-pressed="${fav}" data-fav="${a.id}" aria-label="${fav ? "Remover da" : "Adicionar à"} minha agenda: ${esc(a.titulo)}">${I.star}</button>
      <div class="act-body" id="b-${a.id}" ${aberto ? "" : "hidden"}>
        ${(a.pessoas || []).length ? `<div class="stack" style="gap:.5rem"><h4>Participantes</h4><dl class="roles">${a.pessoas.map((p) => `<div><dt>${esc(p[0])}</dt><dd>${hl(p[1], S.q)}${p[2] ? ` <span class="muted">· ${esc(p[2])}</span>` : ""}</dd></div>`).join("")}</dl></div>` : ""}
        ${nT ? `<div class="stack" style="gap:.5rem"><h4>Trabalhos${a.tipo === "poster" ? " por área" : " na ordem de apresentação"}</h4><ol class="works">${gruposHtml}</ol></div>` : ""}
        ${nT ? `<p class="small muted">Resumos expandidos não estão publicados na página pública do evento.</p>` : ""}
        <div class="act-actions"><button class="btn secondary sm" data-ics="${a.id}">${I.cal} Adicionar ao calendário</button></div>
      </div>
    </article>`;
  }

  function listaHtml(itens) {
    if (!itens.length) return "";
    const porDia = {};
    itens.forEach((a) => (porDia[a.dia] = porDia[a.dia] || []).push(a));
    return Object.keys(porDia).sort().map((dia) => {
      const slots = {};
      porDia[dia].forEach((a) => { const k = a.ini + "|" + a.fim; (slots[k] = slots[k] || []).push(a); });
      const corpo = Object.keys(slots).sort().map((k) => {
        const [ini, fim] = k.split("|"); const arr = slots[k];
        const paralelo = arr.length > 1;
        return `<div class="slot"><div class="slot-time"><b>${ini}</b>${fim}${paralelo ? `<br><span class="small">${arr.length} em paralelo</span>` : ""}</div><div class="slot-items ${paralelo ? "parallel" : ""}" style="--n:${Math.min(arr.length, 3)}">${arr.map(cardAtividade).join("")}</div></div>`;
      }).join("");
      return `${S.dia === "todos" || S.modo === "agenda" ? `<h2 class="eyebrow" style="padding-top:var(--s-5);font-size:var(--t-sm)">${diaSemana(dia)}, ${dLonga(dia)}</h2>` : ""}${corpo}`;
    }).join("");
  }

  function gradeHtml(itens) {
    const dia = S.dia === "todos" ? DIAS[0] : S.dia;
    const doDia = itens.filter((a) => a.dia === dia);
    if (!doDia.length) return "";
    const salas = SALAS.filter((s) => doDia.some((a) => a.sala === s && a.tipo !== "intervalo"));
    const ini = Math.min(...P.filter((a) => a.dia === dia).map((a) => toMin(a.ini)));
    const fim = Math.max(...P.filter((a) => a.dia === dia).map((a) => toMin(a.fim)));
    const passo = 15, linhas = Math.ceil((fim - ini) / passo);
    const row = (m) => Math.round((m - ini) / passo) + 2;
    let html = `<div class="grade" role="table" aria-label="Grade de ${dLonga(dia)} por sala" style="grid-template-columns:3.75rem repeat(${salas.length}, minmax(11.5rem, 1fr));grid-template-rows:3rem repeat(${linhas}, 1.45rem)">`;
    html += `<div class="gh" style="grid-column:1;grid-row:1;border-left:0" role="columnheader">Hora</div>`;
    salas.forEach((s, i) => { const a = doDia.find((x) => x.sala === s); html += `<div class="gh" role="columnheader" style="grid-column:${i + 2};grid-row:1">${esc(s)}${a && a.predio ? `<small>${esc(a.predio)}</small>` : ""}</div>`; });
    for (let m = ini; m < fim; m += 30) html += `<div class="tl" style="grid-column:1;grid-row:${row(m)} / span 2">${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}</div>`;
    for (let m = ini; m < fim; m += 30) salas.forEach((_, i) => (html += `<div class="cell" aria-hidden="true" style="grid-column:${i + 2};grid-row:${row(m)} / span 2"></div>`));
    doDia.forEach((a) => {
      const r = `${row(toMin(a.ini))} / ${row(toMin(a.fim))}`;
      if (a.tipo === "intervalo" || !a.sala) { html += `<div class="blk brk" style="grid-column:2 / -1;grid-row:${r}">${esc(a.titulo)}</div>`; return; }
      const c = salas.indexOf(a.sala) + 2; const g = a.tipo === "poster" ? "" : a.gt[0] || "";
      html += `<button class="blk" data-gt="${g}" style="grid-column:${c};grid-row:${r}" data-irpara="${a.id}" role="cell"><span class="type">${TIPOS[a.tipo]} · ${a.ini}</span><b>${esc(a.titulo)}</b></button>`;
    });
    return `<div class="grade-wrap">${html}</div></div><p class="small muted" style="margin-top:.5rem">Role horizontalmente para ver todas as salas. Selecione um bloco para abrir os detalhes.</p>`;
  }

  function renderProgramacaoShell() {
    const nTot = ATIVIDADES.length;
    $("#v-programacao").innerHTML = `
      ${pageTitle("programacao", "Programação científica", "Programação", `${DIAS.length} dias, ${nTot} atividades e ${TRABALHOS.length} trabalhos. Horários de Brasília. Marque ☆ para montar a sua agenda.`)}
      <div class="toolbar"><div class="wrap">
        <div class="toolbar-row">
          <div class="search">${I.search}<label class="sr-only" for="q">Buscar por título, autor ou palestrante</label><input id="q" type="search" placeholder="Buscar título, autor ou palestrante" autocomplete="off" value="${esc(S.q)}"></div>
          <label class="sr-only" for="f-gt">Grupo de Trabalho</label>
          <select class="select" id="f-gt"><option value="">Todos os GTs</option>${E.gts.map((g) => `<option value="${g.id}">${esc(g.nome)}</option>`).join("")}</select>
          <label class="sr-only" for="f-sala">Sala</label>
          <select class="select" id="f-sala"><option value="">Todas as salas</option>${SALAS.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
          <div class="seg" role="group" aria-label="Modo de visualização">
            <button type="button" data-modo="lista" aria-pressed="true">${I.list} Lista</button>
            <button type="button" data-modo="grade" aria-pressed="false">${I.grid} Grade</button>
            <button type="button" data-modo="agenda" aria-pressed="false">${I.star} Minha agenda <span class="num" id="n-favs"></span></button>
          </div>
        </div>
        <div class="days" role="tablist" aria-label="Dia">
          ${DIAS.map((d, i) => `<button role="tab" id="tab-${d}" data-dia="${d}" aria-selected="false" tabindex="-1"><b>${dCurta(d)}</b><span>${diaSemana(d)}</span></button>`).join("")}
          <button role="tab" id="tab-todos" data-dia="todos" aria-selected="false" tabindex="-1"><b>Todos</b><span>4 dias</span></button>
        </div>
        <div class="chips" role="group" aria-label="Tipo de atividade" id="chips"></div>
      </div></div>
      <div class="wrap" id="prog-res" role="region" aria-label="Resultados da programação"></div>`;
    $("#f-gt").value = S.gt; $("#f-sala").value = S.sala;
  }

  function renderProgramacao() {
    if (!$("#q")) renderProgramacaoShell();
    // abas
    $$(".days [role=tab]").forEach((t) => { const sel = t.dataset.dia === S.dia; t.setAttribute("aria-selected", sel); t.tabIndex = sel ? 0 : -1; });
    $$(".seg [data-modo]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.modo === S.modo));
    $(".days").hidden = S.modo === "agenda";
    $("#n-favs").textContent = S.favs.size ? `(${S.favs.size})` : "";
    // chips com contagem no recorte atual (ignorando o próprio filtro de tipo)
    const salvo = S.tipos; S.tipos = new Set(); const base = filtrar(); S.tipos = salvo;
    $("#chips").innerHTML = Object.keys(TIPOS).filter((t) => t !== "intervalo").map((t) => `<button type="button" class="chip" data-tipo="${t}" aria-pressed="${S.tipos.has(t)}">${TIPOS[t]} <span class="n">${base.filter((a) => a.tipo === t).length}</span></button>`).join("");

    let itens = S.modo === "agenda" ? P.filter((a) => S.favs.has(a.id)) : filtrar();
    const ativos = itens.filter((a) => a.tipo !== "intervalo");
    const filtrosAtivos = S.q || S.tipos.size || S.gt || S.sala;
    let corpo;
    if (S.modo === "agenda") {
      corpo = ativos.length ? listaHtml(itens) : `<div class="empty">${I.star}<p><b>Sua agenda está vazia.</b></p><p>Marque ☆ nas atividades da programação para reunir aqui o que você vai assistir e exportar para o seu calendário.</p><button class="btn secondary sm" data-modo="lista">Voltar para a programação</button></div>`;
    } else if (!ativos.length) {
      const outrosDias = S.dia !== "todos" ? filtrar(true).filter((a) => a.tipo !== "intervalo").length : 0;
      corpo = `<div class="empty"><p><b>Nenhuma atividade encontrada${S.dia !== "todos" ? " neste dia" : ""}.</b></p>${outrosDias ? `<p>Há ${outrosDias} resultado(s) em outros dias.</p><button class="btn sm" data-dia="todos">Ver em todos os dias</button>` : '<p>Revise a busca ou limpe os filtros.</p>'}<button class="btn secondary sm" data-limpar>Limpar filtros</button></div>`;
    } else corpo = S.modo === "grade" ? gradeHtml(itens) : listaHtml(itens);

    const nTrab = ativos.reduce((s, a) => s + (a.trabalhos || []).filter((w) => !S.q || norm(w[0] + " " + w[1]).includes(norm(S.q).trim())).length, 0);
    const exportaveis = S.modo === "agenda" ? ativos : ativos;
    $("#prog-res").innerHTML = `
      <div class="result-line">
        <p class="small"><b class="num">${ativos.length}</b> ${ativos.length === 1 ? "atividade" : "atividades"}${S.q ? ` · <b class="num">${nTrab}</b> trabalhos com “${esc(S.q)}”` : ""}${S.modo === "grade" && S.dia === "todos" ? " · a grade mostra um dia por vez" : ""}</p>
        <div class="btn-row">${filtrosAtivos && S.modo !== "agenda" ? '<button class="btn ghost sm" data-limpar>Limpar filtros</button>' : ""}${exportaveis.length ? `<button class="btn secondary sm" data-exportar>${I.cal} Exportar ${S.modo === "agenda" ? "minha agenda" : S.dia === "todos" ? "seleção" : "dia"} (.ics)</button>` : ""}</div>
      </div>
      ${corpo}`;
    anunciar(`${ativos.length} atividades encontradas`);
    S._exportar = exportaveis;
  }

  /* ---------- iCalendar ---------- */
  function ics(acts, nome) {
    const pad = (n) => String(n).padStart(2, "0");
    const utc = (dia, hm) => { const { y, m, d } = parseD(dia); const [h, mi] = hm.split(":").map(Number); const t = new Date(Date.UTC(y, m - 1, d, h + 3, mi)); return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00Z`; };
    const e = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const fold = (l) => { const out = []; while (l.length > 73) { out.push(l.slice(0, 73)); l = " " + l.slice(73); } out.push(l); return out.join("\r\n"); };
    const stamp = utc(isoBR(new Date()), "00:00");
    const linhas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cienvia//Programacao//PT-BR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:" + e(nome)];
    acts.forEach((a) => {
      const desc = [(a.pessoas || []).map((p) => `${p[0]}: ${p[1]}${p[2] ? " (" + p[2] + ")" : ""}`).join("\n"), (a.trabalhos || []).map((w, i) => `${i + 1}. ${w[0]} (${w[1]})`).join("\n")].filter(Boolean).join("\n\n");
      linhas.push("BEGIN:VEVENT", `UID:${a.id}-${E.slug}@cienvia.demo`, `DTSTAMP:${stamp}`, `DTSTART:${utc(a.dia, a.ini)}`, `DTEND:${utc(a.dia, a.fim)}`, fold("SUMMARY:" + e(a.titulo)), fold("LOCATION:" + e([a.sala, a.predio, "UERJ Campus Maracanã", E.local.endereco].filter(Boolean).join(", "))), fold("DESCRIPTION:" + e(desc)), "END:VEVENT");
    });
    linhas.push("END:VCALENDAR");
    return linhas.join("\r\n");
  }
  function abrirExport(acts, nome, arquivo) {
    const txt = ics(acts, nome);
    const d = $("#dlg-export");
    $("#ics-text").value = txt;
    $("#dlg-desc").textContent = `${acts.length} ${acts.length === 1 ? "atividade" : "atividades"}. Arquivo .ics compatível com Google Agenda, Outlook e Apple Calendário.`;
    const a = $("#ics-download");
    try { if (a._url) URL.revokeObjectURL(a._url); a._url = URL.createObjectURL(new Blob([txt], { type: "text/calendar" })); a.href = a._url; } catch (e) { a.href = "#"; }
    a.download = arquivo;
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  }

  /* ============ PARTICIPAR ============ */
  function renderParticipar() {
    const f = S.fase, hoje = isoBR(S.now);
    const etapas = [
      ["Inscrição", "04/06 a 30/11/2025", "2025-06-04", "2025-11-30"],
      ["Submissão", "Resumo expandido, 09/06 a 03/08", "2025-06-09", "2025-08-03"],
      ["Avaliação", "Resultado em 15/09", "2025-08-04", "2025-09-15"],
      ["Versão final", "13/10 a 28/11", "2025-10-13", "2025-11-28"],
      ["Apresentação", "1 a 4/12, oral ou pôster", "2025-12-01", "2025-12-04"],
      ["Certificado", "Após o evento", "2025-12-05", "2099-12-31"]
    ].map(([t, s, a, b]) => `<li data-st="${b < hoje ? "done" : a <= hoje ? "now" : "next"}"><b>${t}</b><span>${s}</span></li>`).join("");
    const encerrado = f === "andamento" || f === "encerrado";
    const ativo = f === "submissao" || f === "avaliacao" || f === "final";
    const docsHtml = E.documentos.map((d) => `<li><span class="grp">${esc(d.grupo)}</span><a href="${esc(d.url)}" rel="noopener">${esc(d.titulo)}</a><span class="badge" title="A fonte não informa o formato do arquivo">formato n/i</span></li>`).join("");
    const autorEtapa = { submissao: 0, avaliacao: 1, final: 3 }[f] ?? -1;
    const trilha = ["Submetido", "Em avaliação", "Resultado publicado", "Versão final pendente", "Apresentação agendada"];
    const autor = ativo ? `<article class="card stack" id="autor">
        <div class="dlg-head"><div><p class="eyebrow">Área do autor</p><h3>Acompanhe o seu trabalho</h3></div><span class="badge placeholder">Exemplo</span></div>
        <p class="small muted">Visão proposta para a Área do autor do Cienvia. Título e situação abaixo são ilustrativos, não correspondem a nenhum trabalho real.</p>
        <p style="font:600 var(--t-md)/1.35 var(--f-display)">[Título do seu trabalho]</p>
        <ol class="track">${trilha.map((t, i) => `<li data-st="${i < autorEtapa ? "done" : i === autorEtapa ? "now" : "next"}"><span>${t}</span><time>${["03/08", "15/09", "15/09", "28/11", "01/12"][i]}</time></li>`).join("")}</ol>
        ${f === "final" ? '<div class="btn-row"><button class="btn" type="button" disabled title="Demonstração">Enviar versão final</button><button class="btn secondary" type="button" disabled>Ver parecer</button></div><p class="small muted">Botões desativados: nesta demonstração nada é enviado.</p>' : ""}
      </article>` : "";
    const certificados = encerrado ? `<article class="card stack" id="certificados">
        <div class="dlg-head"><div><p class="eyebrow">Após o evento</p><h3>Certificados</h3></div><span class="badge placeholder">Proposta Cienvia</span></div>
        <p>A página original não informa como os certificados desta edição são emitidos. Em caso de dúvida, fale com a organização pelo <a href="#contato">contato do evento</a>.</p>
        <p class="small muted">Como ficaria no Cienvia: o certificado de participação, apresentação ou moderação aparece na Área do participante após a confirmação de presença, com código de verificação público.</p>
      </article>` : "";

    $("#v-participar").innerHTML = `
      ${pageTitle("participar", "Inscrições, submissões e normas", "Participar", "Tudo o que é preciso para se inscrever, submeter e apresentar, em uma página. Regras e prazos conforme a página oficial do evento.", `<div style="margin-top:var(--s-4)">${statusPill()}</div>`)}
      <div class="wrap">
        ${encerrado ? `<section class="section"><div class="closed-banner"><b>${f === "andamento" ? "Inscrições encerradas. O evento está acontecendo." : "Inscrições e submissões encerradas."}</b><span class="small">As regras abaixo ficam como registro desta edição. ${f === "encerrado" ? 'Veja os <a href="#acervo">trabalhos apresentados</a>.' : 'Consulte a <a href="#programacao">programação de hoje</a>.'}</span></div></section>` : ""}
        <section class="section" aria-labelledby="h-jornada">
          <div class="section-head"><h2 id="h-jornada">Etapas</h2></div>
          <ol class="journey">${etapas}</ol>
        </section>

        <section class="section" aria-labelledby="h-reg">
          <div class="grid g2" style="gap:var(--s-5);align-items:start">
            <article class="card stack" id="inscricao"><p class="eyebrow">Inscrição</p><h2 id="h-reg" style="font-size:var(--t-xl)">Gratuita, pelo sistema do evento</h2>
              <dl class="kv">
                <div><dt>Período</dt><dd>04/06 a 30/11/2025</dd></div>
                <div><dt>Valor</dt><dd>Gratuita</dd></div>
                <div><dt>Categorias</dt><dd>${E.categorias.map(esc).join(", ")}</dd></div>
                <div><dt>Minicursos</dt><dd>Gratuitos, vagas limitadas, inscrição de 13/10 a 24/11/2025</dd></div>
                <div><dt>Como fazer</dt><dd>Pelo SIGEventos. Há passo a passo para quem tem e para quem não tem vínculo com a UFRN.</dd></div>
              </dl>
              ${f === "breve" ? '<p class="note">As inscrições abrem em 04/06/2025.</p>' : ""}
            </article>
            <article class="card stack" id="submissao"><p class="eyebrow">Submissão de trabalhos</p><h2 style="font-size:var(--t-xl)">Resumo expandido</h2>
              <dl class="kv">
                <div><dt>Envio</dt><dd>09/06 a 03/08/2025</dd></div>
                <div><dt>Resultado</dt><dd>15/09/2025</dd></div>
                <div><dt>Versão final</dt><dd>13/10 a 28/11/2025</dd></div>
                <div><dt>GT</dt><dd>${E.gts.map((g) => esc(g.nome)).join("; ")}</dd></div>
                <div><dt>Template</dt><dd><a href="${esc(E.documentos[0].url)}" rel="noopener">Template para submissão</a></dd></div>
                <div><dt>Extensão e autoria</dt><dd>${naoInformado("Não informado na página pública")}</dd></div>
              </dl>
              <p class="note"><b>Lacuna da fonte:</b> a página oficial remete a uma aba “Chamada de Trabalhos” que não existe no menu. No Cienvia, as regras ficam aqui, sem desvio.</p>
            </article>
          </div>
        </section>

        <section class="section" id="normas" aria-labelledby="h-normas">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">Normas de apresentação</p><h2 id="h-normas">Oral ou pôster</h2></div></div>
          <div class="grid g2">
            <article class="card stack"><div class="dlg-head"><h3>Apresentação oral</h3><span class="badge">15 min</span></div><ul class="checklist">${E.normas.oral.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></article>
            <article class="card stack"><div class="dlg-head"><h3>Pôster</h3><span class="badge">0,90 × 1,20 m</span></div>
              <div class="poster-fig">
                <svg viewBox="0 0 110 150" role="img" aria-label="Pôster de 0,90 metro de largura por 1,20 metro de altura, pendurado por bastão e cordinha">
                  <path d="M20 14 L55 2 L90 14" fill="none" stroke="currentColor" stroke-width="1.2"/>
                  <rect x="12" y="14" width="86" height="4" rx="2" fill="currentColor"/>
                  <rect x="17" y="18" width="76" height="101" fill="none" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M25 30h50M25 38h60M25 50h28M57 50h28M25 58h28M57 58h28" stroke="currentColor" stroke-width="2" opacity=".35"/>
                  <path d="M17 130h76M17 126v8M93 126v8" stroke="currentColor" stroke-width="1"/>
                  <text x="55" y="145" text-anchor="middle" font-size="10" fill="currentColor" font-family="IBM Plex Mono, monospace">0,90 m</text>
                  <path d="M103 18v101M99 18h8M99 119h8" stroke="currentColor" stroke-width="1"/>
                </svg>
                <ul class="checklist">${E.normas.poster.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
              </div>
              <p class="small muted">Desenho em escala: 3 por 4, altura de 1,20 m.</p>
            </article>
          </div>
        </section>

        <section class="section" aria-labelledby="h-docs">
          <div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">${E.documentos.length} arquivos</p><h2 id="h-docs">Documentos e modelos</h2></div><p class="muted small">Agrupados por finalidade. A fonte não informa formato, tamanho nem data de atualização.</p></div>
          <ul class="docs">${docsHtml}</ul>
        </section>

        ${ativo || encerrado ? `<section class="section"><div class="grid g2" style="align-items:start">${ativo ? formInscricao() + autor : certificados}</div></section>` : ""}
      </div>`;
    if (ativo) ligarForm();
  }

  function formInscricao() {
    return `<article class="card stack">
      <div class="dlg-head"><div><p class="eyebrow">Inscrição em 3 passos</p><h3>Fluxo proposto</h3></div><span class="badge placeholder">Demonstração</span></div>
      <p class="small muted">Nada é enviado. A inscrição real deste evento acontece no SIGEventos.</p>
      <form class="form" id="f-insc" novalidate>
        <ol class="stepper" id="stepper"><li data-st="now">1. Dados</li><li>2. Participação</li><li>3. Revisão</li></ol>
        <div data-passo="1" class="form">
          <div class="field"><label for="i-nome">Nome completo</label><input type="text" id="i-nome" autocomplete="name" aria-describedby="e-nome" required><span class="err" id="e-nome"></span></div>
          <div class="field"><label for="i-email">E-mail</label><span class="hint" id="h-email">Usado para confirmação e certificado.</span><input type="email" id="i-email" autocomplete="email" aria-describedby="h-email e-email" required><span class="err" id="e-email"></span></div>
          <div class="field"><label for="i-inst">Instituição</label><span class="hint" id="h-inst">Sigla ou nome completo.</span><input type="text" id="i-inst" autocomplete="organization" aria-describedby="h-inst e-inst" required><span class="err" id="e-inst"></span></div>
        </div>
        <div data-passo="2" class="form" hidden>
          <fieldset class="field"><legend>Categoria de participação</legend>${E.categorias.slice(0, 2).map((c, i) => `<label class="radio"><input type="radio" name="cat" value="${esc(c)}" ${i ? "" : "checked"}> ${esc(c)}</label>`).join("")}<span class="hint">Palestrantes, equipe e organização são cadastrados pela comissão.</span></fieldset>
          <fieldset class="field"><legend>Minicursos (opcional)</legend>${E.minicursos.map((m, i) => `<label class="radio"><input type="checkbox" name="mc" value="${i}" ${m.status === "cancelado" ? "disabled" : ""}> <span>${esc(m.titulo)} <span class="muted small">· ${dCurta(m.data)}${m.status === "cancelado" ? " · cancelado" : ""}</span></span></label>`).join("")}</fieldset>
        </div>
        <div data-passo="3" class="form" hidden><dl class="kv" id="revisao"></dl></div>
        <div class="success" id="ok" hidden tabindex="-1"><b>Inscrição simulada com sucesso.</b><span class="small">No Cienvia, você receberia a confirmação por e-mail e a inscrição apareceria na Área do participante.</span></div>
        <div class="form-actions" id="acoes"><button type="button" class="btn secondary" id="voltar" hidden>Voltar</button><button type="button" class="btn" id="avancar">Continuar</button></div>
      </form></article>`;
  }
  function ligarForm() {
    const form = $("#f-insc"); if (!form) return;
    let passo = 1;
    const campos = { "i-nome": (v) => (v.trim().length < 3 ? "Informe o nome completo." : ""), "i-email": (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Informe um e-mail válido, por exemplo nome@instituicao.br." : ""), "i-inst": (v) => (!v.trim() ? "Informe a instituição. Sem vínculo, escreva “Sem vínculo”." : "") };
    const validar = (id) => { const el = $("#" + id), msg = campos[id](el.value); el.setAttribute("aria-invalid", msg ? "true" : "false"); $("#e-" + id.slice(2)).textContent = msg; return !msg; };
    Object.keys(campos).forEach((id) => $("#" + id).addEventListener("blur", () => validar(id)));
    const mostrar = () => {
      $$("[data-passo]", form).forEach((p) => (p.hidden = Number(p.dataset.passo) !== passo));
      $$("#stepper li").forEach((li, i) => (li.dataset.st = i + 1 < passo ? "done" : i + 1 === passo ? "now" : ""));
      $("#voltar").hidden = passo === 1; $("#avancar").textContent = passo === 3 ? "Confirmar inscrição" : "Continuar";
      if (passo === 3) {
        const mc = $$("input[name=mc]:checked", form).map((c) => E.minicursos[c.value].titulo);
        $("#revisao").innerHTML = [["Nome", $("#i-nome").value], ["E-mail", $("#i-email").value], ["Instituição", $("#i-inst").value], ["Categoria", ($("input[name=cat]:checked", form) || {}).value], ["Minicursos", mc.join("; ") || "Nenhum"]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
      }
      const alvo = $(`[data-passo="${passo}"] input, [data-passo="${passo}"] dl`, form); if (alvo && passo > 1) alvo.focus?.();
    };
    $("#avancar").addEventListener("click", () => {
      if (passo === 1) { const ok = Object.keys(campos).map(validar); const i = ok.indexOf(false); if (i >= 0) { $("#" + Object.keys(campos)[i]).focus(); return; } }
      if (passo === 3) { $$("[data-passo]", form).forEach((p) => (p.hidden = true)); $("#acoes").hidden = true; $("#stepper").hidden = true; $("#ok").hidden = false; $("#ok").focus(); return; }
      passo++; mostrar();
    });
    $("#voltar").addEventListener("click", () => { passo--; mostrar(); });
  }

  /* ============ ACERVO ============ */
  function renderAcervo() {
    if (!$("#a-q")) {
      $("#v-acervo").innerHTML = `
        ${pageTitle("acervo", "Acervo científico", "Trabalhos apresentados", `${TRABALHOS.length} trabalhos da edição 2025, a partir da programação publicada. Os resumos expandidos não estão disponíveis na página pública; quando houver anais, cada título levará ao texto completo.`)}
        <div class="toolbar"><div class="wrap"><div class="toolbar-row">
          <div class="search">${I.search}<label class="sr-only" for="a-q">Buscar por título ou autor</label><input id="a-q" type="search" placeholder="Buscar por título ou autor" autocomplete="off"></div>
          <label class="sr-only" for="a-gt">GT</label><select class="select" id="a-gt"><option value="">Todos os GTs</option>${E.gts.map((g) => `<option value="${g.id}">${esc(g.nome)}</option>`).join("")}</select>
          <label class="sr-only" for="a-fmt">Formato</label><select class="select" id="a-fmt"><option value="">Oral e pôster</option><option>Oral</option><option>Pôster</option></select>
          <label class="sr-only" for="a-ano">Edição</label><select class="select" id="a-ano"><option>2025</option></select>
        </div></div></div>
        <div class="wrap" id="acervo-res" role="region" aria-label="Resultados do acervo"></div>`;
    }
    const A = S.acervo, q = norm(A.q).trim();
    const lista = TRABALHOS.filter((w) => (!q || norm(w.t + " " + w.a).includes(q)) && (!A.gt || w.gt.includes(A.gt)) && (!A.fmt || w.fmt === A.fmt));
    const vis = lista.slice(0, A.limite);
    const sess = (w) => w.act.tipo === "poster" ? `Sessão de Pôsteres${w.grupo ? " · " + w.grupo : ""}` : w.act.titulo.split(":")[0];
    const gtTxt = (w) => w.gt.map((g) => `<span class="tagline" data-gt="${g}"><span class="gt-dot"></span>${esc(gtNome(g))}</span>`).join("<br>");
    $("#acervo-res").innerHTML = `
      <div class="result-line"><p class="small"><b class="num">${lista.length}</b> trabalhos</p><p class="small muted">Ordenados pela programação.</p></div>
      ${lista.length ? `<div class="table-wrap acervo"><table><caption class="sr-only">Trabalhos apresentados</caption><thead><tr><th scope="col">Título e autoria</th><th scope="col">Sessão</th><th scope="col">GT</th><th scope="col">Formato</th><th scope="col">Data</th></tr></thead><tbody>
        ${vis.map((w) => `<tr><td class="t">${hl(w.t, A.q)}<span class="a">${hl(w.a, A.q)}</span></td><td class="small">${esc(sess(w))}</td><td>${gtTxt(w)}</td><td class="small">${w.fmt}</td><td class="small num">${dCurta(w.act.dia)}</td></tr>`).join("")}
      </tbody></table></div>
      <ul class="acervo-list">${vis.map((w) => `<li><span class="act-meta"><span class="type">${w.fmt}</span><span>${dCurta(w.act.dia)}</span><span>${esc(sess(w))}</span></span><b>${hl(w.t, A.q)}</b><span class="muted small">${hl(w.a, A.q)}</span></li>`).join("")}</ul>
      ${lista.length > A.limite ? `<div class="pager"><button class="btn secondary" id="mais">Mostrar mais ${Math.min(30, lista.length - A.limite)} de ${lista.length - A.limite} restantes</button></div>` : ""}`
      : `<div class="empty"><p><b>Nenhum trabalho encontrado.</b></p><p>Tente outro termo ou remova filtros.</p></div>`}`;
    anunciar(`${lista.length} trabalhos encontrados`);
  }

  /* ============ LOCAL ============ */
  function renderLocal() {
    const L = E.local;
    $("#v-local").innerHTML = `
      ${pageTitle("local", "Local e acesso", "UERJ, Campus Maracanã", esc(L.endereco))}
      <div class="wrap"><section class="section"><div class="grid g2" style="gap:var(--s-6);align-items:start">
        <div class="stack" style="gap:var(--s-5)">
          <div class="stack"><h2 style="font-size:var(--t-xl)">Como chegar</h2><ul class="transit">${L.transporte.map((t) => `<li><b>${esc(t.modo)}</b><span>${esc(t.texto)}</span></li>`).join("")}</ul></div>
          <div class="stack"><h2 style="font-size:var(--t-xl)">No campus</h2>
            <dl class="kv">
              <div><dt>Salas das sessões</dt><dd>Bloco F: salas GEO (4º andar) e FAF (8º andar)</dd></div>
              <div><dt>Mesas e abertura</dt><dd>Auditórios 71 e 91</dd></div>
              <div><dt>Alimentação</dt><dd>${esc(L.alimentacao)}</dd></div>
              <div><dt>Avisos em tempo real</dt><dd>Grupo de WhatsApp aberto em 30/11/2025. ${naoInformado("Link não publicado na página.")}</dd></div>
              <div><dt>Acessibilidade</dt><dd>${naoInformado()}</dd></div>
              <div><dt>Hospedagem</dt><dd>${naoInformado()}</dd></div>
            </dl>
          </div>
        </div>
        <div class="map-card">
          <div class="map-ph" aria-hidden="true"><svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><rect width="320" height="200" fill="var(--surface-2)"/><g stroke="var(--line-strong)" stroke-width="7" fill="none" stroke-linecap="round"><path d="M-10 140 C80 120 160 150 330 110"/><path d="M60 -10 L120 210"/><path d="M220 -10 C210 80 240 140 230 210"/></g><g stroke="var(--line)" stroke-width="3" fill="none"><path d="M0 60 H320"/><path d="M0 180 C120 170 200 190 320 175"/></g><rect x="128" y="70" width="70" height="44" rx="4" fill="var(--verde)" opacity=".22"/><circle cx="163" cy="92" r="7" fill="var(--destaque)"/></svg></div>
          <p class="small muted">Esquema ilustrativo, fora de escala.</p>
          <div class="btn-row"><a class="btn" href="${esc(L.mapa)}" rel="noopener">${I.pin} Abrir no mapa ${I.ext}</a><a class="btn secondary" href="${esc(L.comoChegar)}" rel="noopener">Como chegar à UERJ ${I.ext}</a></div>
          <p class="note"><b>Correção aplicada:</b> o link “como chegar” da página original tem o protocolo duplicado (<code>http://https://</code>) e não abre.</p>
        </div>
      </div></section></div>`;
  }

  /* ============ ORGANIZAÇÃO ============ */
  function renderOrganizacao() {
    const grid = (arr) => `<div class="people">${arr.map(([n, i]) => `<div class="person"><span class="avatar" aria-hidden="true">${esc(iniciais(n))}</span><div><b>${esc(n)}</b><span>${esc(i)}</span></div></div>`).join("")}</div>`;
    $("#v-organizacao").innerHTML = `
      ${pageTitle("organizacao", "Institucional", "Organização", "Realização dos Grupos de Trabalho da ABEP, com sede na UERJ.")}
      <div class="wrap">
        <section class="section"><div class="partners">
          <div class="partner-slot"><span class="small muted">Realização</span><div class="logo-ph"><div><b>ABEP</b>Associação Brasileira de Estudos Populacionais</div></div></div>
          <div class="partner-slot"><span class="small muted">Sede</span><div class="logo-ph"><div><b>UERJ</b>Universidade do Estado do Rio de Janeiro</div></div></div>
          <div class="partner-slot"><span class="small muted">Apoio e patrocínio</span><div class="logo-ph"><div><b>Não identificados</b>A fonte exibe apenas logotipos, sem nome</div></div></div>
        </div><p class="small muted" style="margin-top:.75rem">Os logotipos oficiais entram aqui após autorização de uso de cada instituição.</p></section>
        <section class="section" aria-labelledby="h-co"><div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">${E.comissaoOrganizadora.length} pessoas</p><h2 id="h-co">Comissão organizadora</h2></div></div>${grid(E.comissaoOrganizadora)}</section>
        <section class="section" aria-labelledby="h-cc"><div class="section-head"><div class="stack" style="gap:.4rem"><p class="eyebrow">${E.comiteCientifico.length} pessoas</p><h2 id="h-cc">Comitê científico</h2></div></div>${grid(E.comiteCientifico)}</section>
        <section class="section" aria-labelledby="h-cgt"><div class="section-head"><h2 id="h-cgt">Coordenações dos GTs</h2></div><p class="note">A página do evento não lista as coordenações dos quatro GTs. No Cienvia, cada GT teria a própria página com coordenação, sessões e trabalhos.</p></section>
      </div>`;
  }

  /* ============ CONTATO ============ */
  function renderContato() {
    const C = E.contato;
    $("#v-contato").innerHTML = `
      ${pageTitle("contato", "Fale com a organização", "Contato", "Antes de escrever, confira as normas, os documentos e as informações do local.")}
      <div class="wrap"><section class="section"><div class="grid g2" style="align-items:start">
        <article class="card stack"><p class="eyebrow">E-mail</p><p style="font:600 var(--t-lg)/1.3 var(--f-display);word-break:break-all"><span id="email-txt">${esc(C.email)}</span></p><div class="btn-row"><button class="btn" id="copiar-email">Copiar e-mail</button></div></article>
        <article class="card stack"><p class="eyebrow">Instagram</p><p style="font:600 var(--t-lg)/1.3 var(--f-display)">${esc(C.instagramHandle)}</p><div class="btn-row"><a class="btn secondary" href="${esc(C.instagram)}" rel="noopener">Abrir perfil ${I.ext}</a></div></article>
      </div></section>
      <section class="section"><h2 style="font-size:var(--t-xl);margin-bottom:var(--s-4)">Respostas rápidas</h2><div class="grid g3">
        <a class="card stack" href="#participar" data-alvo="normas" style="text-decoration:none;color:inherit"><h3 style="font-size:var(--t-md)">Normas de apresentação</h3><p class="small muted">Tempo de fala, dimensão do pôster e modelos.</p></a>
        <a class="card stack" href="#participar" data-alvo="inscricao" style="text-decoration:none;color:inherit"><h3 style="font-size:var(--t-md)">Inscrição e prazos</h3><p class="small muted">Categorias, minicursos e datas.</p></a>
        <a class="card stack" href="#local" style="text-decoration:none;color:inherit"><h3 style="font-size:var(--t-md)">Local e acesso</h3><p class="small muted">Endereço, transporte e alimentação.</p></a>
      </div></section></div>`;
  }

  /* ============ Roteamento ============ */
  const LEGADO = { principal: "inicio", "normas-apresentacao": "participar", "inscricao-submissoes": "participar", documentos: "participar", "informacoes-uerj": "local", organizadores: "organizacao" };
  const VIEWS = ["inicio", "programacao", "participar", "acervo", "local", "organizacao", "contato"];
  const RENDER = { inicio: renderInicio, programacao: renderProgramacao, participar: renderParticipar, acervo: renderAcervo, local: renderLocal, organizacao: renderOrganizacao, contato: renderContato };
  let atual = null, alvoPendente = null;
  function rota(focar) {
    let v = location.hash.slice(1) || "inicio";
    if (LEGADO[v]) { v = LEGADO[v]; history.replaceState(null, "", "#" + v); }
    if (!VIEWS.includes(v)) v = "inicio";
    if (v !== atual || !$("#v-" + v).innerHTML) RENDER[v]();
    $$(".view").forEach((s) => (s.hidden = s.dataset.view !== v));
    $$(".nav a").forEach((a) => (a.getAttribute("href") === "#" + v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    $("#nav").dataset.open = "false"; $("#menu-btn").setAttribute("aria-expanded", "false");
    const mudou = v !== atual; atual = v;
    if (v === "inicio") requestAnimationFrame(desenharArte);
    document.title = (v === "inicio" ? "" : $("#h-" + v).textContent + " · ") + "Encontro dos GTs ABEP 2025 · Cienvia";
    if (alvoPendente) { const el = document.getElementById(alvoPendente); alvoPendente = null; if (el) { el.scrollIntoView({ block: "start" }); const f = el.querySelector("h1,h2,h3,input"); if (f) { if (!f.hasAttribute("tabindex") && f.tagName !== "INPUT") f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); } return; } }
    if (mudou && focar) { window.scrollTo(0, 0); const h = $("#h-" + v); if (h) h.focus({ preventScroll: true }); }
  }
  function rerenderTudo() { VIEWS.forEach((v) => { if (v !== "programacao" && v !== "acervo") $("#v-" + v).innerHTML = ""; }); RENDER[atual](); }

  function headCta() { const [t, v, alvo] = ctas(S.fase)[0]; const a = $("#head-cta"); a.textContent = t; a.href = "#" + v; if (alvo) a.dataset.alvo = alvo; else delete a.dataset.alvo; }

  /* ============ Eventos ============ */
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("button, a"); if (!t) return;
    if (t.dataset.alvo) { alvoPendente = t.dataset.alvo; if (t.dataset.alvo === "agenda") { S.modo = "agenda"; alvoPendente = null; } }
    if (t.dataset.gtfiltro) { S.gt = t.dataset.gtfiltro; S.dia = "todos"; S.modo = "lista"; if ($("#f-gt")) $("#f-gt").value = S.gt; }
    if (t.dataset.abrir) { const a = P.find((x) => x.id === t.dataset.abrir); S.dia = a.dia; S.modo = "lista"; S.abertos.add(a.id); alvoPendente = "a-" + a.id; }
    if (t.getAttribute("href") && t.getAttribute("href").startsWith("#") && location.hash === t.getAttribute("href")) { ev.preventDefault(); if (atual === "programacao") renderProgramacao(); rota(true); return; }
    if (t.dataset.toggle) { const id = t.dataset.toggle, body = $("#b-" + id), open = t.getAttribute("aria-expanded") !== "true"; t.setAttribute("aria-expanded", open); body.hidden = !open; open ? S.abertos.add(id) : S.abertos.delete(id); return; }
    if (t.dataset.fav) { const id = t.dataset.fav; S.favs.has(id) ? S.favs.delete(id) : S.favs.add(id); store.set("favs", [...S.favs]); const on = S.favs.has(id); t.setAttribute("aria-pressed", on); const a = P.find((x) => x.id === id); t.setAttribute("aria-label", `${on ? "Remover da" : "Adicionar à"} minha agenda: ${a.titulo}`); toast(on ? "Adicionado à sua agenda" : "Removido da sua agenda"); $("#n-favs").textContent = S.favs.size ? `(${S.favs.size})` : ""; if (S.modo === "agenda") renderProgramacao(); return; }
    if (t.dataset.modo) { S.modo = t.dataset.modo; renderProgramacao(); return; }
    if (t.dataset.dia && t.closest("#v-programacao")) { S.dia = t.dataset.dia; if (S.modo === "agenda") S.modo = "lista"; renderProgramacao(); if (t.getAttribute("role") === "tab") $("#tab-" + S.dia).focus(); return; }
    if (t.dataset.tipo) { const k = t.dataset.tipo; S.tipos.has(k) ? S.tipos.delete(k) : S.tipos.add(k); renderProgramacao(); $(`[data-tipo="${k}"]`).focus(); return; }
    if (t.hasAttribute("data-limpar")) { S.q = ""; S.tipos.clear(); S.gt = ""; S.sala = ""; $("#q").value = ""; $("#f-gt").value = ""; $("#f-sala").value = ""; renderProgramacao(); $("#q").focus(); return; }
    if (t.dataset.irpara) { const a = P.find((x) => x.id === t.dataset.irpara); S.modo = "lista"; S.dia = a.dia; S.abertos.add(a.id); renderProgramacao(); const el = $("#a-" + a.id); el.scrollIntoView({ block: "center" }); el.querySelector(".toggle").focus({ preventScroll: true }); return; }
    if (t.dataset.ics) { const a = P.find((x) => x.id === t.dataset.ics); abrirExport([a], a.titulo, `${a.id}.ics`); return; }
    if (t.hasAttribute("data-exportar")) { const nome = S.modo === "agenda" ? "Minha agenda · GTs ABEP 2025" : "GTs ABEP 2025"; abrirExport(S._exportar || [], nome, S.modo === "agenda" ? "minha-agenda.ics" : `programacao-${S.dia}.ics`); return; }
    if (t.id === "ics-copy") { copiar($("#ics-text").value, $("#ics-text")); return; }
    if (t.id === "copiar-email") { copiar(E.contato.email, null); return; }
    if (t.id === "ver-convidados") { const g = $("#convidados"), open = g.classList.toggle("collapsed") === false; t.setAttribute("aria-expanded", open); t.textContent = open ? "Mostrar menos" : `Ver as ${CONVIDADOS.length} pessoas`; return; }
    if (t.id === "mais") { S.acervo.limite += 30; renderAcervo(); return; }
    if (t.id === "menu-btn") { const open = $("#nav").dataset.open !== "true"; $("#nav").dataset.open = open; t.setAttribute("aria-expanded", open); if (open) $("#nav a").focus(); return; }
  });
  // teclado nas abas de dia (setas, Home, End)
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && $("#nav").dataset.open === "true") { $("#nav").dataset.open = "false"; $("#menu-btn").setAttribute("aria-expanded", "false"); $("#menu-btn").focus(); }
    const tab = ev.target.closest && ev.target.closest('.days [role="tab"]'); if (!tab) return;
    const tabs = $$('.days [role="tab"]'); let i = tabs.indexOf(tab);
    if (ev.key === "ArrowRight") i = (i + 1) % tabs.length; else if (ev.key === "ArrowLeft") i = (i - 1 + tabs.length) % tabs.length; else if (ev.key === "Home") i = 0; else if (ev.key === "End") i = tabs.length - 1; else return;
    ev.preventDefault(); tabs[i].click();
  });
  let tq;
  document.addEventListener("input", (ev) => {
    if (ev.target.id === "q") { clearTimeout(tq); tq = setTimeout(() => { S.q = ev.target.value; renderProgramacao(); }, 180); }
    if (ev.target.id === "a-q") { clearTimeout(tq); tq = setTimeout(() => { S.acervo.q = ev.target.value; S.acervo.limite = 30; renderAcervo(); }, 180); }
  });
  document.addEventListener("change", (ev) => {
    const id = ev.target.id;
    if (id === "f-gt") { S.gt = ev.target.value; renderProgramacao(); }
    if (id === "f-sala") { S.sala = ev.target.value; renderProgramacao(); }
    if (id === "a-gt") { S.acervo.gt = ev.target.value; S.acervo.limite = 30; renderAcervo(); }
    if (id === "a-fmt") { S.acervo.fmt = ev.target.value; S.acervo.limite = 30; renderAcervo(); }
    if (id === "fase-sim") { S.simKey = ev.target.value; store.set("fase", S.simKey); aplicarFase(); headCta(); if ($("#q")) $("#v-programacao").innerHTML = ""; rerenderTudo(); toast("Fase simulada: " + FASES[S.fase].label); }
  });
  window.addEventListener("hashchange", () => rota(true));
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(desenharArte, 150); });
  try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", desenharArte); } catch (e) { /* navegador antigo */ }
  new MutationObserver(desenharArte).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ============ Início ============ */
  $("#fase-sim").value = S.simKey in SIM || S.simKey === "real" ? S.simKey : "real";
  aplicarFase(); headCta(); rota(false);
})();
