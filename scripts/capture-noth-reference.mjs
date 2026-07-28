import { writeFile } from "node:fs/promises";

const endpoint = process.argv[2] ?? "http://127.0.0.1:9444";
const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === "page" && entry.url.includes("noth.in"));
if (!target) throw new Error("noth.in page was not found.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.value;
}

await command("Page.enable");
await command("Runtime.enable");
async function capture(name) {
  const shot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(name, Buffer.from(shot.data, "base64"));
}

await command("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1024,
  deviceScaleFactor: 1,
  mobile: false,
});
await command("Page.navigate", { url: "https://www.noth.in/" });
await new Promise((resolve) => setTimeout(resolve, 12000));
await capture("reference-noth-desktop-loaded.png");

await evaluate(`window.scrollTo({ top: 1500, behavior: "instant" })`);
await new Promise((resolve) => setTimeout(resolve, 1800));
await capture("reference-noth-works.png");

await evaluate(`window.scrollTo({ top: 4700, behavior: "instant" })`);
await new Promise((resolve) => setTimeout(resolve, 1800));
await capture("reference-noth-studio.png");

const state = await evaluate(`({
  title: document.title,
  text: document.body.innerText.slice(0, 3000),
  bodyClass: document.body.className,
  links: [...document.links].slice(0, 20).map(link => ({ text: link.innerText, href: link.href })),
  scrollHeight: document.documentElement.scrollHeight,
  viewport: [innerWidth, innerHeight]
})`);

await command("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await command("Page.navigate", { url: "https://www.noth.in/" });
await new Promise((resolve) => setTimeout(resolve, 12000));
await capture("reference-noth-mobile-loaded.png");
const menuOpened = await evaluate(`(() => {
  const candidates = [...document.querySelectorAll("button, a")];
  const target = candidates.find((element) => element.textContent.trim().toUpperCase().startsWith("MENU"))
    || document.elementFromPoint(innerWidth - 24, 26);
  if (!target) return false;
  target.click();
  return true;
})()`);
await new Promise((resolve) => setTimeout(resolve, 1200));
if (menuOpened) await capture("reference-noth-mobile-menu.png");
socket.close();
console.log(JSON.stringify({ ...state, menuOpened }, null, 2));
