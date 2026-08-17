
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  CircleDot,
  Compass,
  Mic,
  NotebookPen,
  Repeat,
  Sparkles,
  Timer,
  Trash2,
  Trophy,
} from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { useLocalStore } from "@/components/quran/use-local-store";
import {
  clearContestHistory,
  clearMemoSessions,
  getAthkarState,
  getBookmarks,
  getContestHistory,
  getMemoSessions,
  getNotes,
  getPrayerPlace,
  getProgress,
  getReciteState,
  getTasbih,
  removeNote,
  type Bookmark,
  type ContestRun,
  type MemoSession,
  type Note,
  type PrayerPlace,
  type Progress,
  type ReciteState,
  type TasbihState,
} from "@/lib/storage";
import { toArabicNumber } from "@/lib/quran";
import { seoHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    seoHead({
      title: "لوحة التقدّم — الحفظ والتسميع والمسابقة والأذكار",
      description:
        "لوحة شاملة لكل نشاطك: القراءة والحفظ واختبار التسميع والمسابقة القرآنية والسبحة والأذكار والعلامات والملاحظات في مكان واحد.",
      path: "/dashboard",
      crumbs: [{ name: "لوحة التقدّم", path: "/dashboard" }],
      noIndex: true,
    }),
  component: Dashboard,
});

const dateLabel = (t: number) =>
  new Date(t).toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" });

const MODE_TO: Record<string, string> = {
  read: "/read",
  page: "/page",
  memorize: "/memorize",
  hadith: "/hadith",
};

function Section({
  icon: Icon,
  title,
  hint,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
        <span className="flex-1" />
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}{" "}
      <Link to={to} className="text-primary underline-offset-4 hover:underline">
        {cta}
      </Link>
    </p>
  );
}

