// Screenshots for the mockups. Starts ONE headless Edge, drives it over the DevTools protocol,
// takes every shot in sequence, then closes it and waits for it to exit.
// Usage: node tools/shoot.mjs [filter] [--out=dir]
// Needs Node 22+ (global WebSocket) and Microsoft Edge. Nothing is downloaded.
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const HERE = resolve(import.meta.dirname);
const SITE = resolve(HERE, "..", "mockups");
const args = process.argv.slice(2);
const filter = args.find((a) => !a.startsWith("--")) || "";
const outArg = args.find((a) => a.startsWith("--out="));
const OUT = outArg ? resolve(outArg.slice(6)) : resolve(HERE, "..", "screenshots");
const PROFILE = process.env.BB_PROFILE || join(tmpdir(), "bb-d3-edge-profile");
const EDGE = process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9337;

const pages = ["index", "tutorials", "tutorial-import-catalog", "docs-setup", "docs-hosting", "docs-configuration", "faq", "404", "states"];
const shots = [];
for (const p of pages) {
  for (const w of [390, 1440]) for (const t of ["light", "dark"]) shots.push({ name: `${p}-${w}-${t}`, page: p, w, theme: t, full: true });
}
for (const w of [360, 768, 1024]) shots.push({ name: `index-${w}-light`, page: "index", w, theme: "light", full: true });
for (const w of [360, 768, 1024]) shots.push({ name: `docs-configuration-${w}-light`, page: "docs-configuration", w, theme: "light", full: true });
shots.push({ name: `tutorial-import-catalog-768-light`, page: "tutorial-import-catalog", w: 768, theme: "light", full: true });
shots.push({ name: `docs-setup-1024-light`, page: "docs-setup", w: 1024, theme: "light", full: true });
for (const t of ["light", "dark"]) {
  shots.push({ name: `state-menu-open-390-${t}`, page: "index", w: 390, theme: t, q: "menu=open" });
  shots.push({ name: `state-docs-nav-open-390-${t}`, page: "docs-hosting", w: 390, theme: t, q: "docs=open" });
  shots.push({ name: `state-docs-nav-desktop-1440-${t}`, page: "docs-configuration", w: 1440, theme: t, scrollTo: "#storage" });
}
shots.push({ name: `state-on-this-page-open-390-light`, page: "docs-configuration", w: 390, theme: "light", q: "toc=open" });
shots.push({ name: `state-header-1440-light`, page: "docs-setup", w: 1440, h: 120, theme: "light" });
shots.push({ name: `state-header-1440-dark`, page: "docs-setup", w: 1440, h: 120, theme: "dark" });
shots.push({ name: `state-build-state-mixed-390-light`, page: "index", w: 390, theme: "light", click: "#bs-mixed", scrollTo: ".showcase" });
shots.push({ name: `state-build-state-sealed-1440-dark`, page: "index", w: 1440, theme: "dark", click: "#bs-sealed", scrollTo: ".showcase" });
shots.push({ name: `state-tutorial-row-hover-1440-light`, page: "tutorials", w: 1440, theme: "light", hover: ".tut-row:nth-child(2) h3 a" });
shots.push({ name: `state-stack-hover-1440-light`, page: "index", w: 1440, theme: "light", hover: ".stack li:nth-child(3) a" });
shots.push({ name: `state-focus-tab-1440-light`, page: "index", w: 1440, theme: "light", tabs: 3 });

const todo = shots.filter((s) => filter.split(",").some((f) => s.name.includes(f)));
mkdirSync(OUT, { recursive: true });
rmSync(PROFILE, { recursive: true, force: true });

