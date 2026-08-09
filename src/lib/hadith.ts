
/** Hadith library: authentic collections (fawazahmed0/hadith-api) + curated weak & fabricated. */

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

/* ---------- offline-first data layer ---------- */

const LOCAL_HADITH = `${import.meta.env.BASE_URL}data/hadith/`;

interface EditionFile {
  metadata?: { name?: string; sections?: Record<string, string> };
  hadiths?: HadithEntry[];
}

const editionCache = new Map<string, EditionFile>();

async function loadEditionFile(edition: string): Promise<EditionFile> {
  const hit = editionCache.get(edition);
  if (hit) return hit;
  const res = await fetch(`${LOCAL_HADITH}${edition}.min.json`);
  if (!res.ok) throw new Error("edition not bundled");
  const file = (await res.json()) as EditionFile;
  editionCache.set(edition, file);
  return file;
}

export interface HadithBook {
  slug: string;
  edition: string;
  name: string;
  author: string;
  grade: string;
}

/** Part 1 — Bukhari, Part 2 — Muslim, Part 3 — the Sunan (hasan/sahih material). */
export const HADITH_PARTS: { id: string; title: string; hint: string; books: HadithBook[] }[] = [
  {
    id: "bukhari",
    title: "الجزء الأول — صحيح البخاري",
    hint: "أصحّ كتاب بعد كتاب الله",
    books: [
      {
        slug: "bukhari",
        edition: "ara-bukhari",
        name: "صحيح البخاري",
        author: "الإمام محمد بن إسماعيل البخاري",
        grade: "صحيح",
      },
    ],
  },
  {
    id: "muslim",
    title: "الجزء الثاني — صحيح مسلم",
    hint: "ثاني الصحيحين",
    books: [
      {
        slug: "muslim",
        edition: "ara-muslim",
        name: "صحيح مسلم",
        author: "الإمام مسلم بن الحجاج النيسابوري",
        grade: "صحيح",
      },
    ],
  },
  {
    id: "sunan",
    title: "الجزء الثالث — السنن (الصحيح والحسن)",
    hint: "أبو داود والترمذي والنسائي وابن ماجه ومالك والدارمي",
    books: [
      {
        slug: "abudawud",
        edition: "ara-abudawud",
        name: "سنن أبي داود",
        author: "الإمام أبو داود السجستاني",
        grade: "فيه الصحيح والحسن",
      },
      {
        slug: "tirmidhi",
        edition: "ara-tirmidhi",
        name: "جامع الترمذي",
        author: "الإمام محمد بن عيسى الترمذي",
        grade: "فيه الصحيح والحسن",
      },
      {
        slug: "nasai",
        edition: "ara-nasai",
        name: "سنن النسائي",
        author: "الإمام أحمد بن شعيب النسائي",
        grade: "فيه الصحيح والحسن",
      },
      {
        slug: "ibnmajah",
        edition: "ara-ibnmajah",
        name: "سنن ابن ماجه",
        author: "الإمام محمد بن يزيد بن ماجه",
        grade: "فيه الصحيح والحسن",
      },
      {
        slug: "malik",
        edition: "ara-malik",
        name: "موطأ مالك",
        author: "الإمام مالك بن أنس",
        grade: "فيه الصحيح والحسن",
      },
      {
        slug: "dehlawi",
        edition: "ara-dehlawi",
        name: "الأربعون للدهلوي",
        author: "شاه ولي الله الدهلوي",
        grade: "منتخب",
      },
      {
        slug: "nawawi",
        edition: "ara-nawawi",
        name: "الأربعون النووية",
        author: "الإمام يحيى بن شرف النووي",
        grade: "منتخب",
      },
      {
        slug: "qudsi",
        edition: "ara-qudsi",
        name: "الأحاديث القدسية",
        author: "مجموعة",
        grade: "منتخب",
      },
    ],
  },
];

export const ALL_BOOKS = HADITH_PARTS.flatMap((p) => p.books);

export const findBook = (slug: string) => ALL_BOOKS.find((b) => b.slug === slug) ?? ALL_BOOKS[0];

export interface HadithEntry {
  hadithnumber: number;
  arabicnumber?: number;
  text: string;
  grades?: { name: string; grade: string }[];
  reference?: { book: number; hadith: number };
}

interface SectionPayload {
  metadata: { name: string; section: Record<string, string> };
  hadiths: HadithEntry[];
}

