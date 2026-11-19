/* Mockup helper only. Theme: no data-theme attribute means "System".
   ?theme=light|dark|system forces a theme for screenshots. The real app uses Mantine's
   useMantineColorScheme() and ColorSchemeScript instead of this file. */
(function () {
  var root = document.documentElement;
  var q = new URLSearchParams(location.search).get("theme");
  var saved = null;
  try {
    saved = localStorage.getItem("bb-theme");
  } catch (e) {}
  var apply = function (t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t);
    else root.removeAttribute("data-theme");
    document.querySelectorAll("[data-set-theme]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-theme") === (t || "system")));
    });
  };
  var current = q || saved || "system";
  apply(current);
  document.addEventListener("DOMContentLoaded", function () {
    apply(current);
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-set-theme]");
      if (!b) return;
      current = b.getAttribute("data-set-theme");
      try {
        localStorage.setItem("bb-theme", current);
      } catch (err) {}
      apply(current);
    });
  });
})();
