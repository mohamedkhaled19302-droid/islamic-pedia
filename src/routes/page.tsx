
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookImage, ChevronDown, ChevronUp, Gauge, Globe, LayoutList, Loader2, Maximize2, Minus, Minimize2, Moon, Pause, Play, Plus, Sun } from "lucide-react";
import { QuranNav } from "@/components/quran/QuranNav";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { ReciterSelect } from "@/components/quran/ReciterSelect";
import { BookmarkButton } from "@/components/quran/BookmarkButton";
import { NoteButton } from "@/components/quran/NoteButton";

import { getMushafStyle, MUSHAF_STYLES, V4_PAPER } from "@/lib/mushaf";
import { MushafV4 } from "@/components/quran/MushafV4";
import { useNightMode } from "@/components/quran/use-night-mode";
import { audioUrl, fetchPage, stripBasmala, toArabicNumber, RECITERS } from "@/lib/quran";
import { globalAudio, useGlobalAudio } from "@/lib/audio";
import { resolvePlayableUrl } from "@/lib/audioDownloads";

import { getMushafPrefs, saveMushafPrefs, saveProgress } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/page")({
  validateSearch: (search: Record<string, unknown>) => ({
    p: search.p ? Number(search.p) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "وضع صفحة صفحة — تصفّح المصحف الشريف" },
      {
        name: "description",
        content:
          "اقرأ القرآن الكريم كما في المصحف المطبوع من الصفحة ١ إلى ٦٠٤، مع تشغيل الآيات وتكرارها والتحكم بسرعة التلاوة.",
      },
      { property: "og:title", content: "صفحة صفحة — باحث كتاب الله" },
      {
        property: "og:description",
        content: "تجربة المصحف الورقي على الشاشة مع تلاوة وتكرار للآيات.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PageMode,
});

const SPEEDS = [0.75, 1, 1.25, 1.5];

