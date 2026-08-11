
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { BookmarkButton } from "@/components/quran/BookmarkButton";
import { NoteButton } from "@/components/quran/NoteButton";
import { API, toArabicNumber } from "@/lib/quran";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "بحث في آيات القرآن الكريم — كلمة أو عبارة" },
      {
        name: "description",
        content:
          "ابحث عن أي كلمة أو عبارة في القرآن الكريم كاملاً، واحصل على الآيات مع اسم السورة ورقم الآية وروابط القراءة والاستماع.",
      },
      { property: "og:title", content: "البحث في الآيات — باحث كتاب الله" },
      {
        property: "og:description",
        content: "بحث فوري على مستوى الآية في المصحف كاملاً دون إنترنت بعد أول تحميل.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchMode,
});

interface Row {
  surah: number;
  surahName: string;
  ayah: number;
  page: number;
  text: string;
  norm: string;
  normAlt: string;
}

/** Normalizes for matching. Returns two forms:
 *  [strip dagger-alef → keeps "الله" from اللّٰه] and
 *  [dagger-alef → ا → keeps "العالمين" from العٰلمين]. */
const normForms = (s: string): [string, string] => {
  const base = s
    .replace(/^\uFEFF/, "")
    .replace(/[\u064B-\u0652\u0640\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
  return [base.replace(/\u0670/g, ""), base.replace(/\u0670/g, "ا")];
};

async function loadIndex(): Promise<Row[]> {
  let surahs: Array<{
    number: number;
    name: string;
    ayahs: Array<{ text: string; numberInSurah: number; page: number }>;
  }> = [];
  const local = await fetch(`${import.meta.env.BASE_URL}data/quran/quran-uthmani.json`);
  if (local.ok) {
    surahs = (await local.json()) as typeof surahs;
  } else {
    const res = await fetch(`${API}/quran/quran-simple`);
    if (!res.ok) throw new Error("تعذّر تحميل نص المصحف");
    const json = await res.json();
    surahs = json.data.surahs;
  }
  const rows: Row[] = [];
  for (const s of surahs) {
    for (const a of s.ayahs) {
      const [norm, normAlt] = normForms(a.text);
      rows.push({
        surah: s.number,
        surahName: s.name,
        ayah: a.numberInSurah,
        page: a.page,
        text: a.text,
        norm,
        normAlt,
      });
    }
  }
  return rows;
}

function SearchMode() {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(100);
  const index = useQuery({ queryKey: ["quran-index"], queryFn: loadIndex, staleTime: Infinity });

  const matches = useMemo(() => {
    const [needle, needleAlt] = normForms(q);
    if (needle.length < 2 || !index.data) return [];
    return index.data.filter((r) => r.norm.includes(needle) || r.normAlt.includes(needleAlt));
  }, [q, index.data]);

  useEffect(() => {
    setLimit(100);
  }, [q]);

  const total = matches.length;
  const visible = matches.slice(0, limit);
  const hidden = total - limit;
  const STEP = 200;

  return (
    <main className="min-h-screen pb-20">
      <ModeHeader title="البحث في الآيات" subtitle="ابحث عن كلمة أو عبارة في المصحف كاملاً">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="مثال: الحمد لله رب العالمين"
            className="h-11 bg-card pr-9 text-card-foreground"
            aria-label="كلمة البحث"
          />
        </div>
      </ModeHeader>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {index.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جاري تجهيز فهرس المصحف…
          </div>
        ) : index.isError ? (
          <p className="py-16 text-center text-sm text-destructive">تعذّر تحميل نص المصحف.</p>
        ) : normForms(q)[0].length < 2 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            اكتب حرفين على الأقل لبدء البحث في ٦٢٣٦ آية.
          </p>
        ) : total === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
        ) : (
          <>
            <p className="mb-4 text-center text-xs text-muted-foreground">
              {toArabicNumber(total)} نتيجة
            </p>
            <ul className="space-y-3">
              {visible.map((r) => (
                <li key={`${r.surah}-${r.ayah}`} className="ayah-frame px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-quran text-sm text-primary">{r.surahName}</span>
                    <span>آية {toArabicNumber(r.ayah)}</span>
                    <span>· صفحة {toArabicNumber(r.page)}</span>
                    <span className="flex-1" />
                    <BookmarkButton
                      item={{
                        kind: "ayah",
                        surah: r.surah,
                        surahName: r.surahName,
                        ayah: r.ayah,
                        text: r.text.slice(0, 160),
                      }}
                    />
                    <NoteButton
                      surah={r.surah}
                      surahName={r.surahName}
                      ayah={r.ayah}
                      text={r.text}
                    />
                  </div>
                  <p className="font-quran text-[22px] leading-[2.2] text-foreground">{r.text}</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <Link
                      to="/read"
                      search={{ s: r.surah, a: r.ayah }}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      فتح في الوضع المستمر
                    </Link>
                    <Link
                      to="/page"
                      search={{ p: r.page }}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      فتح في المصحف
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            {hidden > 0 ? (
              <button
                type="button"
                onClick={() => setLimit((l) => l + STEP)}
                className="mx-auto mt-6 block rounded-xl border border-gold/50 bg-card px-6 py-2.5 text-sm font-bold text-primary shadow-soft transition-colors hover:border-gold"
              >
                عرض المزيد — تبقّى {toArabicNumber(hidden)} آية
              </button>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}


