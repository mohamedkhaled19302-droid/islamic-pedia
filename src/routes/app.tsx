import { createFileRoute } from "@tanstack/react-router";
import { Download, MonitorDown, ShieldCheck, Smartphone, CheckCircle2, Code2, Puzzle } from "lucide-react";
import { useEffect, useState } from "react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { useLang } from "@/lib/i18n";
import { APP_BINARY_URLS, APP_VERSION, GITHUB_REPO, isPackagedApp } from "@/lib/app-downloads";

const CHROME_EXT_URL = `${GITHUB_REPO}/tree/main/chrome-extension`;

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "تحميل التطبيق — الموسوعة الإسلامية" },
      {
        name: "description",
        content:
          "حمّل الموسوعة الإسلامية على ويندوز أو أندرويد. تطبيق كامل يعمل دون متصفح، أو استخدم النسخة الإلكترونية من الموقع.",
      },
      { property: "og:title", content: "تحميل التطبيق — الموسوعة الإسلامية" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DownloadAppPage,
});

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
        {n}
      </span>
      <span className="text-sm leading-7 text-muted-foreground">{children}</span>
    </li>
  );
}

function DownloadAppPage() {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted && isPackagedApp()) {
    return (
      <main className="min-h-screen pb-16">
        <ModeHeader title={t("app.title")} subtitle={t("app.subtitle")} />
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="animate-rise rounded-3xl border border-gold/40 bg-card p-8 text-center shadow-glow">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-gold-gradient text-gold-foreground">
              <CheckCircle2 className="size-8" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {t("app.alreadyInstalled")}
            </h2>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title={t("app.title")} subtitle={t("app.subtitle")} />

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">

        {/* ── ويندوز ── */}
        <section className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-5 py-3">
            <MonitorDown className="size-5 text-gold" />
            <h2 className="font-bold text-foreground">{t("app.windowsTitle")}</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-7 text-muted-foreground">{t("app.windowsDesc")}</p>

            <a
              href={APP_BINARY_URLS.windows}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              <Download className="size-4" />
              {t("app.download")} · {t("install.windows")} {APP_VERSION}
            </a>

            <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldCheck className="size-4 text-gold" /> {t("app.windowsWarnTitle")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("app.windowsWarnDesc")}</p>
              <ol className="mt-2 space-y-1.5">
                <Step n={1}>{t("app.windowsWarnStep1")}</Step>
                <Step n={2}>{t("app.windowsWarnStep2")}</Step>
                <Step n={3}>{t("app.windowsWarnStep3")}</Step>
              </ol>
            </div>
          </div>
        </section>

        {/* ── أندرويد ── */}
        <section className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-5 py-3">
            <Smartphone className="size-5 text-gold" />
            <h2 className="font-bold text-foreground">{t("app.androidTitle")}</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-7 text-muted-foreground">{t("app.androidDesc")}</p>

            <a
              href={APP_BINARY_URLS.apk}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              <Download className="size-4" />
              {t("app.download")} · APK {APP_VERSION}
            </a>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldCheck className="size-4 text-gold" /> {t("app.androidSteps")}
              </p>
              <ol className="mt-2 space-y-1.5">
                <Step n={1}>{t("app.androidStep1")}</Step>
                <Step n={2}>{t("app.androidStep2")}</Step>
                <Step n={3}>{t("app.androidStep3")}</Step>
                <Step n={4}>{t("app.androidStep4")}</Step>
              </ol>
            </div>

            <div className="mt-3 rounded-xl border border-green-500/30 bg-green-500/5 p-3">
              <p className="text-xs font-bold text-green-700 dark:text-green-400">{t("app.androidSafe")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("app.androidSafeDesc")}</p>
            </div>
          </div>
        </section>

        {/* ── إضافة المتصفح ── */}
        <section className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-5 py-3">
            <Puzzle className="size-5 text-gold" />
            <h2 className="font-bold text-foreground">إضافة المتصفح</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-7 text-muted-foreground">
              إضافة كروم توفر لك مواقيت الصلاة، السبحة، القرآن الكريم، والأذكار في نافذة صغيرة بضغطة واحدة.
            </p>

            <a
              href={CHROME_EXT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              <Puzzle className="size-4" />
              تحميل الإضافة من GitHub
            </a>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldCheck className="size-4 text-gold" /> طريقة التثبيت
              </p>
              <ol className="mt-2 space-y-1.5">
                <Step n={1}>حمّل مجلد الإضافة من الرابط أعلاه</Step>
                <Step n={2}>افتح <code className="rounded bg-muted px-1 py-0.5 text-xs">chrome://extensions</code> وفعّل وضع المطوّر</Step>
                <Step n={3}>اضغط «تحميل إضافة غير مضغوطة» واختر مجلد <code className="rounded bg-muted px-1 py-0.5 text-xs">chrome-extension</code></Step>
              </ol>
            </div>
          </div>
        </section>

        {/* ── الكود المصدري ── */}
        <section className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-5 py-3">
            <Code2 className="size-5 text-gold" />
            <h2 className="font-bold text-foreground">الكود المصدري</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm leading-7 text-muted-foreground">
              المشروع مفتوح المصدر بالكامل. يمكنك الاطلاع على الكود أو المساهمة أو تحميل أحدث إصدار.
            </p>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background shadow-soft transition-transform hover:scale-[1.02]"
            >
              <Code2 className="size-4" />
              فتح على GitHub
            </a>
          </div>
        </section>

        <p className="rounded-2xl border border-border bg-card p-4 text-center text-xs leading-7 text-muted-foreground">
          {t("app.webNote")}
        </p>
      </div>
    </main>
  );
}
