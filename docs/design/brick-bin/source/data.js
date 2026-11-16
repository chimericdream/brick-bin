/* Brick Bin mockup data. EVERYTHING here is invented: set names, numbers, people, prices.
   Set numbers are shaped like each brand's own style but do not refer to real products.
   Counts shown on screens are computed from these rows (see the asserts at the bottom). */

const TODAY = '16 Nov 2026';

/* ---------- catalog colours (names and swatches) ---------- */
const COL = {
  blk: { n: 'Black', h: '#05131D' }, wht: { n: 'White', h: '#FFFFFF' },
  lbg: { n: 'Light Bluish Gray', h: '#A0A5A9' }, dbg: { n: 'Dark Bluish Gray', h: '#6C6E68' },
  red: { n: 'Red', h: '#C91A09' }, blu: { n: 'Blue', h: '#0055BF' },
  rbr: { n: 'Reddish Brown', h: '#582A12' }, tan: { n: 'Tan', h: '#E4CD9E' },
  lav: { n: 'Lavender', h: '#E1D5ED' }, dor: { n: 'Dark Orange', h: '#A95500' },
  grn: { n: 'Green', h: '#237841' }, yel: { n: 'Yellow', h: '#F2CD37' },
  azu: { n: 'Medium Azure', h: '#36AEBF' }, clr: { n: 'Trans-Clear', h: '#E8EEF2' },
};

/* ---------- catalog parts (shape drives the SVG drawing) ---------- */
const PART = {
  '3001': { n: 'Brick 2 x 4', cat: 'Bricks', shape: 'brick', w: 4, d: 2 },
  '3004': { n: 'Brick 1 x 2', cat: 'Bricks', shape: 'brick', w: 2, d: 1 },
  '3020': { n: 'Plate 2 x 4', cat: 'Plates', shape: 'plate', w: 4, d: 2 },
  '3023': { n: 'Plate 1 x 2', cat: 'Plates', shape: 'plate', w: 2, d: 1 },
  '3069b': { n: 'Tile 1 x 2 with Groove', cat: 'Tiles', shape: 'tile', w: 2, d: 1 },
  '54200': { n: 'Slope 30 1 x 1 x 2/3', cat: 'Slopes', shape: 'slope', w: 1, d: 1 },
  '3062b': { n: 'Brick, Round 1 x 1 Open Stud', cat: 'Bricks, round', shape: 'round', w: 1, d: 1 },
  '2780': { n: 'Technic Pin with Friction Ridges', cat: 'Technic', shape: 'pin' },
  '32523': { n: 'Technic Beam 3 x 0.5 with 3 Holes', cat: 'Technic', shape: 'beam', w: 3, d: 1 },
  '4624': { n: 'Wheel 8 x 18 with Tyre', cat: 'Wheels', shape: 'wheel' },
  '3010': { n: 'Brick 1 x 4', cat: 'Bricks', shape: 'brick', w: 4, d: 1 },
  '2412b': { n: 'Tile 1 x 2 Grille', cat: 'Tiles', shape: 'tile', w: 2, d: 1 },
};

/* ---------- people, places ---------- */
const HOUSEHOLD = 'Marlowe household';
const PEOPLE = {
  Dana: { role: 'admin', hue: 215 }, Theo: { role: 'member', hue: 160 },
  Wren: { role: 'restricted', hue: 25, age: 9 }, Milo: { role: 'restricted', hue: 330, age: 12 },
};
const LOCS = [
  { n: 'Attic', kids: [{ n: 'Shelf 1', c: 3 }, { n: 'Shelf 2', c: 3 }, { n: 'Shelf 3', c: 0 }] },
  { n: 'Study', kids: [{ n: 'Display cabinet', c: 7 }] },
  { n: "Kids' room", kids: [{ n: 'Bin A', c: 4 }, { n: 'Bin B', c: 5 }] },
  { n: 'Basement', kids: [{ n: 'Totes', c: 2 }] },
];

/* ---------- build states ---------- */
const STATES = {
  sealed: { l: 'Sealed', d: 'Factory sealed, never opened' },
  opened: { l: 'Opened', d: 'Opened, not built' },
  in_progress: { l: 'In progress', d: 'Being built right now' },
  built: { l: 'Built', d: 'Finished and on display' },
  disassembled: { l: 'Disassembled', d: 'Taken apart, kept together' },
  mixed: { l: 'Mixed', d: 'Parted into bulk bins' },
};

