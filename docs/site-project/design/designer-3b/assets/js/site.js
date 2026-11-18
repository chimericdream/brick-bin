/* Brick Bin site mockups. Small and dependency-free; every page still reads without it.
   Query parameters exist only so states can be screenshotted:
   ?theme=system|light|dark  ?menu=open  ?toc=open  ?tutnav=open
   ?state=sealed|opened|progress|built|apart|mixed */
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  root.classList.remove("no-js");

  /* ----- theme: System, Light, Dark. No data-theme attribute means System. ----- */
  function getChoice() {
    var q = params.get("theme");
    if (q) return q;
    try {
      return localStorage.getItem("bb-theme") || "system";
    } catch (e) {
      return "system";
    }
  }
  function applyTheme(choice) {
    if (choice === "light" || choice === "dark") root.setAttribute("data-theme", choice);
    else root.removeAttribute("data-theme");
    document.querySelectorAll(".theme:not([data-static]) button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.value === choice));
    });
  }
  applyTheme(getChoice());
  document.querySelectorAll(".theme:not([data-static]) button").forEach(function (b) {
    b.addEventListener("click", function () {
      try {
        localStorage.setItem("bb-theme", b.value);
      } catch (e) {}
      applyTheme(b.value);
    });
  });

  /* ----- phone menu: a dialog that traps focus, closes on Escape, returns focus ----- */
  var menu = document.querySelector(".menu");
  var openBtn = document.querySelector(".menu-btn[data-open]");
  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    if (openBtn) openBtn.setAttribute("aria-expanded", String(open));
    if (open) menu.querySelector("[data-close]").focus();
    else if (openBtn) openBtn.focus();
  }
  if (menu && openBtn) {
    openBtn.addEventListener("click", function () {
      setMenu(true);
    });
    menu.querySelector("[data-close]").addEventListener("click", function () {
      setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("menu-open")) return;
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") {
        var f = menu.querySelectorAll("a, button");
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    if (params.get("menu") === "open") {
      root.classList.add("menu-open");
      openBtn.setAttribute("aria-expanded", "true");
    }
  }

  /* ----- disclosures that a screenshot may want open ----- */
  document.querySelectorAll("details[data-param]").forEach(function (d) {
    if (params.get(d.getAttribute("data-param")) === "open") d.setAttribute("open", "");
  });

  /* ----- "On this page" tracks the scroll position ----- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var seen = {};
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          tocLinks.forEach(function (a) {
            var on = a.getAttribute("href") === "#" + en.target.id;
            a.classList.toggle("is-here", on);
            if (on) a.setAttribute("aria-current", "location");
            else a.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "0px 0px -70% 0px" }
    );
    tocLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var t = document.getElementById(id);
      if (t && !seen[id]) {
        seen[id] = 1;
        io.observe(t);
      }
    });
  }

  /* ----- copy buttons on code blocks ----- */
  document.querySelectorAll(".codeblock__bar button").forEach(function (b) {
    b.addEventListener("click", function () {
      var code = b.closest(".codeblock").querySelector("pre").innerText;
      var done = function () {
        b.textContent = "Copied";
        setTimeout(function () {
          b.textContent = "Copy";
        }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, done);
      else done();
    });
  });

  /* ----- the one live thing: nine bricks, six build states ----- */
  var toy = document.querySelector(".toy");
  if (toy) {
    /* each piece: [x, y, rotation, opacity]; order p1..p9, then the two strangers.
       OUT parks a piece inside the box, invisible. */
    var OUT = [200, 196, 0, 0];
    var BUILT = [
      [60, 228, 0], [180, 228, 0], [340, 228, 0],
      [100, 196, 0], [180, 196, 0], [300, 196, 0],
      [140, 164, 0], [260, 164, 0], [200, 132, 0],
    ];
    var S = {
      sealed: { p: [OUT, OUT, OUT, OUT, OUT, OUT, OUT, OUT, OUT, OUT, OUT], box: 1, lid: "" },
      opened: {
        p: [OUT, OUT, OUT, [150, 96, -10], OUT, OUT, OUT, [262, 92, 12], [206, 84, 0], OUT, OUT],
        box: 1,
        lid: "translate(-58px,-34px) rotate(-22deg)",
      },
      progress: {
        p: [BUILT[0], BUILT[1], BUILT[2], BUILT[3], BUILT[4], BUILT[5], BUILT[6], [-34, 228, 0], [432, 228, 12], OUT, OUT],
        box: 0,
      },
      built: { p: BUILT.concat([OUT, OUT]), box: 0 },
      apart: {
        p: [
          [0, 228, 0], [126, 228, 0], [396, 190, 10],
          [14, 190, -8], [150, 196, 0], [290, 192, -6],
          [292, 228, 0], [200, 158, -14], [60, 152, 8],
          OUT, OUT,
        ],
        box: 0,
      },
      mixed: {
        p: [
          [54, 222, 0], [306, 222, 0], [196, 222, 0],
          [70, 184, -12], [222, 186, 6], [350, 182, 16],
          [120, 142, 22], [300, 140, -18], [210, 146, 4],
          [166, 190, -24], [392, 142, 30],
        ],
        box: 0,
        tub: 1,
      },
    };
    var NOTES = {
      sealed: "<b>Sealed.</b> Still in the shrink-wrap. Admire from a distance.",
      opened: "<b>Opened.</b> The bags are out. No promises were made.",
      progress: "<b>In progress.</b> Bag three of seven. The table is spoken for.",
      built: "<b>Built.</b> Done, on display, and due for dusting.",
      apart: "<b>Disassembled.</b> Back in pieces, on purpose, and still all together.",
      mixed: "<b>Mixed.</b> No longer a set. Its parts are in the big tub with everything else.",
    };
    var pieces = toy.querySelectorAll("[data-p]");
    var box = toy.querySelector(".toy__box");
    var lid = toy.querySelector(".toy__lid");
    var tub = toy.querySelector(".toy__tub");
    var note = toy.querySelector(".toy__note");
    var setState = function (name) {
      var st = S[name];
      if (!st) return;
      pieces.forEach(function (el, i) {
        var p = st.p[i];
        el.style.transform = "translate(" + p[0] + "px," + p[1] + "px) rotate(" + p[2] + "deg)";
        el.style.opacity = p.length > 3 ? p[3] : 1;
      });
      box.style.opacity = st.box;
      lid.style.transform = st.lid || "";
      tub.style.opacity = st.tub ? 1 : 0;
      note.innerHTML = NOTES[name];
      toy.querySelectorAll(".toy__states button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.value === name));
      });
    };
    toy.querySelectorAll(".toy__states button").forEach(function (b) {
      b.addEventListener("click", function () {
        setState(b.value);
      });
    });
    setState(params.get("state") || "built");
  }
})();
