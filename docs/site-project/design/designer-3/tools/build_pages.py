"""Stamp the shared header, menu, docs navigation and footer around each page body.

The mockups in ../mockups/ are the deliverable: plain static HTML that opens by double-clicking.
This script only exists so the shared chrome stays identical on every page. Edit a body in
tools/pages/, then run:  python tools/build_pages.py
"""
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "mockups"
REPO = "https://github.com/chimericdream/brick-bin"
ISSUES = REPO + "/issues"
LICENCE = REPO + "/blob/main/LICENSE"

ICON = {
    "system": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>',
    "light": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    "dark": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    "menu": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25"><path d="M3 7h18M3 12h18M3 17h18"/></svg>',
    "close": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    "chev": '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25"><path d="M6 9l6 6 6-6"/></svg>',
}

MARK = ('<svg class="logo__mark" viewBox="0 0 96 70" aria-hidden="true"><g fill="currentColor">'
        '<path d="M11 0h28v10H11zM57 0h28v10H57z"/>'
        '<path fill-rule="evenodd" d="M6 10h84a4 4 0 0 1 4 4v52a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4zm16 20v20h52V30z"/></g></svg>')
WORD = ('<svg viewBox="0 0 495 90" aria-hidden="true"><g fill="currentColor">'
        '<path fill-rule="evenodd" d="M0 0H18V30H36A30 30 0 0 1 66 60A30 30 0 0 1 36 90H0ZM18 48V72H36A12 12 0 0 0 48 60A12 12 0 0 0 36 48Z"/>'
        '<path d="M76 90V60A30 30 0 0 1 106 30H124V48H106A12 12 0 0 0 94 60V90Z"/>'
        '<path d="M134 30H152V90H134ZM134 10H152V22H134Z"/>'
        '<path d="M222 30V48H192A12 12 0 0 0 180 60A12 12 0 0 0 192 72H222V90H192A30 30 0 0 1 162 60A30 30 0 0 1 192 30Z"/>'
        '<path d="M232 0H250V90H232ZM250 51L274 30H301L250 74ZM256 64L270 52L297 90H275Z"/>'
        '<path fill-rule="evenodd" d="M331 0H349V30H367A30 30 0 0 1 397 60A30 30 0 0 1 367 90H331ZM349 48V72H367A12 12 0 0 0 379 60A12 12 0 0 0 367 48Z"/>'
        '<path d="M407 30H425V90H407ZM407 10H425V22H407Z"/>'
        '<path d="M435 90V30H465A30 30 0 0 1 495 60V90H477V60A12 12 0 0 0 465 48H453V90Z"/></g></svg>')
LOGO = f'<a class="logo" href="index.html">{MARK}{WORD}<span class="vh">Brick Bin, home</span></a>'

SECTIONS = [  # key, label, file, short description
    ("tutorials", "Tutorials", "tutorials.html", "Ten walk-throughs"),
    ("setup", "Setup", "docs-setup.html", "Start here"),
    ("hosting", "Hosting", "docs-hosting.html", "Proxmox, Tailscale, backups"),
    ("config", "Configuration", "docs-configuration.html", "Every setting"),
    ("faq", "FAQ", "faq.html", "Short answers"),
]

TUTORIALS = [  # group, [(title, file-or-None, steps, summary)]
    ("Getting started", [
        ("First run", None, 4, "Create your household and the admin account on the first visit."),
        ("Import the LEGO catalog", "tutorial-import-catalog.html", 7, "Paste Rebrickable's downloads page, press the button, and learn why it rests for 48 hours."),
        ("Add your first set", None, 6, "Three ways in: search the catalog, scan a barcode, or type in an off-brand set by hand."),
    ]),
    ("Day to day", [
        ("Track several copies and change build state", None, 5, "Give each box its own place, owner and price, then move it from sealed to built with one tap."),
        ("Record missing pieces and work the shopping list", None, 7, "Log the parts a copy is short of, then take the list to the shop or export it."),
        ("Attach instructions", None, 4, "Upload a PDF, save a link, or have Brick Bin save a PDF from a web address."),
    ]),
    ("The household", [
        ("Set up a kid profile", None, 5, "A read-only profile with no prices and no shopping list, and how to hide a set completely."),
        ("Run a wishlist", None, 6, "Private “I bought this” marks that only the buyer sees, and “We got it” for when the box arrives."),
    ]),
    ("Bigger jobs", [
        ("Import from CSV", None, 6, "Bring in a Rebrickable set list, a Brickset export, or the spreadsheet you've kept for years."),
        ("Check collection value", None, 4, "Read the totals, compare paid with estimated value, and find the values that have gone stale."),
    ]),
]


