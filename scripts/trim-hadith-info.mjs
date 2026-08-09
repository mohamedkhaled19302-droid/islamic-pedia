import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hDir = join(root, "public", "data", "hadith");

const EDITIONS = [
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

const out = {};
for (const e of EDITIONS) {
  const file = join(hDir, `${e}.min.json`);
  const j = JSON.parse(await readFile(file, "utf8"));
  const meta = j.metadata ?? {};
  out[e] = {
    metadata: {
      name: meta.name ?? e,
      sections: meta.sections ?? {},
    },
  };
}
await writeFile(join(hDir, "info.json"), JSON.stringify(out));
const size = (await import("node:fs/promises")).stat(join(hDir, "info.json"));
console.log("trimmed info.json written for", EDITIONS.length, "books");
