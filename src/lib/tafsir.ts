
/** Multiple tafsir sources (quran.com API v4) + helpers. */

export interface TafsirSource {
  id: number;
  name: string;
  author: string;
}

/** Every Arabic tafsir exposed by the quran.com API, plus two English ones. */
export const TAFSIRS: TafsirSource[] = [
  { id: 16, name: "التفسير الميسر", author: "مجمع الملك فهد" },
  { id: 91, name: "تفسير السعدي", author: "عبد الرحمن السعدي" },
  { id: 14, name: "تفسير ابن كثير", author: "الحافظ ابن كثير" },
  { id: 15, name: "تفسير الطبري", author: "الإمام الطبري" },
  { id: 90, name: "تفسير القرطبي", author: "الإمام القرطبي" },
  { id: 94, name: "تفسير البغوي", author: "الإمام البغوي" },
  { id: 93, name: "التفسير الوسيط", author: "طنطاوي" },
  { id: 169, name: "Ibn Kathir (English)", author: "Abridged" },
  { id: 168, name: "Ma'arif al-Qur'an (English)", author: "Mufti Shafi" },
];

export const DEFAULT_TAFSIR = 16;

const cache = new Map<string, string>();

/** Returns the tafsir HTML for `surah:ayah`, or an empty string. */
export async function fetchTafsir(tafsirId: number, surah: number, ayah: number) {
  const key = `${tafsirId}:${surah}:${ayah}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const res = await fetch(
    `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}`,
  );
  if (!res.ok) throw new Error("تعذّر تحميل التفسير");
  const json = (await res.json()) as { tafsir?: { text?: string } };
  const text = json.tafsir?.text ?? "";
  cache.set(key, text);
  return text;
}


