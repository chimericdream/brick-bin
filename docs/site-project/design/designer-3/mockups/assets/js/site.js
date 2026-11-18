/* Brick Bin site: mockup behaviour. Small on purpose; each block maps to a Mantine piece (see SPEC.md).
   The theme is applied before paint by the inline script in each page's <head>. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var KEY = "bb-color-scheme"; // same idea as Mantine's localStorage colour-scheme manager
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  var forced = new URLSearchParams(location.search).get("theme"); // mockup screenshots only
  function stored() {
    if (forced) return forced;
    try { return localStorage.getItem(KEY) || "auto"; } catch (e) { return "auto"; }
  }
  function apply(choice) {
    var resolved = choice === "auto" ? (mq && mq.matches ? "dark" : "light") : choice;
    root.setAttribute("data-mantine-color-scheme", resolved);
    document.querySelectorAll("[data-theme-choice]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-choice") === choice));
    });
  }
  function choose(choice) {
    forced = null;
    try { localStorage.setItem(KEY, choice); } catch (e) { /* private mode: still applies for this page */ }
    apply(choice);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-theme-choice]");
    if (b) choose(b.getAttribute("data-theme-choice"));
  });
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (stored() === "auto") apply("auto"); });
  apply(stored());

  /* Phone menu: a modal sheet. Focus moves in, is trapped, Escape closes, focus returns. */
  var sheet = document.getElementById("menu");
  var opener = document.querySelector("[data-menu-open]");
  function focusables() {
    return Array.prototype.slice.call(sheet.querySelectorAll("a[href], button:not([disabled])"));
  }
  function openMenu() {
    sheet.classList.add("is-open");
    sheet.removeAttribute("hidden");
    document.body.classList.add("menu-open");
    opener.setAttribute("aria-expanded", "true");
    var f = sheet.querySelector("[data-menu-close]");
    if (f) f.focus();
  }
  function closeMenu() {
    sheet.classList.remove("is-open");
    sheet.setAttribute("hidden", "");
    document.body.classList.remove("menu-open");
    opener.setAttribute("aria-expanded", "false");
    opener.focus();
  }
  if (sheet && opener) {
    opener.addEventListener("click", openMenu);
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("[data-menu-close]") || e.target.classList.contains("menu-sheet__scrim")) closeMenu();
    });
    sheet.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeMenu(); return; }
      if (e.key !== "Tab") return;
      var f = focusables(); var first = f[0]; var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* Phone docs bar: opens the docs nav in place */
  var bar = document.querySelector("[data-docs-toggle]");
  if (bar) {
    var panel = document.getElementById(bar.getAttribute("aria-controls"));
    bar.addEventListener("click", function () {
      var open = bar.getAttribute("aria-expanded") !== "true";
      bar.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
    });
  }

  /* Copy buttons on code blocks */
  document.querySelectorAll(".code__copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pre = btn.closest(".code").querySelector("pre");
      var done = function () {
        btn.classList.add("is-done"); btn.textContent = "Copied";
        setTimeout(function () { btn.classList.remove("is-done"); btn.textContent = "Copy"; }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(pre.innerText).then(done, done); else done();
    });
  });

  /* "On this page": marks the section in view (Mantine: TableOfContents with scrollSpy) */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".docs__toc a[href^='#']"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          tocLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          byId[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) obs.observe(el); });
  }

  /* Screenshot helpers for the mockups only: ?menu=open, ?docs=open, ?toc=open */
  var q = new URLSearchParams(location.search);
  if (q.get("menu") === "open" && opener) openMenu();
  if (q.get("docs") === "open" && bar) bar.click();
  if (q.get("toc") === "open") { var d = document.querySelector(".toc-mobile"); if (d) d.open = true; }
})();
