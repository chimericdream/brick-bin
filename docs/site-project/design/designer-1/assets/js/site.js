/* Brick Bin site mockups. Small, dependency-free, and everything still reads without it.
   Query parameters exist only so states can be screenshotted:
   ?theme=dark|light  ?menu=open  ?docsnav=open  ?state=sealed|opened|progress|built|apart|mixed */
(function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);

  /* ----- theme ----- */
  function currentTheme() {
    return root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function paintToggle() {
    var dark = currentTheme() === "dark";
    document.querySelectorAll("button.theme").forEach(function (b) {
      b.setAttribute("aria-pressed", String(dark));
      var label = b.querySelector(".theme__label");
      if (label) label.textContent = dark ? "Dark" : "Light";
    });
  }
  root.setAttribute("data-theme", currentTheme());
  document.querySelectorAll("button.theme").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("bb-theme", next);
      } catch (e) {}
      paintToggle();
    });
  });
  paintToggle();

  /* ----- mobile menu ----- */
  var menuBtn = document.querySelector(".menu-btn");
  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.lastChild.textContent = open ? "Close" : "Menu";
    }
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(!root.classList.contains("menu-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    if (params.get("menu") === "open") setMenu(true);
  }

  /* ----- docs navigation on phones ----- */
  var side = document.querySelector(".docs__side");
  var sideBtn = document.querySelector(".sidenav__toggle");
  if (side && sideBtn) {
    var setSide = function (open) {
      side.classList.toggle("docsnav-open", open);
      sideBtn.setAttribute("aria-expanded", String(open));
    };
    sideBtn.addEventListener("click", function () {
      setSide(!side.classList.contains("docsnav-open"));
    });
    if (params.get("docsnav") === "open") setSide(true);
  }

  /* ----- "on this page": closed by default on small screens, tracks position on large ----- */
  var toc = document.querySelector(".toc");
  if (toc) {
    if (matchMedia("(max-width: 1099px)").matches && params.get("toc") !== "open") toc.removeAttribute("open");
    var links = Array.prototype.slice.call(toc.querySelectorAll("a[href^='#']"));
    var targets = links
      .map(function (a) {
        return document.getElementById(a.getAttribute("href").slice(1));
      })
      .filter(Boolean);
    if ("IntersectionObserver" in window && targets.length) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            links.forEach(function (a) {
              a.classList.toggle("is-here", a.getAttribute("href") === "#" + en.target.id);
            });
          });
        },
        { rootMargin: "0px 0px -70% 0px" }
      );
      targets.forEach(function (t) {
        io.observe(t);
      });
    }
  }

  /* ----- the hero toy: one set of bricks, six build states ----- */
  var toy = document.querySelector(".toy");
  if (toy) {
    /* each piece: [x, y, rotation, opacity]; order b1..b9, x1, x2 */
    var IN = [200, 300, 0, 0];
    var S = {
      sealed: { p: [IN, IN, IN, IN, IN, IN, IN, IN, IN, IN, IN], box: 1, lid: "" },
      opened: {
        p: [[150, 192, -8, 1], IN, IN, IN, [228, 184, 9, 1], IN, IN, IN, [304, 196, 28, 1], IN, IN],
        box: 1,
        lid: "translate(-46px,-58px) rotate(-24deg)",
      },
      progress: {
        p: [
          [90, 364, 0, 1], [210, 364, 0, 1], [330, 364, 0, 1],
          [90, 328, 0, 1], [150, 328, 0, 1], [270, 328, 0, 1],
          [150, 292, 0, 1], [14, 364, 0, 1], [406, 364, 0, 1],
          IN, IN,
        ],
        box: 0,
      },
      built: {
        p: [
          [90, 364, 0, 1], [210, 364, 0, 1], [330, 364, 0, 1],
          [90, 328, 0, 1], [150, 328, 0, 1], [270, 328, 0, 1],
          [150, 292, 0, 1], [270, 292, 0, 1], [180, 256, 0, 1],
          IN, IN,
        ],
        box: 0,
      },
      apart: {
        p: [
          [0, 364, 0, 1], [262, 364, 0, 1], [398, 364, 0, 1],
          [44, 318, -16, 1], [130, 364, 0, 1], [150, 316, 7, 1],
          [286, 320, -5, 1], [410, 314, 22, 1], [218, 268, 38, 1],
          IN, IN,
        ],
        box: 0,
      },
      mixed: {
        p: [
          [90, 364, 0, 1], [210, 364, 0, 1], [330, 364, 0, 1],
          [16, 364, 0, 1], [150, 328, 0, 1], [300, 318, -9, 1],
          [34, 316, 12, 1], [404, 364, 0, 1], [262, 276, 31, 1],
          [176, 284, -20, 1], [352, 268, 14, 1],
        ],
        box: 0,
      },
    };
    var NOTES = {
      sealed: "<b>Sealed.</b> Still in the shrink-wrap. Admire from a distance.",
      opened: "<b>Opened.</b> The bags are out. No promises were made.",
      progress: "<b>In progress.</b> Bag three of seven. The table is spoken for.",
      built: "<b>Built.</b> Done, displayed, and due for dusting.",
      apart: "<b>Disassembled.</b> Back in pieces, on purpose this time.",
      mixed: "<b>Mixed.</b> Sharing a tub with two other sets. It happens.",
    };
    var pieces = toy.querySelectorAll(".b");
    var box = toy.querySelector(".box");
    var lid = toy.querySelector(".box__lid");
    var note = document.querySelector(".state-note");
    var buttons = document.querySelectorAll(".state-btn");
    var show = function (name) {
      var s = S[name];
      if (!s) return;
      pieces.forEach(function (el, i) {
        var p = s.p[i];
        el.style.transform = "translate(" + p[0] + "px," + p[1] + "px) rotate(" + p[2] + "deg)";
        el.style.opacity = p[3];
      });
      box.style.opacity = s.box;
      lid.style.transform = s.lid || "none";
      if (note) note.innerHTML = NOTES[name];
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.state === name));
      });
    };
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        show(b.dataset.state);
      });
    });
    show(S[params.get("state")] ? params.get("state") : "built");
  }
})();
