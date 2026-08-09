
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Pause, Play, RotateCcw, X } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { ReciterSelect } from "@/components/quran/ReciterSelect";
import {
  audioUrl,
  fetchJuz,
  fetchSurah,
  fetchSurahs,
  shuffle,
  stripBasmala,
  toArabicNumber,
  type Ayah,
} from "@/lib/quran";
import { saveContestRun, type ContestAnswer } from "@/lib/storage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contest")({
  head: () => ({
    meta: [
      { title: "المسابقة القرآنية — اختبر معرفتك بالقرآن" },
      {
        name: "description",
        content:
          "مسابقة تفاعلية بثلاثة أنواع من الأسئلة مع مراجعة بعد المسابقة تُظهر مواضع الخطأ وتشغّل تلاوة الآية الصحيحة.",
      },
      { property: "og:title", content: "المسابقة القرآنية — الموسوعة الإسلامية" },
      {
        property: "og:description",
        content: "أسئلة متنوعة ونتيجة مباشرة ومراجعة صوتية لمواضع الخطأ.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contest,
});

type Scope = "all" | "juz" | "surah";
type QType = "which-surah" | "next" | "prev";

interface Question {
  prompt: string;
  verse: string;
  options: string[];
  answer: string;
  quran: boolean;
  /** رقم الآية العام لتشغيل تلاوة الإجابة الصحيحة في المراجعة */
  globalAyah?: number;
  surahName?: string;
}


function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = ok ? "sine" : "sawtooth";
    osc.frequency.setValueAtTime(ok ? 660 : 180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(ok ? 990 : 110, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* silent */
  }
}

function Contest() {
  const [scope, setScope] = useState<Scope>("all");
  const [juz, setJuz] = useState(1);
  const [surahNum, setSurahNum] = useState(1);
  const [qtype, setQType] = useState<QType>("which-surah");
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [flash, setFlash] = useState<"" | "flash-correct" | "flash-wrong">("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<ContestAnswer[]>([]);
  const [review, setReview] = useState<ContestAnswer[] | null>(null);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [playing, setPlaying] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const surahs = useQuery({ queryKey: ["surahs"], queryFn: fetchSurahs, staleTime: Infinity });

  const scopeLabel =
    scope === "all"
      ? "القرآن كامل"
      : scope === "juz"
        ? `الجزء ${toArabicNumber(juz)}`
        : (surahs.data ?? []).find((s) => s.number === surahNum)?.name ?? "سورة";

  const typeLabel =
    qtype === "which-surah"
      ? "من أي سورة هذه الآية؟"
      : qtype === "next"
        ? "ما هي الآية التالية؟"
        : "ما هي الآية السابقة؟";

  const loadPool = async (surahNumber: number) => {
    const data = await fetchSurah(surahNumber);
    return data.ayahs.map((a) => ({
      ...a,
      surah: {
        number: data.number,
        name: data.name,
        englishName: data.englishName,
        numberOfAyahs: data.numberOfAyahs,
      },
    })) as Ayah[];
  };

  const buildQuestion = async () => {
    setLoading(true);
    setPicked(null);
    try {
      let pool: Ayah[] = [];
      // A single small surah can't host a "next/prev" question, so keep trying
      // other sources within the chosen scope instead of giving up.
      for (let attempt = 0; attempt < 6 && pool.length < 2; attempt++) {
        const raw =
          scope === "juz"
            ? (await fetchJuz(juz)).ayahs
            : await loadPool(scope === "surah" ? surahNum : 1 + Math.floor(Math.random() * 114));
        const filtered = raw.filter((a) => a.text.trim().length > 8);
        pool = filtered.length >= 2 ? filtered : raw;
        if (scope === "surah" && pool.length >= 2) break;
      }
      if (pool.length < 2) {
        // Absolute fallback: al-Baqarah always has plenty of verses.
        pool = await loadPool(2);
      }

      // Extra verses used to top up answer options when the scope is tiny.
      const fillers = async () => {
        const extra = await loadPool(1 + Math.floor(Math.random() * 114));
        return extra.filter((a) => a.text.trim().length > 8);
      };

      if (qtype === "which-surah") {
        const idx = Math.floor(Math.random() * pool.length);
        const target = pool[idx];
        const correct = target.surah?.name ?? "";
        const names = shuffle((surahs.data ?? []).map((s) => s.name).filter((n) => n !== correct)).slice(0, 3);
        setQuestion({
          prompt: "من أي سورة هذه الآية؟",
          verse: stripBasmala(target.text, target.surah?.number ?? 0, target.numberInSurah),
          options: shuffle([correct, ...names]),
          answer: correct,
          quran: false,
          globalAyah: target.number,
          surahName: target.surah?.name,
        });
      } else {
        const step = qtype === "next" ? 1 : -1;
        const min = step === 1 ? 0 : 1;
        const max = step === 1 ? pool.length - 1 : pool.length;
        const idx = min + Math.floor(Math.random() * (max - min));
        const target = pool[idx];
        const correctAyah = pool[idx + step];
        const correct = stripBasmala(
          correctAyah.text,
          correctAyah.surah?.number ?? 0,
          correctAyah.numberInSurah,
        );
        let distractors = shuffle(pool.filter((_, i) => i !== idx && i !== idx + step))
          .slice(0, 3)
          .map((a) => stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah));
        if (distractors.length < 3) {
          const extra = shuffle(await fillers())
            .slice(0, 6)
            .map((a) => stripBasmala(a.text, a.surah?.number ?? 0, a.numberInSurah))
            .filter((t) => t !== correct && !distractors.includes(t));
          distractors = [...distractors, ...extra].slice(0, 3);
        }
        setQuestion({
          prompt: qtype === "next" ? "ما هي الآية التالية؟" : "ما هي الآية السابقة؟",
          verse: stripBasmala(target.text, target.surah?.number ?? 0, target.numberInSurah),
          options: shuffle([correct, ...distractors]),
          answer: correct,
          quran: true,
          globalAyah: correctAyah.number,
          surahName: correctAyah.surah?.name,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    setScore({ right: 0, wrong: 0 });
    setAnswers([]);
    setReview(null);
    setStarted(true);
    await buildQuestion();
  };

  const answer = (opt: string) => {
    if (picked || !question) return;
    setPicked(opt);
    const ok = opt === question.answer;
    beep(ok);
    setFlash(ok ? "flash-correct" : "flash-wrong");
    window.setTimeout(() => setFlash(""), 700);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }));
    setAnswers((prev) => [
      ...prev,
      {
        prompt: question.prompt,
        verse: question.verse,
        picked: opt,
        answer: question.answer,
        correct: ok,
        quran: question.quran,
        surahName: question.surahName,
        globalAyah: question.globalAyah,
      },
    ]);
    // The contest never ends on its own — it keeps serving questions until
    // the user presses "إنهاء".
    window.setTimeout(() => void buildQuestion(), 1800);
  };

  /** إنهاء المسابقة: يحفظ الجولة في السجل ويعرض شاشة المراجعة. */
  const finish = () => {
    audioRef.current?.pause();
    setPlaying(null);
    setStarted(false);
    if (answers.length) {
      saveContestRun({
        id: `${Date.now()}`,
        at: Date.now(),
        scopeLabel,
        typeLabel,
        right: answers.filter((a) => a.correct).length,
        wrong: answers.filter((a) => !a.correct).length,
        answers,
      });
      setReview(answers);
    }
  };

  const playAnswer = (i: number, globalAyah?: number) => {
    const el = audioRef.current;
    if (!el || !globalAyah) return;
    if (playing === i) {
      el.pause();
      setPlaying(null);
      return;
    }
    el.src = audioUrl(reciter, globalAyah);
    void el.play().then(() => setPlaying(i)).catch(() => setPlaying(null));
  };


  return (
    <main className={`min-h-screen pb-24 ${flash}`}>
      <ModeHeader
        title="المسابقة القرآنية"
        subtitle="Quran Contest"
        right={
          started ? (
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="rounded-full bg-primary/30 px-2 py-1">صح {toArabicNumber(score.right)}</span>
              <span className="rounded-full bg-destructive/40 px-2 py-1">خطأ {toArabicNumber(score.wrong)}</span>
            </div>
          ) : null
        }
      />

      <audio ref={audioRef} onEnded={() => setPlaying(null)} onError={() => setPlaying(null)} className="hidden" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {!started && review ? (
          <div className="mb-6 space-y-4 rounded-3xl border-2 border-gold/50 bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-foreground">مراجعة المسابقة</h2>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-primary/20 px-2 py-1 text-primary">
                  صح {toArabicNumber(review.filter((a) => a.correct).length)}
                </span>
                <span className="rounded-full bg-destructive/20 px-2 py-1 text-destructive">
                  خطأ {toArabicNumber(review.filter((a) => !a.correct).length)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">القارئ</span>
              <ReciterSelect value={reciter} onChange={setReciter} className="h-8 w-44 text-xs" />
            </div>

            {review.filter((a) => !a.correct).length === 0 ? (
              <p className="rounded-xl bg-secondary p-3 text-sm text-foreground">
                ما شاء الله — لم تُخطئ في أي سؤال في هذه الجولة.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">مواضع الخطأ — اضغط زر التشغيل لسماع الإجابة الصحيحة:</p>
                {review.map((a, i) =>
                  a.correct ? null : (
                    <div key={i} className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3">
                      <p className="text-xs font-bold text-primary">{a.prompt}</p>
                      <p className="font-quran mt-2 text-lg leading-[2] text-foreground">{a.verse}</p>
                      <p className="mt-2 text-xs text-destructive">
                        إجابتك: <span className={a.quran ? "font-quran" : "font-hand"}>{a.picked}</span>
                      </p>
                      <p className="mt-1 text-xs text-primary">
                        الصحيح: <span className={a.quran ? "font-quran" : "font-hand"}>{a.answer}</span>
                        {a.surahName ? ` — ${a.surahName}` : ""}
                      </p>
                      {a.globalAyah ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2 gap-1"
                          onClick={() => playAnswer(i, a.globalAyah)}
                        >
                          {playing === i ? <Pause className="size-4" /> : <Play className="size-4" />}
                          {playing === i ? "إيقاف" : "استمع للآية الصحيحة"}
                        </Button>
                      ) : null}
                    </div>
                  ),
                )}
              </div>
            )}
            <Button variant="secondary" className="w-full" onClick={() => setReview(null)}>
              إغلاق المراجعة
            </Button>
          </div>
        ) : null}

        {!started ? (
          <div className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-soft">

            <div>
              <h2 className="mb-3 font-bold text-foreground">نطاق المسابقة</h2>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["all", "القرآن كامل"],
                  ["juz", "جزء محدد"],
                  ["surah", "سورة واحدة"],
                ] as const).map(([v, label]) => (
                  <Button
                    key={v}
                    variant={scope === v ? "default" : "secondary"}
                    onClick={() => setScope(v)}
                    className="h-auto whitespace-normal py-3 text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {scope === "juz" ? (
                <select
                  value={juz}
                  onChange={(e) => setJuz(Number(e.target.value))}
                  aria-label="اختيار الجزء"
                  className="mt-3 w-full rounded-lg border border-input bg-background p-2 text-sm"
                >
                  {Array.from({ length: 30 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      الجزء {toArabicNumber(i + 1)}
                    </option>
                  ))}
                </select>
              ) : null}
              {scope === "surah" ? (
                <select
                  value={surahNum}
                  onChange={(e) => setSurahNum(Number(e.target.value))}
                  aria-label="اختيار السورة"
                  className="mt-3 w-full rounded-lg border border-input bg-background p-2 text-sm"
                >
                  {(surahs.data ?? []).map((s) => (
                    <option key={s.number} value={s.number}>
                      {toArabicNumber(s.number)} — {s.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div>
              <h2 className="mb-3 font-bold text-foreground">نوع السؤال</h2>
              <div className="grid gap-2">
                {([
                  ["which-surah", "من أي سورة هذه الآية؟"],
                  ["next", "ما هي الآية التالية؟"],
                  ["prev", "ما هي الآية السابقة؟"],
                ] as const).map(([v, label]) => (
                  <Button
                    key={v}
                    variant={qtype === v ? "default" : "secondary"}
                    onClick={() => setQType(v)}
                    className="justify-start"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={start} className="h-12 w-full text-base font-bold">
              ابدأ المسابقة
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : question ? (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-gold/50 bg-card p-5 text-center shadow-soft">
              <p className="text-sm font-bold text-primary">{question.prompt}</p>
              <p className="font-quran mt-4 text-2xl leading-[2.2] text-foreground">{question.verse}</p>
            </div>

            <div className="grid gap-2">
              {question.options.map((opt) => {
                const isAnswer = opt === question.answer;
                const state = picked
                  ? isAnswer
                    ? "border-primary bg-primary/10"
                    : opt === picked
                      ? "border-destructive bg-destructive/10"
                      : "border-border opacity-60"
                  : "border-border hover:border-primary";
                return (
                  <button
                    key={opt}
                    onClick={() => answer(opt)}
                    className={`flex items-center gap-2 rounded-2xl border-2 bg-card p-4 text-right transition-all ${state}`}
                  >
                    {picked && isAnswer ? <Check className="size-4 shrink-0 text-primary" /> : null}
                    {picked && !isAnswer && opt === picked ? (
                      <X className="size-4 shrink-0 text-destructive" />
                    ) : null}
                    <span className={question.quran ? "font-quran text-xl leading-[2]" : "font-hand text-xl font-bold"}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button onClick={buildQuestion} disabled={!picked} className="h-12 flex-1 font-bold">
                السؤال التالي ←
              </Button>
              <Button variant="secondary" onClick={finish} className="h-12 gap-1">
                <RotateCcw className="size-4" /> إنهاء
              </Button>

            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">جاري تجهيز سؤال آخر…</p>
            <Button onClick={buildQuestion} className="mt-4">
              سؤال جديد
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}


