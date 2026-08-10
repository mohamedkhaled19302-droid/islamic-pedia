
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Languages, Loader2, Maximize2, Minus, Minimize2, Moon, Plus, Sun } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { ReciterSelect } from "@/components/quran/ReciterSelect";
import { SurahBlock } from "@/components/quran/SurahBlock";
import { QuranNav } from "@/components/quran/QuranNav";
import { useNightMode } from "@/components/quran/use-night-mode";
import { fetchSurahs } from "@/lib/quran";
import { saveProgress } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/read")({
  validateSearch: (search: Record<string, unknown>) => ({
    s: search.s ? Number(search.s) : undefined,
    a: search.a ? Number(search.a) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "الوضع المستمر — قراءة القرآن الكريم كاملاً" },
      {
        name: "description",
        content:
          "تصفّح القرآن الكريم في شريط مستمر مع النص العثماني والترجمة الإنجليزية وتلاوات ستة عشر قارئاً، وتنقّل سريع بالسورة أو الجزء أو الصفحة.",
      },
      { property: "og:title", content: "الوضع المستمر — باحث كتاب الله" },
      {
        property: "og:description",
        content: "قراءة متواصلة للقرآن الكريم مع الصوت والترجمة والتحكم بحجم الخط.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContinuousMode,
});

function ContinuousMode() {
  const { night, toggle } = useNightMode();
  const { s: startSurah, a: startAyah } = Route.useSearch();
  const [reciter, setReciter] = useState("ar.alafasy");
  const [fontSize, setFontSize] = useState(32);
  const [expand, setExpand] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loaded, setLoaded] = useState<number[]>([Math.min(114, Math.max(1, startSurah || 1))]);
  const [active, setActive] = useState<number | null>(null);
  const [startSignal, setStartSignal] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const surahs = useQuery({ queryKey: ["surahs"], queryFn: fetchSurahs, staleTime: Infinity });

  useEffect(() => {
    if (!startAyah) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`ayah-${startSurah}-${startAyah}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 900);
    return () => window.clearTimeout(t);
  }, [startSurah, startAyah]);

  useEffect(() => {
    const current = loaded[loaded.length - 1];
    const meta = (surahs.data ?? []).find((x) => x.number === current);
    if (!meta) return;
    saveProgress({
      mode: "read",
      label: `سورة ${meta.name}`,
      value: current,
      at: Date.now(),
    });
  }, [loaded, surahs.data]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setLoaded((prev) => {
          const next = prev[prev.length - 1] + 1;
          return next <= 114 ? [...prev, next] : prev;
        });
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const jumpTo = (surah: number, ayah = 1) => {
    setLoaded((prev) => (prev.includes(surah) ? prev : [surah]));
    window.setTimeout(() => {
      const target =
        document.getElementById(`ayah-${surah}-${ayah}`) ??
        document.getElementById(`surah-${surah}`);
      target?.scrollIntoView({ behavior: "smooth", block: ayah > 1 ? "center" : "start" });
    }, 200);
  };

  const advance = (surah: number) => {
    const next = surah + 1;
    if (next > 114) {
      setActive(null);
      return;
    }
    setLoaded((prev) => (prev.includes(next) ? prev : [...prev, next]));
    setActive(next);
    setStartSignal(next);
    window.setTimeout(() => {
      document.getElementById(`surah-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  };

  return (
    <main className="min-h-screen pb-24">
      <ModeHeader title="الوضع المستمر" subtitle="Continuous Mode">
        <div className="flex flex-wrap items-center gap-2">
          <QuranNav label="السور والأجزاء" onSelect={(t) => jumpTo(t.surah, t.ayah)} />

          <ReciterSelect value={reciter} onChange={setReciter} className="h-8 w-40 text-xs" />

          <Button
            size="sm"
            variant={showTranslation ? "default" : "secondary"}
            onClick={() => setShowTranslation((v) => !v)}
            className="gap-1"
          >
            <Languages className="size-4" /> الترجمة
          </Button>
          <Button
            size="sm"
            variant={expand ? "default" : "secondary"}
            onClick={() => {
              setExpand((v) => {
                const next = !v;
                if (next) setFontSize((f) => Math.max(f, 42));
                return next;
              });
            }}
            aria-label="توسيع النص"
            className="gap-1"
          >
            {expand ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            {expand ? "تصغير" : "توسيع"}
          </Button>
          <Button size="sm" variant="secondary" onClick={toggle} aria-label="الوضع الليلي">
            {night ? <Sun className="size-4" /> : <Moon className="size-4" />}
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
        </div>
      </ModeHeader>

      <div className={cn("mx-auto", expand ? "max-w-4xl" : "max-w-3xl")}>
        {surahs.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {loaded.map((n) => (
          <SurahBlock
            key={n}
            num={n}
            reciter={reciter}
            fontSize={fontSize}
            showTranslation={showTranslation}
            isActive={active === n}
            onActivate={setActive}
            startSignal={startSignal}
            onConsumeStart={() => setStartSignal(null)}
            onEndSurah={advance}
          />
        ))}
        <div ref={sentinel} className="h-16" />
      </div>
    </main>
  );
}


