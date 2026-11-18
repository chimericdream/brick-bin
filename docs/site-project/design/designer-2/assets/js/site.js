/* Brick Bin site mockups: small, dependency-free behaviour.
   Everything here is progressive: each page reads correctly with scripts off. */
(function () {
  var doc = document.documentElement;
  var KEY = 'bb-theme';

  /* ---------- Theme: auto, light, dark ---------- */
  function currentTheme() { return doc.getAttribute('data-theme') || 'auto'; }
  function syncToggles() {
    var t = currentTheme();
    document.querySelectorAll('[data-theme-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === t));
    });
  }
  function setTheme(t) {
    if (t === 'auto') doc.removeAttribute('data-theme'); else doc.setAttribute('data-theme', t);
    try { if (t === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch (e) {}
    syncToggles();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-set]');
    if (b) setTheme(b.getAttribute('data-theme-set'));
  });
  syncToggles();

  /* ---------- Mobile menu ---------- */
  var menu = document.getElementById('menu');
  var opener = document.querySelector('[aria-controls="menu"]');
  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    opener && opener.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var first = menu.querySelector('.menu__bricks a');
    first && first.focus();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    opener && opener.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    opener && opener.focus();
  }
  opener && opener.addEventListener('click', openMenu);
  if (menu) {
    menu.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', closeMenu); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') { // keep focus inside the sheet
        var f = menu.querySelectorAll('a, button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  window.bbOpenMenu = openMenu;

  /* ---------- Entrances: heading, then text, then picture ---------- */
  var risers = document.querySelectorAll('.rise');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    risers.forEach(function (el) { io.observe(el); });
  } else {
    risers.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Self-hosting stages: one slider drives both halves ---------- */
  document.querySelectorAll('[data-stages]').forEach(function (root) {
    var input = root.querySelector('input[type="range"]');
    var stages = root.querySelectorAll('.stage');
    var frags = root.querySelectorAll('.frag');
    var names = root.querySelectorAll('.stage-names button');
    function show(i) {
      i = Number(i);
      stages.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
      frags.forEach(function (s, k) { s.classList.toggle('is-current', k === i); });
      names.forEach(function (s, k) { s.setAttribute('aria-pressed', String(k === i)); });
      input.value = i;
      input.setAttribute('aria-valuetext', names[i] ? names[i].textContent : String(i + 1));
      root.style.setProperty('--p', i / (stages.length - 1));
    }
    input.addEventListener('input', function () { show(input.value); });
    names.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
    show(input.value || 0);
  });

  /* ---------- Tutorials index: pointing at a row brings up its picture ---------- */
  document.querySelectorAll('[data-index-preview]').forEach(function (root) {
    var rows = root.querySelectorAll('.tut-row');
    var lists = root.querySelectorAll('.tut-list');
    var shots = root.querySelectorAll('.tut-preview .shot');
    function activate(row) {
      rows.forEach(function (r) { r.classList.toggle('is-active', r === row); });
      lists.forEach(function (l) { l.classList.toggle('has-active', !!row); });
      var id = row ? row.getAttribute('data-shot') : null;
      shots.forEach(function (s) { s.classList.toggle('is-current', s.getAttribute('data-shot') === (id || shots[0].getAttribute('data-shot'))); });
    }
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { activate(r); });
      r.addEventListener('focus', function () { activate(r); });
    });
    root.addEventListener('mouseleave', function () { activate(null); });
    activate(null);
  });

  /* ---------- On this page: mark the section being read ---------- */
  var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var heads = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    function mark(id) { tocLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + id); }); }
    mark(heads[0] && heads[0].id);
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) mark(en.target.id); });
    }, { rootMargin: '0px 0px -70% 0px' });
    heads.forEach(function (h) { tio.observe(h); });
  }

  /* ---------- Copy buttons on code blocks ---------- */
  document.querySelectorAll('.copy-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var code = b.closest('.codeblock').querySelector('code').innerText;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, function () {}); else done();
    });
  });

  /* ---------- Configuration: filter the table ---------- */
  var filter = document.getElementById('cfg-filter');
  if (filter) {
    var rowsC = document.querySelectorAll('.cfg tbody tr');
    var empty = document.querySelector('.cfg-empty');
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase(), shown = 0;
      rowsC.forEach(function (r) { var hit = r.textContent.toLowerCase().indexOf(q) > -1; r.hidden = !hit; if (hit) shown++; });
      if (empty) empty.style.display = shown ? 'none' : 'block';
    });
  }
})();
