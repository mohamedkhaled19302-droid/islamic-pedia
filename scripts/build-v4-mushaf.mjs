import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const v4Dir = join(root, "public", "data", "quran", "v4");
const pagesDir = join(v4Dir, "pages");
const fontsDir = join(v4Dir, "fonts");

const QURANCOM = "https://api.quran.com/api/v4";
const FONT_CDN = "https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2";
const WORD_FIELDS = "code_v2,line_number,text_uthmani,verse_key,char_type_name,position";

const PAGES = 604;

async function get(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

async function save(file, json) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(json));
  const kb = Math.round((await stat(file)).size / 1024);
  console.log(`  saved ${file.replace(root, ".")}  (${kb} KB)`);
}

await mkdir(pagesDir, { recursive: true });
await mkdir(fontsDir, { recursive: true });

console.log("== building page data ==");
const done = new Set();
for (const f of await import("node:fs/promises").then((m) => m.readdir(pagesDir))) {
  done.add(parseInt(f.slice(1, -5), 10));
}

async function buildPage(p) {
  const j = await get(`${QURANCOM}/verses/by_page/${p}?words=true&word_fields=${WORD_FIELDS}`);

  const lines = [];
  let start = null;
  let firstVerseLine = null;

  for (const v of j.verses) {
    for (const w of v.words) {
      const ln = w.line_number;
      if (!lines[ln]) lines[ln] = [];
      lines[ln].push({
        c: w.code_v2,
        k: w.verse_key,
        t: w.char_type_name,
        p: w.position,
        u: w.text_uthmani,
      });
      if (firstVerseLine === null) firstVerseLine = ln;
      const [s, a] = w.verse_key.split(":").map(Number);
      if (start === null && a === 1 && w.position === 1) {
        start = { surah: s, firstLine: ln, top: ln <= 3 };
      }
    }
  }

  const page = {
    p,
    start,
    lines: lines.map((l) => l || null),
  };

  const file = join(pagesDir, `p${p}.json`);
  await mkdir(pagesDir, { recursive: true });
  await writeFile(file, JSON.stringify(page));
  return stat(file).then((s) => s.size);
}

let bytes = 0;
let fails = 0;
const B = 16;
for (let p = 1; p <= PAGES; p += B) {
  const results = await Promise.all(
    Array.from({ length: Math.min(B, PAGES - p + 1) }, (_, i) =>
      (async () => {
        const pp = p + i;
        if (done.has(pp)) return 0;
        try {
          return await buildPage(pp);
        } catch (e) {
          fails++;
          console.error(`  FAIL p${pp}: ${e.message}`);
          return 0;
        }
      })()
    )
  );
  bytes += results.reduce((a, b) => a + b, 0);
  console.log(`  pages ${p}-${Math.min(PAGES, p + B - 1)} done`);
}

console.log(`== downloading fonts (${PAGES} woff2) ==`);
let fbytes = 0;
let ffails = 0;
for (let p = 1; p <= PAGES; p += B) {
  const results = await Promise.all(
    Array.from({ length: Math.min(B, PAGES - p + 1) }, (_, i) =>
      (async () => {
        const pp = p + i;
        const file = join(fontsDir, `p${pp}.woff2`);
        try {
          const s = await stat(file);
          fbytes += s.size;
          return;
        } catch {}
        try {
          const res = await fetch(`${FONT_CDN}/p${pp}.woff2`, { signal: AbortSignal.timeout(120000) });
          if (!res.ok) throw new Error(`${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          await writeFile(file, buf);
          fbytes += buf.length;
          if (pp % 50 === 0) console.log(`  font p${pp} (${(buf.length / 1024) | 0} KB)`);
        } catch (e) {
          ffails++;
          console.error(`  FAIL font p${pp}: ${e.message}`);
        }
      })()
    )
  );
}

console.log("== done ==");
console.log(`page data: ${(bytes / 1048576).toFixed(1)} MB (${fails} failures)`);
console.log(`fonts: ${(fbytes / 1048576).toFixed(1)} MB (${ffails} failures)`);
