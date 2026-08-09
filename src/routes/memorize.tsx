
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Headphones, Loader2, Pause, Settings2 } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { ReciterSelect } from "@/components/quran/ReciterSelect";
import { audioUrl, fetchSurah, fetchSurahs, stripBasmala, toArabicNumber, RECITERS } from "@/lib/quran";
import { globalAudio, useGlobalAudio } from "@/lib/audio";
import { resolvePlayableUrl } from "@/lib/audioDownloads";


import { bumpMemoSession, startMemoSession } from "@/lib/storage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/memorize")({
  head: () => ({
    meta: [
      { title: "التكرار للحفظ — أداة حفظ القرآن الكريم" },
      {
        name: "description",
        content:
          "اختر السورة ونطاق الآيات والقارئ وعدد التكرارات، ودع التطبيق يكرر كل آية قبل الانتقال للتالية لتثبيت الحفظ.",
      },
      { property: "og:title", content: "التكرار للحفظ — باحث كتاب الله" },
      {
        property: "og:description",
        content: "أداة متخصصة للحفظ بالتكرار مع تلاوة كبار القراء.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Memorize,
});

function Memorize() {
  const [selected, setSelected] = useState<number | null>(null);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [repeat, setRepeat] = useState(3);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  const audio = useGlobalAudio();
  const indexRef = useRef(0);
  const repeatLeft = useRef(0);
  const sessionRef = useRef<string | null>(null);
  const mineRef = useRef<string | null>(null);
  const onEndedRef = useRef<() => void>(() => {});

  const surahs = useQuery({ queryKey: ["surahs"], queryFn: fetchSurahs, staleTime: Infinity });
  const surah = useQuery({
    queryKey: ["surah", selected],
    queryFn: () => fetchSurah(selected as number),
    enabled: selected !== null,
    staleTime: Infinity,
  });

  const ayahs = surah.data?.ayahs ?? [];
  const reciterName = RECITERS.find((r) => r.id === reciter)?.name ?? reciter;
  const isPlaying = audio.playing && mineRef.current !== null && audio.current?.src === mineRef.current;

  useEffect(() => {
    if (surah.data) {
      setFrom(1);
      setTo(surah.data.numberOfAyahs);
    }
  }, [surah.data]);

  const stop = () => {
    mineRef.current = null;
    globalAudio.pause();
    setActiveIndex(null);
  };

  const playIndex = async (i: number) => {
    const ayah = ayahs[i];
    if (!ayah || i > to - 1) {
      stop();
      return;
    }
    indexRef.current = i;
    repeatLeft.current = repeat;
    setActiveIndex(i);
    if (sessionRef.current) bumpMemoSession(sessionRef.current);
    setShowSettings(false);
    const src = audioUrl(reciter, ayah.number);
    mineRef.current = src;
    const playSrc = await resolvePlayableUrl(src);
    globalAudio.play(
      {
        src,
        playSrc,
        title: `سورة ${surah.data?.name ?? ""}`,
        subtitle: `الآية ${toArabicNumber(ayah.numberInSurah)} — ${reciterName}`,
        href: "/memorize",
      },
      { onEnded: onEndedRef.current },
    );
    document.getElementById(`m-ayah-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  onEndedRef.current = () => {
    if (repeatLeft.current > 0) {
      repeatLeft.current -= 1;
      globalAudio.replay();
      return;
    }
    void playIndex(indexRef.current + 1);
  };

  if (selected === null) {
    return (
      <main className="min-h-screen pb-16">
        <ModeHeader title="التكرار للحفظ" subtitle="اختر السورة من الشبكة" />
        <div className="mx-auto max-w-3xl px-4 py-6">
          {surahs.isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(surahs.data ?? []).map((s) => (
                <button
                  key={s.number}
                  onClick={() => setSelected(s.number)}
                  className="rounded-2xl border border-border bg-card p-3 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <span className="mx-auto grid size-7 place-items-center rounded-lg bg-gold-gradient text-[11px] font-bold text-gold-foreground">
                    {toArabicNumber(s.number)}
                  </span>
                  <span className="font-quran mt-2 block text-base text-foreground">{s.name}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {toArabicNumber(s.numberOfAyahs)} آية
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  const count = surah.data?.numberOfAyahs ?? 1;

  return (
    <main className="min-h-screen pb-28">
      <ModeHeader
        title={surah.data?.name ?? "…"}
        subtitle={`التكرار للحفظ · ${toArabicNumber(from)}–${toArabicNumber(to)}`}
        right={
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            onClick={() => {
              stop();
              setSelected(null);
            }}
          >
            <ArrowRight className="size-4" /> السور
          </Button>
        }
      >
        {showSettings ? (
          <div className="grid gap-2 rounded-2xl bg-background/10 p-3 text-xs sm:grid-cols-2">
            <label className="flex items-center gap-2">
              من الآية
              <select
                value={from}
                onChange={(e) => setFrom(Number(e.target.value))}
                className="flex-1 rounded-md bg-card p-1.5 text-card-foreground"
              >
                {Array.from({ length: count }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              إلى الآية
              <select
                value={to}
                onChange={(e) => setTo(Number(e.target.value))}
                className="flex-1 rounded-md bg-card p-1.5 text-card-foreground"
              >
                {Array.from({ length: count }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label
              className={`flex items-center gap-2 rounded-lg border px-2 py-1 transition-colors ${
                repeat > 0 ? "animate-repeat-hue" : "border-transparent"
              }`}
            >
              التكرار
              <select
                value={repeat}
                onChange={(e) => setRepeat(Number(e.target.value))}
                className="flex-1 rounded-md bg-card p-1.5 text-card-foreground"
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <ReciterSelect value={reciter} onChange={setReciter} className="h-8 text-xs" />
            <Button
              onClick={() => {
                sessionRef.current = startMemoSession({
                  surah: selected,
                  surahName: surah.data?.name ?? "",
                  from,
                  to,
                  repeat,
                });
                playIndex(from - 1);
              }}
              className="h-10 gap-2 font-bold sm:col-span-2"
            >
              <Headphones className="size-4" /> ابدأ الحفظ
            </Button>
          </div>
        ) : null}
      </ModeHeader>

      <div className="mx-auto max-w-2xl space-y-3 px-4 py-6">
        {surah.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          ayahs.slice(from - 1, to).map((a, i) => {
            const idx = from - 1 + i;
            return (
              <button
                key={a.number}
                id={`m-ayah-${idx}`}
                onClick={() => playIndex(idx)}
                className={`ayah-frame block w-full px-4 py-3 text-right transition-all ${
                  activeIndex === idx ? "shadow-glow ring-2 ring-gold" : ""
                }`}
              >
                <span className="font-quran text-2xl leading-[2.3] text-foreground">
                  {stripBasmala(a.text, selected, a.numberInSurah)}
                  <span className="mx-1 inline-grid size-7 place-items-center rounded-full bg-gold-gradient align-middle text-[11px] font-bold text-gold-foreground">
                    {toArabicNumber(a.numberInSurah)}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="fixed bottom-5 left-5 z-30 flex flex-col gap-2">
        <button
          onClick={() => setShowSettings((v) => !v)}
          aria-label="الإعدادات"
          className="grid size-12 place-items-center rounded-full border border-border bg-card text-foreground shadow-soft"
        >
          <Settings2 className="size-5" />
        </button>
        <button
          onClick={() => (isPlaying ? stop() : void playIndex(activeIndex ?? from - 1))}
          aria-label="تشغيل"
          className="grid size-14 place-items-center rounded-full bg-gold-gradient text-gold-foreground shadow-glow transition-transform hover:scale-105"
        >
          {isPlaying ? <Pause className="size-6" /> : <Headphones className="size-6" />}
        </button>
      </div>
    </main>
  );
}


