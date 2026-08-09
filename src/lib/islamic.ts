
/** Extra Islamic APIs: Aladhan (islamic.network) + UmmahAPI. */

const ALADHAN = "https://api.aladhan.com/v1";
const UMMAH = "https://ummahapi.com/api";
const LOCAL_DATA = `${import.meta.env.BASE_URL}data/`;

export interface AsmaName {
  number: number;
  name: string;
  transliteration: string;
  en: { meaning: string };
}

export async function fetchAsmaAlHusna(): Promise<AsmaName[]> {
  try {
    const res = await fetch(`${LOCAL_DATA}asma.json`);
    if (!res.ok) throw new Error("no local asma");
    return (await res.json()) as AsmaName[];
  } catch {
    const r = await fetch(`${ALADHAN}/asmaAlHusna`);
    if (!r.ok) throw new Error("asma");
    return (await r.json()).data as AsmaName[];
  }
}

export async function fetchQibla(lat: number, lng: number): Promise<number> {
  const r = await fetch(`${ALADHAN}/qibla/${lat}/${lng}`);
  if (!r.ok) throw new Error("qibla");
  return (await r.json()).data.direction as number;
}

export interface HijriDate {
  hijri: { date: string; day: string; month: { ar: string; number: number }; year: string; weekday: { ar: string } };
  gregorian: { date: string };
}

export async function fetchHijri(d: Date): Promise<HijriDate> {
  const dd = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  const r = await fetch(`${ALADHAN}/gToH/${dd}`);
  if (!r.ok) throw new Error("hijri");
  return (await r.json()).data as HijriDate;
}

export interface SimilarVerse {
  verse_key: string;
  surah_name_arabic?: string;
  arabic: string;
}

export interface Mutashabih {
  verse_key: string;
  surah: number;
  ayah: number;
  surah_name_arabic: string;
  arabic: string;
  similar_verses: SimilarVerse[];
}

export async function fetchRandomMutashabih(): Promise<Mutashabih> {
  const r = await fetch(`${UMMAH}/quran/mutashabihat/random`);
  if (!r.ok) throw new Error("mutashabihat");
  return (await r.json()).data as Mutashabih;
}

export async function fetchMutashabihatBySurah(surah: number): Promise<Mutashabih[]> {
  const r = await fetch(`${UMMAH}/quran/mutashabihat/${surah}?limit=50`);
  if (!r.ok) throw new Error("mutashabihat");
  const j = await r.json();
  return (j.data?.verses ?? j.data ?? []) as Mutashabih[];
}

export interface RandomAyah {
  surah: { number: number; name_arabic: string };
  verse: { verse_key: string; ayah: number; arabic: string };
}

export async function fetchRandomAyah(): Promise<RandomAyah> {
  const r = await fetch(`${UMMAH}/quran/random`);
  if (!r.ok) throw new Error("random");
  return (await r.json()).data as RandomAyah;
}

/** تحويل تاريخ هجري إلى ميلادي (Aladhan). */
export async function fetchHijriToGregorian(day: number, month: number, year: number) {
  const dd = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
  const r = await fetch(`${ALADHAN}/hToG/${dd}`);
  if (!r.ok) throw new Error("htog");
  const j = await r.json();
  return j.data.gregorian.date as string; // DD-MM-YYYY
}

export interface IslamicEvent {
  name: string;
  hijri: { day: number; month: number };
}

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { name: "رأس السنة الهجرية", hijri: { day: 1, month: 1 } },
  { name: "يوم عاشوراء", hijri: { day: 10, month: 1 } },
  { name: "المولد النبوي (ذكرى)", hijri: { day: 12, month: 3 } },
  { name: "الإسراء والمعراج (ذكرى)", hijri: { day: 27, month: 7 } },
  { name: "منتصف شعبان", hijri: { day: 15, month: 8 } },
  { name: "أول رمضان", hijri: { day: 1, month: 9 } },
  { name: "ليلة القدر (المرجّحة)", hijri: { day: 27, month: 9 } },
  { name: "عيد الفطر", hijri: { day: 1, month: 10 } },
  { name: "يوم عرفة", hijri: { day: 9, month: 12 } },
  { name: "عيد الأضحى", hijri: { day: 10, month: 12 } },
];

/** يرجع تواريخ المناسبات الإسلامية القادمة بالميلادي مع عدد الأيام المتبقية. */
export async function fetchUpcomingEvents() {
  const today = await fetchHijri(new Date());
  const hYear = Number(today.hijri.year);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const out = await Promise.all(
    ISLAMIC_EVENTS.map(async (e) => {
      const pick = async (y: number) => {
        const g = await fetchHijriToGregorian(e.hijri.day, e.hijri.month, y);
        const [d, m, yy] = g.split("-").map(Number);
        return new Date(yy, m - 1, d);
      };
      let date = await pick(hYear);
      if (date.getTime() < now.getTime()) date = await pick(hYear + 1);
      const days = Math.round((date.getTime() - now.getTime()) / 86400000);
      return { name: e.name, date, days };
    }),
  );
  return out.sort((a, b) => a.days - b.days);
}


