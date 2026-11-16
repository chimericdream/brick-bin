/* Shared helpers: icons, shell (sidebar / top bar / tab bar), badges, tiles, planks. Needs data.js and art.js. */
const Q = new URLSearchParams(location.search);
const ROLE = Q.get('role') || 'admin';            // admin | member | kid
const KID = ROLE === 'kid';
const PH = innerWidth < 900;
if (Q.get('theme')) document.documentElement.setAttribute('data-theme', Q.get('theme'));

const ICON = {
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.600-7 10-7 10z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>',
  search: '<circle cx="11" cy="11" r="6.500"/><path d="M16 16l5 5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  sort: '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  warn: '<circle cx="12" cy="12" r="9"/><path d="M12 7.500v5.500M12 16.500v.01"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  boxopen: '<path d="M4 9l8-4 8 4v9l-8 3-8-3zM4 9l8 3 8-3M12 12v9"/><path d="M8 7l-3-3M16 7l3-3"/>',
  tool: '<path d="M14.500 6.500a4 4 0 005 5l-9 9a2.100 2.100 0 01-3-3zM14.500 6.500l-2-2 3-1 2 2z" />',
  blocks: '<rect x="4" y="12" width="8" height="8" rx="1"/><rect x="12" y="12" width="8" height="8" rx="1"/><rect x="8" y="4" width="8" height="8" rx="1"/>',
  split: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="5" width="7" height="7" rx="1"/><rect x="6" y="15" width="7" height="6" rx="1"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  circ: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M9 12h6"/>',
  okc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.500l3 3 5-6"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6"/>',
  link: '<path d="M10 14a4 4 0 005.700 0l3-3a4 4 0 00-5.700-5.700l-1 1M14 10a4 4 0 00-5.700 0l-3 3A4 4 0 0011 18.700l1-1"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M7 12h10"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 19c.8-3.300 3.200-5 6.500-5s5.700 1.700 6.500 5M16 5a3.500 3.500 0 010 7M18 14c2 .6 3.200 2.300 3.500 5"/>',
  pin: '<path d="M12 21s-6-5.600-6-11a6 6 0 0112 0c0 5.400-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  edit: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  right: '<path d="M10 6l6 6-6 6"/>', left: '<path d="M14 6l-6 6 6 6"/>', down: '<path d="M7 10l5 5 5-5"/>',
  eyeoff: '<path d="M3 12s3.500-6 9-6 9 6 9 6-3.500 6-9 6-9-6-9-6z"/><path d="M4 4l16 16"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18v3H3zM12 9v11M12 9c-2.500 0-4-1-4-2.500S10 3 12 9zM12 9c2.500 0 4-1 4-2.500S14 3 12 9z"/>',
  down2: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>', up2: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  print: '<path d="M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z"/>',
  refresh: '<path d="M4 12a8 8 0 0114-5.300L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.300L4 15M4 20v-5h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  disk: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.700 3.600 3 8 3s8-1.300 8-3V6M4 12c0 1.700 3.600 3 8 3s8-1.300 8-3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.500v.01"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8zM7.500 7.500v.01"/>',
  undo: '<path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-3"/>',
  bag: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
  home: '<path d="M4 11l8-7 8 7M6 10v10h12V10"/>',
  moon: '<path d="M20 14.500A8 8 0 019.500 4 8 8 0 1020 14.500z"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  book: '<path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h10"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M14.500 9.500c-.5-1-1.500-1.500-2.500-1.500-1.500 0-2.500.8-2.500 2s1 1.700 2.500 2 2.500.8 2.500 2-1 2-2.500 2c-1.200 0-2.200-.6-2.700-1.700M12 6.500V8M12 16v1.500"/>',
};
const I = (n, c) => `<span class="ic ${c || ''}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICON[n] || ''}</svg></span>`;
const MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="7" width="26" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7v20M21 7v20" stroke="currentColor" stroke-width="2.4"/><rect x="5" y="3" width="22" height="4" rx="2" fill="currentColor"/></svg>';

