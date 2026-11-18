// Takes every screenshot with ONE headless Edge instance, one tab, one shot at a time.
// Usage (from the package root):  node tools/shoot.mjs <profile-dir> [filter]
// The browser is started once, driven over the DevTools protocol, and closed at the end.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "screenshots");
const PROFILE = process.argv[2];
const FILTER = process.argv[3] || "";
if (!PROFILE) throw new Error("pass a temp profile directory");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9377;
mkdirSync(OUT, { recursive: true });

// ---- the job list ----
const jobs = [];
const add = (name, page, o = {}) => jobs.push({ name, page, w: 1440, h: 900, theme: "light", full: true, ...o });
const pages = {
  landing: "index.html",
  tutorials: "tutorials.html",
  tutorial: "tutorial-import-catalog.html",
  "docs-setup": "docs-setup.html",
  "docs-hosting": "docs-hosting.html",
  "docs-configuration": "docs-configuration.html",
  faq: "faq.html",
  404: "404.html",
  states: "states.html",
};
for (const [name, page] of Object.entries(pages)) {
  for (const w of [390, 1440]) for (const theme of ["light", "dark"]) add(`${name}-${w}-${theme}`, page, { w, h: w === 390 ? 844 : 900, theme });
}
for (const w of [360, 768, 1024]) {
  add(`landing-${w}-light`, "index.html", { w, h: 900 });
  add(`docs-configuration-${w}-light`, "docs-configuration.html", { w, h: 900 });
}
add("docs-setup-768-light", "docs-setup.html", { w: 768 });
add("docs-setup-1024-light", "docs-setup.html", { w: 1024 });
add("tutorial-768-light", "tutorial-import-catalog.html", { w: 768 });
add("tutorials-768-light", "tutorials.html", { w: 768 });
// states, viewport only
for (const theme of ["light", "dark"]) {
  add(`state-menu-open-390-${theme}`, "index.html", { w: 390, h: 844, theme, full: false, q: "menu=open" });
  add(`state-docs-nav-phone-390-${theme}`, "docs-hosting.html", { w: 390, h: 844, theme, full: false, q: "toc=open" });
  add(`state-docs-nav-desktop-1440-${theme}`, "docs-hosting.html", { w: 1440, h: 900, theme, full: false, scroll: "#storage" });
  add(`state-tutorial-nav-phone-390-${theme}`, "tutorial-import-catalog.html", { w: 390, h: 844, theme, full: false, q: "tutnav=open" });
}
add("state-docs-nav-tablet-768-light", "docs-setup.html", { w: 768, h: 1024, full: false });
add("state-docs-nav-1024-light", "docs-setup.html", { w: 1024, h: 768, full: false });
for (const s of ["sealed", "opened", "progress", "built", "apart", "mixed"]) {
  add(`state-hero-${s}-1440-${s === "sealed" || s === "mixed" ? "dark" : "light"}`, "index.html", { full: false, q: `state=${s}`, theme: s === "sealed" || s === "mixed" ? "dark" : "light", wait: 900 });
}
add("state-hero-mixed-390-light", "index.html", { w: 390, h: 844, full: false, q: "state=mixed", wait: 900, scroll: ".toy" });
// theme toggle: header crops
const clipHeader = { x: 900, y: 0, width: 540, height: 80 };
add("state-theme-toggle-system-light-device", "index.html", { theme: "system", scheme: "light", full: false, clip: clipHeader });
add("state-theme-toggle-system-dark-device", "index.html", { theme: "system", scheme: "dark", full: false, clip: clipHeader });
add("state-theme-toggle-light", "index.html", { theme: "light", scheme: "dark", full: false, clip: clipHeader });
add("state-theme-toggle-dark", "index.html", { theme: "dark", scheme: "light", full: false, clip: clipHeader });
// real pointer and keyboard states
add("state-hover-primary-button-1440-light", "index.html", { full: false, hover: ".hero .btn", clip: { x: 0, y: 0, width: 1440, height: 760 } });
add("state-focus-keyboard-1440-light", "index.html", { full: false, tabs: 6, clip: { x: 0, y: 0, width: 1440, height: 760 } });
add("state-hover-tutorial-row-1440-light", "tutorials.html", { full: false, hover: ".tutlist li:nth-child(2) a" });
add("state-hover-stack-brick-1440-dark", "index.html", { theme: "dark", full: false, scroll: ".stack", hover: ".stack li:nth-child(3) a" });
add("state-config-row-target-1440-light", "docs-configuration.html", { full: false, hash: "COOKIE_SECURE" });
add("state-focus-docs-nav-1440-dark", "docs-hosting.html", { theme: "dark", full: false, tabs: 12 });