/** Chapter titles for a book (English titles from the source dataset). */
export async function fetchBookInfo(slug: string) {
  let json: Record<
    string,
    { metadata: { name: string; sections: Record<string, string> } }
  >;
  try {
    const res = await fetch(`${LOCAL_HADITH}info.json`);
    if (!res.ok) throw new Error("no local info");
    json = (await res.json()) as typeof json;
  } catch {
    const res = await fetch(`${CDN}/info.json`);
    if (!res.ok) throw new Error("تعذّر تحميل فهرس الكتاب");
    json = (await res.json()) as typeof json;
  }
  const meta = json[slug]?.metadata;
  const sections = Object.entries(meta?.sections ?? {})
    .filter(([n, title]) => Number(n) > 0 && title)
    .map(([n, title]) => ({ n: Number(n), title }));
  return { name: meta?.name ?? slug, sections };
}

export async function fetchSection(edition: string, section: number) {
  try {
    const full = await loadEditionFile(edition);
    const hadiths = (full.hadiths ?? []).filter((h) => h.reference?.book === section);
    if (!hadiths.length) throw new Error("empty section");
    return {
      metadata: { name: full.metadata?.name ?? edition, section: {} },
      hadiths,
    } as SectionPayload;
  } catch {
    const res = await fetch(`${CDN}/editions/${edition}/sections/${section}.min.json`);
    if (!res.ok) throw new Error("تعذّر تحميل الباب");
    return (await res.json()) as SectionPayload;
  }
}

/* ----------------- curated weak & fabricated ----------------- */

export interface RuledHadith {
  text: string;
  ruling: string;
  source: string;
}

/** الأحاديث الضعيفة — مشهورة على الألسنة، ضعّفها أهل الحديث. */
export const WEAK_HADITHS: RuledHadith[] = [
  {
    text: "اطلبوا العلم ولو بالصين.",
    ruling: "ضعيف جداً",
    source: "ضعّفه ابن حبان وابن الجوزي، وضعّفه الألباني في «الضعيفة» (416).",
  },
  {
    text: "نية المؤمن خير من عمله.",
    ruling: "ضعيف",
    source: "ضعّفه الألباني في «السلسلة الضعيفة» (2789).",
  },
  {
    text: "اختلاف أمتي رحمة.",
    ruling: "لا أصل له",
    source: "قال السبكي: لم أقف له على سند صحيح ولا ضعيف ولا موضوع، «الضعيفة» (57).",
  },
  {
    text: "من عرف نفسه فقد عرف ربه.",
    ruling: "ليس بحديث",
    source: "قال النووي: ليس بثابت، وذكره ابن تيمية أنه موضوع.",
  },
  {
    text: "حبّ الوطن من الإيمان.",
    ruling: "موضوع",
    source: "قال الصغاني والسخاوي: موضوع، «الضعيفة» (36).",
  },
  {
    text: "من حسن إسلام المرء تركه ما لا يعنيه.",
    ruling: "حسن (استثناء صحيح)",
    source: "رواه الترمذي وحسّنه، وصححه الألباني — أُدرج هنا للتنبيه أنه ثابت لا ضعيف.",
  },
  {
    text: "تفكّر ساعة خير من عبادة سبعين سنة.",
    ruling: "لا يصح مرفوعاً",
    source: "مروي عن بعض السلف موقوفاً، وضعّفه أهل العلم مرفوعاً.",
  },
  {
    text: "أنا مدينة العلم وعليٌّ بابها.",
    ruling: "موضوع",
    source: "حكم بوضعه ابن الجوزي والذهبي، «الضعيفة» (2955).",
  },
  {
    text: "من بشّرني بخروج شهر آذار بشّرته بالجنة.",
    ruling: "موضوع",
    source: "«الضعيفة» (137).",
  },
  {
    text: "لولاك لولاك ما خلقت الأفلاك.",
    ruling: "موضوع",
    source: "قال الصغاني: موضوع، «الضعيفة» (282).",
  },
];

