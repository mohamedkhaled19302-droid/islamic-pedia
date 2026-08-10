
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  CloudDownload,
  Languages,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { VersionBadge } from "@/components/quran/VersionBadge";
import { THEMES, useTheme } from "@/components/quran/use-theme";
import { useNightMode } from "@/components/quran/use-night-mode";
import { LANGS, useLang, type Lang } from "@/lib/i18n";
import { clearAllData } from "@/lib/storage";
import { countDownloadedAudio } from "@/lib/audioDownloads";
import { isPackagedApp } from "@/lib/app-downloads";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — الموسوعة الإسلامية" },
      { name: "description", content: "إعدادات شكل التطبيق والوضع الليلي والتحميلات والبيانات." },
      { property: "og:title", content: "الإعدادات — الموسوعة الإسلامية" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { theme, setTheme } = useTheme();
  const { night, toggle } = useNightMode();
  const { lang, setLang, t, num } = useLang();
  const [audioCount, setAudioCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isPackagedApp()) return;
    void countDownloadedAudio().then(setAudioCount);
  }, [mounted]);

  const packaged = mounted && isPackagedApp();

  const confirmReset = () => {
    if (window.confirm(t("settings.confirmReset"))) {
      void clearAllData();
    }
  };

  return (
    <main className="min-h-screen pb-24">
      <ModeHeader title={t("settings.title")} subtitle={t("settings.subtitle")}>
        <span className="text-xs text-muted-foreground">{t("common.dataLocal")}</span>
      </ModeHeader>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <Languages className="size-5 text-gold" /> {t("settings.langTitle")}
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{t("settings.langHint")}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id as Lang)}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
                  lang === l.id ? "border-gold bg-secondary shadow-glow" : "border-border bg-background hover:border-gold/50"
                }`}
              >
                <span className="font-bold text-foreground">{l.label}</span>
                {lang === l.id ? <Check className="size-4 text-gold" /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <Palette className="size-5 text-gold" /> {t("settings.themeTitle")}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition-all ltr:text-left ${
                  theme === th.id ? "border-gold bg-secondary shadow-glow" : "border-border bg-background hover:border-gold/50"
                }`}
              >
                <span
                  className="size-10 shrink-0 rounded-full border border-border"
                  style={{ backgroundImage: th.swatch }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {lang === "ar" ? th.name : th.nameEn}
                  </span>
                  <span className="block text-[11px] leading-tight text-muted-foreground">
                    {lang === "ar" ? th.desc : th.descEn}
                  </span>
                </span>
                {theme === th.id ? <Check className="size-4 shrink-0 text-gold" /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <Moon className="size-5 text-gold" /> {t("settings.nightTitle")}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => !night && toggle()}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
                !night ? "border-gold bg-secondary shadow-glow" : "border-border bg-background hover:border-gold/50"
              }`}
            >
              <Sun className="size-5 text-gold" />
              <span className="font-bold text-foreground">{t("settings.day")}</span>
            </button>
            <button
              onClick={() => night && toggle()}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
                night ? "border-gold bg-secondary shadow-glow" : "border-border bg-background hover:border-gold/50"
              }`}
            >
              <Moon className="size-5 text-primary" />
              <span className="font-bold text-foreground">{t("settings.night")}</span>
            </button>
          </div>
        </section>

        {packaged && (
          <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
            <Link
              to="/downloads"
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition-all hover:border-gold/50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-gradient text-gold-foreground">
                <CloudDownload className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-foreground">{t("settings.downloadsTitle")}</span>
                <span className="block text-xs text-muted-foreground">
                  {audioCount
                    ? `${num(audioCount)} ${t("settings.downloadsCount")}`
                    : t("settings.downloadsEmpty")}
                </span>
              </span>
            </Link>
          </section>
        )}

        <section className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="size-5 text-gold" /> {t("settings.aboutTitle")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("settings.aboutText")}</p>
          <div className="mt-3 text-xs text-muted-foreground">
            <VersionBadge />
          </div>
        </section>

        <section className="animate-rise rounded-2xl border border-destructive/40 bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold text-destructive">
            <Trash2 className="size-5" /> {t("settings.resetTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("settings.resetDesc")}</p>
          <button
            onClick={confirmReset}
            className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20"
          >
            {t("settings.resetBtn")}
          </button>
        </section>
      </div>
    </main>
  );
}
