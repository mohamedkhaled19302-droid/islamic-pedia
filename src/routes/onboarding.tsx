import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CloudDownload, Globe, Moon, Sun, Sparkles } from "lucide-react";
import { useTheme, THEMES } from "@/components/quran/use-theme";
import { useNightMode } from "@/components/quran/use-night-mode";
import { saveOnboarding } from "@/lib/storage";
import { LANGS, useLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "مرحباً بك — الموسوعة الإسلامية" },
      { name: "description", content: "اختر شكل تطبيقك وفضّل تحميل التلاوات في أول خطوة." },
      { property: "og:title", content: "مرحباً بك — الموسوعة الإسلامية" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { night, set } = useNightMode();
  const { lang, setLang, t, dir } = useLang();
  const [step, setStep] = useState(0);
  const [nightChoice, setNightChoice] = useState<boolean | null>(night);
  const [downloadNow, setDownloadNow] = useState(false);
  const [langChoice, setLangChoice] = useState<Lang>(lang);

  const steps = [
    t("onb.stepWelcome"),
    t("onb.stepLang"),
    t("onb.stepTheme"),
    t("onb.stepLook"),
    t("onb.stepAudio"),
  ];

  const finish = (dl: boolean) => {
    saveOnboarding({
      done: true,
      theme,
      night: nightChoice ?? false,
      downloadNow: dl,
      lang: langChoice,
    });
    void navigate({ to: dl ? "/downloads" : "/" });
  };

  const NextIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-hero px-4 py-10 text-hero-foreground">
      <div className="w-full max-w-lg">
        <div className="animate-rise rounded-3xl border border-gold/40 bg-background/70 p-6 shadow-glow backdrop-blur sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-quran text-lg text-gold">{t("app.bismillah")}</span>
            <span className="text-xs font-bold text-muted-foreground">
              {steps[step]} · {step + 1}/{steps.length}
            </span>
          </div>

          <div key={step} className="animate-rise mt-6">
            {step === 0 ? (
              <div className="text-center">
                <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                  {t("app.name")}
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
                  {t("onb.welcomeDesc")}
                </p>
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="size-4 text-gold" />
                  {t("onb.ready")}
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <h2 className="text-center text-xl font-bold">{t("onb.chooseLang")}</h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">{t("onb.chooseLangHint")}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {LANGS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLangChoice(l.id);
                        setLang(l.id);
                      }}
                      className={`flex items-center justify-center gap-2 rounded-2xl border p-5 transition-all ${
                        langChoice === l.id
                          ? "border-gold bg-secondary shadow-glow"
                          : "border-border bg-card hover:border-gold/50"
                      }`}
                    >
                      <Globe className={`size-5 ${langChoice === l.id ? "text-gold" : "text-muted-foreground"}`} />
                      <span className="font-bold text-foreground">{l.label}</span>
                      {langChoice === l.id ? <Check className="size-4 text-gold" /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <h2 className="text-center text-xl font-bold">{t("onb.chooseTheme")}</h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">{t("onb.chooseThemeHint")}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                        theme === th.id
                          ? "border-gold bg-secondary shadow-glow"
                          : "border-border bg-card hover:border-gold/50"
                      }`}
                    >
                      <span
                        className="size-9 shrink-0 rounded-full border border-border shadow-soft"
                        style={{ backgroundImage: th.swatch }}
                      />
                      <span className="flex-1 text-sm font-bold text-foreground">{th.name}</span>
                      {theme === th.id ? <Check className="size-4 text-gold" /> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <h2 className="text-center text-xl font-bold">{t("onb.chooseLook")}</h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">{t("onb.chooseLookHint")}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { key: false, label: t("onb.day"), desc: t("onb.dayDesc"), icon: Sun },
                    { key: true, label: t("onb.night"), desc: t("onb.nightDesc"), icon: Moon },
                  ].map((opt) => (
                    <button
                      key={String(opt.key)}
                      onClick={() => {
                        setNightChoice(opt.key);
                        set(opt.key);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all ${
                        (nightChoice ?? night) === opt.key
                          ? "border-gold bg-secondary shadow-glow"
                          : "border-border bg-card hover:border-gold/50"
                      }`}
                    >
                      <opt.icon className={`size-8 ${opt.key ? "text-primary" : "text-gold"}`} />
                      <span className="font-bold text-foreground">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <h2 className="text-center text-xl font-bold">{t("onb.downloadAudio")}</h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">{t("onb.downloadAudioHint")}</p>
                <div className="mt-5 grid gap-3">
                  <button
                    onClick={() => {
                      setDownloadNow(true);
                      finish(true);
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-gold bg-secondary p-4 text-right shadow-glow transition-all ltr:text-left hover:border-gold"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-gradient text-gold-foreground">
                      <CloudDownload className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold text-foreground">{t("onb.downloadNow")}</span>
                      <span className="block text-xs text-muted-foreground">{t("onb.downloadNowDesc")}</span>
                    </span>
                    <ArrowLeft className="size-4 text-primary rtl:block ltr:hidden" />
                    <ArrowRight className="size-4 text-primary rtl:hidden ltr:block" />
                  </button>
                  <button
                    onClick={() => {
                      setDownloadNow(false);
                      finish(false);
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right transition-all ltr:text-left hover:border-gold/50"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                      <Sparkles className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold text-foreground">{t("onb.startReading")}</span>
                      <span className="block text-xs text-muted-foreground">{t("onb.startReadingDesc")}</span>
                    </span>
                    <ArrowLeft className="size-4 text-primary rtl:block ltr:hidden" />
                    <ArrowRight className="size-4 text-primary rtl:hidden ltr:block" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-bold text-muted-foreground transition-all hover:bg-secondary disabled:opacity-30"
            >
              <BackIcon className="size-4" /> {t("common.back")}
            </button>

            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-gold-gradient" : i < step ? "w-2 bg-gold/60" : "w-2 bg-secondary"
                  }`}
                />
              ))}
            </div>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className="flex items-center gap-1 rounded-full bg-gold-gradient px-5 py-2 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-105"
              >
                {t("common.next")} <NextIcon className="size-4" />
              </button>
            ) : (
              <span className="px-2" />
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-hero-foreground/60">{t("onb.footerNote")}</p>
      </div>
    </main>
  );
}
