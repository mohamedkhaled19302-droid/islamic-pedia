
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BASMALA_GLYPHS,
  fetchV4Page,
  PAPER_DARK,
  PAPER_LIGHT,
  V4_PAGE_LINES,
  v4FontCSS,
  v4FontFamily,
  V4Word,
} from "@/lib/v4mushaf";
import { fetchSurahs, toArabicNumber } from "@/lib/quran";

interface MushafV4Props {
  page: number;
  night: boolean;
  /** verse_key "s:a" -> global ayah number (for clicks + active highlight) */
  ayahNumbers: Record<string, number>;
  activeNumber: number | null;
  onWordClick: (globalAyah: number) => void;
}

const ACTIVE_TINT = "rgba(210, 168, 52, 0.30)";

function HeaderStar({ size = 11, color = "#a8842c" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 2l2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1z" />
    </svg>
  );
}

export function MushafV4({ page, night, ayahNumbers, activeNumber, onWordClick }: MushafV4Props) {
  const { data } = useQuery({
    queryKey: ["v4page", page],
    queryFn: () => fetchV4Page(page),
    staleTime: Infinity,
  });
  const { data: surahs } = useQuery({
    queryKey: ["surahs"],
    queryFn: fetchSurahs,
    staleTime: Infinity,
  });

  const surfaceRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  const family = v4FontFamily(page, night);
  const css = useMemo(() => v4FontCSS(page), [page]);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    const measure = () => {
      const surface = surfaceRef.current;
      const measurer = measurerRef.current;
      if (!surface || !measurer) return;
      const cs = getComputedStyle(surface);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const innerW = surface.clientWidth - padX;
      if (!innerW) return;
      let widest = 0;
      for (const el of measurer.querySelectorAll<HTMLElement>("[data-mline]")) {
        if (el.offsetWidth > widest) widest = el.offsetWidth;
      }
      if (widest > 0) {
        const next = (innerW * 100) / widest;
        setFontSize((prev) => (prev === null || Math.abs(prev - next) > 0.5 ? next : prev));
      }
    };
    document.fonts
      .load(`100px "${family}"`, BASMALA_GLYPHS)
      .then(() => !cancelled && measure())
      .catch(() => !cancelled && measure());
    const ro = new ResizeObserver(measure);
    if (surfaceRef.current) ro.observe(surfaceRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [data, page, family]);

  const start = data?.start ?? null;
  const lines = data?.lines ?? [];
  const isHeaderSurah = start !== null && (start.surah === 1 || start.surah === 9);
  const headerLine = start?.top ? (isHeaderSurah ? 1 : start.firstLine === 3 ? 1 : null) : null;
  const basmalaLine =
    start && !isHeaderSurah && start.firstLine > 1 ? start.firstLine - 1 : null;
  /** A new surah starting mid-line: the basmala shares the line with the tail of the previous surah. */
  const basmalaSharesWords = basmalaLine !== null && !!lines[basmalaLine]?.length;
  /** Mid-page surah start: draw the surah-name ornament on the empty line above the basmala. */
  const ornamentLine =
    start && !isHeaderSurah && !start.top && basmalaLine !== null && basmalaLine - 1 >= 1 && !lines[basmalaLine - 1]
      ? basmalaLine - 1
      : null;

  const lineKind = (ln: number): "words" | "basmala" | "header" | "ornament" | null => {
    if (headerLine === ln) return "header";
    if (ornamentLine === ln) return "ornament";
    if (basmalaLine === ln) return "basmala";
    return lines[ln] ? "words" : null;
  };

  const surahMeta = surahs?.find((s) => s.number === start?.surah);
  const ink = night ? "#d9b95c" : "#3a2d12";
  const ornament = night ? "#c9a34a" : "#a8842c";

  const wordSpan = (w: V4Word, active: boolean, key: string) => {
    const global = ayahNumbers[w.k];
    return (
      <span
        key={key}
        role="button"
        tabIndex={0}
        title={w.u}
        onClick={() => global && onWordClick(global)}
        onKeyDown={(e) => e.key === "Enter" && global && onWordClick(global)}
        className={`v4pg select-none ${active ? "v4-active" : "cursor-pointer"}`}
        style={{ fontFamily: family, fontSize: fontSize ?? 100, lineHeight: 1 }}
      >
        {w.c}
      </span>
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "622 / 917",
        background: night ? PAPER_DARK : PAPER_LIGHT,
        borderRadius: 10,
        direction: "rtl",
      }}
    >
      <style>{css}</style>
      {!data ? (
        <div className="grid h-full w-full place-items-center">
          <Loader2 className="size-6 animate-spin" style={{ color: ornament }} />
        </div>
      ) : (
        <div
          ref={surfaceRef}
          className="flex h-full w-full flex-col"
          style={{ padding: "3.4% 6.2% 3.4% 6.2%", visibility: fontSize ? "visible" : "hidden" }}
        >
          {/* hidden measurer at a 100px base */}
          <div
            ref={measurerRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-0 overflow-hidden opacity-0"
          >
            {Array.from({ length: V4_PAGE_LINES }, (_, i) => i + 1).map((ln) => {
              const kind = lineKind(ln);
              if (kind === "basmala") {
                const shared = basmalaSharesWords ? lines[ln] : null;
                return (
                  <div key={ln} data-mline style={{ fontFamily: family, fontSize: 100, whiteSpace: "nowrap" }}>
                    {(shared ? shared.map((w) => w.c).join("") : "") + BASMALA_GLYPHS}
                  </div>
                );
              }
              if (kind === "words" && lines[ln])
                return (
                  <div key={ln} data-mline style={{ fontFamily: family, fontSize: 100, whiteSpace: "nowrap" }}>
                    {lines[ln].map((w) => w.c).join("")}
                  </div>
                );
              return null;
            })}
          </div>

          {Array.from({ length: V4_PAGE_LINES }, (_, i) => i + 1).map((ln) => {
            const kind = lineKind(ln);
            if (kind === "header") {
              return (
                <div key={ln} className="flex" style={{ flex: 1, alignItems: "center" }}>
                  <div className="flex w-full items-center gap-2" style={{ color: ink }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ flex: 1, height: 1, background: ornament, opacity: 0.8 }} />
                      <HeaderStar size={8} color={ornament} />
                    </div>
                    <span className="font-quran text-center text-[0.58em]" style={{ fontWeight: 700 }}>
                      {surahMeta?.name ?? ""}
                    </span>
                    <span className="whitespace-nowrap text-center" style={{ fontSize: "0.36em", opacity: 0.85 }}>
                      {surahMeta
                        ? `${surahMeta.revelationType === "Medinan" ? "مَدَنِيَّة" : "مَكِّيَّة"}، آياتها ${toArabicNumber(
                            surahMeta.numberOfAyahs,
                          )}`
                        : ""}
                    </span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
                      <HeaderStar size={8} color={ornament} />
                      <div style={{ flex: 1, height: 1, background: ornament, opacity: 0.8 }} />
                    </div>
                  </div>
                </div>
              );
            }
            if (kind === "ornament") {
              return (
                <div key={ln} className="flex" style={{ flex: 1, alignItems: "center" }}>
                  <div className="flex w-full items-center gap-2" style={{ color: ink }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ flex: 1, height: 1, background: ornament, opacity: 0.8 }} />
                      <HeaderStar size={8} color={ornament} />
                    </div>
                    <span className="font-quran text-center text-[0.55em]" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      سُورَةُ {(surahMeta?.name ?? "").replace(/^سُورَةُ\s+/, "")}
                    </span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
                      <HeaderStar size={8} color={ornament} />
                      <div style={{ flex: 1, height: 1, background: ornament, opacity: 0.8 }} />
                    </div>
                  </div>
                </div>
              );
            }
            if (kind === "basmala") {
              const shared = basmalaSharesWords ? lines[ln] : null;
              if (shared?.length) {
                return (
                  <div
                    key={ln}
                    className="flex"
                    dir="rtl"
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: shared.length > 1 ? "space-between" : "center",
                    }}
                  >
                    {shared.map((w, i) =>
                      wordSpan(w, activeNumber !== null && ayahNumbers[w.k] === activeNumber, `b-${i}`),
                    )}
                    <span
                      className="v4pg"
                      style={{ fontFamily: family, fontSize: fontSize ?? 100, lineHeight: 1, whiteSpace: "nowrap" }}
                    >
                      {BASMALA_GLYPHS}
                    </span>
                  </div>
                );
              }
              return (
                <div key={ln} className="flex" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <span
                    className="v4pg"
                    style={{ fontFamily: family, fontSize: fontSize ?? 100, lineHeight: 1, whiteSpace: "nowrap" }}
                  >
                    {BASMALA_GLYPHS}
                  </span>
                </div>
              );
            }
            const words = lines[ln];
            return (
              <div
                key={ln}
                className="flex"
                dir="rtl"
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: words && words.length > 1 ? "space-between" : "center",
                }}
              >
                {(words ?? []).map((w, i) =>
                  wordSpan(w, activeNumber !== null && ayahNumbers[w.k] === activeNumber, `${ln}-${i}`),
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
