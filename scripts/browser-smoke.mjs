const endpoint = process.argv[2] ?? "http://127.0.0.1:9222";
const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === "page" && entry.url.includes("4173"));

if (!target) {
  throw new Error("Portfolio page was not found in the browser session.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
const browserErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") {
    browserErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    browserErrors.push(message.params.entry.text);
  }
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await command("Runtime.enable");
await command("Log.enable");
await command("Page.enable");
await command("Page.navigate", { url: "http://127.0.0.1:4173/" });
await new Promise((resolve) => setTimeout(resolve, 700));
browserErrors.length = 0;

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

const result = await evaluate(`(async () => {
  const toggle = document.querySelector('.object-switch');
  const before = toggle?.getAttribute('aria-pressed');
  toggle?.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const after = toggle?.getAttribute('aria-pressed');
  document.querySelector('a[href="#work"]')?.click();
  await new Promise(resolve => setTimeout(resolve, 500));
  const filter = [...document.querySelectorAll('.filters button')].find(button => button.textContent === 'Event');
  filter?.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const eventCount = document.querySelectorAll('.project-card').length;
  document.querySelectorAll('.project-card')[1]?.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const dialogOpen = Boolean(document.querySelector('.project-dialog'));
  const dialogTitle = document.querySelector('.dialog-hero h2')?.textContent;
  document.querySelector('.youtube-film button')?.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const youtubeEmbed = document.querySelector('.youtube-film iframe')?.src;
  document.querySelector('.dialog-bar button')?.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    title: document.title,
    before,
    after,
    hash: location.hash,
    workVisible: Boolean(document.querySelector('#work')),
    eventCount,
    dialogOpen,
    dialogTitle,
    youtubeEmbed,
    dialogClosed: !document.querySelector('.project-dialog'),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
})()`);

await new Promise((resolve) => setTimeout(resolve, 150));
socket.close();

console.log(JSON.stringify({ ...result, browserErrors }, null, 2));

if (!result.before || !result.after || result.before === result.after || result.hash !== "#work") process.exitCode = 1;
if (!result.workVisible || result.eventCount !== 2 || !result.dialogOpen || result.dialogTitle !== "Samsung skate park" || !result.youtubeEmbed?.includes("youtube-nocookie.com/embed/gW9KfXGeqEQ") || !result.dialogClosed || result.horizontalOverflow || browserErrors.length) process.exitCode = 1;
