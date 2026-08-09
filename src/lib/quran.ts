
export const API = "https://api.alquran.cloud/v1";

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surah?: { number: number; name: string; englishName: string; numberOfAyahs: number };
}

export interface Reciter {
  id: string;
  name: string;
  en: string;
}

export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "مشاري العفاسي", en: "Alafasy" },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", en: "Ash-Shaatree" },
  { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي", en: "Al-Ajamy" },
  { id: "ar.husary", name: "محمود خليل الحصري", en: "Husary" },
  { id: "ar.husarymujawwad", name: "الحصري (المجود)", en: "Husary Mujawwad" },
  { id: "ar.hudhaify", name: "علي الحذيفي", en: "Hudhaify" },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", en: "Maher Al Muaiqly" },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي", en: "Minshawi" },
  { id: "ar.muhammadayyoub", name: "محمد أيوب", en: "Muhammad Ayyoub" },
  { id: "ar.muhammadjibreel", name: "محمد جبريل", en: "Muhammad Jibreel" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد", en: "Abdul Basit" },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس", en: "As-Sudais" },
  { id: "ar.abdullahbasfar", name: "عبد الله بصفر", en: "Abdullah Basfar" },
  { id: "ar.hanirifai", name: "هاني الرفاعي", en: "Hani Rifai" },
  { id: "ar.minshawimujawwad", name: "المنشاوي (المجود)", en: "Minshawi Mujawwad" },
  { id: "ar.saoodshuraym", name: "سعود الشريم", en: "Saud Shuraym" },
];

/** Readers whose CDN files are only available at a non-default bitrate. */
export const RECITER_BITRATES: Record<string, number> = {
  "ar.abdulbasitmurattal": 192,
  "ar.abdurrahmaansudais": 192,
  "ar.abdullahbasfar": 192,
  "ar.hanirifai": 192,
  "ar.minshawimujawwad": 64,
  "ar.saoodshuraym": 64,
};

export const audioUrl = (reciter: string, globalAyah: number) =>
  `https://cdn.islamic.network/quran/audio/${RECITER_BITRATES[reciter] ?? 128}/${reciter}/${globalAyah}.mp3`;

/* ---------- offline-first data layer ----------
 * Bundled editions live under /data/quran/*.json. Every lookup tries the
 * local bundle first and falls back to the network API when offline data is
 * unavailable, so the app keeps working (and stays honest) in both modes. */

const LOCAL_QURAN = `${import.meta.env.BASE_URL}data/quran/`;

const EDITION_FILE: Record<string, string> = {
  "quran-uthmani": "quran-uthmani.json",
  "en.sahih": "en.sahih.json",
};

export interface LocalSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: Ayah[];
}

const editionCache = new Map<string, LocalSurah[]>();

async function loadEditionLocal(edition: string): Promise<LocalSurah[]> {
  const file = EDITION_FILE[edition];
  if (!file) throw new Error("edition not bundled");
  const hit = editionCache.get(edition);
  if (hit) return hit;
  const res = await fetch(`${LOCAL_QURAN}${file}`);
  if (!res.ok) throw new Error("bundled edition missing");
  const surahs = (await res.json()) as LocalSurah[];
  editionCache.set(edition, surahs);
  return surahs;
}

function withSurah(a: Ayah, s: LocalSurah): Ayah {
  return {
    ...a,
    surah: {
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      numberOfAyahs: s.ayahs.length,
    },
  };
}

const pageIndex = new Map<string, Map<number, Ayah[]>>();
const juzIndex = new Map<string, Map<number, Ayah[]>>();

function indexEdition(surahs: LocalSurah[], edition: string) {
  if (pageIndex.has(edition)) return;
  const byPage = new Map<number, Ayah[]>();
  const byJuz = new Map<number, Ayah[]>();
  for (const s of surahs) {
    for (const a of s.ayahs) {
      const enriched = withSurah(a, s);
      const pg = byPage.get(a.page);
      if (pg) pg.push(enriched);
      else byPage.set(a.page, [enriched]);
      const jz = byJuz.get(a.juz);
      if (jz) jz.push(enriched);
      else byJuz.set(a.juz, [enriched]);
    }
  }
  pageIndex.set(edition, byPage);
  juzIndex.set(edition, byJuz);
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`تعذّر تحميل البيانات (${res.status})`);
  const json = await res.json();
  return json.data as T;
}

export async function fetchSurahs(): Promise<SurahMeta[]> {
  try {
    const surahs = await loadEditionLocal("quran-uthmani");
    return surahs.map((s) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.ayahs.length,
      revelationType: s.revelationType,
    }));
  } catch {
    return get<SurahMeta[]>("/surah");
  }
}

export async function fetchSurah(n: number, edition = "quran-uthmani") {
  try {
    const surahs = await loadEditionLocal(edition);
    const s = surahs.find((x) => x.number === n);
    if (!s) throw new Error("surah missing");
    return { ...s, numberOfAyahs: s.ayahs.length, ayahs: s.ayahs.map((a) => withSurah(a, s)) };
  } catch {
    return get<SurahMeta & { ayahs: Ayah[] }>(`/surah/${n}/${edition}`);
  }
}

export async function fetchPage(n: number, edition = "quran-uthmani") {
  try {
    const surahs = await loadEditionLocal(edition);
    indexEdition(surahs, edition);
    const ayahs = pageIndex.get(edition)?.get(n);
    if (!ayahs?.length) throw new Error("no ayahs on page");
    return { number: n, ayahs };
  } catch {
    return get<{ number: number; ayahs: Ayah[] }>(`/page/${n}/${edition}`);
  }
}

export async function fetchJuz(n: number, edition = "quran-uthmani") {
  try {
    const surahs = await loadEditionLocal(edition);
    indexEdition(surahs, edition);
    const ayahs = juzIndex.get(edition)?.get(n);
    if (!ayahs?.length) throw new Error("no ayahs in juz");
    return { number: n, ayahs };
  } catch {
    return get<{ number: number; ayahs: Ayah[] }>(`/juz/${n}/${edition}`);
  }
}

export const TRANSLATION_EDITION = "en.sahih";

const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

export const stripBasmala = (text: string, surah: number, ayah: number) => {
  if (ayah !== 1 || surah === 1 || surah === 9) return text;
  return text.startsWith(BASMALA) ? text.slice(BASMALA.length).trim() : text;
};

export const toArabicNumber = (n: number) =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


