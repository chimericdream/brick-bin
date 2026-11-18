"""Stamps the shared head, header, phone menu and footer into each page.

Run from the package root:  python tools/build.py
Input:  tools/src/<page>.html  (first line is a JSON object of page settings)
Output: <page>.html in the package root (plain static HTML, opens by double-clicking)
Also writes PLACEHOLDERS.md from the @shot lines, so the list cannot drift from the pages.
"""

import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "src"
REPO = "https://github.com/chimericdream/brick-bin"

MARK = (
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
    '<path fill="currentColor" d="M10.5 5.5H15V9h2V5.5h4.5V9H23v14H9V9h1.5z"/>'
    '<path fill="currentColor" d="M3 13h4v13h18V13h4v17H3z"/></svg>'
)
ICONS = {
    "system": '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="10" rx="1"/><path d="M7 17h6M10 13.5V17"/></svg>',
    "light": '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"/></svg>',
    "dark": '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3z"/></svg>',
}


def theme(kind, label_id):
    btns = "".join(
        f'<button type="button" value="{v}" aria-pressed="false" title="{t}">{ICONS[v]}<span>{t}</span></button>'
        for v, t in (("system", "System"), ("light", "Light"), ("dark", "Dark"))
    )
    return f'<div class="theme theme--{kind}" role="group" aria-label="Theme"{label_id}>{btns}</div>'


SECTIONS = [
    ("tutorials", "Tutorials", "tutorials.html", "Ten walk-throughs"),
    ("setup", "Setup", "docs-setup.html", "Start here"),
    ("hosting", "Hosting", "docs-hosting.html", "Proxmox, Tailscale, backups"),
    ("config", "Configuration", "docs-configuration.html", "Every setting"),
    ("faq", "FAQ", "faq.html", "Short answers"),
]


def cur(flag):
    return ' aria-current="page"' if flag else ""


def header(meta):
    sec = meta.get("section", "")
    nav = meta.get("nav", "")
    links = (
        f'<a href="tutorials.html"{cur(nav == "tutorials")}>Tutorials</a>'
        f'<a href="docs-setup.html"{cur(nav == "docs")}>Docs</a>'
        f'<a href="faq.html"{cur(nav == "faq")}>FAQ</a>'
    )
    bricks = "".join(
        f'<li><a class="menu__brick studs sec-{k}" href="{href}"{cur(sec == k)}><b>{name}</b><span>{hint}</span></a></li>'
        for k, name, href, hint in SECTIONS
    )
    return f"""<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="index.html" aria-label="Brick Bin, home">{MARK}<span>Brick Bin</span></a>
    <nav class="nav" aria-label="Main">{links}</nav>
    <div class="header-tools">
      {theme("icons", "")}
      <a class="btn btn--small studs" href="docs-setup.html">Set it up</a>
    </div>
    <a class="menu-btn" href="#site-nav" data-open>
      Menu
      <svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M2 4h16v2.5H2zM2 8.75h16v2.5H2zM2 13.5h16V16H2z"/></svg>
    </a>
  </div>
</header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="menu__bar">
    <a class="logo" href="index.html" aria-label="Brick Bin, home">{MARK}<span>Brick Bin</span></a>
    <button class="menu-btn" type="button" data-close>
      Close
      <svg viewBox="0 0 20 20" aria-hidden="true"><path stroke="currentColor" stroke-width="2.5" d="M4 4l12 12M16 4L4 16"/></svg>
    </button>
  </div>
  <ul class="menu__list">{bricks}</ul>
  <div class="menu__links">
    <a href="index.html">Home</a>
    <a href="{REPO}">Source code</a>
  </div>
  <div class="menu__foot">
    <span class="theme-label" id="menu-theme">Theme</span>
    {theme("words", ' aria-labeledby="menu-theme"').replace(' aria-label="Theme"', "")}
    <p class="small muted" style="margin-top:16px">Free and open source. It runs on your server, so there is nothing to sign in to here.</p>
  </div>
</div>
"""


