import { createFileRoute } from "@tanstack/react-router";
import { Download, MonitorDown, ShieldCheck, Smartphone, Globe, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { useLang } from "@/lib/i18n";
import { APP_BINARY_URLS, APP_VERSION, isPackagedApp } from "@/lib/app-downloads";

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

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <MonitorDown className="size-5 text-gold" /> {t("app.windowsTitle")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("app.windowsDesc")}</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{t("app.windowsInstallSteps")}</p>
          <a
            href={APP_BINARY_URLS.windows}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-105"
          >
            <Download className="size-4" />
            {t("app.download")} · {t("install.windows")} {APP_VERSION}
          </a>

          <div className="mt-5 rounded-xl border border-gold/40 bg-secondary/60 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="size-4 text-gold" /> {t("app.windowsWarnTitle")}
            </p>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">{t("app.windowsWarnDesc")}</p>
            <ol className="mt-2 space-y-1.5 text-sm leading-7 text-muted-foreground">
              <li>1. {t("app.windowsWarnStep1")}</li>
              <li>2. {t("app.windowsWarnStep2")}</li>
              <li>3. {t("app.windowsWarnStep3")}</li>
            </ol>
          </div>
        </section>

        <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <Smartphone className="size-5 text-gold" /> {t("app.androidTitle")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("app.androidDesc")}</p>

          <a
            href={APP_BINARY_URLS.apk}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-105"
          >
            <Download className="size-4" />
            {t("app.download")} · APK {APP_VERSION}
          </a>

          <h3 className="mt-5 flex items-center gap-2 text-sm font-bold text-foreground">
            <ShieldCheck className="size-4 text-gold" /> {t("app.androidSteps")}
          </h3>
          <ol className="mt-2 space-y-2 text-sm leading-7 text-muted-foreground">
            <li>1. {t("app.androidStep1")}</li>
            <li>2. {t("app.androidStep2")}</li>
            <li>3. {t("app.androidStep3")}</li>
            <li>4. {t("app.androidStep4")}</li>
          </ol>

          <div className="mt-5 rounded-xl border border-gold/40 bg-secondary/60 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="size-4 text-green-600" /> {t("app.androidSafe")}
            </p>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">{t("app.androidSafeDesc")}</p>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Globe className="size-4 text-primary" /> {t("app.playStoreTitle")}
            </p>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">{t("app.playStoreDesc")}</p>
          </div>
        </section>

        <p className="rounded-2xl border border-border bg-card p-4 text-center text-xs leading-7 text-muted-foreground">
          {t("app.webNote")}
        </p>
      </div>
    </main>
  );
}
