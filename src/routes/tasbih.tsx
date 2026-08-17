
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Vibrate } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { TASBIH_PHRASES } from "@/lib/athkar";
import { getTasbih, saveTasbih, type TasbihState } from "@/lib/storage";
import { toArabicNumber } from "@/lib/quran";
import { seoHead } from "@/lib/seo";
import { SeoIntro } from "@/components/SeoIntro";

export const Route = createFileRoute("/tasbih")({
  head: () =>
    seoHead({
      title: "السبحة الإلكترونية — عدّاد التسبيح",
      description:
        "سبحة إلكترونية بعدّاد لكل ذكر، مع أهداف ٣٣ و٩٩ و١٠٠، وإحصائيات يومية وإجمالية تُحفظ تلقائياً على جهازك دون تسجيل دخول.",
      path: "/tasbih",
      crumbs: [{ name: "السبحة الإلكترونية", path: "/tasbih" }],
    }),
  component: TasbihPage,
});

const TARGETS = [33, 99, 100, 1000];
const dayKey = () => new Date().toISOString().slice(0, 10);

function TasbihPage() {
  const [s, setS] = useState<TasbihState | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => setS(getTasbih()), []);

  if (!s) return <div className="min-h-screen" />;

  const count = s.counts[s.active] ?? 0;
  const pct = Math.min(100, Math.round((count / s.target) * 100));

  const update = (next: TasbihState) => {
    setS(next);
    saveTasbih(next);
  };

  const tap = () => {
    const d = dayKey();
    const nextCount = count + 1;
    update({
      ...s,
      counts: { ...s.counts, [s.active]: nextCount },
      total: s.total + 1,
      daily: { ...s.daily, [d]: (s.daily[d] ?? 0) + 1 },
    });
    setPulse((p) => p + 1);
    if (nextCount % s.target === 0 && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const resetActive = () => update({ ...s, counts: { ...s.counts, [s.active]: 0 } });

  const todayCount = s.daily[dayKey()] ?? 0;

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title="السبحة" subtitle="سبّح واحفظ عدّك تلقائياً — بلا تسجيل دخول" />

      <section className="mx-auto max-w-3xl px-4 pt-4">
        <SeoIntro
          title="السبحة الإلكترونية"
          links={[
            { to: "/athkar", label: "الأذكار الموثقة" },
            { to: "/dashboard", label: "لوحة التقدّم" },
          ]}
        >
          سبحة إلكترونية بعدّاد لكل ذكر من أذكار التسبيح والتحميد والتهليل
          والتكبير، مع أهداف ٣٣ و٩٩ و١٠٠ وإحصائيات يومية وإجمالية تُحفظ تلقائياً
          على جهازك دون تسجيل دخول.
        </SeoIntro>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {TASBIH_PHRASES.map((p) => (
            <button
              key={p}
              onClick={() => update({ ...s, active: p })}
              className={`shrink-0 rounded-full border px-3 py-1.5 font-quran text-sm transition-colors ${
                p === s.active
                  ? "border-gold bg-gold-gradient text-gold-foreground"
                  : "border-border bg-card text-foreground hover:border-gold/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">الهدف:</span>
          {TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => update({ ...s, target: t })}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                t === s.target
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {toArabicNumber(t)}
            </button>
          ))}
        </div>

        <div className="mt-6 grid place-items-center">
          <button
            onClick={tap}
            aria-label="تسبيح"
            className="group relative grid size-64 place-items-center rounded-full border-4 border-gold/50 bg-hero text-hero-foreground shadow-glow transition-transform active:scale-95"
          >
            <span className="pointer-events-none absolute inset-2 rounded-full border border-gold/25" />
            <span
              key={pulse}
              className="animate-pop pointer-events-none absolute inset-0 rounded-full ring-4 ring-gold/40"
            />
            <span className="font-quran text-lg text-gold">{s.active}</span>
            <span className="mt-1 text-6xl font-bold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
              {toArabicNumber(count)}
            </span>
            <span className="mt-1 text-xs opacity-70">اضغط للتسبيح</span>
          </button>
        </div>

        <div className="mx-auto mt-6 max-w-sm">
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gold-gradient transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {toArabicNumber(count % s.target)} / {toArabicNumber(s.target)}
            </span>
            <span>أكملت {toArabicNumber(Math.floor(count / s.target))} دورة</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="اليوم" value={todayCount} />
          <Stat label="هذا الذكر" value={count} />
          <Stat label="الإجمالي" value={s.total} />
        </div>

        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={resetActive}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
          >
            <RotateCcw className="size-4" /> تصفير هذا الذكر
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Vibrate className="size-4 text-gold" /> سجل الأيام الأخيرة
          </h2>
          <div className="mt-3 grid gap-2">
            {Object.entries(s.daily)
              .sort((a, b) => (a[0] < b[0] ? 1 : -1))
              .slice(0, 7)
              .map(([d, n]) => (
                <div
                  key={d}
                  className="flex items-center justify-between rounded-xl bg-secondary/70 px-3 py-2 text-xs"
                >
                  <span className="text-muted-foreground">{d}</span>
                  <span className="font-bold text-foreground">{toArabicNumber(n)} تسبيحة</span>
                </div>
              ))}
            {!Object.keys(s.daily).length ? (
              <p className="text-xs text-muted-foreground">ابدأ التسبيح وسيظهر سجلك هنا.</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-soft">
      <p className="text-xl font-bold text-foreground tabular-nums">{toArabicNumber(value)}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}


