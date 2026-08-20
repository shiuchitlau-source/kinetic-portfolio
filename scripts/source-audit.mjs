const origin = "https://www.shiuchitlau.com";

function clean(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const homepage = await fetch(origin).then((response) => response.text());
const routes = [...new Set([...homepage.matchAll(/href="(\/project\/[^"]+)"/g)].map((match) => match[1]))];
const homepageImages = [...new Set([...homepage.matchAll(/(?:src|poster)="(\/images\/[^"]+)"/g)].map((match) => match[1]))];

const projects = [];
for (const route of routes) {
  const html = await fetch(origin + route).then((response) => response.text());
  projects.push({
    route,
    title: clean(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]),
    text: clean(html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html),
    images: [...new Set([...html.matchAll(/(?:src|poster)="(\/images\/[^"]+)"/g)].map((match) => match[1]))],
    videos: [...new Set([...html.matchAll(/(?:src|poster)="([^"]+\.(?:mp4|webm|mov)[^"]*)"/gi)].map((match) => match[1]))],
    embeds: [...new Set([
      ...[...html.matchAll(/<iframe[^>]+src="([^"]+)"/gi)].map((match) => match[1]),
      ...[...html.matchAll(/https?:\\?\/\\?\/(?:www\.)?(?:youtube\.com|youtu\.be)[^"'\\\s<]+/gi)].map((match) => match[0].replaceAll("\\/", "/")),
    ])],
  });
}

console.log(JSON.stringify({
  homepageText: clean(homepage.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? homepage),
  homepageImages,
  projects,
}, null, 2));
