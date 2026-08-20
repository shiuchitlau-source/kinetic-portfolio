import { writeFile } from "node:fs/promises";

const endpoint = process.argv[2] ?? "http://127.0.0.1:9333";
const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === "page" && entry.url.includes("4173"));
if (!target) throw new Error("Portfolio page was not found.");

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
  return command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
}

async function capture(name, width, height, setup) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await command("Page.navigate", { url: "http://127.0.0.1:4173/" });
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (setup) await evaluate(setup);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const shot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(name, Buffer.from(shot.data, "base64"));
}

await command("Page.enable");
await command("Runtime.enable");
await capture("implementation-motion-mobile-final.png", 390, 844);
await capture("implementation-motion-work-final.png", 1440, 1100, `document.querySelector('#work').scrollIntoView()`);
await capture("implementation-motion-youtube-final.png", 1440, 1100, `document.querySelectorAll('.project-card')[1].click()`);
socket.close();
