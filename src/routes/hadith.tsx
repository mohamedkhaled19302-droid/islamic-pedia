
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Library, Loader2, Search, ShieldAlert } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import {
  ALL_BOOKS,
  FABRICATED_HADITHS,
  fetchBookInfo,
  fetchSection,
  findBook,
  HADITH_PARTS,
  searchAllBooks,
  searchRuled,
  WEAK_HADITHS,
  type HadithHit,
  type RuledHadith,
} from "@/lib/hadith";
import { CHAPTER_TITLES_AR } from "@/lib/hadith-chapters";

import { toArabicNumber } from "@/lib/quran";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hadith")({
  head: () => ({
    meta: [
      { title: "مكتبة الحديث — البخاري ومسلم والسنن والضعيف والموضوع" },
      {
        name: "description",
        content:
          "مكتبة حديثية مقسّمة إلى أجزاء: صحيح البخاري، صحيح مسلم، السنن الأربعة، مع أبواب الأحاديث الضعيفة والموضوعة وبيان حكم كل حديث، بتصفّح على شكل كتاب.",
      },
      { property: "og:title", content: "مكتبة الحديث — باحث كتاب الله" },
      {
        property: "og:description",
        content: "كتب السنة في مكان واحد مع تقليب الصفحات وبيان درجة كل حديث.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HadithLibrary,
});

const PER_PAGE = 5;
type Shelf = string | "weak" | "fabricated";

function HadithSearch() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [hits, setHits] = useState<HadithHit[] | null>(null);
  const [ruled, setRuled] = useState<{ weak: RuledHadith[]; fabricated: RuledHadith[] }>({
    weak: [],
    fabricated: [],
  });

  const run = async () => {
    if (q.trim().length < 2) return;
    setBusy(true);
    setHits(null);
    setRuled(searchRuled(q));
    try {
      const res = await searchAllBooks(q, {
        onProgress: (name, i, total) => setProgress(`${name} (${toArabicNumber(i)}/${toArabicNumber(total)})`),
      });
      setHits(res);
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <div className="mb-5 rounded-2xl border border-gold/40 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="ابحث عن كلمة أو جملة في كل كتب الحديث…"
            className="h-10 w-full rounded-xl border border-input bg-background pr-9 pl-3 text-sm"
          />
        </div>
        <Button onClick={run} disabled={busy || q.trim().length < 2} className="gap-1">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} بحث
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {busy
          ? `جارٍ البحث في ${progress}… قد يستغرق الأمر قليلاً في أول مرة.`
          : "يبحث المحرك داخل كل كتب السنة المتاحة في التطبيق مع الضعيف والموضوع."}
      </p>

      {hits ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold text-primary">
            النتائج: {toArabicNumber(hits.length + ruled.weak.length + ruled.fabricated.length)}
          </p>
          {[...ruled.weak.map((h) => ({ ...h, tag: "ضعيف" })), ...ruled.fabricated.map((h) => ({ ...h, tag: "موضوع" }))].map(
            (h, i) => (
              <div key={`r-${i}`} className="rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                <p className="font-quran text-lg leading-9">«{h.text}»</p>
                <p className="mt-1 text-[11px] font-bold text-destructive">
                  {h.tag} — {h.ruling}
                </p>
                <p className="text-[11px] text-muted-foreground">{h.source}</p>
              </div>
            ),
          )}
          {hits.map((h, i) => (
            <div key={`${h.bookSlug}-${h.hadithnumber}-${i}`} className="rounded-xl border border-border bg-background p-3">
              <p className="text-[11px] text-primary">
                {h.bookName} — حديث {toArabicNumber(h.hadithnumber)}
                {h.grades?.[0] ? ` · ${h.grades[0].grade}` : ""}
              </p>
              <p className="font-quran mt-1 text-lg leading-9 text-foreground">{h.text}</p>
            </div>
          ))}
          {hits.length + ruled.weak.length + ruled.fabricated.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function HadithLibrary() {
  const [shelf, setShelf] = useState<Shelf>("bukhari");
  const [section, setSection] = useState(1);
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);

  const isRuled = shelf === "weak" || shelf === "fabricated";
  const book = useMemo(() => (isRuled ? null : findBook(shelf)), [shelf, isRuled]);


  const info = useQuery({
    queryKey: ["hadith-info", book?.slug],
    queryFn: () => fetchBookInfo(book!.slug),
    enabled: !!book,
    staleTime: Infinity,
  });

  const data = useQuery({
    queryKey: ["hadith-section", book?.edition, section],
    queryFn: () => fetchSection(book!.edition, section),
    enabled: !!book,
    staleTime: Infinity,
  });

  useEffect(() => {
    setSection(1);
    setPage(0);
  }, [shelf]);
  useEffect(() => setPage(0), [section]);

  const ruled: RuledHadith[] = shelf === "weak" ? WEAK_HADITHS : FABRICATED_HADITHS;
  const items = isRuled ? ruled : (data.data?.hadiths ?? []);
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const slice = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const turn = (dir: "next" | "prev") => {
    setFlip(dir);
    setTimeout(() => {
      setPage((p) => Math.min(totalPages - 1, Math.max(0, p + (dir === "next" ? 1 : -1))));
      setFlip(null);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }, 220);
  };

  const arTitles = book ? (CHAPTER_TITLES_AR[book.slug] ?? {}) : {};
  const sectionTitle = arTitles[String(section)] ?? `الباب ${toArabicNumber(section)}`;

  return (
    <main className="min-h-screen pb-24">
      <ModeHeader title="مكتبة الحديث" subtitle="كتب السنة النبوية في مكان واحد">
        <div className="flex flex-wrap items-center gap-2">
          {!isRuled && info.data?.sections.length ? (
            <select
              value={section}
              onChange={(e) => setSection(Number(e.target.value))}
              aria-label="اختر الباب"
              className="h-8 max-w-[15rem] rounded-lg border border-input bg-background px-2 text-xs text-foreground"
            >
              {info.data.sections.map((s) => (
                <option key={s.n} value={s.n}>
                  {toArabicNumber(s.n)} — {arTitles[String(s.n)] ?? s.title}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </ModeHeader>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <HadithSearch />

        {/* الأجزاء */}

        <div className="mb-5 space-y-3">
          {HADITH_PARTS.map((part) => (
            <section key={part.id}>
              <h2 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Library className="size-3.5 text-gold" /> {part.title}
                <span className="font-normal opacity-70">· {part.hint}</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {part.books.map((b) => (
                  <button
                    key={b.slug}
                    onClick={() => setShelf(b.slug)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                      shelf === b.slug
                        ? "border-gold bg-gold-gradient text-gold-foreground"
                        : "border-border bg-card text-foreground hover:border-gold/60",
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <ShieldAlert className="size-3.5 text-destructive" /> الجزء الرابع — التحذير
              <span className="font-normal opacity-70">· احذر نسبتها للنبي ﷺ</span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["weak", "الأحاديث الضعيفة"],
                  ["fabricated", "الأحاديث الموضوعة (المكذوبة)"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setShelf(id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    shelf === id
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : "border-border bg-card text-foreground hover:border-destructive/60",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* الكتاب */}
        <article
          className={cn(
            "origin-right rounded-3xl border-2 border-gold/50 p-5 shadow-soft transition-all duration-200",
            flip === "next" && "-rotate-y-6 translate-x-4 opacity-40",
            flip === "prev" && "rotate-y-6 -translate-x-4 opacity-40",
          )}
          style={{ background: "#fdfaf1", perspective: "1200px" }}
        >
          <header className="mb-4 border-b border-gold/30 pb-3 text-center">
            <h3 className="font-hand text-2xl" style={{ color: "#5b4a1f" }}>
              {isRuled
                ? shelf === "weak"
                  ? "الأحاديث الضعيفة"
                  : "الأحاديث الموضوعة"
                : book?.name}
            </h3>
            <p className="mt-0.5 text-[11px]" style={{ color: "#8a7a4f" }}>
              {isRuled ? "مشهورة على الألسنة — مع بيان الحكم والمصدر" : `${book?.author} · ${sectionTitle}`}
            </p>
          </header>

          {!isRuled && (data.isLoading || info.isLoading) ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin" style={{ color: "#8a7a4f" }} />
            </div>
          ) : !isRuled && data.isError ? (
            <p className="py-12 text-center text-sm text-destructive">
              تعذّر تحميل هذا الباب، جرّب باباً آخر أو تحقق من الاتصال.
            </p>
          ) : (
            <ol className="space-y-5">
              {isRuled
                ? (slice as RuledHadith[]).map((h, i) => (
                    <li key={i} className="border-b border-dashed border-gold/30 pb-4 last:border-0">
                      <p className="font-quran text-[20px] leading-[2.1]" style={{ color: "#2a2418" }}>
                        «{h.text}»
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2 py-1 text-[11px] font-bold text-destructive">
                        <AlertTriangle className="size-3.5" /> {h.ruling}
                      </p>
                      <p className="mt-1.5 text-[11px]" style={{ color: "#7a6a45" }}>
                        {h.source}
                      </p>
                    </li>
                  ))
                : (slice as { hadithnumber: number; text: string; grades?: { name: string; grade: string }[] }[]).map(
                    (h) => (
                      <li
                        key={h.hadithnumber}
                        className="border-b border-dashed border-gold/30 pb-4 last:border-0"
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="grid size-7 place-items-center rounded-full bg-gold-gradient text-[11px] font-bold text-gold-foreground">
                            {toArabicNumber(h.hadithnumber)}
                          </span>
                          {h.grades?.slice(0, 2).map((g) => (
                            <span
                              key={g.name}
                              className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                            >
                              {g.grade}
                            </span>
                          ))}
                        </div>
                        <p
                          className="font-quran text-[20px] leading-[2.15]"
                          style={{ color: "#2a2418" }}
                        >
                          {h.text}
                        </p>
                      </li>
                    ),
                  )}
            </ol>
          )}

          <footer className="mt-5 flex items-center justify-between border-t border-gold/30 pt-3">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              disabled={page === 0}
              onClick={() => turn("prev")}
            >
              <ChevronRight className="size-4" /> الصفحة السابقة
            </Button>
            <span className="flex items-center gap-1 text-xs" style={{ color: "#8a7a4f" }}>
              <BookOpen className="size-3.5" />
              {toArabicNumber(page + 1)} / {toArabicNumber(totalPages)}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1"
              disabled={page >= totalPages - 1}
              onClick={() => turn("next")}
            >
              الصفحة التالية <ChevronLeft className="size-4" />
            </Button>
          </footer>
        </article>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          مصدر نصوص الكتب التسعة: مشروع Hadith API المفتوح · الأحكام على الأحاديث الضعيفة والموضوعة
          من «السلسلة الضعيفة» للألباني و«كشف الخفاء» للعجلوني · عدد الكتب المتاحة{" "}
          {toArabicNumber(ALL_BOOKS.length)}.
        </p>
      </div>
    </main>
  );
}