/* ---------- sets and copies ----------
   art: scene name; c1 box colour, c2 sky, p palette.  m: missing rows [part, colour, qty] or ['other', text, qty] */
function cp(owner, loc, state, checked, o) { return Object.assign({ owner, loc, state, checked, box: true, ins: true, m: [], paid: 0, value: 0, valued: null, acq: null, note: '' }, o || {}); }
const SETS = [
  { id: 's01', brand: 'LEGO', num: '60460', name: 'Harbour Lighthouse', theme: ['City', 'Harbour'], year: 2023, pcs: 456, figs: 2, age: 7, rrp: 5999, art: 'lighthouse', c1: '#2f6ea5', c2: '#bfe0ee', p: ['#f4f4f0', '#d1453b', '#5d6b78', '#3d5a73'], ins: 2, tags: ['Display room'],
    copies: [cp('Dana', 'Study › Display cabinet', 'built', 'Mar 2026', { paid: 5999, value: 7400, valued: '2026-03', acq: '2023-12-24', note: 'Lamp brick clicks loosely.' })] },
  { id: 's02', brand: 'LEGO', num: '60461', name: 'Container Crane', theme: ['City', 'Harbour'], year: 2022, pcs: 612, figs: 1, age: 8, rrp: 7999, art: 'crane', c1: '#c06a1b', c2: '#cfe3ea', p: ['#e1a12a', '#3d5a73', '#8b979f', '#2c3a47'], ins: 1, tags: ["Wren's"],
    copies: [cp('Wren', "Kids' room › Bin A", 'in_progress', null, { m: [['3020', 'lbg', 2], ['3069b', 'wht', 1], ['54200', 'dor', 1]], paid: 7999, value: 7000, valued: '2026-03', acq: '2022-12-25', ins: false })] },
  { id: 's03', brand: 'LEGO', num: '42188', name: 'Dune Rover 4x4', theme: ['Technic'], year: 2023, pcs: 1078, figs: 0, age: 10, rrp: 11999, art: 'car', c1: '#b9772f', c2: '#f1dcb4', p: ['#d98a2b', '#2c3a47', '#7a5a38', '#f4e9d2'], ins: 1, tags: [],
    copies: [cp('Theo', 'Attic › Shelf 1', 'built', null, { m: [['2780', 'blk', 2]], paid: 11999, value: 13500, valued: '2026-03', acq: '2023-06-10' }),
      cp('Dana', 'Attic › Shelf 2', 'sealed', null, { paid: 10999, value: 16800, valued: '2025-09', acq: '2024-01-12', note: 'Box corner dented, 1 cm.' })] },
  { id: 's04', brand: 'LEGO', num: '42190', name: 'Crawler Crane', theme: ['Technic'], year: 2021, pcs: 2806, figs: 0, age: 14, rrp: 19999, art: 'crane', c1: '#3c6b4a', c2: '#d8e8d6', p: ['#e8c23a', '#2c3a47', '#7d8a84', '#233a2d'], ins: 2, tags: [],
    copies: [cp('Theo', 'Basement › Totes', 'disassembled', 'Sep 2025', { m: [['2780', 'blk', 4], ['3020', 'lbg', 1], ['32523', 'dbg', 2]], paid: 19999, value: 21000, valued: '2024-12', acq: '2021-11-20' })] },
  { id: 's05', brand: 'LEGO', num: '10784', name: 'Night Express', theme: ['Icons'], year: 2024, pcs: 2310, figs: 0, age: 18, rrp: 14999, art: 'train', c1: '#243b53', c2: '#9fb7cf', p: ['#2d4a3a', '#c9a24a', '#161c22', '#aab4bd'], ins: 2, tags: ['Display room', 'Christmas 2024'],
    copies: [cp('Dana', 'Study › Display cabinet', 'built', 'Mar 2026', { paid: 14999, value: 19900, valued: '2026-06', acq: '2024-12-25' })] },
  { id: 's06', brand: 'LEGO', num: '10782', name: 'Windmill Workshop', theme: ['Icons'], year: 2024, pcs: 1687, figs: 0, age: 18, rrp: 12999, art: 'windmill', c1: '#7a5a3a', c2: '#d6e6ef', p: ['#b98b5a', '#e8dcc4', '#c34a3d', '#5a4a3a'], ins: 1, tags: ['Display room'],
    copies: [cp('Dana', 'Attic › Shelf 2', 'sealed', null, { paid: 12999, value: 17400, valued: '2025-09', acq: '2024-05-04' })] },
  { id: 's07', brand: 'LEGO', num: '31211', name: 'Seaside Cottage 3-in-1', theme: ['Creator'], year: 2022, pcs: 564, figs: 0, age: 8, rrp: 4999, art: 'cottage', c1: '#2f8a8f', c2: '#d4ecee', p: ['#f1ead9', '#c34a3d', '#6b7e8c', '#e1b04a'], ins: 3, tags: ["Milo's"],
    copies: [cp('Milo', "Kids' room › Bin B", 'mixed', null, { paid: 4999, value: 3800, valued: '2026-03', acq: '2022-08-14', ins: false, box: false })] },
  { id: 's08', brand: 'LEGO', num: '21360', name: "Botanist's Greenhouse", theme: ['Ideas'], year: 2024, pcs: 1436, figs: 1, age: 16, rrp: 9999, art: 'dome', c1: '#4a7a3c', c2: '#e3efd8', p: ['#a9d3c4', '#f1ead9', '#d1453b', '#3d5a43'], ins: 1, tags: [],
    copies: [cp('Theo', 'Study › Display cabinet', 'in_progress', null, { paid: 9999, value: 11900, valued: '2026-03', acq: '2025-03-02' })] },
  { id: 's09', brand: 'LEGO', num: '30650', name: 'Mini Sailboat (polybag)', theme: ['Polybags'], year: 2023, pcs: 48, figs: 0, age: 6, rrp: 499, art: 'ship', c1: '#3a6fb0', c2: '#d7e8f6', p: ['#f4f4f0', '#d1453b', '#5d6b78', '#3d5a73'], ins: 0, tags: ['Party favours'],
    copies: [1, 2, 3, 4, 5].map(() => cp(null, "Kids' room › Bin B", 'sealed', null, { paid: 499, value: 700, valued: '2026-03', acq: '2025-10-02', ins: false, box: false })) },
  { id: 's10', brand: 'LEGO', num: '10790', name: 'Winter Observatory', theme: ['Icons'], year: 2025, pcs: 2048, figs: 0, age: 18, rrp: 16999, art: 'dome', c1: '#1f2e4a', c2: '#8fa6c4', p: ['#e8eef5', '#c9a24a', '#46566e', '#2a3652'], ins: 1, tags: ['Gift'], hidden: true,
    copies: [cp('Theo', 'Attic › Shelf 3', 'sealed', null, { paid: 16999, value: 16999, valued: '2026-11', acq: '2026-11-08', note: 'Present for Dana. Not wrapped yet.' })] },
  { id: 's11', brand: 'Mould King', num: '13190', name: 'Steam Locomotive 2-8-0', theme: ['Trains'], year: 2022, pcs: 1258, figs: 0, age: 14, rrp: 18900, art: 'train', c1: '#3a3a3a', c2: '#cfd8df', p: ['#2b2b2b', '#b98b2a', '#7d1f1f', '#8d969c'], ins: 1, tags: ['Display room'],
    copies: [cp('Dana', 'Study › Display cabinet', 'built', 'Jan 2026', { m: [['3023', 'blk', 2], ['other', 'Sticker sheet (number plates)', 1]], paid: 18900, value: 17500, valued: '2025-04', acq: '2022-12-01', note: 'Motor box included.' })] },
  { id: 's12', brand: 'Mould King', num: '18005', name: 'Tower Crane', theme: ['Technic'], year: 2023, pcs: 2150, figs: 0, age: 14, rrp: 9499, art: 'crane', c1: '#b8472a', c2: '#e9e2d2', p: ['#d9a22a', '#2c3a47', '#8b979f', '#6b2f1c'], ins: 1, tags: [],
    copies: [cp('Theo', 'Attic › Shelf 1', 'opened', null, { paid: 9499, value: 9500, valued: '2026-06', acq: '2025-07-19' })] },
  { id: 's13', brand: 'Mould King', num: '16040', name: 'Rescue Helicopter', theme: ['Technic'], year: 2021, pcs: 840, figs: 0, age: 12, rrp: 5499, art: 'heli', c1: '#2b5f8f', c2: '#cfe5f1', p: ['#e04b3a', '#f4f4f0', '#2c3a47', '#8b979f'], ins: 1, tags: ["Milo's"],
    copies: [cp('Milo', "Kids' room › Bin A", 'built', 'Mar 2026', { paid: 5499, value: 4500, valued: '2026-03', acq: '2022-03-05' })] },
  { id: 's14', brand: 'CaDA', num: 'C61045W', name: 'Alpine Sports Coupe', theme: ['Technic'], year: 2022, pcs: 1589, figs: 0, age: 14, rrp: 12900, art: 'car', c1: '#1c1c24', c2: '#b8c4d0', p: ['#3b82c4', '#14161b', '#8d969c', '#e6edf3'], ins: 1, tags: [],
    copies: [cp('Theo', 'Study › Display cabinet', 'built', 'Mar 2026', { paid: 12900, value: 13500, valued: '2026-03', acq: '2022-10-30' })] },
  { id: 's15', brand: 'CaDA', num: 'C66011W', name: 'Heritage Tram', theme: ['Trains'], year: 2023, pcs: 722, figs: 0, age: 12, rrp: 6999, art: 'tram', c1: '#a8761f', c2: '#e6dfcf', p: ['#2f7a5a', '#f1ead9', '#3a3a3a', '#c9a24a'], ins: 1, tags: ["Wren's"],
    copies: [cp('Wren', "Kids' room › Bin A", 'in_progress', null, { m: [['3023', 'blk', 2]], paid: 6999, value: 7000, valued: '2026-06', acq: '2025-12-25' })] },
  { id: 's16', brand: 'COBI', num: '4849', name: 'Gunboat Larkspur', theme: ['Historical ships'], year: 2021, pcs: 612, figs: 4, age: 8, rrp: 3999, art: 'ship', c1: '#51603a', c2: '#d9e4e6', p: ['#6b7d5a', '#e8dcc4', '#8d6a3f', '#3a4630'], ins: 1, tags: [],
    copies: [cp('Theo', 'Study › Display cabinet', 'built', 'Mar 2026', { paid: 3999, value: 5200, valued: '2025-02', acq: '2021-07-04' })] },
  { id: 's17', brand: 'COBI', num: '2582', name: 'Field Kitchen Wagon', theme: ['Historical'], year: 2020, pcs: 296, figs: 2, age: 7, rrp: 2499, art: 'wagon', c1: '#6b6b45', c2: '#e2e2cf', p: ['#7a7a52', '#8d6a3f', '#3b3b2c', '#e8dcc4'], ins: 1, tags: [],
    copies: [cp('Theo', 'Attic › Shelf 1', 'sealed', null, { paid: 2499, value: 2800, valued: '2026-03', acq: '2024-06-22' })] },
  { id: 's18', brand: 'BlueBrixx', num: '103511', name: 'Market Hall', theme: ['Architecture'], year: 2022, pcs: 1980, figs: 0, age: 14, rrp: 11900, art: 'hall', c1: '#8c3b35', c2: '#e9e0d0', p: ['#c9b48a', '#8c3b35', '#5d6b78', '#f1ead9'], ins: 2, tags: [],
    copies: [cp('Dana', 'Basement › Totes', 'disassembled', 'Jun 2025', { m: [['3001', 'tan', 3], ['3069b', 'wht', 1]], paid: 11900, value: 11900, valued: '2025-06', acq: '2022-11-25' })] },
  { id: 's19', brand: 'BlueBrixx', num: '105208', name: 'Signal Tower', theme: ['Architecture'], year: 2024, pcs: 884, figs: 0, age: 14, rrp: 5900, art: 'lighthouse', c1: '#3b4f66', c2: '#d9e1e8', p: ['#e8e2d4', '#c34a3d', '#6b7e8c', '#3d5a73'], ins: 1, tags: [],
    copies: [cp('Theo', 'Attic › Shelf 1', 'built', 'Mar 2026', { paid: 5900, value: 5900, valued: '2026-06', acq: '2024-09-01' })] },
  { id: 's20', brand: 'Lumibricks', num: 'LB-3072', name: 'Orchid Lamp', theme: ['Botanical'], year: 2024, pcs: 1044, figs: 0, age: 14, rrp: 8900, art: 'flower', c1: '#5a3d6e', c2: '#e7dff0', p: ['#e6c3d6', '#7aa37a', '#f4f4f0', '#a05a82'], ins: 1, tags: ['Display room'],
    copies: [cp('Dana', 'Study › Display cabinet', 'built', 'Mar 2026', { paid: 8900, value: 9500, valued: '2026-06', acq: '2024-12-25' })] },
];