// ---- the browser ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(
  EDGE,
  ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync", "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank"],
  { stdio: "ignore" }
);
const exited = new Promise((r) => child.on("exit", r));
const guard = setTimeout(() => {
  console.error("timeout: killing the browser");
  child.kill();
  process.exit(2);
}, 9 * 60 * 1000);

let target;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(250);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
}
if (!target) {
  child.kill();
  throw new Error("browser did not start");
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
const waiters = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  } else if (m.method) {
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === m.method) waiters.splice(i, 1)[0].resolve(m.params);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, (m) => (m.error ? reject(new Error(method + ": " + m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

await send("Page.enable");
await send("Runtime.enable");
const problems = [];
let done = 0;
for (const j of jobs) {
  if (FILTER && !j.name.includes(FILTER)) continue;
  await send("Emulation.setDeviceMetricsOverride", { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: j.w < 700 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: j.scheme || "light" }] });
  const q = [`theme=${j.theme}`, j.q].filter(Boolean).join("&");
  const url = pathToFileURL(path.join(ROOT, j.page)).href + "?" + q + (j.hash ? "#" + j.hash : "");
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  await evaluate(`document.fonts.ready.then(() => new Promise((r) => setTimeout(r, ${j.wait || 200})))`);
  const over = await evaluate("document.documentElement.scrollWidth - window.innerWidth");
  if (over > 0) problems.push(`${j.name}: page is ${over}px wider than the viewport`);
  if (j.full) {
    const height = await evaluate("Math.ceil(document.documentElement.scrollHeight)");
    await send("Emulation.setDeviceMetricsOverride", { width: j.w, height, deviceScaleFactor: 1, mobile: j.w < 700 });
    await sleep(120);
  }
  if (j.scroll) {
    await evaluate(`(document.querySelector(${JSON.stringify(j.scroll)}).scrollIntoView({block:"start",behavior:"instant"}), window.scrollBy(0,-24), new Promise((r) => setTimeout(r, 300)))`);
  }
  if (j.hover) {
    const p = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(j.hover)}).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p[0], y: p[1] });
    await sleep(400);
  }
  if (j.focus) {
    await evaluate(`document.querySelector(${JSON.stringify(j.focus)}).focus({focusVisible:true})`);
    await sleep(150);
  }
  for (let i = 0; i < (j.tabs || 0); i++) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await sleep(60);
  }
  const shot = await send("Page.captureScreenshot", { format: "png", ...(j.clip ? { clip: { ...j.clip, scale: 1 } } : {}) });
  writeFileSync(path.join(OUT, j.name + ".png"), Buffer.from(shot.data, "base64"));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 0, y: 0 });
  done++;
}
console.log(`${done} screenshots`);
console.log(problems.length ? "PROBLEMS:\n" + problems.join("\n") : "no horizontal overflow at any capture");

await send("Browser.close").catch(() => {});
ws.close();
await Promise.race([exited, sleep(8000)]);
if (child.exitCode === null) child.kill();
clearTimeout(guard);
await sleep(500);
try {
  rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
} catch (e) {
  console.error("could not delete profile:", e.message);
}
console.log("browser exit code:", child.exitCode, "| profile removed");
