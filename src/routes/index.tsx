
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  CircleDot,
  Compass,
  Download,
  FileText,
  History,
  Layers,
  Library,
  Mic,
  MessageSquareHeart,
  Radio,
  Repeat,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";

import heroPattern from "@/assets/hero-pattern.jpg";
import { useLocalStore } from "@/components/quran/use-local-store";
import { InstallAppButton } from "@/components/quran/InstallAppButton";
import { FeedbackLink } from "@/components/quran/FeedbackLink";
import { getBookmarks, getProgress, type Bookmark, type Progress } from "@/lib/storage";
import { AboutMarquee } from "@/components/quran/AboutMarquee";
import { useLang } from "@/lib/i18n";
import { seoHead } from "@/lib/seo";
import { isPackagedApp } from "@/lib/app-downloads";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      title: "قرآن وحديث وأذكار ومواقيت الصلاة",
      description:
        "الموسوعة الإسلامية: اقرأ القرآن الكريم بوضع مستمر أو صفحة صفحة، استمع لإذاعات القرآن، احفظ بالتكرار، اقرأ الحديث والسيرة والأذكار، واختبر معلوماتك بمسابقة تفاعلية.",
      path: "/",
    }),
  component: Splash,
});


const MODES = [
  {
    to: "/read",
    icon: BookOpen,
    title: "الوضع المستمر",
    desc: "تصفّح القرآن كاملاً في شريط مستمر مع الترجمة والصوت والتمرير التلقائي.",
  },
  {
    to: "/page",
    icon: FileText,
    title: "صفحة صفحة",
    desc: "اقرأ كما في المصحف المطبوع، من الصفحة ١ إلى ٦٠٤ مع تكرار الآيات.",
  },
  {
    to: "/radio",
    icon: Radio,
    title: "إذاعات القرآن",
    desc: "اختر الدولة واستمع لبث مباشر لإذاعة القرآن الكريم من كل أنحاء العالم.",
  },
  {
    to: "/contest",
    icon: Trophy,
    title: "المسابقة القرآنية",
    desc: "اختبر معرفتك مع سجل للنتائج وشاشة مراجعة تعرض الإجابات الصحيحة.",
  },
  {
    to: "/memorize",
    icon: Repeat,
    title: "التكرار للحفظ",
    desc: "اختر السورة ونطاق الآيات وعدد التكرارات ودع التطبيق يعينك على الحفظ.",
  },
  {
    to: "/recite",
    icon: Mic,
    title: "اختبار التسميع",
    desc: "حدّد النطاق (صفحات أو أجزاء أو سور) وسمّع بالميكروفون كلمة كلمة، أو سمّع بنفسك واكشف الآية.",
  },
  {
    to: "/tafsir",
    icon: ScrollText,
    title: "المصحف المجوّد والتفسير",
    desc: "مصحف ملوّن بأحكام التجويد في الأعلى وتفسير الآية في الأسفل يتغيّر مع تلاوة الشيخ.",
  },
  {
    to: "/hadith",
    icon: Library,
    title: "مكتبة الحديث",
    desc: "البخاري ومسلم والسنن في أجزاء مرتبة، مع باب للأحاديث الضعيفة والموضوعة وبيان حكمها.",
  },
  {
    to: "/athkar",
    icon: Sparkles,
    title: "الأذكار",
    desc: "أذكار الصباح والمساء والنوم وأدبار الصلوات ورمضان والحج — موثقة بمصادرها مع عدّاد.",
  },
  {
    to: "/tasbih",
    icon: CircleDot,
    title: "السبحة",
    desc: "سبّح واحفظ عدّك تلقائياً بأهداف ٣٣ و٩٩ و١٠٠ وإحصائيات يومية بلا تسجيل دخول.",
  },
  {
    to: "/prayer",
    icon: Timer,
    title: "مواقيت الصلاة",
    desc: "اختر دولتك ومدينتك لترى مواقيت اليوم مع عدٍّ تنازلي للصلاة القادمة.",
  },
  {
    to: "/search",
    icon: Search,
    title: "البحث في الآيات",
    desc: "ابحث عن أي كلمة أو عبارة في المصحف كاملاً وانتقل مباشرة إلى موضعها.",
  },
  {
    to: "/sira",
    icon: ScrollText,
    title: "السيرة النبوية الشريفة",
    desc: "فصول السيرة من المولد إلى الرفيق الأعلى مع بحث داخل النصوص.",
  },
  {
    to: "/tools",
    icon: Compass,
    title: "أدوات إسلامية",
    desc: "أسماء الله الحسنى، التقويم الهجري، المناسبات، حاسبة الزكاة، الآيات المتشابهات، وآية اليوم.",
  },
  {
    to: "/dashboard",
    icon: Layers,
    title: "لوحة تقدّم الحفظ",
    desc: "تابع نطاقات الحفظ المكتملة وسجل التكرار وكل ملاحظاتك على الآيات.",
  },
  {
    to: "/downloads",
    icon: Download,
    title: "التحميلات والعمل دون إنترنت",
    desc: "حمّل تلاوات القرّاء وصفحات المصاحف لتستمع وتقرأ بلا اتصال، واعرف ما يعمل دون إنترنت تلقائياً.",
  },
] as const;


