
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookText, Loader2, Maximize2, Minimize2, Pause, Play, ScrollText } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { ReciterSelect } from "@/components/quran/ReciterSelect";
import { QuranNav } from "@/components/quran/QuranNav";
import { MushafV4 } from "@/components/quran/MushafV4";
import { useNightMode } from "@/components/quran/use-night-mode";
import { getMushafStyle, MUSHAF_STYLES, V4_PAPER } from "@/lib/mushaf";
import { audioUrl, fetchPage, toArabicNumber, RECITERS } from "@/lib/quran";
import { globalAudio, useGlobalAudio } from "@/lib/audio";
import { resolvePlayableUrl } from "@/lib/audioDownloads";
import { DEFAULT_TAFSIR, fetchTafsir, TAFSIRS } from "@/lib/tafsir";
import { getMushafPrefs, saveMushafPrefs } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tafsir")({
  validateSearch: (search: Record<string, unknown>) => ({
    p: search.p ? Number(search.p) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "المصحف المجوّد مع التفسير — تفاسير متعددة لكل آية" },
      {
        name: "description",
        content:
          "اقرأ المصحف بألوان التجويد صفحة صفحة، واستمع للتلاوة مع تتبّع الآية الحالية، وشاهد تفسيرها في الأسفل من الميسر والسعدي وابن كثير والطبري والقرطبي.",
      },
      { property: "og:title", content: "المصحف المجوّد مع التفسير — باحث كتاب الله" },
      {
        property: "og:description",
        content: "مصحف ملوّن بأحكام التجويد وتفسير متزامن مع الآية التي يقرؤها الشيخ.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TafsirMode,
});