/* ---------- badges ---------- */
const STATE_ICON = { sealed: 'lock', opened: 'boxopen', in_progress: 'tool', built: 'blocks', disassembled: 'split', mixed: 'shuffle' };
const stateBadge = (s, lg) => `<span class="b ${s}${lg ? ' lg' : ''}">${I(STATE_ICON[s])}${STATES[s].l}</span>`;
const COMP_ICON = { missing: 'warn', complete: 'okc', unchecked: 'circ', sealed: 'lock' };
function compBadge(c, lg) {
  if (c.k === 'sealed') return '';  // sealed copies show "Sealed" as the state badge itself
  const short = c.k === 'complete' ? 'Complete' : c.k === 'missing' ? c.t : c.t;
  return `<span class="b ${c.k}${lg ? ' lg' : ''}">${I(COMP_ICON[c.k])}<span class="long">${c.t}</span><span class="short">${short}</span></span>`;
}
const avatar = (n, sz) => n ? `<span class="av" style="--h:${PEOPLE[n].hue};${sz ? `width:${sz}px;height:${sz}px` : ''}" aria-hidden="true">${n[0]}</span>` : `<span class="av" style="--h:215" aria-hidden="true">${I('home')}</span>`;
const money = (c) => KID ? '' : USD(c);

/* ---------- tiles, planks ---------- */
function tile(s, o) {
  o = o || {}; const sum = setSummary(s);
  const copies = s.copies.length > 1 ? `<span class="copies" title="${s.copies.length} copies">${I('copy')}${s.copies.length}</span>` : '';
  const tick = o.select ? `<span class="tick${o.on ? ' on' : ''}">${o.on ? '<svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>' : ''}</span>` : '';
  const priv = s.hidden && !KID ? `<span class="b plain priv" title="Hidden from kid profiles">${I('eyeoff')}Hidden from kids</span>` : '';
  const stbadge = sum.states.length > 1 ? sum.states.map((x) => stateBadge(x)).join('') : stateBadge(sum.state);
  return `<a class="tile" href="set.html?id=${s.id}${KID ? '&role=kid' : ''}${Q.get('theme') ? '&theme=' + Q.get('theme') : ''}">
    <div class="frame">${boxArt(s)}${copies}${tick}${priv}</div>
    <div class="body"><h3>${s.name}</h3><div class="meta">${s.brand} · ${s.num} · ${s.year}</div>
    <div class="badges">${stbadge}${compBadge(sum.comp)}</div></div></a>`;
}
function planks(items, cols) {
  cols = cols || (PH ? 2 : 3); let out = '';
  for (let i = 0; i < items.length; i += cols) out += `<div class="plank" style="--cols:${cols}">${items.slice(i, i + cols).join('')}</div>`;
  return out;
}

/* ---------- shell ---------- */
function href(p) { const e = []; if (Q.get('role')) e.push('role=' + Q.get('role')); if (Q.get('theme')) e.push('theme=' + Q.get('theme')); return p + (e.length ? (p.includes('?') ? '&' : '?') + e.join('&') : ''); }
const ME = KID ? { n: 'Wren', r: 'Kid profile' } : ROLE === 'member' ? { n: 'Theo', r: 'Member' } : { n: 'Dana', r: 'Admin' };
const OPEN = shoppingGroups(ROLE).groups.reduce((a, g) => a + g.q, 0) + shoppingGroups(ROLE).others.reduce((a, g) => a + g.q, 0);
const IMPORTED = '15 Nov';

