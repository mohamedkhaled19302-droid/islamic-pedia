
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { ATHKAR } from "@/lib/athkar";
import { getAthkarState, saveAthkarState } from "@/lib/storage";
import { toArabicNumber } from "@/lib/quran";

export const Route = createFileRoute("/athkar")({
  head: () => ({
    meta: [
      { title: "الأذكار الموثقة — أذكار الصباح والمساء والنوم | باحث كتاب الله" },
      {
        name: "description",
        content:
          "أذكار الصباح والمساء والنوم والاستيقاظ وأدبار الصلوات ورمضان والحج والسفر، بنصوص موثقة من القرآن والسنة الصحيحة مع ذكر المصدر وعدّاد لكل ذكر.",
      },
      { property: "og:title", content: "الأذكار الموثقة — باحث كتاب الله" },
      {
        property: "og:description",
        content: "أذكار موثقة من الكتاب والسنة مع عدّاد لكل ذكر وحفظ تلقائي لتقدّمك اليومي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AthkarPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function AthkarPage() {
  const [cat, setCat] = useState(() => {
    const h = new Date().getHours();
    return h >= 4 && h < 15 ? "morning" : "evening";
  });
  const [state, setState] = useState<Record<string, number>>(() => getAthkarState());

  const category = useMemo(() => ATHKAR.find((c) => c.id === cat) ?? ATHKAR[0], [cat]);
  const day = today();

  const remaining = (i: number) => {
    const key = `${day}|${category.id}|${i}`;
    return state[key] ?? category.items[i].count;
  };

  const tap = (i: number) => {
    const key = `${day}|${category.id}|${i}`;
    const left = remaining(i);
    if (left <= 0) return;
    const next = { ...state, [key]: left - 1 };
    setState(next);
    saveAthkarState(next);
  };

  const resetCategory = () => {
    const next = { ...state };
    category.items.forEach((_, i) => delete next[`${day}|${category.id}|${i}`]);
    setState(next);
    saveAthkarState(next);
  };

  const done = category.items.filter((_, i) => remaining(i) === 0).length;
  const pct = Math.round((done / category.items.length) * 100);

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title="الأذكار" subtitle={`${category.title} — ${category.subtitle}`}>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {ATHKAR.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                c.id === cat
                  ? "border-gold bg-gold-gradient text-gold-foreground"
                  : "border-gold/30 bg-background/10 text-hero-foreground/85 hover:bg-background/20"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </ModeHeader>

      <section className="mx-auto max-w-3xl px-4 pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <span className="grid size-10 place-items-center rounded-xl bg-gold-gradient text-gold-foreground">
            <Sparkles className="size-5" />
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>
                أتممت {toArabicNumber(done)} من {toArabicNumber(category.items.length)}
              </span>
              <span className="text-muted-foreground">{toArabicNumber(pct)}٪</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gold-gradient transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <button
            onClick={resetCategory}
            aria-label="إعادة العدّ"
            className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {category.items.map((d, i) => {
            const left = remaining(i);
            const finished = left === 0;
            return (
              <button
                key={i}
                onClick={() => tap(i)}
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                className={`animate-rise w-full rounded-2xl border p-4 text-right transition-all ${
                  finished
                    ? "border-primary/40 bg-secondary/60 opacity-70"
                    : "border-border bg-card shadow-soft hover:border-gold/50 active:scale-[0.99]"
                }`}
              >
                <p className="font-quran text-[1.35rem] leading-[2.4] text-foreground">{d.text}</p>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                  <span className="text-[11px] leading-5 text-muted-foreground">{d.source}</span>
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      finished
                        ? "bg-primary text-primary-foreground"
                        : "bg-gold-gradient text-gold-foreground"
                    }`}
                  >
                    {finished ? <Check className="size-4" /> : toArabicNumber(left)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs leading-6 text-muted-foreground">
          النصوص من القرآن الكريم وصحيحي البخاري ومسلم والسنن، مع الإشارة إلى المصدر تحت كل ذكر.
          يُحفظ تقدّمك تلقائياً على جهازك ويتجدّد كل يوم.
        </p>
      </section>
    </main>
  );
}


