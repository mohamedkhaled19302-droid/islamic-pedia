
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
import { isPackagedApp } from "@/lib/app-downloads";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الموسوعة الإسلامية — قرآن وحديث وأذكار ومواقيت الصلاة" },
      {
        name: "description",
        content:
          "الموسوعة الإسلامية: اقرأ القرآن الكريم بوضع مستمر أو صفحة صفحة، استمع لإذاعات القرآن، احفظ بالتكرار، اقرأ الحديث والسيرة والأذكار، واختبر معلوماتك بمسابقة تفاعلية.",
      },
      { property: "og:title", content: "الموسوعة الإسلامية — Islamic Pedia" },
      {
        property: "og:description",
        content:
          "قرآن كريم وتفسير وحديث وسيرة وأذكار ومواقيت صلاة وأدوات إسلامية في تطبيق واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});


const MODES = [
  {
    to: "/read",
    icon: BookOpen,
    title: "الوضع المستمر",
    en: "Continuous Mode",
    titleEn: "Continuous Mode",
    desc: "تصفّح القرآن كاملاً في شريط مستمر مع الترجمة والصوت والتمرير التلقائي.",
    descEn: "Browse the whole Qur'an in one continuous stream with translation, audio and auto-scroll.",
  },
  {
    to: "/page",
    icon: FileText,
    title: "صفحة صفحة",
    en: "Page by Page",
    titleEn: "Page by Page",
    desc: "اقرأ كما في المصحف المطبوع، من الصفحة ١ إلى ٦٠٤ مع تكرار الآيات.",
    descEn: "Read like a printed mushaf, from page 1 to 604, with verse repetition.",
  },
  {
    to: "/radio",
    icon: Radio,
    title: "إذاعات القرآن",
    en: "World Radio",
    titleEn: "Quran Radio",
    desc: "اختر الدولة واستمع لبث مباشر لإذاعة القرآن الكريم من كل أنحاء العالم.",
    descEn: "Pick a country and listen to live Quran radio broadcasts from around the world.",
  },
  {
    to: "/contest",
    icon: Trophy,
    title: "المسابقة القرآنية",
    en: "Quran Contest",
    titleEn: "Quran Contest",
    desc: "اختبر معرفتك مع سجل للنتائج وشاشة مراجعة تعرض الإجابات الصحيحة.",
    descEn: "Test your knowledge with a results history and a review screen showing correct answers.",
  },
  {
    to: "/memorize",
    icon: Repeat,
    title: "التكرار للحفظ",
    en: "Memorization",
    titleEn: "Memorization",
    desc: "اختر السورة ونطاق الآيات وعدد التكرارات ودع التطبيق يعينك على الحفظ.",
    descEn: "Pick the surah, verse range and repeat count and let the app help you memorize.",
  },
  {
    to: "/recite",
    icon: Mic,
    title: "اختبار التسميع",
    en: "Recitation Test",
    titleEn: "Recitation Test",
    desc: "حدّد النطاق (صفحات أو أجزاء أو سور) وسمّع بالميكروفون كلمة كلمة، أو سمّع بنفسك واكشف الآية.",
    descEn: "Choose a range (pages, juz or surahs) and recite word by word with the mic, or test yourself and reveal the verse.",
  },
  {
    to: "/tafsir",
    icon: ScrollText,
    title: "المصحف المجوّد والتفسير",
    en: "Tajweed & Tafsir",
    titleEn: "Tajweed & Tafsir",
    desc: "مصحف ملوّن بأحكام التجويد في الأعلى وتفسير الآية في الأسفل يتغيّر مع تلاوة الشيخ.",
    descEn: "A mushaf colored with tajweed rules on top and the verse's tafsir below, synced with the recitation.",
  },
  {
    to: "/hadith",
    icon: Library,
    title: "مكتبة الحديث",
    en: "Hadith Library",
    titleEn: "Hadith Library",
    desc: "البخاري ومسلم والسنن في أجزاء مرتبة، مع باب للأحاديث الضعيفة والموضوعة وبيان حكمها.",
    descEn: "Bukhari, Muslim and the Sunan in organized volumes, with a section for weak and fabricated hadith and their rulings.",
  },
  {
    to: "/athkar",
    icon: Sparkles,
    title: "الأذكار",
    en: "Daily Athkar",
    titleEn: "Daily Athkar",
    desc: "أذكار الصباح والمساء والنوم وأدبار الصلوات ورمضان والحج — موثقة بمصادرها مع عدّاد.",
    descEn: "Morning, evening, sleep and after-prayer athkar for Ramadan and Hajj — sourced with a counter.",
  },
  {
    to: "/tasbih",
    icon: CircleDot,
    title: "السبحة",
    en: "Tasbih Counter",
    titleEn: "Tasbih Counter",
    desc: "سبّح واحفظ عدّك تلقائياً بأهداف ٣٣ و٩٩ و١٠٠ وإحصائيات يومية بلا تسجيل دخول.",
    descEn: "Count dhikr with auto-saved totals and targets of 33, 99 and 100 plus daily stats, no sign-in.",
  },
  {
    to: "/prayer",
    icon: Timer,
    title: "مواقيت الصلاة",
    en: "Prayer Times",
    titleEn: "Prayer Times",
    desc: "اختر دولتك ومدينتك لترى مواقيت اليوم مع عدٍّ تنازلي للصلاة القادمة.",
    descEn: "Choose your country and city to see today's prayer times with a countdown to the next prayer.",
  },
  {
    to: "/search",
    icon: Search,
    title: "البحث في الآيات",
    en: "Verse Search",
    titleEn: "Verse Search",
    desc: "ابحث عن أي كلمة أو عبارة في المصحف كاملاً وانتقل مباشرة إلى موضعها.",
    descEn: "Search any word or phrase in the whole Qur'an and jump straight to it.",
  },
  {
    to: "/sira",
    icon: ScrollText,
    title: "السيرة النبوية الشريفة",
    en: "Prophetic Biography",
    titleEn: "Prophetic Biography",
    desc: "فصول السيرة من المولد إلى الرفيق الأعلى مع بحث داخل النصوص.",
    descEn: "Seerah chapters from birth to the final journey, with in-text search.",
  },
  {
    to: "/tools",
    icon: Compass,
    title: "أدوات إسلامية",
    en: "Islamic Tools",
    titleEn: "Islamic Tools",
    desc: "أسماء الله الحسنى، التقويم الهجري، المناسبات، حاسبة الزكاة، الآيات المتشابهات، وآية اليوم.",
    descEn: "The 99 names, Hijri calendar, occasions, zakat calculator, similar verses and verse of the day.",
  },
  {
    to: "/dashboard",
    icon: Layers,
    title: "لوحة تقدّم الحفظ",
    en: "Progress",
    titleEn: "Memorization Progress",
    desc: "تابع نطاقات الحفظ المكتملة وسجل التكرار وكل ملاحظاتك على الآيات.",
    descEn: "Track completed memorization ranges, repetition history and all your verse notes.",
  },
  {
    to: "/downloads",
    icon: Download,
    title: "التحميلات والعمل دون إنترنت",
    en: "Offline & Downloads",
    titleEn: "Offline & Downloads",
    desc: "حمّل تلاوات القرّاء وصفحات المصاحف لتستمع وتقرأ بلا اتصال، واعرف ما يعمل دون إنترنت تلقائياً.",
    descEn: "Download recitations and mushaf pages to listen and read offline, and see what works offline automatically.",
  },
] as const;


const MODE_LABEL: Record<string, { title: string; titleEn: string; to: string }> = {
  read: { title: "الوضع المستمر", titleEn: "Continuous Mode", to: "/read" },
  page: { title: "صفحة صفحة", titleEn: "Page by Page", to: "/page" },
  memorize: { title: "التكرار للحفظ", titleEn: "Memorization", to: "/memorize" },
  hadith: { title: "قراءة الحديث", titleEn: "Hadith Reading", to: "/hadith" },
};

function Splash() {
  const progress = useLocalStore<Record<string, Progress>>(getProgress, {});
  const bookmarks = useLocalStore<Bookmark[]>(getBookmarks, []);
  const { t, num, lang } = useLang();
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
                      {lang === "ar" ? (MODE_LABEL[p.mode]?.title ?? p.mode) : (MODE_LABEL[p.mode]?.titleEn ?? p.mode)}
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
                  <h2 className="text-lg font-bold text-foreground">{lang === "ar" ? m.title : m.titleEn}</h2>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {m.en}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{lang === "ar" ? m.desc : m.descEn}</p>
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


