/* Esquema 3D ilustrativo do Campus Maracanã (UERJ).
   Plantas desenhadas à mão sobre o mapa do campus enviado pelo usuário (03/11/2026),
   em coordenadas de pixel daquele mapa (~620 × 760). Alturas são relativas, sem escala.
   Projeção axonométrica: rotação no plano + inclinação; faces laterais visíveis com sombreamento. */
(function () {
  "use strict";
  const rect = (x1, y1, x2, y2) => [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
  const semi = (cx, cy, r, n = 14) => { const p = [[cx - r, cy]]; for (let i = 1; i < n; i++) { const a = Math.PI + (i / n) * Math.PI; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } p.push([cx + r, cy]); return p; };

  const CAMPUS = [[300, 45], [400, 40], [440, 75], [452, 150], [438, 212], [458, 258], [468, 340], [466, 400], [474, 470], [494, 538], [478, 580], [440, 602], [380, 640], [322, 672], [286, 690], [242, 682], [206, 652], [204, 600], [176, 606], [116, 600], [95, 562], [92, 480], [100, 400], [116, 330], [150, 250], [208, 160], [258, 92]];
  const BLUE = "#2F86E0", ORANGE = "#F29A2E", YELLOW = "#F2C230", BROWN = "#9A4E1C", PURPLE = "#8E86C8", GREEN = "#2E9E57", FIELD = "#3DBB5C", VIOLET = "#8A2BB0", RED = "#D9473F";
  // Bloco F do Pavilhão João Lyra Filho recebe as salas das sessões (GEO e FAF): destacado.
  const BLOCKS = [
    { id: "campos", pts: rect(305, 80, 337, 104), h: 1, c: FIELD },
    { id: "campos", pts: rect(342, 62, 380, 86), h: 1, c: FIELD },
    { id: "campos", pts: rect(342, 94, 380, 120), h: 1, c: FIELD },
    { id: "campos", pts: rect(386, 94, 424, 120), h: 1, c: FIELD },
    { id: "cultural", pts: rect(292, 136, 420, 194), h: 12, c: GREEN, label: "Centro Cultural", lx: 356, ly: 165 },
    { id: "pav", pts: rect(210, 228, 262, 300), h: 46, c: "#E3A21A", label: "Bloco F", lx: 236, ly: 262, key: true },
    { id: "pav", pts: rect(210, 300, 262, 458), h: 46, c: BLUE },
    { id: "pav", pts: rect(210, 458, 262, 530), h: 46, c: "#E3A21A", label: "Bloco F", lx: 236, ly: 494, key: true },
    { id: "pav", pts: rect(262, 260, 332, 282), h: 36, c: BLUE, label: "E", lx: 318, ly: 271 },
    { id: "pav", pts: rect(284, 282, 300, 306), h: 30, c: BLUE },
    { id: "pav", pts: rect(262, 306, 332, 330), h: 36, c: BLUE, label: "D", lx: 318, ly: 318 },
    { id: "pav", pts: rect(262, 346, 312, 386), h: 36, c: BLUE, label: "C", lx: 296, ly: 366 },
    { id: "pav", pts: rect(262, 424, 332, 450), h: 36, c: BLUE, label: "B", lx: 318, ly: 437 },
    { id: "pav", pts: rect(284, 450, 300, 470), h: 30, c: BLUE },
    { id: "pav", pts: rect(262, 470, 332, 496), h: 36, c: BLUE, label: "A", lx: 318, ly: 483 },
    { id: "capela", pts: rect(394, 344, 410, 380), h: 6, c: YELLOW },
    { id: "capela", pts: rect(374, 290, 430, 344), h: 20, c: YELLOW, label: "Capela Ecumênica", lx: 402, ly: 317, out: [545, 290] },
    { id: "concha", pts: rect(370, 412, 446, 446), h: 12, c: PURPLE },
    { id: "concha", pts: semi(408, 412, 36), h: 22, c: RED, label: "Concha Acústica Marielle Franco", lx: 408, ly: 400, out: [560, 395] },
    { id: "teatro", pts: rect(374, 446, 442, 522), h: 26, c: BROWN, label: "Teatro Odylo Costa Filho", lx: 408, ly: 484, out: [575, 470] },
    { id: "violeta", pts: rect(224, 552, 246, 566), h: 9, c: VIOLET },
    { id: "violeta", pts: rect(210, 580, 262, 602), h: 11, c: VIOLET },
    { id: "haroldo", pts: [[292, 562], [366, 562], [366, 550], [410, 550], [410, 562], [470, 562], [470, 590], [410, 590], [410, 600], [366, 600], [366, 590], [292, 590]], h: 24, c: ORANGE, label: "Pavilhão Reitor Haroldo Lisboa", lx: 430, ly: 576, out: [560, 640] }
  ];
  const PARKING = [[118, 330], [200, 330], [200, 598], [118, 598], [98, 560], [96, 480], [104, 400]];
  const GATES = [["Portão 1", 466, 382], ["Portão 2", 494, 540], ["Portão 3", 286, 690], ["Portão 4", 204, 600], ["Portão 5", 100, 376], ["Portão 7", 438, 213]];
  const STREETS = [["Rua São Francisco Xavier", 150, 240, -58], ["Av. Rei Pelé", 470, 300, 80], ["Av. Prof. Manoel de Abreu", 410, 640, -28], ["Rua Rad. Waldir Amaral", 200, 676, 18]];

  window.campus3D = function (opts = {}) {
    const ang = (opts.angulo ?? -28) * Math.PI / 180, tilt = 0.6, Z = 0.85;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const rot = (x, y) => [x * ca - y * sa, x * sa + y * ca];
    const P = (x, y, z = 0) => { const [rx, ry] = rot(x, y); return [rx, ry * tilt - z * Z]; };
    // limites para o viewBox
    let pts = []; CAMPUS.forEach(([x, y]) => { pts.push(P(x, y)); pts.push(P(x, y, 60)); });
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const pad = 150, minX = Math.min(...xs) - pad, minY = Math.min(...ys) - 40, W = Math.max(...xs) - minX + pad + 110, H = Math.max(...ys) - minY + 40;
    const path = (arr) => "M" + arr.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
    const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))); return `rgb(${ch.join(",")})`; };
    const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a / 2; };

    let svg = `<svg viewBox="${minX.toFixed(0)} ${minY.toFixed(0)} ${W.toFixed(0)} ${H.toFixed(0)}" role="img" aria-labelledby="campus-t campus-d" class="campus3d">
      <title id="campus-t">Esquema 3D do Campus Maracanã da UERJ</title>
      <desc id="campus-d">Pavilhão Reitor João Lyra Filho no lado oeste, com os blocos A a E voltados para o leste e o Bloco F nas duas pontas, onde ficam as salas das sessões. A leste ficam a Capela Ecumênica, a Concha Acústica Marielle Franco e o Teatro Odylo Costa Filho; ao norte o Centro Cultural e os campos; ao sul o Pavilhão Reitor Haroldo Lisboa. Portões 1 e 2 na Avenida Rei Pelé, 3 na Avenida Professor Manoel de Abreu, 4 na Rua Radialista Waldir Amaral, 5 na Rua São Francisco Xavier e 7 no norte.</desc>`;
    // base com espessura (sensação de maquete)
    const base = CAMPUS.map(([x, y]) => P(x, y)), baseLow = CAMPUS.map(([x, y]) => P(x, y, -8));
    for (let i = 0; i < CAMPUS.length; i++) { const j = (i + 1) % CAMPUS.length; const q = [base[i], base[j], baseLow[j], baseLow[i]]; svg += `<path d="${path(q)}" fill="var(--map-edge)"/>`; }
    svg += `<path d="${path(base)}" fill="var(--map-ground)" stroke="var(--map-line)" stroke-width="1"/>`;
    svg += `<path d="${path(PARKING.map(([x, y]) => P(x, y)))}" fill="var(--map-pave)"/>`;
    // vagas sugeridas
    for (let y = 345; y < 590; y += 16) svg += `<path d="${path([P(130, y), P(188, y), P(188, y + 1.4), P(130, y + 1.4)])}" fill="var(--map-line)" opacity=".7"/>`;
    // ruas (rótulos ao longo das bordas)
    STREETS.forEach(([t, x, y, r]) => { const [px, py] = P(x, y); svg += `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" transform="rotate(${(r + ang * 180 / Math.PI * 0.6).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})" class="c3-street">${t}</text>`; });

    // prismas ordenados por profundidade (fundo primeiro)
    const depth = (b) => { const c = b.pts.reduce((s, [x, y]) => [s[0] + x, s[1] + y], [0, 0]).map((v) => v / b.pts.length); return rot(c[0], c[1])[1] + b.h * 0.05; };
    const ordered = BLOCKS.slice().sort((a, b) => depth(a) - depth(b));
    const labels = [];
    ordered.forEach((b) => {
      const p = area(b.pts) < 0 ? b.pts.slice().reverse() : b.pts.slice();
      const top = p.map(([x, y]) => P(x, y, b.h)), bot = p.map(([x, y]) => P(x, y, 0));
      // sombra projetada simples
      if (b.h > 2) svg += `<path d="${path(p.map(([x, y]) => P(x + b.h * 0.35, y + b.h * 0.2, 0)))}" fill="var(--map-shadow)"/>`;
      for (let i = 0; i < p.length; i++) {
        const j = (i + 1) % p.length;
        const [ax, ay] = rot(...p[i]), [bx, by] = rot(...p[j]);
        const nx = by - ay, ny = -(bx - ax); // normal externa (polígono anti-horário em y para baixo)
        if (ny <= 0) continue; // face de costas para o observador
        const len = Math.hypot(nx, ny) || 1, light = 0.72 + 0.18 * (nx / len);
        svg += `<path d="${path([bot[i], bot[j], top[j], top[i]])}" fill="${shade(b.c, light)}" stroke="${shade(b.c, 0.55)}" stroke-width=".5" stroke-linejoin="round"/>`;
      }
      svg += `<path d="${path(top)}" fill="${shade(b.c, 1.08)}" stroke="${shade(b.c, 0.6)}" stroke-width=".7" stroke-linejoin="round"${b.key ? ' class="c3-key"' : ""}/>`;
      if (b.id === "concha") for (const r of [26, 16]) svg += `<path d="${path(semi(408, 412, r).map(([x, y]) => P(x, y, b.h + 0.5)))}" fill="none" stroke="${r === 26 ? "#3D6FD1" : "#B9E0FF"}" stroke-width="3"/>`;
      if (b.label) labels.push(b);
    });
    // rótulos por último, acima de tudo
    labels.forEach((b) => {
      const [x, y] = P(b.lx, b.ly, b.h);
      const short = b.label.length <= 2;
      if (b.out) { const [ox, oy] = P(b.out[0], b.out[1], b.h); svg += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${ox.toFixed(1)} ${oy.toFixed(1)}" stroke="var(--ink)" stroke-width="1" fill="none"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="var(--ink)"/><text x="${(ox + 4).toFixed(1)}" y="${(oy + 4).toFixed(1)}" class="c3-label" style="text-anchor:start">${b.label}</text>`; return; }
      svg += short ? `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="c3-letter">${b.label}</text>` : `<text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" class="c3-label${b.key ? " key" : ""}">${b.label}</text>`;
    });
    GATES.forEach(([t, x, y]) => {
      const [px, py] = P(x, y, 0);
      svg += `<g class="c3-gate"><path d="M${px.toFixed(1)} ${py.toFixed(1)} l0 -18" stroke="var(--ink)" stroke-width="1.4"/><circle cx="${px.toFixed(1)}" cy="${(py - 22).toFixed(1)}" r="9" fill="var(--gate)"/><text x="${px.toFixed(1)}" y="${(py - 18.5).toFixed(1)}" class="c3-gnum">${t.split(" ")[1]}</text></g>`;
    });
    // rosa dos ventos (norte do mapa original)
    const n0 = P(560, 120), n1 = P(560, 80);
    svg += `<g class="c3-north"><path d="M${n0[0].toFixed(1)} ${n0[1].toFixed(1)} L${n1[0].toFixed(1)} ${n1[1].toFixed(1)}" stroke="var(--ink-2)" stroke-width="1.5" marker-end="url(#c3arrow)"/><text x="${(n1[0] + 6).toFixed(1)}" y="${(n1[1] - 4).toFixed(1)}" class="c3-street" style="font-style:normal">N do mapa</text></g>`;
    svg += `<defs><marker id="c3arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--ink-2)"/></marker></defs>`;
    return svg + "</svg>";
  };
})();
