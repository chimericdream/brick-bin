// Stamps the shared head, header, docs sidebar and footer around each page body in tools/src/
// and writes plain static .html files to the designer-1 root. Convenience only: the .html files
// in the root are the deliverable and can be edited by hand. Run: node tools/stamp.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const mark = `<svg viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect x="10" y="9" width="14" height="15" fill="var(--mid)"/><rect x="11.5" y="5" width="4.5" height="4" fill="var(--mid)"/><rect x="18" y="5" width="4.5" height="4" fill="var(--mid)"/><path d="M3 13h5v13h18V13h5v18H3z" fill="currentColor"/></svg>`;

const head = (m) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${m.title}</title>
<meta name="description" content="${m.desc}">
<link rel="icon" href="assets/svg/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/AlbertSans-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<script>(function(d){d.classList.add("js");var p=new URLSearchParams(location.search).get("theme"),s=null;try{s=localStorage.getItem("bb-theme")}catch(e){}var t=p||s;if(t==="dark"||t==="light")d.setAttribute("data-theme",t)})(document.documentElement)</script>
</head>
<body id="top">
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap site-head__bar">
    <a class="brand" href="index.html" aria-label="Brick Bin, home">${mark}<span>Brick Bin</span></a>
    <nav class="nav" id="nav" aria-label="Main">
      <a href="tutorials.html"${m.nav === "tutorials" ? ' aria-current="page"' : ""}>Tutorials</a>
      <a href="docs-setup.html"${m.nav === "docs" ? ' aria-current="page"' : ""}>Docs</a>
      <a href="faq.html"${m.nav === "faq" ? ' aria-current="page"' : ""}>FAQ</a>
      <a class="nav__cta" href="docs-setup.html">Set it up</a>
      <p class="nav__extra">Free and open source. It runs on your server, so there is nothing to sign in to here.</p>
    </nav>
    <div class="head-actions">
      <button class="theme" type="button" aria-pressed="false"><span class="theme__plate" aria-hidden="true"></span><span class="theme__label">Light</span><span class="vh"> theme in use. Switch theme</span></button>
      <a class="btn btn--small studs" href="docs-setup.html">Set it up</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav"><span class="menu-btn__icon" aria-hidden="true"></span>Menu</button>
    </div>
  </div>
</header>
`;

const tuts = [
  ["Getting going", [["first", "First run"], ["import", "Import the LEGO catalog"], ["add", "Add your first set"]]],
  ["Day to day", [["copies", "Copies and build state"], ["missing", "Missing pieces and shopping"], ["instructions", "Attach instructions"]]],
  ["The household", [["kid", "Set up a kid profile"], ["wishlist", "Run a wishlist"]]],
  ["Bigger jobs", [["csv", "Import from CSV"], ["value", "Check collection value"]]],
];
const docsnav = (cur) => {
  const item = (key, href, label) =>
    `<li><a href="${href}"${cur === key ? ' aria-current="page"' : ""}>${label}</a></li>`;
  if (cur === "import") {
    return `<aside class="docs__side">
    <button class="sidenav__toggle studs" type="button" aria-expanded="false" aria-controls="sidenav"><span>Tutorials menu</span><span>2 of 10</span></button>
    <nav class="sidenav" id="sidenav" aria-label="Tutorials">
      ${tuts
        .map(
          ([group, list]) => `<h2>${group}</h2>
      <ul>
        ${list.map(([k, l]) => item(k, k === "import" ? "tutorial-import-catalog.html" : "#not-mocked", l)).join(" ")}
      </ul>`
        )
        .join(" ")}
    </nav>
  </aside>`;
  }
  const names = { setup: "Setup", hosting: "Hosting", configuration: "Configuration" };
  return `<aside class="docs__side">
    <button class="sidenav__toggle studs" type="button" aria-expanded="false" aria-controls="sidenav"><span>Docs menu</span><span>${names[cur]}</span></button>
    <nav class="sidenav" id="sidenav" aria-label="Documentation">
      <h2>Documentation</h2>
      <ul>
        ${item("setup", "docs-setup.html", "Setup")}
        ${item("hosting", "docs-hosting.html", "Hosting")}
        ${item("configuration", "docs-configuration.html", "Configuration")}
      </ul>
      <h2>Elsewhere</h2>
      <ul>
        <li><a href="tutorials.html">Tutorials</a></li>
        <li><a href="faq.html">FAQ</a></li>
      </ul>
    </nav>
  </aside>`;
};

const foot = `
<footer class="site-foot">
  <div class="wrap">
    <div class="blocks" aria-hidden="true"><span class="studs" style="--h:.82">B</span><span class="studs" style="--h:1">R</span><span class="studs" style="--h:.7">I</span><span class="studs" style="--h:.9">C</span><span class="studs" style="--h:.76">K</span><span class="studs sp" style="--h:.34"></span><span class="studs m" style="--h:.94">B</span><span class="studs m" style="--h:.72">I</span><span class="studs m" style="--h:.86">N</span></div>
    <div class="foot-grid">
      <div>
        <h2>Get it running</h2>
        <ul>
          <li><a href="docs-setup.html">Setup</a></li>
          <li><a href="docs-hosting.html">Hosting</a></li>
          <li><a href="docs-configuration.html">Configuration</a></li>
        </ul>
      </div>
      <div>
        <h2>Use it</h2>
        <ul>
          <li><a href="tutorials.html">Tutorials</a></li>
          <li><a href="faq.html">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h2>The project</h2>
        <ul>
          <li><a href="#repo">Source code</a></li>
          <li><a href="#repo-issues">Report a problem</a></li>
        </ul>
      </div>
      <div class="foot-credit">
        <p>Catalog data comes from <a href="https://rebrickable.com/">Rebrickable</a>. You import it yourself, onto your own server. Thank you, Rebrickable.</p>
        <p>Brick Bin is an independent project. It is not affiliated with, endorsed by or sponsored by the LEGO Group or any other brick maker. LEGO is a trademark of the LEGO Group.</p>
      </div>
    </div>
    <div class="foot-last">
      <span>Free and open source. Your collection lives on your server, not ours.</span>
      <span class="on-field"><a class="btn btn--small studs" href="#top">Back to the top</a></span>
    </div>
  </div>
</footer>
<script src="assets/js/site.js"></script>
</body>
</html>
`;

const srcDir = join(here, "src");
for (const f of readdirSync(srcDir).filter((n) => n.endsWith(".html"))) {
  const raw = readFileSync(join(srcDir, f), "utf8");
  const end = raw.indexOf("-->");
  const m = JSON.parse(raw.slice(raw.indexOf("{"), end));
  let body = raw.slice(end + 3).trim();
  if (m.docs) body = body.replace("{{DOCSNAV}}", docsnav(m.docs));
  writeFileSync(join(root, f), head(m) + `<main id="main">\n${body}\n</main>\n` + foot);
  console.log("wrote", f);
}