const edge = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars",
  "--disable-background-networking", "--disable-sync", "--disable-gpu", "about:blank",
], { stdio: "ignore" });
let edgeExited = false;
edge.on("exit", () => { edgeExited = true; });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(path) {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}${path}`); if (r.ok) return await r.json(); } catch {}
    await sleep(150);
  }
  throw new Error("Edge did not open its debugging port");
}

let ws; let id = 0; const waiting = new Map(); const listeners = [];
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const n = ++id; waiting.set(n, { res, rej });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
function once(method) { return new Promise((res) => listeners.push({ method, res })); }

const report = [];
try {
  const list = await getJSON("/json/list");
  const pageT = list.find((t) => t.type === "page");
  ws = new WebSocket(pageT.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { const w = waiting.get(m.id); waiting.delete(m.id); m.error ? w.rej(new Error(m.error.message)) : w.res(m.result); }
    else if (m.method) { for (let i = listeners.length - 1; i >= 0; i--) if (listeners[i].method === m.method) { listeners[i].res(m.params); listeners.splice(i, 1); } }
  };
  await send("Page.enable");
  await send("Runtime.enable");

  for (const s of todo) {
    const h = s.h || (s.w < 768 ? 844 : 900);
    await send("Emulation.setDeviceMetricsOverride", { width: s.w, height: h, deviceScaleFactor: 1, mobile: s.w < 768 });
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: s.theme }, { name: "prefers-reduced-motion", value: "reduce" }] });
    const url = pathToFileURL(join(SITE, `${s.page}.html`)).href + `?theme=${s.theme}` + (s.q ? `&${s.q}` : "");
    const loaded = once("Page.loadEventFired");
    await send("Page.navigate", { url });
    await loaded;
    await send("Runtime.evaluate", { expression: "document.fonts.ready.then(()=>true)", awaitPromise: true });
    if (s.click) await send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(s.click)}).click()` });
    if (s.scrollTo) await send("Runtime.evaluate", { expression: `(()=>{const e=document.querySelector(${JSON.stringify(s.scrollTo)});window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 80)})()` });
    if (s.hover) {
      const r = await send("Runtime.evaluate", { expression: `(()=>{const e=document.querySelector(${JSON.stringify(s.hover)});e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return JSON.stringify([b.x+b.width/2,b.y+b.height/2])})()`, returnByValue: true });
      const [x, y] = JSON.parse(r.result.value);
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    }
    if (s.tabs) for (let i = 0; i < s.tabs; i++) { await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); }
    await sleep(250);
    const m = await send("Runtime.evaluate", { expression: "JSON.stringify({sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight})", returnByValue: true });
    const { sw, iw, sh } = JSON.parse(m.result.value);
    if (process.env.BB_EVAL) { const e = await send("Runtime.evaluate", { expression: process.env.BB_EVAL, returnByValue: true }); console.log("eval:", JSON.stringify(e.result.value)); }
    let clip;
    if (s.full) {
      let full = sh;
      for (let k = 0; k < 4; k++) {
        await send("Emulation.setDeviceMetricsOverride", { width: s.w, height: full, deviceScaleFactor: 1, mobile: s.w < 768 });
        await sleep(200);
        const r2 = await send("Runtime.evaluate", { expression: "Math.ceil(document.body.getBoundingClientRect().height)", returnByValue: true });
        if (r2.result.value === full) break;
        full = r2.result.value;
      }
      clip = { x: 0, y: 0, width: s.w, height: full, scale: 1 };
    }
    const shot = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip, captureBeyondViewport: false } : {}) });
    writeFileSync(join(OUT, `${s.name}.png`), Buffer.from(shot.data, "base64"));
    const overflow = sw > iw;
    report.push(`${s.name}  ${s.w}x${clip ? clip.height : h}${overflow ? "  HORIZONTAL OVERFLOW " + sw : ""}`);
    console.log(report[report.length - 1]);
  }
} finally {
  try { await send("Browser.close"); } catch {}
  try { ws && ws.close(); } catch {}
  for (let i = 0; i < 50 && !edgeExited; i++) await sleep(100);
  if (!edgeExited) { edge.kill(); for (let i = 0; i < 30 && !edgeExited; i++) await sleep(100); }
  console.log(edgeExited ? "Edge exited." : "WARNING: Edge still running, pid " + edge.pid);
  await sleep(500);
  try { rmSync(PROFILE, { recursive: true, force: true }); console.log("Profile removed:", !existsSync(PROFILE)); } catch (e) { console.log("Profile not removed yet:", e.message); }
}