def theme_toggle(words=False, ident=""):
    cls = "theme theme--words" if words else "theme"
    out = [f'<div class="{cls}" role="group" aria-label="Colour theme{ident}">']
    for key, label in (("auto", "System"), ("light", "Light"), ("dark", "Dark")):
        if words:
            out.append(f'<button type="button" data-theme-choice="{key}" aria-pressed="false">{ICON["system" if key == "auto" else key]}{label}</button>')
        else:
            out.append(f'<button type="button" data-theme-choice="{key}" aria-pressed="false" title="{label} theme">{ICON["system" if key == "auto" else key]}<span class="vh">{label}</span></button>')
    out.append("</div>")
    return "".join(out)


def header(meta):
    cur = meta.get("nav")  # tutorials | docs | faq | None
    sec = meta.get("section", "none")
    docs_sec = sec if sec in ("setup", "hosting", "config") else "setup"
    items = [("Tutorials", "tutorials.html", "tutorials", "tutorials"),
             ("Docs", "docs-setup.html", "docs", docs_sec),
             ("FAQ", "faq.html", "faq", "faq")]
    lis = []
    for label, href, key, colour in items:
        ac = ' aria-current="page"' if cur == key else ""
        lis.append(f'<li><a href="{href}" data-section="{colour}"{ac}>{label}</a></li>')
    lis.append(f'<li><a href="{REPO}">Source code</a></li>')
    menu_bricks = []
    for key, label, href, desc in SECTIONS:
        ac = ' aria-current="page"' if sec == key and meta.get("file") == href else ""
        menu_bricks.append(f'<li><a class="menu-brick studs" data-section="{key}" href="{href}"{ac}>{label}<small>{desc}</small></a></li>')
    return f"""<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap site-header__bar">
    {LOGO}
    <nav class="site-nav" aria-label="Main"><ul>{''.join(lis)}</ul></nav>
    <div class="header-tools">
      {theme_toggle(False)}
      <a class="btn btn--small studs" href="docs-setup.html">Set it up</a>
    </div>
    <button class="menu-btn" type="button" data-menu-open aria-expanded="false" aria-controls="menu">Menu {ICON['menu']}</button>
  </div>
</header>
<div class="menu-sheet" id="menu" hidden>
  <div class="menu-sheet__scrim"></div>
  <div class="menu-sheet__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="menu-sheet__top">{LOGO}<button class="menu-btn" type="button" data-menu-close>Close {ICON['close']}</button></div>
    <nav aria-label="Sections"><ul class="menu-sheet__list">{''.join(menu_bricks)}</ul></nav>
    <ul class="menu-sheet__links">
      <li><a href="index.html">Home</a></li>
      <li><a href="{REPO}">Source code on GitHub</a></li>
      <li><a href="{ISSUES}">Report a problem</a></li>
    </ul>
    <div class="menu-sheet__theme"><h2>Theme</h2>{theme_toggle(True, ', menu')}</div>
  </div>
</div>"""


def footer():
    wall = "".join(
        f'<span class="studs" data-section="{s}">{ch}</span>' if ch != " " else '<span class="wall__gap"></span>'
        for ch, s in zip("BRICK BIN", ["tutorials", "setup", "hosting", "config", "faq", "", "hosting", "tutorials", "setup"])
    ).replace('<span class="studs" data-section="hosting">B</span><span class="studs" data-section="tutorials">I</span><span class="studs" data-section="setup">N</span>',
              '<span class="studs bin" data-section="hosting">B</span><span class="studs bin" data-section="tutorials">I</span><span class="studs bin" data-section="setup">N</span>')
    return f"""<footer class="site-footer field-zone">
  <div class="wrap">
    <div class="wall" aria-hidden="true">{wall}</div>
    <div class="footer__grid">
      <nav aria-labelledby="f-learn"><h2 id="f-learn">Learn</h2><ul><li><a href="tutorials.html">Tutorials</a></li><li><a href="tutorial-import-catalog.html">Import the catalog</a></li><li><a href="faq.html">FAQ</a></li></ul></nav>
      <nav aria-labelledby="f-docs"><h2 id="f-docs">Docs</h2><ul><li><a href="docs-setup.html">Setup</a></li><li><a href="docs-hosting.html">Hosting</a></li><li><a href="docs-configuration.html">Configuration</a></li></ul></nav>
      <nav aria-labelledby="f-proj"><h2 id="f-proj">Project</h2><ul><li><a href="{REPO}">Source code</a></li><li><a href="{ISSUES}">Report a problem</a></li><li><a href="{LICENCE}">MIT licence</a></li></ul></nav>
      <div class="footer__theme"><h2>Theme</h2>{theme_toggle(True, ', footer')}</div>
      <div class="footer__about">
        <p>Catalog data comes from <a href="https://rebrickable.com">Rebrickable</a>, imported by you onto your own server. Thank you, Rebrickable.</p>
        <p>Brick Bin is an independent project. It is not affiliated with, sponsored or endorsed by the LEGO Group or any other brick maker. LEGO is a trademark of the LEGO Group.</p>
      </div>
    </div>
    <div class="footer__base">
      <p>&copy; 2026 Bill Parrott. Free and open source under the MIT licence. Nothing on this site tracks you.</p>
      <a class="btn btn--quiet btn--small studs" href="#top">Back to top <span aria-hidden="true">&uarr;</span></a>
    </div>
  </div>
</footer>"""


