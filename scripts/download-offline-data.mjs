import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "public", "data");
const qDir = join(dataDir, "quran");
const hDir = join(dataDir, "hadith");

const QURAN_API = "https://api.alquran.cloud/v1";
const HADITH_CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

const HADITH_EDITIONS = [
  "ara-bukhari",
  "ara-muslim",
  "ara-abudawud",
  "ara-tirmidhi",
  "ara-nasai",
  "ara-ibnmajah",
  "ara-malik",
  "ara-dehlawi",
  "ara-nawawi",
  "ara-qudsi",
];

async function get(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

async function save(file, json) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(json));
  const kb = Math.round((await import("node:fs/promises")).stat(file).then((s) => s.size) / 1024);
  console.log(`  saved ${file.replace(root, ".")}  (${kb} KB)`);
}

console.log("== Quran combined editions ==");
await mkdir(qDir, { recursive: true });

const uthmaniRaw = await get(`${QURAN_API}/quran/quran-uthmani`);
const uthmani = uthmaniRaw.data.surahs;
await save(join(qDir, "quran-uthmani.json"), uthmani);

const enRaw = await get(`${QURAN_API}/quran/en.sahih`);
await save(join(qDir, "en.sahih.json"), enRaw.data.surahs);

const list = uthmani.map(({ number, name, englishName, englishNameTranslation, revelationType, ayahs }) => ({
  number,
  name,
  englishName,
  englishNameTranslation,
  numberOfAyahs: ayahs.length,
  revelationType,
}));
await save(join(qDir, "surah.json"), list);
console.log(`  surahs: ${list.length}, total ayahs: ${uthmani.reduce((a, s) => a + s.ayahs.length, 0)}`);

console.log("== Hadith ==");
await mkdir(hDir, { recursive: true });

const info = await get(`${HADITH_CDN}/info.json`);
await save(join(hDir, "info.json"), info);

let done = 0;
async function downloadEdition(edition) {
  const j = await get(`${HADITH_CDN}/editions/${edition}.min.json`);
  await save(join(hDir, `${edition}.min.json`), j);
  done++;
  console.log(`  [${done}/${HADITH_EDITIONS.length}] ${edition} done`);
}
for (let i = 0; i < HADITH_EDITIONS.length; i += 4) {
  await Promise.all(HADITH_EDITIONS.slice(i, i + 4).map(downloadEdition));
}

console.log("== Asma (99 names) ==");
const asma = await get("https://api.aladhan.com/v1/asmaAlHusna");
await save(join(dataDir, "asma.json"), asma.data);

console.log("ALL DONE");