function shell(o) {
  const cur = (k) => (o.page === k ? ' aria-current="page"' : '');
  const lib = `<a href="${href('library.html')}"${cur('library')}>${I('grid')}Library</a>`;
  const shop = `<a href="${href('shopping.html')}"${cur('shopping')}>${I('list')}Shopping list<span class="sub">${OPEN} pieces</span></a>`;
  const wish = `<a href="${href('wishlist.html')}"${cur('wishlist')}>${I('heart')}Wishlist</a>`;
  const settings = (k, ic, l, extra) => `<a href="${href(k + '.html')}"${cur(k)}>${I(ic)}${l}${extra || ''}</a>`;
  const nav = KID ? `${lib}${shop}${wish}` : `${lib}${shop}${wish}<a href="${href('collection.html')}"${cur('collection')}>${I('chart')}Collection</a>
    <div class="navgrp">Household</div>
    <a href="${href('people.html')}"${['people', 'places', 'catalog', 'trash', 'brands', 'activity'].includes(o.page) ? ' aria-current="page"' : ''}>${I('gear')}Settings</a>`;
  const side = `<aside class="side"><a class="brand" href="${href('library.html')}">${MARK}Brick Bin</a>
    <div class="scope"><div><b>${HOUSEHOLD}</b>${NUM(visibleSets(ROLE).length)} sets · ${NUM(visibleSets(ROLE).reduce((a, s) => a + s.copies.length, 0))} copies</div></div>
    ${KID ? '' : `<a class="btn pri addbtn" href="${href('add.html')}">${I('plus')}Add set</a>`}
    <nav class="nav" aria-label="Main">${nav}</nav>
    <div class="foot"><div class="me">${avatar(ME.n)}<div style="line-height:1.25">${ME.n}<div class="xs muted" style="font-weight:400">${ME.r}</div></div></div>
    <div style="padding:4px 10px 0">Catalog data from <a href="https://rebrickable.com" rel="noreferrer">Rebrickable</a></div></div></aside>`;
  const back = o.back ? `<a class="iconbtn lft" href="${o.back}" aria-label="Back">${I('left')}</a>` : '';
  const top = `<header class="topbar">${back}${o.back || o.title ? `<span class="tt">${o.title || ''}</span>` : `<a class="brand" href="library.html">${MARK}Brick Bin</a>`}<span class="sp"></span>${o.topAct || ''}</header>`;
  const tc = (k, ic, l, h, extra) => `<a href="${href(h)}"${cur(k)}>${I(ic)}${l}${extra || ''}</a>`;
  const tabs = KID
    ? `<nav class="tabbar" style="grid-template-columns:repeat(3,1fr)" aria-label="Main">${tc('library', 'grid', 'Library', 'library.html')}${tc('shopping', 'list', 'Shopping', 'shopping.html')}${tc('wishlist', 'heart', 'Wishlist', 'wishlist.html')}</nav>`
    : `<nav class="tabbar" aria-label="Main">${tc('library', 'grid', 'Library', 'library.html')}${tc('shopping', 'list', 'Shopping', 'shopping.html', `<small>${OPEN}</small>`)}<a class="plus" href="${href('add.html')}" aria-label="Add set">${I('plus')}Add</a>${tc('wishlist', 'heart', 'Wishlist', 'wishlist.html')}${tc('more', 'more', 'More', 'more.html')}</nav>`;
  const foot = `<footer class="pagefoot"><span>Catalog data from <a href="https://rebrickable.com" rel="noreferrer">Rebrickable</a></span><span>Brick Bin is not affiliated with any set maker.</span></footer>`;
  document.getElementById('app').innerHTML = `<div class="shell">${side}<div style="min-width:0">${top}<main class="main"><div class="wrap">${o.html}${o.nofoot ? '' : foot}</div></main></div></div>${o.tabs === false ? '' : tabs}${o.after || ''}`;
  document.title = (o.title || o.h1 || 'Brick Bin') + ' · Brick Bin';
}
function head(h1, sub, acts, crumbs) {
  return `<div class="pagehead">${''}<div>${crumbs ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>` : ''}<h1>${h1}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
}
const cb = (label, n, on, cls) => `<label class="cb ${on ? 'on' : ''} ${cls || ''}"><i>${on ? '<svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>' : ''}</i><span>${label}</span>${n !== undefined ? `<span class="n">${n}</span>` : ''}</label>`;
const attrib = '<span class="xs muted">Catalog data from <a href="https://rebrickable.com" style="text-decoration:underline">Rebrickable</a></span>';
/* settings sub navigation (desktop column, phone scrolling tabs) */
function subnav(cur) {
  const it = [['people', 'users', 'People'], ['places', 'pin', 'Places'], ['brands', 'tag', 'Brands and themes'], ['catalog', 'disk', 'Catalog'], ['activity', 'clock', 'Activity'], ['trash', 'trash', 'Trash']];
  return `<nav class="subnav" aria-label="Settings">${it.map(([k, ic, l]) => `<a href="${href(k + '.html')}" ${cur === k ? 'aria-current="page"' : ''}>${I(ic)}${l}${k === 'catalog' && ROLE === 'admin' ? '<span class="xs muted" style="margin-left:auto;font-weight:400;white-space:nowrap">Imported 15 Nov</span>' : ''}</a>`).join('')}</nav>`;
}
const mock = (t) => `<div class="mocknote"><b>Mockup note.</b> ${t}</div>`;