/** الأحاديث الموضوعة — المكذوبة على النبي ﷺ. */
export const FABRICATED_HADITHS: RuledHadith[] = [
  {
    text: "من صام رجب إيماناً واحتساباً وجبت له الجنة.",
    ruling: "موضوع",
    source: "قال ابن حجر: لا يصح في فضل شهر رجب حديث، «الضعيفة» (4400).",
  },
  {
    text: "خير الأسماء ما عُبِّد وما حُمِّد.",
    ruling: "موضوع",
    source: "«الضعيفة» (411).",
  },
  {
    text: "المعدة بيت الداء والحمية رأس الدواء.",
    ruling: "موضوع / كلام طبيب",
    source: "قال العجلوني: هو من كلام الحارث بن كلدة، «الضعيفة» (253).",
  },
  {
    text: "من قلّد عالماً لقي الله سالماً.",
    ruling: "موضوع",
    source: "«الضعيفة» (2317).",
  },
  {
    text: "أصحابي كالنجوم بأيهم اقتديتم اهتديتم.",
    ruling: "موضوع",
    source: "قال أحمد وابن حزم: موضوع، «الضعيفة» (58).",
  },
  {
    text: "من عشق فعفّ فكتم فمات مات شهيداً.",
    ruling: "موضوع",
    source: "«الضعيفة» (409).",
  },
  {
    text: "رجعنا من الجهاد الأصغر إلى الجهاد الأكبر.",
    ruling: "لا أصل له",
    source: "قال ابن تيمية: لا أصل له، «كشف الخفاء» (1362).",
  },
  {
    text: "طلب الحلال جهاد، وإن الله يحب المؤمن المحترف.",
    ruling: "ضعيف جداً / موضوع",
    source: "«الضعيفة» (1301).",
  },
  {
    text: "أحبّوا العرب لثلاث؛ لأني عربي…",
    ruling: "موضوع",
    source: "«الضعيفة» (160).",
  },
  {
    text: "من صلّى ليلة النصف من شعبان مئة ركعة غُفر له.",
    ruling: "موضوع",
    source: "قال ابن الجوزي والنووي: موضوع باطل.",
  },
];

/* ----------------- بحث في كل كتب الحديث ----------------- */

const cache = new Map<string, HadithEntry[]>();

/** يزيل التشكيل والهمزات وعلامات الترقيم لمطابقة عربية مرنة. */
export function normalizeAr(s: string) {
  return s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A0-9a-zA-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadEdition(edition: string): Promise<HadithEntry[]> {
  const hit = cache.get(edition);
  if (hit) return hit;
  try {
    const full = await loadEditionFile(edition);
    const list = full.hadiths ?? [];
    cache.set(edition, list);
    return list;
  } catch {
    const res = await fetch(`${CDN}/editions/${edition}.min.json`);
    if (!res.ok) throw new Error("تعذّر تحميل الكتاب");
    const json = (await res.json()) as { hadiths: HadithEntry[] };
    const list = json.hadiths ?? [];
    cache.set(edition, list);
    return list;
  }
}

export interface HadithHit {
  bookSlug: string;
  bookName: string;
  hadithnumber: number;
  text: string;
  grades?: { name: string; grade: string }[];
}

/**
 * يبحث في كل كتب السنة المتاحة (تحميل تدريجي مع تقرير التقدّم).
 * @param onProgress (اسم الكتاب، رقمه، الإجمالي)
 */
export async function searchAllBooks(
  query: string,
  opts: { limitPerBook?: number; books?: HadithBook[]; onProgress?: (name: string, i: number, total: number) => void } = {},
): Promise<HadithHit[]> {
  const q = normalizeAr(query);
  if (q.length < 2) return [];
  const books = opts.books ?? ALL_BOOKS;
  const limit = opts.limitPerBook ?? 25;
  const out: HadithHit[] = [];

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    opts.onProgress?.(b.name, i + 1, books.length);
    try {
      const list = await loadEdition(b.edition);
      let found = 0;
      for (const h of list) {
        if (found >= limit) break;
        if (normalizeAr(h.text).includes(q)) {
          out.push({
            bookSlug: b.slug,
            bookName: b.name,
            hadithnumber: h.hadithnumber,
            text: h.text,
            grades: h.grades,
          });
          found++;
        }
      }
    } catch {
      /* تخطّي كتاب تعذّر تحميله */
    }
  }
  return out;
}

/** بحث في الأحاديث الضعيفة والموضوعة المنتقاة. */
export function searchRuled(query: string) {
  const q = normalizeAr(query);
  if (q.length < 2) return { weak: [], fabricated: [] };
  const f = (l: RuledHadith[]) => l.filter((h) => normalizeAr(h.text).includes(q));
  return { weak: f(WEAK_HADITHS), fabricated: f(FABRICATED_HADITHS) };
}


