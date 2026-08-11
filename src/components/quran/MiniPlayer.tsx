
import { Link } from "@tanstack/react-router";
import { Headphones, Home, Pause, Play, X } from "lucide-react";
import { globalAudio, useGlobalAudio } from "@/lib/audio";

/** Small floating bar shown while a track is loaded, available in every mode. */
export function MiniPlayer() {
  const audio = useGlobalAudio();
  const track = audio.current;

  if (!track) return null;

  const toggle = () => (audio.playing ? globalAudio.pause() : globalAudio.resume());

  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[min(92vw,400px)] -translate-x-1/2 rounded-2xl border border-gold/40 bg-card/95 p-3 shadow-glow backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label={audio.playing ? "إيقاف التلاوة" : "متابعة التلاوة"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-gradient text-gold-foreground shadow-soft"
        >
          {audio.playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <div className="min-w-0 flex-1">
          {track.href ? (
            <Link
              to={track.href}
              className="block truncate text-sm font-bold text-foreground transition-colors hover:text-primary"
            >
              {track.title}
            </Link>
          ) : (
            <p className="block truncate text-sm font-bold text-foreground">{track.title}</p>
          )}
          {track.subtitle ? (
            <p className="truncate text-[11px] text-muted-foreground">{track.subtitle}</p>
          ) : null}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Headphones className="size-3.5" /> مشغّل مشترك
        </span>
        <Link
          to="/"
          aria-label="العودة إلى الرئيسية"
          title="العودة إلى الرئيسية"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Home className="size-4" />
        </Link>
        <button
          onClick={() => globalAudio.stop()}
          aria-label="إغلاق المشغّل"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