def footer():
    wall = ""
    word = [("B", "tutorials"), ("r", "setup"), ("i", "hosting"), ("c", "config"), ("k", "faq"), None, ("B", "hosting"), ("i", "tutorials"), ("n", "setup")]
    for item in word:
        if item is None:
            wall += '<span class="wall__gap"></span>'
        else:
            wall += f'<span class="studs sec-{item[1]}">{item[0].upper()}</span>'
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="wall" role="img" aria-label="Brick Bin, spelled out in bricks">{wall}</div>
    <div class="footer-grid" id="site-nav">
      <nav aria-labeledby="f1"><h2 id="f1">Get it running</h2><ul>
        <li><a href="docs-setup.html">Setup</a></li><li><a href="docs-hosting.html">Hosting</a></li><li><a href="docs-configuration.html">Configuration</a></li></ul></nav>
      <nav aria-labeledby="f2"><h2 id="f2">Use it</h2><ul>
        <li><a href="tutorials.html">Tutorials</a></li><li><a href="faq.html">FAQ</a></li></ul></nav>
      <nav aria-labeledby="f3"><h2 id="f3">The project</h2><ul>
        <li><a href="{REPO}">Source code</a></li><li><a href="{REPO}/issues">Report a problem</a></li><li><a href="{REPO}/blob/main/LICENSE">MIT license</a></li></ul></nav>
      <div><h2 class="theme-label" id="f4">Theme</h2>{theme("icons", ' aria-labeledby="f4"').replace(' aria-label="Theme"', "")}</div>
      <div class="footer-credit">
        <p>Catalog data comes from <a href="https://rebrickable.com/">Rebrickable</a>. You import it yourself, onto your own server. Thank you, Rebrickable.</p>
        <p>Brick Bin is an independent project. It is not affiliated with, endorsed by or sponsored by the LEGO Group or any other brick maker. LEGO is a trademark of the LEGO Group.</p>
      </div>
    </div>
    <div class="footer-base">
      <p>&copy; 2026 Bill Parrott. Free and open source under the MIT license. Nothing on this site tracks you.</p>
      <a class="btn btn--small" href="#top">Back to the top</a>
    </div>
  </div>
</footer>"""


TUTORIALS = [
    ("Getting going", [
        ("First run", "Create your household and the admin account on the first visit.", 4),
        ("Import the LEGO catalog", "Load Rebrickable's catalog by pasting its downloads page, and learn why the button then rests for 48 hours.", 7),
        ("Add your first set", "Three ways in: search the catalog, scan a barcode, or type in an off-brand set by hand.", 6),
    ]),
    ("Day to day", [
        ("Track several copies and change build state", "Give each box its own place, owner and price, then move it from sealed to built with one tap.", 5),
        ("Record missing pieces and work the shopping list", "Log the parts a copy is short of, then take the list to the store or export it.", 7),
        ("Attach instructions", "Upload a PDF, save a link, or have Brick Bin save a PDF from a web address.", 4),
    ]),
    ("The household", [
        ("Set up a kid profile", "A read-only profile with no prices and no shopping list, and sets you can hide from it.", 5),
        ("Run a wishlist", "Private \"I bought this\" marks, and \"We got it\" when the box arrives.", 6),
    ]),
    ("Bigger jobs", [
        ("Import from CSV", "Bring in a Rebrickable set list, a Brickset export or any spreadsheet.", 6),
        ("Check collection value", "Totals, paid against estimated value, and the values that have gone stale.", 4),
    ]),
]
MOCKED = "Import the LEGO catalog"
DOCS = [("setup", "Setup", "docs-setup.html"), ("hosting", "Hosting", "docs-hosting.html"), ("config", "Configuration", "docs-configuration.html")]


def tut_href(name):
    return "tutorial-import-catalog.html" if name == MOCKED else "#not-mocked"


def tut_sidenav(current):
    out = ""
    n = 0
    for group, items in TUTORIALS:
        out += f"<h2>{group}</h2><ul>"
        for name, _, _ in items:
            n += 1
            out += f'<li><a href="{tut_href(name)}"{cur(name == current)}><span class="num">{n:02d}</span>{name}</a></li>'
        out += "</ul>"
    return out


def tut_index():
    out = ""
    n = 0
    for group, items in TUTORIALS:
        gid = re.sub(r"[^a-z]+", "-", group.lower())
        out += f'<section class="tutgroup" aria-labeledby="{gid}"><h2 id="{gid}">{group}</h2><ul class="tutlist">'
        for name, summary, steps in items:
            n += 1
            out += f'<li><a href="{tut_href(name)}"><span class="n">{n}</span><b>{name}</b><span>{summary}</span><small>{steps} steps</small></a></li>'
        out += "</ul></section>"
    return out


def docs_sidenav(section):
    out = "<h2>Documentation</h2><ul>"
    for k, name, href in DOCS:
        out += f'<li><a class="sec-{k}" href="{href}"{cur(k == section)}><span class="b1"></span>{name}</a></li>'
    out += '</ul><h2>Elsewhere</h2><ul><li><a class="sec-tutorials" href="tutorials.html"><span class="b1"></span>Tutorials</a></li><li><a class="sec-faq" href="faq.html"><span class="b1"></span>FAQ</a></li></ul>'
    return out


def doctabs(section):
    out = '<nav aria-label="Documentation sections"><ul class="doctabs">'
    for k, name, href in DOCS:
        out += f'<li><a class="sec-{k}" href="{href}"{cur(k == section)}><span class="b1"></span>{name}</a></li>'
    return out + "</ul></nav>"


def toc_items(toc):
    return "".join(f'<li><a href="#{i}"><span class="b1"></span>{t}</a></li>' for i, t in toc)


def tokens(body, meta):
    sec = meta.get("section", "")
    toc = meta.get("toc", [])
    cur_t = meta.get("tutorial", "")
    if "{SIDENAV}" in body:
        if sec == "tutorials":
            nav = f'<nav class="sidenav" aria-label="Tutorials">{tut_sidenav(cur_t)}</nav>'
            n = [name for _, items in TUTORIALS for name, _, _ in items].index(cur_t) + 1
            phone = f'<details class="tutnav" data-param="tutnav"><summary>Tutorial {n} of 10 · all tutorials</summary><nav class="sidenav" aria-label="Tutorials">{tut_sidenav(cur_t)}</nav></details>'
        else:
            nav = f'<nav class="sidenav" aria-label="Documentation">{docs_sidenav(sec)}</nav>'
            phone = doctabs(sec)
        body = body.replace("{SIDENAV}", nav).replace("{PHONENAV}", phone)
    body = body.replace("{TOC}", f'<details class="toc" data-param="toc"><summary>On this page</summary><nav aria-label="On this page"><ul>{toc_items(toc)}</ul></nav></details>')
    body = body.replace("{TOCDESK}", f'<aside class="toc__desk"><nav class="toc" aria-label="On this page"><h2>On this page</h2><ul>{toc_items(toc)}</ul></nav></aside>')
    body = body.replace("{TUTINDEX}", tut_index())
    for k in ICONS:
        body = body.replace("{I_" + k.upper() + "}", ICONS[k])
    return body


shots = []


def shot(m, page):
    d = json.loads(m.group(1))
    d["page"] = page
    kind = d.get("kind", "desktop")
    slug = re.sub(r"[^a-z0-9]+", "-", d["title"].lower()).strip("-")
    d["file"] = f'{d["id"].lower()}-{slug}'
    shots.append(d)
    cls = {"desktop": "", "phone": " shot--phone", "crop": " shot--crop"}[kind]
    shape = {"desktop": "desktop · 16:10", "phone": "phone · 9:19.5", "crop": "phone · 4:5 crop"}[kind]
    e = html.escape
    return f"""<figure class="shot{cls}">
  <div class="shot__frame">
    <div class="shot__art baseplate" role="img" aria-label="{e(d['alt'])}"></div>
    <div class="shot__label"><b>{d['id']}</b><strong>{e(d['title'])}</strong>{shape} · {d['theme']}</div>
    <div class="shot__notes" role="group" aria-label="Shot notes for {d['id']}" tabindex="0">
      <b>{d['id']} · {e(d['title'])}</b>
      <dl>
        <div><dt>Screen</dt><dd>{e(d['screen'])}</dd></div>
        <div><dt>State</dt><dd>{e(d['state'])}</dd></div>
        <div><dt>Viewport and theme</dt><dd>{e(d['view'])}</dd></div>
        <div><dt>Focus</dt><dd>{e(d['focus'])}</dd></div>
      </dl>
    </div>
  </div>