function Dashboard() {
  const sessions = useLocalStore<MemoSession[]>(getMemoSessions, []);
  const notes = useLocalStore<Note[]>(getNotes, []);
  const bookmarks = useLocalStore<Bookmark[]>(getBookmarks, []);
  const progress = useLocalStore<Record<string, Progress>>(getProgress, {});
  const contests = useLocalStore<ContestRun[]>(getContestHistory, []);
  const recite = useLocalStore<ReciteState | null>(getReciteState, null);
  const tasbih = useLocalStore<TasbihState>(getTasbih, {
    counts: {},
    total: 0,
    daily: {},
    target: 33,
    active: "",
  });
  const athkar = useLocalStore<Record<string, number>>(getAthkarState, {});
  const place = useLocalStore<PrayerPlace | null>(getPrayerPlace, null);

  const totalPlays = sessions.reduce((n, s) => n + s.plays, 0);
  const ayahsCovered = new Set(
    sessions.flatMap((s) =>
      Array.from({ length: Math.max(0, s.to - s.from + 1) }, (_, i) => `${s.surah}:${s.from + i}`),
    ),
  ).size;
  const surahs = new Set(sessions.map((s) => s.surah)).size;

  const right = contests.reduce((n, c) => n + c.right, 0);
  const wrong = contests.reduce((n, c) => n + c.wrong, 0);
  const accuracy = right + wrong ? Math.round((right / (right + wrong)) * 100) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const athkarToday = Object.keys(athkar).filter((k) => k.startsWith(today)).length;
  const tasbihToday = tasbih.daily?.[today] ?? 0;

  const stats = [
    { label: "جلسة حفظ", value: sessions.length },
    { label: "آية مغطّاة", value: ayahsCovered },
    { label: "سورة", value: surahs },
    { label: "تلاوة مكرّرة", value: totalPlays },
    { label: "مسابقة", value: contests.length },
    { label: "% إتقان المسابقة", value: accuracy },
    { label: "تسبيحة اليوم", value: tasbihToday },
    { label: "ملاحظة وعلامة", value: notes.length + bookmarks.length },
  ];

  return (
    <main className="min-h-screen pb-20">
      <ModeHeader title="لوحة التقدّم" subtitle="كل نشاطك في التطبيق: قراءة وحفظ وتسميع ومسابقة وأذكار" />

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        {/* ملخص */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-gold/40 bg-card p-4 text-center shadow-soft"
            >
              <p className="text-2xl font-bold text-primary">{toArabicNumber(s.value)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </section>

        {/* إرشاد */}
        <section className="rounded-2xl border border-gold/40 bg-card p-4 text-sm leading-7 text-muted-foreground shadow-soft">
          <h2 className="mb-2 font-bold text-foreground">كيف ترفع تقدّمك؟</h2>
          <ul className="space-y-1.5">
            <li>
              • <Link to="/memorize" className="text-primary hover:underline">التكرار للحفظ</Link> —
              كل جلسة ونطاق وتكرار يُسجّل هنا.
            </li>
            <li>
              • <Link to="/recite" className="text-primary hover:underline">اختبار التسميع</Link> —
              سمّع بصوتك وتظهر أخطاؤك في القسم المخصص أدناه.
            </li>
            <li>
              • <Link to="/read" search={{ s: undefined, a: undefined }} className="text-primary hover:underline">الوضع المستمر</Link> و
              <Link to="/page" search={{ p: undefined }} className="text-primary hover:underline"> صفحة صفحة</Link> — تحفظ

              موضعك تلقائياً.
            </li>
            <li>
              • <Link to="/contest" className="text-primary hover:underline">المسابقة</Link> و
              <Link to="/tools" className="text-primary hover:underline"> المتشابهات</Link> — لتثبيت
              الحفظ وتمييز الآيات المتقاربة.
            </li>
            <li>
              • <Link to="/athkar" className="text-primary hover:underline">الأذكار</Link> و
              <Link to="/tasbih" className="text-primary hover:underline"> السبحة</Link> — وردك
              اليومي يُحتسب هنا.
            </li>
          </ul>
        </section>

        {/* متابعة القراءة */}
        <Section icon={BookOpen} title="متابعة القراءة">
          {Object.values(progress).length === 0 ? (
            <Empty text="لم تبدأ القراءة بعد." to="/read" cta="ابدأ القراءة" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {Object.values(progress)
                .sort((a, b) => b.at - a.at)
                .map((p) => (
                  <li key={p.mode} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                    <p className="text-sm font-bold text-foreground">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground">{dateLabel(p.at)}</p>
                    <Link
                      to={MODE_TO[p.mode] ?? "/"}
                      className="mt-1 inline-block text-xs text-primary hover:underline"
                    >
                      متابعة
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Section>

        {/* الحفظ */}
        <Section
          icon={Repeat}
          title="سجل جلسات الحفظ"
          action={
            sessions.length ? (
              <Button size="sm" variant="secondary" onClick={clearMemoSessions}>
                مسح السجل
              </Button>
            ) : null
          }
        >
          {sessions.length === 0 ? (
            <Empty text="لم تبدأ أي جلسة حفظ بعد." to="/memorize" cta="ابدأ الآن" />
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-xs shadow-soft"
                >
                  <div className="flex-1">
                    <p className="font-quran text-base text-foreground">{s.surahName}</p>
                    <p className="text-muted-foreground">
                      الآيات {toArabicNumber(s.from)}–{toArabicNumber(s.to)} · تكرار{" "}
                      {toArabicNumber(s.repeat)} · {toArabicNumber(s.plays)} تلاوة
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dateLabel(s.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* اختبار التسميع */}
        <Section icon={Mic} title="اختبار التسميع">
          {!recite ? (
            <Empty text="لا توجد جلسة تسميع محفوظة." to="/recite" cta="ابدأ التسميع" />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
              <p className="text-foreground">
                جلسة محفوظة —{" "}
                {recite.kind === "page" ? "صفحات" : recite.kind === "juz" ? "أجزاء" : "سور"} من{" "}
                {toArabicNumber(recite.from)} إلى {toArabicNumber(recite.to)} · الصفحة الحالية{" "}
                {toArabicNumber(recite.page)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                الأخطاء المسجّلة: {toArabicNumber(recite.mistakes.length)} · الوضع{" "}
                {recite.mode === "mic" ? "بالميكروفون" : "ذاتي"} · آخر تحديث {dateLabel(recite.at)}
              </p>
              {recite.mistakes.length ? (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
                  {recite.mistakes.slice(0, 8).map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {m.kind === "missed" ? "خطأ" : "تخطٍّ"}
                      </span>
                      <span className="font-quran text-base text-foreground">{m.expected}</span>
                      <span className="text-muted-foreground">
                        {m.surahName} · آية {toArabicNumber(m.ayahNumber)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                to="/recite"
                className="mt-3 inline-block text-xs text-primary underline-offset-4 hover:underline"
              >
                متابعة الجلسة
              </Link>
            </div>
          )}
        </Section>

        {/* المسابقة */}
        <Section
          icon={Trophy}
          title="المسابقة القرآنية"
          hint={contests.length ? `الإتقان ${toArabicNumber(accuracy)}٪` : undefined}
          action={
            contests.length ? (
              <Button size="sm" variant="secondary" onClick={clearContestHistory}>
                مسح السجل
              </Button>
            ) : null
          }
        >
          {contests.length === 0 ? (
            <Empty text="لم تخض أي مسابقة بعد." to="/contest" cta="ابدأ المسابقة" />
          ) : (
            <ul className="space-y-2">
              {contests.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-xs shadow-soft"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{c.typeLabel}</p>
                    <p className="text-muted-foreground">{c.scopeLabel}</p>
                  </div>
                  <span className="text-primary">✓ {toArabicNumber(c.right)}</span>
                  <span className="text-destructive">✕ {toArabicNumber(c.wrong)}</span>
                  <span className="text-[10px] text-muted-foreground">{dateLabel(c.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* السبحة والأذكار */}
        <Section icon={CircleDot} title="الورد اليومي">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
              <p className="font-bold text-foreground">السبحة</p>
              <p className="mt-1 text-muted-foreground">
                اليوم {toArabicNumber(tasbihToday)} · الإجمالي {toArabicNumber(tasbih.total)} · الهدف{" "}
                {toArabicNumber(tasbih.target)}
              </p>
              <Link to="/tasbih" className="mt-2 inline-block text-xs text-primary hover:underline">
                افتح السبحة
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
              <p className="flex items-center gap-2 font-bold text-foreground">
                <Sparkles className="size-4 text-gold" /> الأذكار
              </p>
              <p className="mt-1 text-muted-foreground">
                {athkarToday
                  ? `تقدّمت في ${toArabicNumber(athkarToday)} ذكراً اليوم`
                  : "لم تبدأ أذكار اليوم بعد"}
              </p>
              <Link to="/athkar" className="mt-2 inline-block text-xs text-primary hover:underline">
                افتح الأذكار
              </Link>
            </div>
          </div>
        </Section>

        {/* الصلاة والأدوات */}
        <Section icon={Timer} title="الصلاة والأدوات">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
              <p className="font-bold text-foreground">مواقيت الصلاة</p>
              <p className="mt-1 text-muted-foreground">
                {place ? `${place.city} — ${place.country}` : "لم تحدّد مدينتك بعد"}
              </p>
              <Link to="/prayer" className="mt-2 inline-block text-xs text-primary hover:underline">
                افتح المواقيت
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
              <p className="flex items-center gap-2 font-bold text-foreground">
                <Compass className="size-4 text-primary" /> أدوات إسلامية
              </p>
              <p className="mt-1 text-muted-foreground">
                التقويم الهجري، أسماء الله الحسنى، الزكاة، والمتشابهات.
              </p>
              <Link to="/tools" className="mt-2 inline-block text-xs text-primary hover:underline">
                افتح الأدوات
              </Link>
            </div>
          </div>
        </Section>

        {/* العلامات */}
        <Section icon={BookMarked} title="العلامات المرجعية">
          {bookmarks.length === 0 ? (
            <Empty text="لا توجد علامات محفوظة." to="/read" cta="احفظ آية" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {bookmarks.slice(0, 10).map((b) => (
                <li key={b.id} className="rounded-2xl border border-border bg-card p-3 text-xs shadow-soft">
                  <p className="font-bold text-foreground">
                    {b.kind === "page"
                      ? `صفحة ${toArabicNumber(b.page ?? 0)}`
                      : `${b.surahName} — آية ${toArabicNumber(b.ayah ?? 0)}`}
                  </p>
                  {b.text ? (
                    <p className="font-quran mt-1 line-clamp-2 text-sm text-muted-foreground">{b.text}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* الملاحظات */}
        <Section icon={NotebookPen} title="ملاحظاتي على الآيات">
          {notes.length === 0 ? (
            <Empty text="أضف ملاحظة من زر الدفتر بجانب أي آية." to="/read" cta="افتح المصحف" />
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                  <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-quran text-sm text-primary">{n.surahName}</span>
                    <span>آية {toArabicNumber(n.ayah)}</span>
                    <span className="flex-1" />
                    <button
                      onClick={() => removeNote(n.id)}
                      aria-label="حذف الملاحظة"
                      className="grid size-7 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {n.text ? (
                    <p className="font-quran text-base leading-8 text-foreground">{n.text}</p>
                  ) : null}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
                  <Link
                    to="/read"
                    search={{ s: n.surah, a: n.ayah }}
                    className="mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline"
                  >
                    فتح الآية
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}


