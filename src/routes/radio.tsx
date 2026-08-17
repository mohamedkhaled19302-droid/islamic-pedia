
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pause, Play, Radio as RadioIcon, Volume2 } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { RADIO_COUNTRIES, RADIO_STATIONS, type RadioStation } from "@/lib/radio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { seoHead } from "@/lib/seo";
import { SeoIntro } from "@/components/SeoIntro";

export const Route = createFileRoute("/radio")({
  head: () =>
    seoHead({
      title: "إذاعات القرآن الكريم حول العالم — بث مباشر",
      description:
        "استمع لإذاعات القرآن الكريم من دول العالم: السعودية ومصر والإمارات والأردن وعُمان والكويت واليمن والجزائر وغيرها، بثّ مباشر بضغطة واحدة.",
      path: "/radio",
      crumbs: [{ name: "إذاعات القرآن", path: "/radio" }],
    }),
  component: RadioMode,
});

function RadioMode() {
  const { t } = useLang();
  const [country, setCountry] = useState(RADIO_COUNTRIES[0].country);
  const [current, setCurrent] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  const stations = useMemo(
    () => RADIO_STATIONS.filter((s) => s.country === country),
    [country],
  );

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, current]);

  useEffect(() => () => hlsRef.current?.destroy(), []);

  const stop = () => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setPlaying(false);
    setLoading(false);
  };

  const play = async (station: RadioStation) => {
    const el = audioRef.current;
    if (!el) return;
    if (current?.id === station.id && playing) {
      stop();
      return;
    }
    stop();
    setError(null);
    setCurrent(station);
    setLoading(true);

    try {
      if (station.hls && !el.canPlayType("application/vnd.apple.mpegurl")) {
        const { default: Hls } = await import("hls.js");
        if (!Hls.isSupported()) throw new Error("unsupported");
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(station.url);
        hls.attachMedia(el);
        hlsRef.current = hls;
      } else {
        el.src = station.url;
      }
      el.volume = volume;
      await el.play();
      setPlaying(true);
    } catch {
      setError(t("radio.errorPlay"));
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pb-40">
      <ModeHeader title={t("radio.title")} subtitle={t("radio.subtitle")} />

      <audio
        ref={audioRef}
        className="hidden"
        onPlaying={() => {
          setPlaying(true);
          setLoading(false);
        }}
        onWaiting={() => setLoading(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          if (current) setError(t("radio.errorStream"));
          setLoading(false);
          setPlaying(false);
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-6">
        <SeoIntro
          title="إذاعات القرآن الكريم بث مباشر"
          links={[
            { to: "/read", label: "قراءة القرآن الكريم" },
            { to: "/memorize", label: "التكرار للحفظ" },
          ]}
        >
          استمع إلى إذاعات القرآن الكريم من دول العالم: السعودية ومصر والإمارات
          والأردن وعُمان والكويت واليمن والجزائر وغيرها — بثّ مباشر بضغطة واحدة من
          أي مكان في العالم.
        </SeoIntro>
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">{t("radio.chooseCountry")}</h2>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-3">
          {RADIO_COUNTRIES.map((c, i) => {
            const active = c.country === country;
            return (
              <button
                key={c.country}
                onClick={() => setCountry(c.country)}
                style={{ animationDelay: `${i * 35}ms` }}
                className={cn(
                  "animate-pop flex shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition-all duration-300",
                  active
                    ? "-translate-y-1 border-gold bg-gold-gradient text-gold-foreground shadow-glow"
                    : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-gold/60",
                )}
              >
                <span className="text-2xl leading-none">{c.flag}</span>
                <span className="whitespace-nowrap text-xs font-bold">{c.country}</span>
              </button>
            );
          })}
        </div>

        <div key={country} className="mt-4 grid gap-3">
          {stations.map((s, i) => {
            const active = current?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => play(s)}
                style={{ animationDelay: `${i * 70}ms` }}
                className={cn(
                  "animate-rise flex items-center gap-4 rounded-2xl border p-4 text-right transition-all duration-300",
                  active
                    ? "border-gold bg-card shadow-glow"
                    : "border-border bg-card hover:-translate-y-0.5 hover:shadow-soft",
                )}
              >
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-full transition-transform",
                    active
                      ? "bg-gold-gradient text-gold-foreground animate-pulse-ring"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {active && loading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : active && playing ? (
                    <Pause className="size-5" />
                  ) : (
                    <Play className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-foreground">{s.station}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.flag} {s.country}
                  </span>
                </span>
                {active && playing ? (
                  <span className="flex items-end gap-0.5" aria-hidden="true">
                    {[0, 1, 2, 3].map((b) => (
                      <span
                        key={b}
                        className="h-5 w-1 origin-bottom rounded-full bg-gold"
                        style={{ animation: `bars 0.9s ${b * 0.12}s ease-in-out infinite` }}
                      />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {country === "تلاوات مختارة" ? (
          <p className="animate-pop mt-4 rounded-xl border border-gold/40 bg-secondary/70 p-3 text-center text-xs leading-6 text-muted-foreground">
            {t("radio.selectedNote")}
          </p>
        ) : null}

        {error ? (
          <p className="animate-pop mt-4 rounded-xl bg-destructive/15 p-3 text-center text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t("radio.note")}
        </p>
      </div>

      {current ? (
        <div className="animate-rise fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-hero/95 text-hero-foreground backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-gradient text-gold-foreground">
              <RadioIcon className={cn("size-5", playing && "animate-pulse")} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{current.station}</p>
              <p className="truncate text-xs opacity-80">
                {current.flag} {current.country}
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Volume2 className="size-4 opacity-80" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                aria-label={t("radio.volume")}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1 w-24 accent-[var(--gold)]"
              />
            </div>
            <Button
              onClick={() => play(current)}
              className="gap-1 rounded-full bg-gold-gradient text-gold-foreground hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : playing ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {playing ? t("radio.stop") : t("radio.play")}
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}


