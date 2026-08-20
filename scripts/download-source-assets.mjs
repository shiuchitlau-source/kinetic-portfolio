import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const origin = "https://www.shiuchitlau.com";
const output = decodeURIComponent(new URL("../public/assets/shiuchit/", import.meta.url).pathname);
await mkdir(output, { recursive: true });

const homepage = await fetch(origin).then((response) => response.text());
const routes = [...new Set([...homepage.matchAll(/href="(\/project\/[^"]+)"/g)].map((match) => match[1]))];
const assets = new Set([...homepage.matchAll(/(?:src|poster)="((?:\/images|\/videos)\/[^"]+)"/g)].map((match) => match[1]));

for (const route of routes) {
  const html = await fetch(origin + route).then((response) => response.text());
  for (const match of html.matchAll(/(?:src|poster)="((?:\/images|\/videos)\/[^"]+)"/g)) assets.add(match[1]);
}

for (const asset of assets) {
  const response = await fetch(origin + asset);
  if (!response.ok) throw new Error(`${response.status} ${asset}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(join(output, basename(asset)), bytes);
  console.log(`${basename(asset)} ${bytes.length}`);
}

console.log(`Downloaded ${assets.size} source assets.`);