const MODE_LABEL: Record<string, { title: string; to: string }> = {
  read: { title: "الوضع المستمر", to: "/read" },
  page: { title: "صفحة صفحة", to: "/page" },
  memorize: { title: "التكرار للحفظ", to: "/memorize" },
  hadith: { title: "قراءة الحديث", to: "/hadith" },
};

function Splash() {
  const progress = useLocalStore<Record<string, Progress>>(getProgress, {});
  const bookmarks = useLocalStore<Bookmark[]>(getBookmarks, []);
  const { t, num } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const packaged = mounted && isPackagedApp();
  const visibleModes = MODES.filter((m) => packaged || m.to !== "/downloads");

  const resume = Object.values(progress).sort((a, b) => b.at - a.at);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <section className="theme-hero relative overflow-hidden bg-hero text-hero-foreground">
        <img
          src={heroPattern}
          alt=""
          aria-hidden="true"
          width={1280}
          height={960}
          className="absolute inset-0 size-full object-cover opacity-15"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-background/25" />
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          <Link
            to="/settings"
            aria-label="الإعدادات"
            title="الإعدادات — شكل التطبيق والوضع الليلي والتحميلات"
            className="grid size-10 place-items-center rounded-full border border-gold/50 bg-background/10 text-gold backdrop-blur transition-all hover:scale-105 hover:bg-background/20"
          >
            <Settings className="size-4" />
          </Link>
        </div>
        <FeedbackLink
          to="/feedback"
          aria-label="أرسل رأيك"
          title="أرسل رأيك"
          className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full border border-gold/50 bg-background/10 text-gold backdrop-blur transition-all hover:scale-105 hover:bg-background/20"
        >
          <MessageSquareHeart className="size-4" />
        </FeedbackLink>
        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-14 text-center sm:pt-16">
          <p className="font-quran animate-pop text-lg text-gold">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
          <h1
            className="animate-rise mt-5 text-4xl font-bold tracking-tight text-hero-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-5xl"
            style={{ fontFamily: "var(--font-display)", animationDelay: "80ms" }}
          >
            {t("app.name")}
          </h1>
          <p
            className="animate-rise mx-auto mt-4 max-w-md text-sm leading-7 text-hero-foreground/85"
            style={{ animationDelay: "160ms" }}
          >
            {t("home.heroTag")}
          </p>
          <div className="animate-pop mx-auto mt-6 h-px w-24 bg-gold-gradient" />
          <div className="animate-pop mt-6" style={{ animationDelay: "240ms" }}>
            <InstallAppButton variant="pill" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-10">

        {resume.length ? (
          <div className="theme-card animate-rise mb-6 rounded-2xl border border-gold/40 bg-card p-4 shadow-glow">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <History className="size-4 text-gold" /> {t("home.resume")}
            </h2>
            <div className="mt-3 grid gap-2">
              {resume.map((p) => (
                <Link
                  key={p.mode}
                  to={MODE_LABEL[p.mode]?.to ?? "/"}
                  search={
                    p.mode === "page"
                      ? { p: p.value }
                      : p.mode === "read"
                        ? { s: p.value, a: p.ayah }
                        : p.mode === "hadith"
                          ? { b: p.book, s: p.value, p: p.page }
                          : { s: p.value }
                  }
                  className="flex items-center gap-3 rounded-xl bg-secondary/70 p-3 transition-all hover:translate-x-[-4px] hover:bg-secondary"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold-gradient text-gold-foreground">
                    <BookOpen className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {p.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {MODE_LABEL[p.mode]?.title ?? p.mode}
                    </span>
                  </span>
                  <ArrowLeft className="size-4 text-primary" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <Link
          to="/bookmarks"
          className="theme-card animate-rise mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gold-gradient text-gold-foreground">
            <BookMarked className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-foreground">{t("home.bookmarks")}</span>
            <span className="block text-xs text-muted-foreground">
              {bookmarks.length
                ? `${num(bookmarks.length)} ${t("home.bookmarksCount")}`
                : t("home.bookmarksEmpty")}
            </span>
          </span>
          <ArrowLeft className="size-4 text-primary" />
        </Link>

        <div className="theme-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleModes.map((m, i) => (
            <Link
              key={m.to}
              to={m.to}
              style={{ animationDelay: `${i * 70}ms` }}
              className="theme-card group animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-glow"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-gold-gradient text-gold-foreground shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <m.icon className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{m.title}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{m.desc}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {t("common.startNow")}
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1 rtl:block ltr:hidden" />
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:hidden ltr:block" />
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          {t("home.footerNote")}
        </p>
      </section>

      <AboutMarquee />
    </main>
  );
}