def docs_nav(kind, meta):
    file = meta["file"]
    if kind == "tutorials":
        parts = []
        for group, items in TUTORIALS:
            parts.append(f"<h2>{group}</h2><ul>")
            for title, href, steps, _ in items:
                ac = ' aria-current="page"' if href == file else ""
                parts.append(f'<li><a class="studs" data-section="tutorials" href="{href or "#not-mocked"}"{ac}>{title}</a></li>')
            parts.append("</ul>")
        return "".join(parts)
    parts = ["<h2>Docs</h2><ul>"]
    for key, label, href, _ in SECTIONS[1:4]:
        ac = ' aria-current="page"' if href == file else ""
        parts.append(f'<li><a class="studs" data-section="{key}" href="{href}"{ac}><span class="b1" aria-hidden="true"></span>{label}</a></li>')
    parts.append("</ul><h2>Also</h2><ul>")
    for key, label, href, _ in (SECTIONS[0], SECTIONS[4]):
        parts.append(f'<li><a data-section="{key}" href="{href}"><span class="b1" aria-hidden="true"></span>{label}</a></li>')
    parts.append("</ul>")
    return "".join(parts)


def toc_lists(meta):
    items = meta.get("toc", [])
    desk = "".join(f'<li><a href="#{i}"{" aria-current=\"true\"" if n == 0 else ""}><span class="b1" aria-hidden="true"></span>{l}</a></li>' for n, (i, l) in enumerate(items))
    mob = "".join(f'<li><a href="#{i}">{l}</a></li>' for i, l in items)
    return desk, mob


def page(meta, body):
    title = meta["title"]
    sec = meta.get("section", "none")
    layout = meta.get("layout", "plain")
    if layout in ("docs", "tutorial"):
        kind = "tutorials" if layout == "tutorial" else "docs"
        nav = docs_nav(kind, meta)
        desk, mob = toc_lists(meta)
        current_label = meta.get("crumb", title)
        bar_label = "Tutorials" if kind == "tutorials" else "Docs"
        toc_mobile = (f'<details class="toc-mobile"><summary>On this page {ICON["chev"]}</summary><ul>{mob}</ul></details>' if mob else "")
        body = body.replace("<!--TOC-MOBILE-->", toc_mobile)
        side_label = "Tutorials" if kind == "tutorials" else "Documentation"
        main = f"""<div class="wrap docs" data-section="{sec}">
  <aside class="docs__side" aria-label="{side_label}"><nav class="docs-nav" aria-label="{side_label}">{nav}</nav></aside>
  <main class="docs__main" id="main">
    <div class="docs-bar">
      <button class="docs-bar__btn" type="button" data-docs-toggle aria-expanded="false" aria-controls="docs-panel"><span class="b1" aria-hidden="true"></span><b>{bar_label}</b><span class="where">{current_label}</span>{ICON['chev']}</button>
      <div class="docs-bar__panel" id="docs-panel"><nav class="docs-nav" aria-label="{side_label}, phone">{nav}</nav></div>
    </div>
    {body}
  </main>
  {f'<aside class="docs__toc" aria-label="On this page"><nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ul>{desk}</ul></nav></aside>' if desk else ''}
</div>"""
    else:
        main = f'<main id="main" data-section="{sec}">\n{body}\n</main>'
    return f"""<!doctype html>
<html lang="en" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{meta.get('desc', '')}">
<link rel="icon" href="assets/svg/favicon.svg" type="image/svg+xml">
<script>(function(){{var c="auto";try{{c=localStorage.getItem("bb-color-scheme")||"auto"}}catch(e){{}}var q=new URLSearchParams(location.search).get("theme");if(q)c=q;var d=c==="auto"?(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):c;document.documentElement.setAttribute("data-mantine-color-scheme",d)}})();</script>
<link rel="preload" href="assets/fonts/AlbertSans-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
{header(meta)}
{main}
{footer()}
<script src="assets/js/site.js"></script>
</body>
</html>
"""


def main():
    for src in sorted((HERE / "pages").glob("*.html")):
        text = src.read_text(encoding="utf-8")
        m = re.match(r"<!--meta\s*(\{.*?\})\s*-->\s*", text, re.S)
        meta = json.loads(m.group(1))
        body = text[m.end():]
        meta.setdefault("file", src.name)
        (OUT / meta["file"]).write_text(page(meta, body), encoding="utf-8", newline="\n")
        print("wrote", meta["file"])


if __name__ == "__main__":
    main()