</figure>"""


def build():
    for src in sorted(SRC.glob("*.html")):
        text = src.read_text(encoding="utf-8")
        first, body = text.split("\n", 1)
        meta = json.loads(first)
        body = re.sub(r"^@shot (\{.*\})$", lambda m: shot(m, src.name), body, flags=re.M)
        body = tokens(body, meta).replace("{REPO}", REPO)
        page = f"""<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{meta['title']}</title>
<meta name="description" content="{html.escape(meta['description'])}">
<link rel="icon" href="assets/svg/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/AlbertSans-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<script>
/* Set the saved theme before first paint. No attribute means "System". */
(function(){{var d=document.documentElement,p=new URLSearchParams(location.search);if(p.get("nojs"))return;d.classList.remove("no-js");try{{var q=p.get("theme"),t=q||localStorage.getItem("bb-theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}}catch(e){{}}}})();
</script>
</head>
<body id="top" data-section="{meta.get('section', '')}">
{header(meta)}
<main id="main">
{body.strip()}
</main>
{footer()}
<script src="assets/js/site.js"></script>
</body>
</html>
"""
        (ROOT / src.name).write_text(page, encoding="utf-8", newline="\n")
        print("built", src.name)
    write_placeholders()


def write_placeholders():
    planned = (SRC / "planned-shots.md").read_text(encoding="utf-8")
    rows = ""
    for d in shots:
        kind = {"desktop": "16:10", "phone": "9:19.5", "crop": "4:5"}[d.get("kind", "desktop")]
        rows += (
            f"### {d['id']}: {d['title']}\n\n"
            f"- **Used on:** `{d['page']}`\n"
            f"- **Files:** `{d['file']}.light.png`, `{d['file']}.dark.png` (ratio {kind}; first choice for this spot: {d['theme']})\n"
            f"- **Screen:** {d['screen']}\n- **State:** {d['state']}\n"
            f"- **Viewport and theme:** {d['view']}\n- **Focus:** {d['focus']}\n"
            f"- **Alt text:** {d['alt']}\n\n"
        )
    head = (SRC / "placeholders-head.md").read_text(encoding="utf-8")
    (ROOT / "PLACEHOLDERS.md").write_text(head + rows + planned, encoding="utf-8", newline="\n")
    print("wrote PLACEHOLDERS.md with", len(shots), "placeholders")


if __name__ == "__main__":
    build()