/* ---------- derived: copies, completeness, totals ---------- */
SETS.forEach((s) => s.copies.forEach((c, i) => { c.setId = s.id; c.id = s.id + 'c' + (i + 1); c.missingN = c.m.reduce((a, r) => a + r[2], 0); }));
const COPIES = SETS.flatMap((s) => s.copies);
function completeness(c) {
  if (c.state === 'sealed') return { k: 'sealed', t: 'Sealed' };
  if (c.missingN > 0) return { k: 'missing', t: 'Missing ' + c.missingN + (c.missingN === 1 ? ' piece' : ' pieces'), n: c.missingN };
  if (c.checked) return { k: 'complete', t: 'Complete (checked ' + c.checked + ')' };
  return { k: 'unchecked', t: 'Not checked' };
}
/* a set's tile summarises its copies: worst completeness wins, state of the first copy, "2 copies" text */
function setSummary(s) {
  const cs = s.copies; const comp = cs.map(completeness);
  const missing = comp.filter((x) => x.k === 'missing');
  let c;
  if (missing.length) { const n = missing.reduce((a, x) => a + x.n, 0); c = { k: 'missing', t: 'Missing ' + n + (n === 1 ? ' piece' : ' pieces'), n }; }
  else if (comp.every((x) => x.k === 'sealed')) c = comp[0];
  else if (comp.some((x) => x.k === 'unchecked')) c = { k: 'unchecked', t: 'Not checked' };
  else c = comp.find((x) => x.k === 'complete') || comp[0];
  const states = [...new Set(cs.map((x) => x.state))];
  return { state: states.length > 1 ? states[0] : cs[0].state, states, comp: c, copies: cs.length };
}
const USD = (cents, sign) => (sign && cents > 0 ? '+' : cents < 0 ? '-' : '') + '$' + (Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NUM = (n) => n.toLocaleString('en-US');
const visibleSets = (role) => SETS.filter((s) => role !== 'kid' || !s.hidden);

/* ---------- shopping list: grouped by part + colour from the open missing rows ---------- */
function shoppingGroups(role) {
  const g = {}; const others = [];
  visibleSets(role).forEach((s) => s.copies.forEach((c) => c.m.forEach((r) => {
    if (r[0] === 'other') { others.push({ set: s, copy: c, text: r[1], q: r[2] }); return; }
    const k = r[0] + '|' + r[1];
    (g[k] = g[k] || { part: r[0], col: r[1], q: 0, from: [] });
    g[k].q += r[2]; g[k].from.push({ set: s, copy: c, q: r[2] });
  })));
  return { groups: Object.values(g), others };
}
const MOLD = { '3069b': 'Older mold 3069a will do', '3001': 'Any of 3001, 3001old will do', '2780': 'Pin 3673 (no ridges) is not the same part' };

/* ---------- the set the picker works on: Container Crane 60461 (inventory lines) ---------- */
const INV = [
  ['3001', 'red', 6], ['3001', 'dbg', 8], ['3004', 'lbg', 12], ['3010', 'blu', 4], ['3020', 'lbg', 9], ['3020', 'blk', 5], ['3023', 'yel', 14],
  ['3069b', 'wht', 6], ['3069b', 'lav', 2], ['54200', 'dor', 4], ['3062b', 'clr', 10], ['2412b', 'dbg', 8], ['4624', 'blk', 4], ['32523', 'dbg', 3],
];
const INV_META = { lines: 61, spares: 3, figs: [{ n: 'Crane operator', q: 1, c: '#d98a2b' }, { n: 'Harbour inspector', q: 1, c: '#3d5a73' }] };

/* ---------- wishlists (price seen is members-only) ---------- */
const WISH = {
  Wren: [
    { id: 'w1', t: 'Treehouse Cabin', brand: 'LEGO', num: '31215', price: 8999, seen: 'Brick Outlet', note: 'The green one, please.', art: 'cottage', c1: '#3c7a4f', c2: '#dcebd5', p: ['#f1ead9', '#6a8a4a', '#8d6a3f', '#e1b04a'], bought: '3 Nov' },
    { id: 'w2', t: 'Beach Buggy RC', brand: 'CaDA', num: 'C51022W', price: 4499, seen: 'CaDA store', note: 'Only the RC version has the lights.', art: 'car', c1: '#c4562a', c2: '#f3e0c4', p: ['#e8a22a', '#2c3a47', '#7a5a38', '#f4e9d2'], bought: null },
    { id: 'w3', t: 'Mini Lighthouse', brand: 'BlueBrixx', num: '102300', price: 2999, seen: 'BlueBrixx', note: '', art: 'lighthouse', c1: '#2f6ea5', c2: '#bfe0ee', p: ['#f4f4f0', '#d1453b', '#5d6b78', '#3d5a73'], bought: null },
  ],
  Wren_removed: [{ t: 'Cargo Plane', brand: 'LEGO', num: '60462', removedOn: '9 Nov', markedOn: '2 Nov', art: 'heli', c1: '#2b5f8f', c2: '#cfe5f1', p: ['#e04b3a', '#f4f4f0', '#2c3a47', '#8b979f'] }],
  Milo: [
    { id: 'w4', t: 'Tower Bridge Mini', brand: 'BlueBrixx', num: '104420', price: 5400, seen: 'BlueBrixx', note: 'Lights optional.', art: 'hall', c1: '#3b4f66', c2: '#d9e1e8', p: ['#c9b48a', '#8c3b35', '#5d6b78', '#f1ead9'], bought: null },
    { id: 'w5', t: 'Rally Car Pair', brand: 'Mould King', num: '15091', price: 3999, seen: 'Mould King', note: '', art: 'car', c1: '#1c1c24', c2: '#b8c4d0', p: ['#d9482a', '#14161b', '#8d969c', '#e6edf3'], bought: null },
  ],
  Dana: [
    { id: 'w6', t: 'Orbit Telescope Lamp', brand: 'Lumibricks', num: 'LB-3110', price: 10900, seen: 'Lumibricks', note: 'Would fit next to the Orchid Lamp.', art: 'dome', c1: '#243b53', c2: '#9fb7cf', p: ['#e8eef5', '#c9a24a', '#46566e', '#2a3652'], bought: null },
  ],
  Theo: [
    { id: 'w7', t: 'Fish Market Hall', brand: 'BlueBrixx', num: '103700', price: 12900, seen: 'BlueBrixx', note: '', art: 'hall', c1: '#8c3b35', c2: '#e9e0d0', p: ['#c9b48a', '#8c3b35', '#5d6b78', '#f1ead9'], bought: null },
  ],
};
/* "On someone's wishlist" matches in the add-set typeahead */
const ONLIST = ['31215', 'C51022W'];

/* typeahead results (catalog = Rebrickable-shaped rows, invented) */
const LOOKUP = [
  { num: '31215-1', name: 'Treehouse Cabin', theme: 'Creator', year: 2025, pcs: 703, wish: 'Wren', art: 'cottage', c1: '#3c7a4f', c2: '#dcebd5', p: ['#f1ead9', '#6a8a4a', '#8d6a3f', '#e1b04a'] },
  { num: '31211-1', name: 'Seaside Cottage 3-in-1', theme: 'Creator', year: 2022, pcs: 564, own: true, art: 'cottage', c1: '#2f8a8f', c2: '#d4ecee', p: ['#f1ead9', '#c34a3d', '#6b7e8c', '#e1b04a'] },
  { num: '31213-1', name: 'Pine Cabin Duo', theme: 'Creator', year: 2024, pcs: 411, art: 'cottage', c1: '#7a5a3a', c2: '#d6e6ef', p: ['#b98b5a', '#e8dcc4', '#c34a3d', '#5a4a3a'] },
  { num: '31218-1', name: 'Cove Lighthouse', theme: 'Creator', year: 2025, pcs: 1021, art: 'lighthouse', c1: '#2f6ea5', c2: '#bfe0ee', p: ['#f4f4f0', '#d1453b', '#5d6b78', '#3d5a73'] },
];

/* ---------- consistency checks (read the console) ---------- */
(function () {
  const A = (c, m) => { if (!c) console.error('DATA CHECK FAILED: ' + m); };
  const g = shoppingGroups();
  const lineSum = g.groups.reduce((a, x) => a + x.q, 0) + g.others.reduce((a, x) => a + x.q, 0);
  A(lineSum === COPIES.reduce((a, c) => a + c.missingN, 0), 'shopping totals = copy totals');
  A(COPIES.length === 25, 'copies = 25 (got ' + COPIES.length + ')');
  A(SETS.length === 20, 'sets = 20');
  A(visibleSets('kid').length === 19, 'kid sees 19');
  A(g.groups.length === 7, '7 grouped lines');
})();