function TafsirMode() {
  const { night } = useNightMode();
  const { p } = Route.useSearch();
  const initial = Math.min(604, Math.max(1, p || 1));
  const [page, setPage] = useState(initial);
  const [input, setInput] = useState(String(initial));
  const [reciter, setReciter] = useState("ar.alafasy");
  const [tafsirId, setTafsirId] = useState(DEFAULT_TAFSIR);
  const [styleId, setStyleId] = useState(() => getMushafPrefs().style);
  const [active, setActive] = useState<number | null>(null);
  const [expand, setExpand] = useState(false);

  const audio = useGlobalAudio();
  const indexRef = useRef(0);
  const mineRef = useRef<string | null>(null);
  const onEndedRef = useRef<() => void>(() => {});

  const plain = useQuery({
    queryKey: ["page", page],
    queryFn: () => fetchPage(page),
    staleTime: Infinity,
  });

  const ayahs = plain.data?.ayahs ?? [];

  const ayahNumbers = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of ayahs) {
      const s = a.surah?.number;
      if (s) m[`${s}:${a.numberInSurah}`] = a.number;
    }
    return m;
  }, [ayahs]);

  const current = active !== null ? ayahs[active] : undefined;

  const reciterName = RECITERS.find((r) => r.id === reciter)?.name ?? reciter;
  const playingSrc = active !== null ? audioUrl(reciter, ayahs[active]?.number ?? 0) : "";
  const playing = audio.playing && audio.current?.src === playingSrc;

  const ref = useMemo(
    () =>
      current ? { surah: current.surah?.number ?? 1, ayah: current.numberInSurah } : null,
    [current],
  );

  const tafsir = useQuery({
    queryKey: ["tafsir", tafsirId, ref?.surah, ref?.ayah],
    queryFn: () => fetchTafsir(tafsirId, ref!.surah, ref!.ayah),
    enabled: !!ref,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (mineRef.current && audio.current?.src === mineRef.current) globalAudio.pause();
    setActive(null);
    setInput(String(page));
    window.scrollTo({ top: 0 });
  }, [page]);

  const playIndex = async (i: number, scrollToTafsir = false) => {
    const ayah = ayahs[i];
    if (!ayah) {
      setActive(null);
      return;
    }
    indexRef.current = i;
    setActive(i);
    const src = audioUrl(reciter, ayah.number);
    mineRef.current = src;
    const playSrc = await resolvePlayableUrl(src);
    globalAudio.play(
      {
        src,
        playSrc,
        title: `سورة ${ayah.surah?.name ?? ""}`,
        subtitle: `الآية ${toArabicNumber(ayah.numberInSurah)} — ${reciterName}`,
        href: "/tafsir",
      },
      { onEnded: onEndedRef.current },
    );
    document.getElementById(`t-ayah-${i}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (scrollToTafsir) {
      window.setTimeout(() => {
        document.getElementById("tafsir-panel")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 350);
    }
  };

  onEndedRef.current = () => {
    const next = indexRef.current + 1;
    if (next < ayahs.length) void playIndex(next);
    else if (page < 604) setPage(page + 1);
    else globalAudio.pause();
  };

  const toggle = () => {
    if (playing) {
      globalAudio.pause();
    } else if (playingSrc && audio.current?.src === playingSrc) {
      globalAudio.resume();
    } else {
      void playIndex(0, true);
    }
  };

  const go = (n: number) => setPage(Math.min(604, Math.max(1, n)));

  const mushafStyle = getMushafStyle(styleId);

  useEffect(() => {
    saveMushafPrefs({ ...getMushafPrefs(), style: styleId });
  }, [styleId]);

  return (
    <main className="min-h-screen pb-4">
      <ModeHeader title="المصحف المجوّد والتفسير" subtitle={`الصفحة ${toArabicNumber(page)} من ٦٠٤`}>
        <div className="flex flex-wrap items-center gap-2">
          <QuranNav label="سورة / جزء / صفحة" onSelect={(t) => setPage(t.page)} />
          <Button size="sm" variant="secondary" onClick={() => go(page - 1)}>
            السابقة
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
          <Button size="sm" variant="secondary" onClick={() => go(page + 1)}>
            التالية
          </Button>
          <ReciterSelect value={reciter} onChange={setReciter} className="h-8 w-36 text-xs" />
          <select
            value={tafsirId}
            onChange={(e) => setTafsirId(Number(e.target.value))}
            aria-label="نوع التفسير"
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground"
          >
            {TAFSIRS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
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
        </div>
      </ModeHeader>

      {/* المصحف في الأعلى */}
      <section className={cn("mx-auto px-3 pt-4", expand ? "max-w-4xl" : "max-w-2xl")}>
        <article
          className="rounded-3xl border-2 border-gold/50 p-5 shadow-soft"
          style={{ background: styleId === "v4" ? V4_PAPER(night) : mushafStyle.paper }}
        >
          {plain.isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : styleId === "v4" ? (
            <MushafV4
              page={page}
              night={night}
              ayahNumbers={ayahNumbers}
              activeNumber={active !== null ? (ayahs[active]?.number ?? null) : null}
              onWordClick={(n) => {
                const i = ayahs.findIndex((a) => a.number === n);
                if (i >= 0) playIndex(i, true);
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
        </article>
      </section>

      {/* التفسير في الأسفل (لا يغطي المصحف) */}
      <section id="tafsir-panel" className={cn("mx-auto mt-4 px-3 pb-8", expand ? "max-w-4xl" : "max-w-2xl")}>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ScrollText className="size-4 text-gold" />
              {ref
                ? `${current?.surah?.name} — الآية ${toArabicNumber(ref.ayah)}`
                : "اضغط على أي آية لعرض تفسيرها"}
            </h2>
            <button
              onClick={toggle}
              aria-label="تشغيل التلاوة"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-gradient text-gold-foreground shadow-glow"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
          </div>
          <div className="max-h-[65dvh] overflow-y-auto text-sm leading-7 text-foreground">
            {!ref ? (
              <p className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <BookText className="size-4" />{" "}
                {styleId === "v4"
                  ? "اختر آية من المصحف بالأعلى، أو شغّل التلاوة ليتغيّر التفسير مع كل آية يقرؤها الشيخ."
                  : "شغّل التلاوة ليتغيّر التفسير مع كل آية يقرؤها الشيخ (نمط الصور لا يدعم النقر على الآيات)."}
              </p>
            ) : tafsir.isLoading ? (
              <Loader2 className="my-4 size-5 animate-spin" />
            ) : tafsir.isError ? (
              <p className="text-destructive">تعذّر تحميل التفسير، حاول مرة أخرى.</p>
            ) : (
              <div
                className="tafsir-body space-y-2 [&_h2]:font-bold [&_h2]:text-foreground [&_p]:text-foreground"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: tafsir.data || "لا يوجد نص لهذه الآية." }}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}


