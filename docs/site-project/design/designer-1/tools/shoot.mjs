// Takes the PNG screenshots in ../screenshots with headless Edge or Chrome over the DevTools protocol.
// No dependencies. Run: node tools/shoot.mjs [filter]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(root, "screenshots");
mkdirSync(out, { recursive: true });

const browser = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => existsSync(p));
if (!browser) throw new Error("No Edge or Chrome found");

// [file, width, theme, query, viewportOnly, suffix]
const S = [];
const add = (file, widths, themes, query = "", viewportOnly = false, suffix = "") => {
  for (const w of widths) for (const t of themes) S.push({ file, w, t, query, viewportOnly, suffix });
};
add("index.html", [360, 390, 768, 1024, 1440], ["light"]);
add("index.html", [390, 1440], ["dark"]);
add("index.html", [390, 1440], ["light"], "state=apart", true, "hero-disassembled");
add("index.html", [1440], ["dark"], "state=sealed", true, "hero-sealed");
for (const f of ["tutorials.html", "docs-setup.html", "docs-hosting.html", "faq.html", "404.html"]) add(f, [390, 1440], ["light"]);
add("tutorial-import-catalog.html", [390, 768, 1440], ["light"]);
add("tutorial-import-catalog.html", [390, 1440], ["dark"]);
add("docs-configuration.html", [360, 390, 768, 1024, 1440], ["light"]);
add("docs-configuration.html", [390, 1440], ["dark"]);
add("404.html", [390, 1440], ["dark"]);
add("index.html", [390], ["light", "dark"], "menu=open", true, "menu-open");
add("docs-setup.html", [390], ["light"], "docsnav=open", true, "docs-nav-open");
add("docs-setup.html", [390], ["light"], "toc=open", true, "on-this-page-open");
add("docs-setup.html", [768, 1024], ["light"], "", true, "docs-nav");
add("docs-setup.html", [1440], ["light", "dark"], "", true, "docs-nav");
add("states.html", [390, 1440], ["light", "dark"]);

const filter = process.argv[2];
const shots = filter ? S.filter((s) => (s.file + s.suffix).includes(filter)) : S;

const port = 9400 + Math.floor(Math.random() * 400);
const profile = join(tmpdir(), "bb-shoot-" + port);
const proc = spawn(browser, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--hide-scrollbars",
  "--no-first-run",
  "--disable-gpu",
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
}
if (!target) throw new Error("Browser did not start");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const waiters = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result || m);
    pending.delete(m.id);
  } else if (m.method) {
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].name === m.method) waiters.splice(i, 1)[0].resolve();
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    pending.set(++id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const event = (name) => new Promise((resolve) => waiters.push({ name, resolve }));

await send("Page.enable");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

for (const s of shots) {
  const phone = s.w < 700;
  const h = phone ? 844 : s.w < 1100 ? 1024 : 900;
  await send("Emulation.setDeviceMetricsOverride", { width: s.w, height: h, deviceScaleFactor: phone ? 2 : 1, mobile: phone });
  const q = ["theme=" + s.t, s.query].filter(Boolean).join("&");
  const loaded = event("Page.loadEventFired");
  await send("Page.navigate", { url: pathToFileURL(join(root, s.file)).href + "?" + q });
  await loaded;
  await sleep(450);
  const params = { format: "png" };
  if (!s.viewportOnly) {
    const { cssContentSize } = await send("Page.getLayoutMetrics");
    params.captureBeyondViewport = true;
    params.clip = { x: 0, y: 0, width: s.w, height: Math.ceil(cssContentSize.height), scale: 1 };
    if (cssContentSize.width > s.w + 1) console.log("  ! horizontal overflow:", s.file, s.w, cssContentSize.width);
  }
  const { data } = await send("Page.captureScreenshot", params);
  const name = [s.file.replace(".html", ""), s.suffix, s.w, s.t].filter(Boolean).join("--") + ".png";
  writeFileSync(join(out, name), Buffer.from(data, "base64"));
  console.log(name);
}
ws.close();
proc.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {}
