
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pause, Play } from "lucide-react";
import { audioUrl, fetchSurah, stripBasmala, toArabicNumber, TRANSLATION_EDITION, RECITERS } from "@/lib/quran";
import { globalAudio, useGlobalAudio } from "@/lib/audio";
import { resolvePlayableUrl } from "@/lib/audioDownloads";


import { BookmarkButton } from "./BookmarkButton";
import { NoteButton } from "./NoteButton";

export function SurahBlock({
  num,
  reciter,
  fontSize,
  showTranslation,
  isActive,
  onActivate,
  startSignal,
  onConsumeStart,
  onEndSurah,
}: {
  num: number;
  reciter: string;
  fontSize: number;
  showTranslation: boolean;
  isActive: boolean;
  onActivate: (n: number | null) => void;
  startSignal?: number | null;
  onConsumeStart?: () => void;
  onEndSurah?: (surah: number) => void;
}) {
  const arabic = useQuery({
    queryKey: ["surah", num],
    queryFn: () => fetchSurah(num),
    staleTime: Infinity,
  });
  const translation = useQuery({
    queryKey: ["surah", num, TRANSLATION_EDITION],
    queryFn: () => fetchSurah(num, TRANSLATION_EDITION),
    enabled: showTranslation,
    staleTime: Infinity,
  });

  const audio = useGlobalAudio();
  const indexRef = useRef(0);
  const activeElRef = useRef<HTMLDivElement | null>(null);
  const onEndedRef = useRef<() => void>(() => {});

  const ayahs = arabic.data?.ayahs ?? [];
  const reciterName = RECITERS.find((r) => r.id === reciter)?.name ?? reciter;

  const srcOf = (i: number) => (ayahs[i] ? audioUrl(reciter, ayahs[i].number) : "");
  const isActiveTrack = (i: number) => audio.playing && audio.current?.src === srcOf(i);

  const playFrom = async (i: number) => {
    const ayah = ayahs[i];
    if (!ayah) {
      if (onEndSurah) onEndSurah(num);
      else onActivate(null);
      return;
    }
    indexRef.current = i;
    onActivate(num);
    const src = audioUrl(reciter, ayah.number);
    const playSrc = await resolvePlayableUrl(src);
    globalAudio.play(
      {
        src,
        playSrc,
        title: `سورة ${arabic.data?.name ?? ""}`,
        subtitle: `الآية ${toArabicNumber(ayah.numberInSurah)} — ${reciterName}`,
        href: "/read",
      },
      { onEnded: onEndedRef.current },
    );
    activeElRef.current = document.getElementById(`ayah-${num}-${i}`) as HTMLDivElement | null;
    activeElRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  onEndedRef.current = () => {
    void playFrom(indexRef.current + 1);
  };

  useEffect(() => {
    if (startSignal === num && ayahs.length > 0) {
      onConsumeStart?.();
      void playFrom(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal, num, ayahs.length]);

  if (arabic.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> جاري تحميل السورة…
      </div>
    );
  }

  if (arabic.isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        تعذّر تحميل السورة، تحقق من الاتصال.
      </p>
    );
  }

  return (
    <section id={`surah-${num}`} className="scroll-mt-32 px-4 py-6">
      <div className="mb-5 rounded-2xl border border-gold/40 bg-hero px-4 py-4 text-center text-primary-foreground shadow-soft">
        <p className="text-xs tracking-widest opacity-70">
          سورة {toArabicNumber(num)} · {arabic.data?.revelationType === "Meccan" ? "مكية" : "مدنية"} ·{" "}
          {toArabicNumber(arabic.data?.numberOfAyahs ?? 0)} آية
        </p>
        <h2 className="font-quran mt-1 text-2xl text-gold">{arabic.data?.name}</h2>
      </div>

      {num !== 9 ? (
        <p className="font-quran mb-4 text-center text-xl text-primary">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      ) : null}

      <div className="space-y-3">
        {ayahs.map((a, i) => (
          <div
            key={a.number}
            id={`ayah-${num}-${i}`}
            className="ayah-frame group px-4 py-3 transition-colors"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => {
                  if (isActiveTrack(i)) {
                    globalAudio.pause();
                    onActivate(null);
                  } else {
                    void playFrom(i);
                  }
                }}
                aria-label={`تشغيل الآية ${a.numberInSurah}`}
                className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-border text-primary transition-colors hover:bg-accent"
              >
                {isActiveTrack(i) ? (
                  <Pause className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
              </button>
              <div className="flex-1">
                <p
                  className="font-quran leading-[2.4] text-foreground"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {stripBasmala(a.text, num, a.numberInSurah)}
                  <span className="mx-1 inline-grid size-7 place-items-center rounded-full bg-gold-gradient align-middle text-[11px] font-bold text-gold-foreground">
                    {toArabicNumber(a.numberInSurah)}
                  </span>
                </p>
                {showTranslation ? (
                  <p dir="ltr" className="mt-2 text-left text-sm leading-6 text-muted-foreground">
                    {translation.data?.ayahs?.[i]?.text ?? "…"}
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <BookmarkButton
                    item={{
                      kind: "ayah",
                      surah: num,
                      surahName: arabic.data?.name,
                      ayah: a.numberInSurah,
                      text: stripBasmala(a.text, num, a.numberInSurah).slice(0, 160),
                    }}
                  />
                  <NoteButton
                    surah={num}
                    surahName={arabic.data?.name}
                    ayah={a.numberInSurah}
                    text={stripBasmala(a.text, num, a.numberInSurah)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


