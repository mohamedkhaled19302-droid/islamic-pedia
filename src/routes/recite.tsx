
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  History,
  ListChecks,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
  Volume2,
  Waves,
} from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { Button } from "@/components/ui/button";
import { fetchJuz, fetchPage, fetchSurah, fetchSurahs, stripBasmala, toArabicNumber, type Ayah } from "@/lib/quran";
import { audioUrl } from "@/lib/quran";
import {
  clearReciteState,
  getReciteState,
  saveReciteState,
  type ReciteMistake,
} from "@/lib/storage";
import {
  alternativesOf,
  createRecognition,
  randomOf,
  splitWords,
  wordsMatch,
  type Sensitivity,
  type SpeechLike,
} from "@/lib/recite";

export const Route = createFileRoute("/recite")({
  head: () => ({
    meta: [
      { title: "اختبار التسميع — اقرأ من حفظك بالميكروفون" },
      {
        name: "description",
        content:
          "اختر نطاقاً من الصفحات أو الأجزاء أو السور، وسمّع الآيات من حفظك: الميكروفون يكشف الكلمات كلمة كلمة ويُنبّهك عند الخطأ، أو سمّع بنفسك واكشف الآية للمراجعة.",
      },
      { property: "og:title", content: "اختبار التسميع — باحث كتاب الله" },
      {
        property: "og:description",
        content: "تسميع تفاعلي بالميكروفون مع كشف الكلمات كلمة كلمة وتنبيه الأخطاء.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecitePage,
});

type RangeKind = "page" | "juz" | "surah";
type TestMode = "mic" | "self";

async function pagesForRange(kind: RangeKind, from: number, to: number) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  if (kind === "page") return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const pages = new Set<number>();
  const list = Array.from({ length: Math.min(hi - lo + 1, 20) }, (_, i) => lo + i);
  for (const n of list) {
    const data = kind === "juz" ? await fetchJuz(n) : await fetchSurah(n);
    (data.ayahs as Ayah[]).forEach((a) => pages.add(a.page));
  }
  return [...pages].sort((a, b) => a - b);
}

function RecitePage() {
  const [kind, setKind] = useState<RangeKind>("page");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(5);
  const [mode, setMode] = useState<TestMode>("mic");
  const [surahNames, setSurahNames] = useState<{ number: number; name: string }[]>([]);

  const [pages, setPages] = useState<number[] | null>(null);
  const [page, setPage] = useState<number | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [revealed, setRevealed] = useState(1);
  const [wordIdx, setWordIdx] = useState(0);
  const [mistake, setMistake] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [sensitivity, setSensitivity] = useState<Sensitivity>(2);
  const [micLevel, setMicLevel] = useState(0);

  const [mistakes, setMistakes] = useState<ReciteMistake[]>([]);
  const [review, setReview] = useState(false);
  const [resumable, setResumable] = useState<ReturnType<typeof getReciteState>>(null);
  const [noiseFloor, setNoiseFloor] = useState(10);
  const [calibrating, setCalibrating] = useState(false);
  const [replayIdx, setReplayIdx] = useState<number | null>(null);

  const recRef = useRef<SpeechLike | null>(null);
  /** Words from results already marked final by the recognizer. */
  const finalWordsRef = useRef<string[]>([]);
  /** How many final words were already spoken before the current ayah began. */
  const offsetRef = useRef(0);
  const sensRef = useRef<Sensitivity>(2);
  sensRef.current = sensitivity;
  const targetRef = useRef<string[]>([]);
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null);
  const levelRef = useRef(0);
  const floorRef = useRef(10);
  floorRef.current = noiseFloor;
  const mistakesRef = useRef<ReciteMistake[]>([]);
  const ayahsRef = useRef<Ayah[]>([]);
  const revealedRef = useRef(1);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  ayahsRef.current = ayahs;
  revealedRef.current = revealed;
  mistakesRef.current = mistakes;

  const max = kind === "page" ? 604 : kind === "juz" ? 30 : 114;

  useEffect(() => {
    void fetchSurahs()
      .then((s) => setSurahNames(s.map((x) => ({ number: x.number, name: x.name }))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setFrom(1);
    setTo(kind === "page" ? 5 : 1);
  }, [kind]);

  const stopMic = () => {
    recRef.current?.abort();
    recRef.current = null;
    setListening(false);
    if (audioRef.current) {
      cancelAnimationFrame(audioRef.current.raf);
      audioRef.current.stream.getTracks().forEach((t) => t.stop());
      void audioRef.current.ctx.close();
      audioRef.current = null;
    }
    setMicLevel(0);
  };

  useEffect(() => () => stopMic(), []);

  /* ---- resume: pick up a saved session ---- */
  useEffect(() => {
    const saved = getReciteState();
    if (saved && saved.pages?.length) setResumable(saved);
  }, []);

  /* ---- persist the running session ---- */
  useEffect(() => {
    if (!pages || !page || review) return;
    saveReciteState({
      kind,
      from,
      to,
      mode,
      sensitivity,
      noiseFloor,
      pages,
      page,
      revealed,
      wordIdx,
      mistakes,
      at: Date.now(),
    });
  }, [pages, page, revealed, wordIdx, mistakes, kind, from, to, mode, sensitivity, noiseFloor, review]);

  const target = ayahs[revealed];
  const targetWords = useMemo(
    () => (target ? splitWords(stripBasmala(target.text, target.surah?.number ?? 0, target.numberInSurah)) : []),
    [target],
  );
  targetRef.current = targetWords;

  const resetTranscript = () => {
    finalWordsRef.current = [];
    offsetRef.current = 0;
  };

  const addMistake = (kindOf: "missed" | "skipped", wordIndex: number, heardWord: string) => {
    const i = revealedRef.current;
    const a = ayahsRef.current[i];
    if (!a) return;
    const expected = splitWords(stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah))[wordIndex] ?? "";
    if (!expected) return;
    setMistakes((list) => {
      if (list.some((m) => m.ayahIndex === i && m.wordIndex === wordIndex)) return list;
      return [
        ...list,
        {
          ayahIndex: i,
          globalAyah: a.number,
          surahName: a.surah?.name,
          ayahNumber: a.numberInSurah,
          wordIndex,
          expected,
          heard: heardWord,
          kind: kindOf,
          at: Date.now(),
        },
      ];
    });
  };

  const loadPage = async (list: number[], forced?: number) => {
    setBusy(true);
    setError("");
    try {
      const n = forced ?? randomOf(list);
      const data = await fetchPage(n);
      setPage(n);
      setAyahs(data.ayahs);
      const first = splitWords(data.ayahs[0]?.text ?? "");
      setRevealed(first.length < 7 && data.ayahs.length > 2 ? 2 : 1);
      setWordIdx(0);
      setMistake(false);
      setHeard("");
      resetTranscript();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return data.ayahs;
    } catch {
      setError("تعذّر تحميل الصفحة، تحقق من الاتصال.");
      return [];
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const list = await pagesForRange(kind, from, to);
      if (!list.length) throw new Error("empty");
      setPages(list);
      setMistakes([]);
      setReview(false);
      await loadPage(list);
    } catch {
      setError("تعذّر تجهيز النطاق، حاول مرة أخرى.");
      setBusy(false);
    }
  };

  const resume = async () => {
    const s = resumable;
    if (!s) return;
    setKind(s.kind);
    setFrom(s.from);
    setTo(s.to);
    setMode(s.mode);
    setSensitivity((s.sensitivity as Sensitivity) ?? 2);
    if (s.noiseFloor) setNoiseFloor(s.noiseFloor);
    setPages(s.pages);
    setMistakes(s.mistakes ?? []);
    setResumable(null);
    setReview(false);
    const list = await loadPage(s.pages, s.page);
    if (list.length) {
      setRevealed(Math.min(s.revealed, list.length - 1));
      setWordIdx(s.wordIdx);
      window.setTimeout(
        () => document.getElementById(`r-ayah-${s.revealed}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
        200,
      );
    }
  };

  const advance = () => {
    setWordIdx(0);
    setMistake(false);
    // Everything spoken so far belongs to the previous ayah.
    offsetRef.current = finalWordsRef.current.length;
    setRevealed((r) => {
      const next = r + 1;
      window.setTimeout(
        () => document.getElementById(`r-ayah-${next}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
        80,
      );
      return next;
    });
  };

  /**
   * Recomputes progress from scratch on every update, so interim results that
   * later change never leave stale state behind. `finalCount` marks how many of
   * the spoken words are settled — only those can trigger a mistake warning.
   */
  const consume = (spoken: string[], finalCount: number) => {
    const words = targetRef.current;
    if (!words.length) return;
    let idx = 0;
    let unmatchedFinal = 0;

    for (let i = 0; i < spoken.length && idx < words.length; i++) {
      const w = spoken[i];
      let hit = false;
      // Allow the reciter to run slightly ahead: look at the next few words too.
      for (let look = 0; look < 3 && idx + look < words.length; look++) {
        if (wordsMatch(w, words[idx + look], sensRef.current)) {
          idx += look + 1;
          hit = true;
          break;
        }
      }
      if (hit) unmatchedFinal = 0;
      else if (i < finalCount) unmatchedFinal += 1;
    }

    setWordIdx(idx);
    // Only complain once two settled words in a row failed to match.
    const bad = idx < words.length && unmatchedFinal >= 2;
    setMistake(bad);
    if (bad) addMistake("missed", idx, spoken.slice(-1)[0] ?? "");
    if (idx >= words.length) advance();
  };

  const startLevelMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        const lvl = Math.min(100, Math.round((peak / 128) * 220));
        levelRef.current = lvl;
        setMicLevel(lvl);
        if (audioRef.current) audioRef.current.raf = requestAnimationFrame(tick);
      };
      audioRef.current = { ctx, stream, raf: 0 };
      audioRef.current.raf = requestAnimationFrame(tick);
    } catch {
      /* level meter is optional */
    }
  };

  /** Measures the ambient noise for ~3s and sets the speech gate above it. */
  const calibrate = async () => {
    setCalibrating(true);
    setError("");
    try {
      if (!audioRef.current) await startLevelMeter();
      const samples: number[] = [];
      await new Promise<void>((done) => {
        const id = window.setInterval(() => samples.push(levelRef.current), 100);
        window.setTimeout(() => {
          window.clearInterval(id);
          done();
        }, 3000);
      });
      const sorted = samples.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] ?? 5;
      const floor = Math.min(60, Math.max(4, Math.round(median * 1.6 + 4)));
      setNoiseFloor(floor);
      // A noisy room hurts recognition accuracy — loosen the matcher automatically.
      if (floor > 26) setSensitivity(3);
    } finally {
      setCalibrating(false);
      if (!listening) {
        // keep the meter running only while actually reciting
        if (audioRef.current) {
          cancelAnimationFrame(audioRef.current.raf);
          audioRef.current.stream.getTracks().forEach((t) => t.stop());
          void audioRef.current.ctx.close();
          audioRef.current = null;
        }
        setMicLevel(0);
      }
    }
  };

  /* ---- review helpers ---- */
  const finishSession = () => {
    stopMic();
    setReview(true);
    clearReciteState();
  };

  const playAyah = async (globalAyah: number, idx: number) => {
    const el = playerRef.current;
    if (!el) return;
    if (replayIdx === idx && !el.paused) {
      el.pause();
      setReplayIdx(null);
      return;
    }
    setReplayIdx(idx);
    el.src = audioUrl("ar.alafasy", globalAyah);
    void el.play().catch(() => setReplayIdx(null));
  };

  const replayAll = async () => {
    const list = [...new Set(mistakes.map((m) => m.globalAyah))];
    const el = playerRef.current;
    if (!el || !list.length) return;
    let i = 0;
    const next = async () => {
      if (i >= list.length) {
        setReplayIdx(null);
        el.onended = null;
        return;
      }
      setReplayIdx(-1);
      el.src = audioUrl("ar.alafasy", list[i]);
      i += 1;
      void el.play().catch(() => setReplayIdx(null));
    };
    el.onended = () => void next();
    await next();
  };

  const toggleMic = () => {
    if (listening) {
      stopMic();
      return;
    }
    const rec = createRecognition();
    if (!rec) {
      setError("التعرّف على الصوت غير مدعوم في هذا المتصفح، جرّب Chrome أو Safari.");
      return;
    }

    rec.onresult = (e) => {
      const finals: string[] = [];
      const interim: string[] = [];
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          // Pick the alternative that best fits what we still expect to hear.
          const alts = alternativesOf(r);
          const expected = targetRef.current;
          let best = alts[0] ?? "";
          let bestScore = -1;
          for (const alt of alts) {
            const ws = splitWords(alt);
            let score = 0;
            for (const w of ws) {
              if (expected.some((ex) => wordsMatch(w, ex, sensRef.current))) score += 1;
            }
            if (score > bestScore) {
              bestScore = score;
              best = alt;
            }
          }
          finals.push(...splitWords(best));
        } else {
          interim.push(...splitWords(r[0]?.transcript ?? ""));
        }
      }
      finalWordsRef.current = finals;

      const off = Math.min(offsetRef.current, finals.length);
      const spoken = [...finals.slice(off), ...interim];
      setHeard(spoken.slice(-8).join(" "));
      consume(spoken, Math.max(0, finals.length - off));
    };

    rec.onerror = (ev) => {
      const err = (ev as { error?: string })?.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setError("تم رفض إذن الميكروفون — اسمح به من إعدادات المتصفح.");
        setListening(false);
        stopMic();
      }
      // "no-speech" / "aborted" are transient; onend will restart.
    };

    rec.onend = () => {
      // Chrome stops after a pause; restart automatically to keep listening.
      if (recRef.current === rec) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
    };

    recRef.current = rec;
    resetTranscript();
    try {
      rec.start();
      setListening(true);
      void startLevelMeter();
    } catch {
      setError("تعذّر تشغيل الميكروفون، تأكد من منح الإذن.");
    }
  };

  const reset = () => {
    stopMic();
    setPages(null);
    setPage(null);
    setAyahs([]);
    setReview(false);
    setMistakes([]);
    clearReciteState();
  };

  /* ---------------- review screen ---------------- */
  if (review) {
    const grouped = mistakes.reduce<Record<number, ReciteMistake[]>>((acc, m) => {
      (acc[m.ayahIndex] ||= []).push(m);
      return acc;
    }, {});
    return (
      <main className="min-h-screen pb-24">
        <ModeHeader title="مراجعة التسميع" subtitle={page ? `الصفحة ${toArabicNumber(page)}` : ""} />
        <audio ref={playerRef} className="hidden" onEnded={() => setReplayIdx(null)} />
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["الآيات المسمّعة", toArabicNumber(revealed)],
              ["كلمات لم تُطابق", toArabicNumber(mistakes.filter((m) => m.kind === "missed").length)],
              ["كلمات تخطّيتها", toArabicNumber(mistakes.filter((m) => m.kind === "skipped").length)],
            ].map(([label, val]) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                <p className="font-quran text-2xl text-primary">{val}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {mistakes.length ? (
            <>
              <Button onClick={replayAll} className="h-12 w-full gap-2 font-bold">
                <Volume2 className="size-4" /> إعادة تلاوة كل المقاطع التي أخطأت فيها
              </Button>
              {Object.entries(grouped).map(([idx, list]) => {
                const i = Number(idx);
                const a = ayahs[i];
                const words = a
                  ? splitWords(stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah))
                  : [];
                return (
                  <article key={idx} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {list[0].surahName} · الآية {toArabicNumber(list[0].ayahNumber)}
                      </p>
                      <Button size="sm" variant="secondary" className="gap-1" onClick={() => playAyah(list[0].globalAyah, i)}>
                        <Volume2 className="size-4" /> {replayIdx === i ? "إيقاف" : "إعادة المقطع"}
                      </Button>
                    </div>
                    <p className="font-quran text-[24px] leading-[2.3]">
                      {words.map((w, wi) => {
                        const bad = list.find((m) => m.wordIndex === wi);
                        return (
                          <span
                            key={`${w}-${wi}`}
                            className={
                              bad
                                ? bad.kind === "skipped"
                                  ? "rounded bg-gold/25 px-1 text-foreground"
                                  : "rounded bg-destructive/20 px-1 text-destructive"
                                : "text-foreground"
                            }
                          >
                            {w}{" "}
                          </span>
                        );
                      })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      {list.map((m) => (
                        <span key={m.wordIndex} className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                          {m.kind === "skipped" ? "تخطّيت" : "لم تُطابق"}: {m.expected}
                          {m.heard ? ` — سُمِع: ${m.heard}` : ""}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </>
          ) : (
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" /> ما شاء الله، لم تُسجَّل أي أخطاء في هذه الجلسة.
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" className="h-12 flex-1 gap-1" onClick={reset}>
              <RotateCcw className="size-4" /> جلسة جديدة
            </Button>
            <Button
              className="h-12 flex-1 gap-1"
              onClick={() => {
                setReview(false);
                setMistakes([]);
                if (pages) void loadPage(pages);
              }}
            >
              <Shuffle className="size-4" /> أعد الاختبار
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- setup screen ---------------- */
  if (!pages) {
    return (
      <main className="min-h-screen pb-24">
        <ModeHeader title="اختبار التسميع" subtitle="Recitation Test" />
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="animate-rise space-y-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div>
              <h2 className="mb-3 font-bold text-foreground">اختر النطاق</h2>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["page", "من صفحة إلى صفحة"],
                  ["juz", "من جزء إلى جزء"],
                  ["surah", "من سورة إلى سورة"],
                ] as const).map(([v, label]) => (
                  <Button
                    key={v}
                    variant={kind === v ? "default" : "secondary"}
                    onClick={() => setKind(v)}
                    className="h-auto whitespace-normal py-3 text-xs transition-transform hover:-translate-y-0.5"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {([
                  ["من", from, setFrom],
                  ["إلى", to, setTo],
                ] as const).map(([label, value, setter]) => (
                  <label key={label} className="flex items-center gap-2 text-muted-foreground">
                    {label}
                    <select
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-input bg-background p-2 text-foreground"
                    >
                      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {kind === "surah"
                            ? `${toArabicNumber(n)} — ${surahNames.find((s) => s.number === n)?.name ?? ""}`
                            : toArabicNumber(n)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-bold text-foreground">طريقة الاختبار</h2>
              <div className="grid gap-2">
                <Button
                  variant={mode === "mic" ? "default" : "secondary"}
                  onClick={() => setMode("mic")}
                  className="h-auto justify-start gap-2 whitespace-normal py-3 text-right"
                >
                  <Mic className="size-4 shrink-0" /> بالميكروفون — يظهر كل كلمة عند نطقها وينبّهك عند الخطأ
                </Button>
                <Button
                  variant={mode === "self" ? "default" : "secondary"}
                  onClick={() => setMode("self")}
                  className="h-auto justify-start gap-2 whitespace-normal py-3 text-right"
                >
                  <Eye className="size-4 shrink-0" /> بدون ميكروفون — سمّع بنفسك ثم اكشف الآية للتأكد
                </Button>
              </div>
            </div>

            {mode === "mic" ? (
              <div>
                <h2 className="mb-1 font-bold text-foreground">حساسية المطابقة</h2>
                <p className="mb-3 text-xs text-muted-foreground">
                  كلما زاد التساهل، قُبلت الكلمة إذا كانت حروفها قريبة مما قلته.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    [1, "دقيق", "نفس الحروف تماماً"],
                    [2, "متوازن", "يتجاوز خطأ حرف أو حرفين"],
                    [3, "متساهل", "يقبل الكلمة القريبة"],
                  ] as const).map(([v, label, hint]) => (
                    <Button
                      key={v}
                      variant={sensitivity === v ? "default" : "secondary"}
                      onClick={() => setSensitivity(v)}
                      className="h-auto flex-col items-start gap-0.5 whitespace-normal py-2.5 text-right"
                    >
                      <span className="text-xs font-bold">{label}</span>
                      <span className="text-[10px] font-normal opacity-75">{hint}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {mode === "mic" ? (
              <div className="rounded-2xl border border-border bg-secondary/40 p-3">
                <h2 className="mb-1 flex items-center gap-1 font-bold text-foreground">
                  <Waves className="size-4" /> معايرة الميكروفون
                </h2>
                <p className="mb-3 text-xs text-muted-foreground">
                  اصمت ٣ ثوانٍ ليقيس التطبيق ضجيج المكان ويضبط عتبة السماع تلقائياً.
                </p>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="secondary" onClick={calibrate} disabled={calibrating} className="gap-1">
                    {calibrating ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
                    {calibrating ? "جارٍ القياس…" : "ابدأ المعايرة"}
                  </Button>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold-gradient transition-[width] duration-75" style={{ width: `${micLevel}%` }} />
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">عتبة {toArabicNumber(noiseFloor)}٪</span>
                </div>
              </div>
            ) : null}

            {resumable ? (
              <div className="rounded-2xl border border-gold/50 bg-secondary/40 p-3">
                <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <History className="size-4" /> لديك جلسة تسميع غير مكتملة — الصفحة {toArabicNumber(resumable.page)}، الآية {toArabicNumber(resumable.revealed)}.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={resume} className="gap-1">
                    <Play className="size-4" /> متابعة الجلسة
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      clearReciteState();
                      setResumable(null);
                    }}
                  >
                    تجاهل
                  </Button>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-xl bg-destructive/15 p-3 text-xs text-destructive">{error}</p>
            ) : null}

            <Button onClick={start} disabled={busy} className="h-12 w-full gap-2 text-base font-bold">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} ابدأ التسميع
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- session ---------------- */
  return (
    <main className="min-h-screen pb-40">
      <ModeHeader
        title="اختبار التسميع"
        subtitle={page ? `الصفحة ${toArabicNumber(page)} · ${mode === "mic" ? "بالميكروفون" : "تسميع ذاتي"}` : "…"}
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="gap-1" onClick={() => pages && loadPage(pages)}>
              <Shuffle className="size-4" /> صفحة أخرى
            </Button>
            <Button size="sm" variant="secondary" className="gap-1" onClick={finishSession}>
              <ListChecks className="size-4" /> إنهاء ومراجعة
            </Button>
          </div>
        }
      />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {busy ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <article className="space-y-3 rounded-3xl border-2 border-gold/50 bg-card p-5 shadow-soft">
            {ayahs.map((a, i) => {
              const text = stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah);
              const num = (
                <span className="mx-1 inline-grid size-7 place-items-center rounded-full bg-gold-gradient align-middle text-[11px] font-bold text-gold-foreground">
                  {toArabicNumber(a.numberInSurah)}
                </span>
              );

              if (i < revealed) {
                return (
                  <p key={a.number} id={`r-ayah-${i}`} className="font-quran animate-rise text-[25px] leading-[2.4] text-foreground">
                    {text}
                    {num}
                  </p>
                );
              }

              if (i === revealed && mode === "mic") {
                return (
                  <div
                    key={a.number}
                    id={`r-ayah-${i}`}
                    className={`rounded-2xl border-2 p-4 transition-colors duration-300 ${
                      mistake ? "border-destructive bg-destructive/10" : "border-gold/50 bg-secondary/40"
                    }`}
                  >
                    <p className="font-quran text-[25px] leading-[2.4]">
                      {splitWords(text).map((w, wi) => (
                        <span
                          key={`${w}-${wi}`}
                          className={
                            wi < wordIdx
                              ? "animate-pop text-foreground"
                              : "select-none rounded bg-muted text-transparent"
                          }
                        >
                          {wi < wordIdx ? w : "▒".repeat(Math.max(2, Math.min(6, w.length)))}{" "}
                        </span>
                      ))}
                      {num}
                    </p>
                    {mistake ? (
                      <p className="mt-2 flex items-center gap-1 text-xs font-bold text-destructive">
                        <AlertTriangle className="size-3.5" /> الكلمة غير مطابقة — أعد المحاولة
                      </p>
                    ) : null}
                  </div>
                );
              }

              const clickable = mode === "self" && i === revealed;
              return (
                <button
                  key={a.number}
                  id={`r-ayah-${i}`}
                  disabled={!clickable}
                  onClick={() => clickable && advance()}
                  className={`block w-full rounded-2xl border border-dashed border-border px-4 py-3 text-right transition-all ${
                    clickable ? "border-gold/60 bg-secondary/40 hover:-translate-y-0.5 hover:shadow-glow" : "opacity-60"
                  }`}
                >
                  <span className="font-quran select-none text-[25px] leading-[2.4] text-muted-foreground/50">
                    {"▒".repeat(Math.min(28, Math.max(8, splitWords(text).length * 3)))}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    الآية {toArabicNumber(a.numberInSurah)}
                    {clickable ? " — اضغط لكشفها بعد أن تسمّعها" : ""}
                  </span>
                </button>
              );
            })}
          </article>
        )}

        {error ? <p className="mt-4 text-center text-xs text-destructive">{error}</p> : null}
        {heard && mode === "mic" ? (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">سُمِع: {heard}</p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur">
        {mode === "mic" ? (
          <div className="mx-auto mb-2 flex max-w-2xl items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-gold-gradient transition-[width] duration-75"
                style={{ width: `${listening ? micLevel : 0}%` }}
              />
            </div>
            <div className="flex shrink-0 gap-1">
              {([1, 2, 3] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSensitivity(v)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
                    sensitivity === v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {v === 1 ? "دقيق" : v === 2 ? "متوازن" : "متساهل"}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {mode === "mic" ? (
            <button
              onClick={toggleMic}
              aria-label="الميكروفون"
              className={`grid size-14 shrink-0 place-items-center rounded-full text-gold-foreground shadow-glow transition-transform hover:scale-105 ${
                listening ? "animate-pulse-ring bg-gold-gradient" : "bg-primary text-primary-foreground"
              }`}
            >
              {listening ? <Mic className="size-6" /> : <MicOff className="size-6" />}
            </button>
          ) : null}
          {mode === "mic" ? (
            <Button
              variant="secondary"
              className="h-12 flex-1 gap-1"
              onClick={() => {
                addMistake("skipped", wordIdx, "");
                setWordIdx((w) => Math.min(targetWords.length, w + 1));
              }}
            >
              <SkipForward className="size-4" /> تخطي كلمة
            </Button>
          ) : null}
          <Button variant="secondary" className="h-12 flex-1 gap-1" onClick={advance}>
            <Eye className="size-4" /> إظهار الآية
          </Button>
        </div>
      </div>
    </main>
  );
}