function PageMode() {
  const { night, toggle } = useNightMode();
  const { p } = Route.useSearch();
  const initial = Math.min(604, Math.max(1, p || 1));
  const [page, setPage] = useState(initial);
  const [input, setInput] = useState(String(initial));
  const [reciter, setReciter] = useState("ar.alafasy");
  const [repeat, setRepeat] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [view, setView] = useState<"mushaf" | "ayah" | "searchtruth">("mushaf");
  const [styleId, setStyleId] = useState("v4");
  const [expand, setExpand] = useState(false);
  const [fontSize, setFontSize] = useState(30);
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);



  useEffect(() => {
    const p = getMushafPrefs();
    setView(p.view);
    setStyleId(p.style);
  }, []);

  useEffect(() => {
    saveMushafPrefs({ view, style: styleId });
  }, [view, styleId]);

  const mushafStyle = getMushafStyle(styleId);

  const audio = useGlobalAudio();
  const indexRef = useRef(0);
  const repeatLeft = useRef(0);
  const mineRef = useRef<string | null>(null);
  const onEndedRef = useRef<() => void>(() => {});
  const pendingAutoRef = useRef(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["page", page],
    queryFn: () => fetchPage(page),
    staleTime: Infinity,
  });

  const ayahs = data?.ayahs ?? [];

  const ayahNumbers = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of ayahs) {
      const s = a.surah?.number;
      if (s) m[`${s}:${a.numberInSurah}`] = a.number;
    }
    return m;
  }, [ayahs]);

  const reciterName = RECITERS.find((r) => r.id === reciter)?.name ?? reciter;
  const srcOf = (i: number) => (i >= 0 && i < ayahs.length ? audioUrl(reciter, ayahs[i].number) : "");
  const playingSrc = activeIndex !== null ? srcOf(activeIndex) : "";
  const isPlaying = audio.playing && audio.current?.src === playingSrc;

  useEffect(() => {
    if (mineRef.current && audio.current?.src === mineRef.current && !pendingAutoRef.current) {
      globalAudio.pause();
    }
    setActiveIndex(null);
    setInput(String(page));
    window.scrollTo({ top: 0 });
    saveProgress({
      mode: "page",
      label: `الصفحة ${toArabicNumber(page)}`,
      value: page,
      at: Date.now(),
    });
  }, [page]);

  useEffect(() => {
    if (pendingAutoRef.current && ayahs.length > 0) {
      pendingAutoRef.current = false;
      void playIndex(0);
    }
  }, [ayahs.length]);

  useEffect(() => {
    globalAudio.setRate(speed);
  }, [speed]);

  const playIndex = async (i: number) => {
    const ayah = ayahs[i];
    if (!ayah) {
      setActiveIndex(null);
      return;
    }
    indexRef.current = i;
    repeatLeft.current = repeat;
    setActiveIndex(i);
    const src = audioUrl(reciter, ayah.number);
    mineRef.current = src;
    const playSrc = await resolvePlayableUrl(src);
    globalAudio.play(
      {
        src,
        playSrc,
        title: `سورة ${ayah.surah?.name ?? ""}`,
        subtitle: `الآية ${toArabicNumber(ayah.numberInSurah)} — ${reciterName}`,
        href: "/page",
      },
      { rate: speed, onEnded: onEndedRef.current },
    );
    document
      .getElementById(`p-ayah-${i}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  onEndedRef.current = () => {
    if (repeatLeft.current > 0) {
      repeatLeft.current -= 1;
      globalAudio.replay();
      return;
    }
    if (!autoPlay) {
      setActiveIndex(null);
      return;
    }
    const next = indexRef.current + 1;
    if (next < ayahs.length) void playIndex(next);
    else if (page < 604) {
      pendingAutoRef.current = true;
      setPage(page + 1);
    } else setActiveIndex(null);
  };

  const go = (n: number) => setPage(Math.min(604, Math.max(1, n)));

  return (
    <main className="min-h-screen pb-28">
      <ModeHeader title="صفحة صفحة" subtitle={`الصفحة ${toArabicNumber(page)} من ٦٠٤`}>
        <div className="flex flex-wrap items-center gap-2">
          <QuranNav label="سورة / جزء / صفحة" onSelect={(t) => setPage(t.page)} />
          <div className="flex items-center gap-1">
            <Button size="icon" variant="secondary" className="size-8" aria-label="الصفحة السابقة" onClick={() => go(page - 1)}>
              <ChevronUp className="size-4" />
            </Button>
            <Input
              value={input}
              inputMode="numeric"
              onChange={(e) => setInput(e.target.value)}
              onBlur={() => go(Number(input) || 1)}
              onKeyDown={(e) => e.key === "Enter" && go(Number(input) || 1)}
              className="h-8 w-16 text-center"
              aria-label="رقم الصفحة"
            />
            <Button size="icon" variant="secondary" className="size-8" aria-label="الصفحة التالية" onClick={() => go(page + 1)}>
              <ChevronDown className="size-4" />
            </Button>
          </div>

          <ReciterSelect value={reciter} onChange={setReciter} className="h-8 w-36 text-xs" />

          <div className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            <span>تكرار</span>
            <select
              value={repeat}
              onChange={(e) => setRepeat(Number(e.target.value))}
              aria-label="عدد مرات التكرار"
              className="bg-transparent outline-none"
            >
              {Array.from({ length: 11 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            variant={autoPlay ? "default" : "secondary"}
            onClick={() => setAutoPlay((v) => !v)}
          >
            تشغيل تلقائي
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
          >
            <Gauge className="size-4" /> {speed}×
          </Button>
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-0.5">
            {([
              ["mushaf", "مصحف", <BookImage key="a" className="size-4" />],
              ["ayah", "آية آية", <LayoutList key="b" className="size-4" />],
              ["searchtruth", "مصحف SearchTruth", <Globe key="d" className="size-4" />],
            ] as const).map(([v, label, icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {view === "mushaf" ? (
            <select
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              aria-label="نوع المصحف"
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground"
            >
              {MUSHAF_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button
            size="sm"
            variant={expand ? "default" : "secondary"}
            onClick={() => setExpand((v) => !v)}
            aria-label="توسيع العرض"
            className="gap-1"
          >
            {expand ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            {expand ? "تصغير" : "توسيع"}
          </Button>
          <div className="flex items-center gap-1 rounded-lg bg-secondary px-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="تصغير الخط"
              onClick={() => setFontSize((f) => Math.max(20, f - 2))}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="text-xs text-secondary-foreground">{fontSize}</span>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="تكبير الخط"
              onClick={() => setFontSize((f) => Math.min(64, f + 2))}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <Button size="sm" variant="secondary" onClick={toggle} aria-label="الوضع الليلي">
            {night ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </ModeHeader>

      {view === "searchtruth" ? (
        <section className="w-full px-0 py-3">
          <div className="mx-auto mb-2 max-w-[1600px] px-4 text-xs text-muted-foreground">
            مصحف SearchTruth كاملاً داخل التطبيق — تصفّح الصفحات والسور مباشرة.
          </div>
          <iframe
            src="https://www.searchtruth.com/mushaf/quran.php"
            title="مصحف SearchTruth"
            loading="lazy"
            className="block h-[calc(100dvh-160px)] min-h-[700px] w-full border-0 bg-card"
          />
        </section>
      ) : null}

      <div className={cn("mx-auto px-4 py-6", expand ? "max-w-4xl" : "max-w-2xl", view === "searchtruth" ? "hidden" : "")}>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-destructive">تعذّر تحميل الصفحة.</p>
        ) : view === "mushaf" ? (
          <article
            onTouchStart={(e) => {
              touchX.current = e.touches[0].clientX;
              touchY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (touchX.current === null || touchY.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              const dy = e.changedTouches[0].clientY - touchY.current;
              touchX.current = null;
              touchY.current = null;
              if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
              if (dx > 0) go(page + 1);
              else go(page - 1);
            }}
            className="mushaf-swipe overflow-hidden rounded-3xl border-2 border-gold/50 p-3 shadow-soft"
            style={{ background: styleId === "v4" ? V4_PAPER(night) : mushafStyle.paper }}
          >
            {styleId === "v4" ? (
              <MushafV4
                page={page}
                night={night}
                ayahNumbers={ayahNumbers}
                activeNumber={activeIndex !== null ? (ayahs[activeIndex]?.number ?? null) : null}
                onWordClick={(n) => {
                  const i = ayahs.findIndex((a) => a.number === n);
                  if (i >= 0) playIndex(i);
                }}
              />
            ) : (
              <img
                key={mushafStyle.id + page}
                src={mushafStyle.url(page)}
                alt={`صفحة ${page} من المصحف الشريف — ${mushafStyle.name}`}
                width={622}
                height={917}
                loading="eager"
                className="mx-auto block h-auto w-full select-none"
              />
            )}
            <div className="mt-3 flex flex-col items-center gap-1 border-t border-gold/30 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>{toArabicNumber(page)}</span>
                <BookmarkButton item={{ kind: "page", page }} />
              </div>
              <span className="text-[10px] opacity-70">{mushafStyle.hint}</span>
            </div>
          </article>
        ) : (
          <article
            onTouchStart={(e) => {
              touchX.current = e.touches[0].clientX;
              touchY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (touchX.current === null || touchY.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              const dy = e.changedTouches[0].clientY - touchY.current;
              touchX.current = null;
              touchY.current = null;
              if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
              if (dx > 0) go(page + 1);
              else go(page - 1);
            }}
            className="rounded-3xl border-2 border-gold/50 bg-card p-5 shadow-soft"
          >
            {ayahs.map((a, i) => {
              const isFirst = a.numberInSurah === 1;
              return (
                <span key={a.number}>
                  {isFirst ? (
                    <div className="my-4 rounded-xl border border-gold/40 bg-hero px-3 py-2 text-center text-primary-foreground">
                      <span className="font-quran text-xl text-gold">{a.surah?.name}</span>
                    </div>
                  ) : null}
                  {isFirst && a.surah?.number !== 9 ? (
                    <p className="font-quran my-3 text-center text-xl text-primary">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </p>
                  ) : null}
                  <span
                    id={`p-ayah-${i}`}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      isPlaying && audio.current?.src === srcOf(i)
                        ? (globalAudio.pause(), setActiveIndex(null))
                        : void playIndex(i)
                    }
                    onKeyDown={(e) => e.key === "Enter" && playIndex(i)}
                    className={`font-quran cursor-pointer leading-[2.6] transition-colors ${
                      activeIndex === i
                        ? "rounded-md bg-accent text-accent-foreground"
                        : "text-foreground hover:text-primary"
                    }`}
                    style={{ fontSize }}
                  >
                    {stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah)}
                    <span className="mx-1 inline-grid size-7 place-items-center rounded-full bg-gold-gradient align-middle text-[11px] font-bold text-gold-foreground">
                      {toArabicNumber(a.numberInSurah)}
                    </span>
                    <BookmarkButton
                      className="mx-1 inline-flex align-middle"
                      item={{
                        kind: "ayah",
                        surah: a.surah?.number,
                        surahName: a.surah?.name,
                        ayah: a.numberInSurah,
                        text: stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah).slice(0, 160),
                      }}
                    />
                    <NoteButton
                      className="mx-1 inline-flex align-middle"
                      surah={a.surah?.number ?? 0}
                      surahName={a.surah?.name}
                      ayah={a.numberInSurah}
                      text={stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah)}
                    />
                  </span>{" "}
                </span>
              );
            })}
            <div className="mt-6 flex items-center justify-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{toArabicNumber(page)}</span>
              <BookmarkButton item={{ kind: "page", page }} />
            </div>
          </article>
        )}
      </div>





      <div className="fixed bottom-5 left-5 z-30 flex flex-col items-center gap-2">
        <button
          onClick={() => {
            if (isPlaying) {
              globalAudio.pause();
            } else if (playingSrc && audio.current?.src === playingSrc) {
              globalAudio.resume();
            } else {
              void playIndex(0);
            }
          }}
          aria-label="تشغيل الصفحة كاملة"
          title={isPlaying ? "إيقاف مؤقت" : "تشغيل تلاوة الصفحة من البداية"}
          className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-105"
        >
          {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          <span>{isPlaying ? "إيقاف مؤقت" : "تشغيل الصفحة"}</span>
        </button>
      </div>
    </main>
  );
}


