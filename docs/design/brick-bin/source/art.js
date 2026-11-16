/* Invented box art and part drawings, all inline SVG. No third-party images.
   Box art is 3:2 landscape (300x200). Part drawings are 24-bit-PNG-style: opaque WHITE background. */

function shade(hex, f) { // f<0 darker, f>0 lighter
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, a = Math.abs(f);
  r = Math.round((t - r) * a + r); g = Math.round((t - g) * a + g); b = Math.round((t - b) * a + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
const R = (x, y, w, h, f, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${rx ? ` rx="${rx}"` : ''}/>`;
const P = (pts, f) => `<polygon points="${pts}" fill="${f}"/>`;
const CI = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;

/* scenes live in the panel x 34..266, y 40..172; ground at y=150 */
const SCENES = {
  lighthouse: (p) => R(34, 150, 232, 22, p[3]) + R(34, 138, 232, 14, shade(p[3], .25)) +
    P('142,150 158,150 154,64 146,64', p[0]) + P('146,64 154,64 153,76 147,76', p[1]) + P('145,96 155,96 154,108 146,108', p[1]) + P('143,128 157,128 156,140 144,140', p[1]) +
    R(141, 52, 18, 12, '#f3d36a') + R(138, 46, 24, 7, p[1]) + P('140,46 160,46 150,36', p[2]) + R(120, 140, 60, 10, p[2]) + R(70, 122, 34, 4, p[0]) + R(190, 118, 40, 4, p[0]),
  crane: (p) => R(34, 150, 232, 22, p[3]) + R(60, 140, 60, 10, p[2]) + R(70, 118, 22, 22, p[1]) + R(76, 70, 8, 50, p[0]) + R(70, 62, 130, 8, p[0]) + R(190, 70, 3, 40, p[3]) + R(184, 108, 16, 10, p[1]) +
    R(150, 128, 30, 22, p[0]) + R(184, 134, 30, 16, p[2]) + R(214, 134, 30, 16, p[1]) + CI(86, 154, 6, p[3]),
  car: (p) => R(34, 150, 232, 22, p[3]) + P('70,138 90,112 170,108 216,124 232,140 232,150 70,150', p[0]) + P('100,114 120,114 126,130 94,130', '#dff0f6') + P('130,114 168,112 186,130 130,130', '#dff0f6') +
    R(70, 138, 162, 10, p[1]) + CI(110, 148, 17, p[1]) + CI(110, 148, 8, p[2]) + CI(198, 148, 17, p[1]) + CI(198, 148, 8, p[2]),
  train: (p) => R(34, 150, 232, 22, p[2]) + R(34, 150, 232, 4, '#8b979f') + R(60, 108, 90, 36, p[0]) + R(60, 98, 30, 12, p[1]) + R(76, 76, 12, 24, p[2]) + R(70, 70, 24, 8, p[2]) + R(150, 96, 52, 48, p[0]) + R(158, 104, 20, 16, '#dff0f6') +
    R(150, 92, 56, 6, p[2]) + R(206, 124, 36, 20, p[3]) + CI(80, 148, 12, p[2]) + CI(116, 148, 12, p[2]) + CI(170, 148, 9, p[2]) + CI(196, 148, 9, p[2]) + CI(80, 148, 4, p[1]),
  tram: (p) => R(34, 150, 232, 22, p[2]) + R(34, 150, 232, 4, '#8b979f') + R(64, 100, 172, 44, p[0]) + R(64, 112, 172, 6, p[1]) + [78, 106, 134, 162, 190, 212].map((x) => R(x, 104, 16, 12, '#dff0f6')).join('') +
    R(60, 94, 180, 7, p[3]) + R(148, 58, 3, 38, p[2]) + R(116, 56, 66, 3, p[2]) + CI(92, 148, 8, p[2]) + CI(208, 148, 8, p[2]),
  windmill: (p) => R(34, 150, 232, 22, '#7a8f5a') + P('120,150 180,150 168,88 132,88', p[0]) + P('128,88 172,88 150,64', p[2]) + R(144, 124, 12, 26, p[3]) +
    P('150,84 146,40 154,40', p[1]) + P('150,84 196,80 196,88', p[1]) + P('150,84 154,128 146,128', p[1]) + P('150,84 104,88 104,80', p[1]) + CI(150, 84, 5, p[3]),
  cottage: (p) => R(34, 150, 232, 22, '#7a9a5a') + R(96, 100, 108, 50, p[0]) + P('86,102 150,58 214,102', p[1]) + R(108, 118, 22, 32, p[3]) + R(146, 112, 22, 20, '#dff0f6') + R(176, 112, 18, 20, '#dff0f6') + R(176, 64, 14, 26, p[2]) + R(60, 140, 24, 10, p[3]),
  dome: (p) => R(34, 150, 232, 22, '#7a9a5a') + R(96, 124, 108, 26, p[1]) + `<path d="M96,124 A54,62 0 0 1 204,124Z" fill="${p[0]}" opacity=".9"/>` + [118, 140, 162, 184].map((x) => R(x, 76, 2, 48, p[3])).join('') + R(96, 122, 108, 4, p[3]) + CI(150, 110, 10, p[2]) + R(108, 134, 20, 16, p[3]),
  ship: (p) => R(34, 138, 232, 34, '#4b86b8') + R(34, 148, 232, 24, '#3a6f9a') + P('76,128 224,128 204,152 100,152', p[2]) + R(100, 112, 70, 16, p[0]) + R(112, 100, 26, 12, p[3]) + R(148, 40, 3, 72, p[3]) + P('151,44 190,98 151,98', p[0]) + P('147,50 120,98 147,98', p[1]),
  heli: (p) => R(34, 150, 232, 22, '#7a8f5a') + `<path d="M96,112 Q96,86 140,86 Q172,86 180,112 L190,124 L96,124Z" fill="${p[0]}"/>` + R(112, 94, 30, 18, '#dff0f6') + R(180, 108, 66, 8, p[0]) + R(238, 96, 6, 22, p[2]) + R(100, 70, 110, 4, p[2]) + R(144, 74, 4, 12, p[2]) + R(100, 136, 90, 4, p[2]) + R(112, 124, 4, 12, p[2]) + R(172, 124, 4, 12, p[2]),
  flower: (p) => R(34, 150, 232, 22, p[2]) + R(112, 134, 76, 16, p[3]) + R(144, 94, 12, 42, p[1]) + CI(150, 76, 10, '#f3d36a') + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="${150 + 24 * Math.cos((a * Math.PI) / 180)}" cy="${76 + 24 * Math.sin((a * Math.PI) / 180)}" rx="15" ry="9" transform="rotate(${a} ${150 + 24 * Math.cos((a * Math.PI) / 180)} ${76 + 24 * Math.sin((a * Math.PI) / 180)})" fill="${p[0]}"/>`).join('') + P('150,118 112,100 126,116', p[1]) + P('150,122 192,104 176,122', p[1]),
  wagon: (p) => R(34, 150, 232, 22, '#7a8a5a') + R(76, 100, 130, 36, p[0]) + P('70,100 140,66 212,100', p[3]) + R(206, 120, 40, 4, p[1]) + CI(110, 146, 16, p[1]) + CI(110, 146, 7, p[3]) + CI(184, 146, 16, p[1]) + CI(184, 146, 7, p[3]) + R(88, 108, 18, 16, p[2]),
  hall: (p) => R(34, 150, 232, 22, '#8a8a82') + R(70, 92, 160, 58, p[0]) + P('62,94 150,58 238,94', p[1]) + [86, 118, 150, 182, 204].map((x) => `<path d="M${x},150 v-26 a10,10 0 0 1 20,0 v26z" fill="${p[2]}"/>`).join('') + R(138, 66, 24, 18, p[3]) + R(70, 90, 160, 5, p[1]),
};

function boxArt(o, cls) {
  const [c1, c2] = [o.c1, o.c2], p = o.p;
  const face = shade(c1, -.04);
  return `<svg class="${cls || 'art'}" viewBox="0 0 300 200" role="img" aria-label="Box art for ${o.name || o.t} (invented illustration)" preserveAspectRatio="xMidYMid meet">
  <rect x="14" y="8" width="272" height="184" rx="5" fill="${shade(c1, -.28)}"/><rect x="12" y="6" width="272" height="184" rx="5" fill="${face}"/>
  <rect x="12" y="6" width="272" height="26" rx="5" fill="${shade(c1, -.18)}"/>
  <rect x="24" y="14" width="64" height="9" rx="2" fill="#fff" opacity=".9"/><rect x="94" y="14" width="26" height="9" rx="2" fill="#fff" opacity=".45"/>
  <circle cx="262" cy="19" r="9" fill="#fff" opacity=".92"/><rect x="258" y="17" width="8" height="4" fill="${c1}"/>
  <svg x="34" y="38" width="232" height="132" viewBox="34 40 232 132" overflow="hidden">${R(34, 40, 232, 132, c2)}${(SCENES[o.art] || SCENES.cottage)(p)}</svg>
  <rect x="24" y="170" width="52" height="12" rx="2" fill="#fff" opacity=".85"/><rect x="82" y="173" width="30" height="6" rx="2" fill="#fff" opacity=".45"/>
  </svg>`;
}

/* ---------- part drawings: isometric, on opaque white ---------- */
const C30 = 0.866, S30 = 0.5;
function isoPart(shape, w, d, colour) {
  const u = shape === 'tile' || shape === 'plate' ? 17 : 14, c = colour;
  const pt = (x, y, z, ox, oy) => [(ox + (x - y) * C30 * u).toFixed(1), (oy + (x + y) * S30 * u - z * u).toFixed(1)].join(',');
  const cube = (W, D, H, ox, oy, col, studs) => {
    const A = (x, y, z) => pt(x, y, z, ox, oy);
    let s = P([A(0, D, 0), A(W, D, 0), A(W, D, H), A(0, D, H)].join(' '), shade(col, -.14)) + P([A(W, 0, 0), A(W, D, 0), A(W, D, H), A(W, 0, H)].join(' '), shade(col, -.3)) + P([A(0, 0, H), A(W, 0, H), A(W, D, H), A(0, D, H)].join(' '), col);
    if (studs) for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) {
      const [sx, sy] = pt(i + .5, j + .5, H, ox, oy).split(',').map(Number);
      s += `<path d="M${sx - 5.2},${sy} v-3 a5.2,3 0 0 1 10.4,0 v3 a5.2,3 0 0 1 -10.4,0z" fill="${shade(col, -.1)}"/><ellipse cx="${sx}" cy="${sy - 3}" rx="5.2" ry="3" fill="${shade(col, .12)}"/>`;
    }
    return s;
  };
  const cx = 60;
  switch (shape) {
    case 'brick': return cube(w, d, 1.2, cx - ((w - d) * C30 * u) / 2 + 0, 52 - ((w + d) * S30 * u) / 2 + 12, c, true);
    case 'plate': return cube(w, d, .4, cx - ((w - d) * C30 * u) / 2, 52 - ((w + d) * S30 * u) / 2 + 8, c, true);
    case 'tile': return cube(w, d, .4, cx - ((w - d) * C30 * u) / 2, 52 - ((w + d) * S30 * u) / 2 + 8, c, false);
    case 'beam': return cube(w, .5, .5, cx - ((w - .5) * C30 * u) / 2, 52 - ((w + .5) * S30 * u) / 2 + 8, c, false) + [0, 1, 2].map((i) => { const [x, y] = pt(i + .5, .25, .5, cx - ((w - .5) * C30 * u) / 2, 52 - ((w + .5) * S30 * u) / 2 + 8).split(',').map(Number); return `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="2.4" fill="${shade(c, -.55)}"/>`; }).join('');
    case 'slope': { const ox = 46, oy = 40, A = (x, y, z) => pt(x, y, z, ox, oy); return P([A(0, 1, 0), A(2, 1, 0), A(2, 1, 0.5), A(0, 1, 1.6)].join(' '), shade(c, -.14)) + P([A(2, 0, 0), A(2, 1, 0), A(2, 1, .5), A(2, 0, .5)].join(' '), shade(c, -.3)) + P([A(0, 0, 1.6), A(2, 0, .5), A(2, 1, .5), A(0, 1, 1.6)].join(' '), shade(c, .06)); }
    case 'round': { const [sx, sy] = [60, 52]; return `<path d="M${sx - 17},${sy - 6} v22 a17,9 0 0 0 34,0 v-22z" fill="${shade(c, -.16)}"/><ellipse cx="${sx}" cy="${sy - 6}" rx="17" ry="9" fill="${c}"/><ellipse cx="${sx}" cy="${sy - 10}" rx="9" ry="5" fill="${shade(c, -.1)}"/><ellipse cx="${sx}" cy="${sy - 12}" rx="9" ry="5" fill="${shade(c, .12)}"/>`; }
    case 'pin': return `<g transform="rotate(-28 60 50)"><rect x="26" y="43" width="62" height="12" rx="6" fill="${c}"/><rect x="26" y="43" width="62" height="5" rx="2.5" fill="${shade(c, .22)}"/><rect x="42" y="42" width="3" height="14" fill="${shade(c, -.3)}"/><rect x="62" y="42" width="3" height="14" fill="${shade(c, -.3)}"/><rect x="80" y="39" width="12" height="20" rx="3" fill="${shade(c, -.1)}"/></g>`;
    case 'wheel': return CI(60, 50, 33, shade(c, -.1)) + CI(60, 50, 20, shade('#a0a5a9', -.1)) + CI(60, 50, 12, '#e8eef2') + CI(60, 50, 5, '#a0a5a9') + `<path d="M60,17 a33,33 0 0 1 28,16" stroke="${shade(c, .25)}" stroke-width="3" fill="none"/>`;
    default: return cube(2, 2, 1, 60, 40, c, true);
  }
}
function partImg(num, colour, cls) { // LDraw-style render: opaque white
  const p = PART[num] || PART['3001']; const col = COL[colour] ? COL[colour].h : '#888';
  return `<svg class="${cls || 'pimg'}" viewBox="0 0 120 90" role="img" aria-label="${p.n}, ${COL[colour] ? COL[colour].n : ''}"><rect width="120" height="90" fill="#fff"/>${isoPart(p.shape, p.w, p.d, col)}</svg>`;
}
