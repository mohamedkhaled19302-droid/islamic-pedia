
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, HelpCircle, Heart, Info, Library } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { FeedbackLink } from "@/components/quran/FeedbackLink";
import { APP_BLURB, APP_SECTIONS, FAQS, SOURCES } from "@/lib/about";
import { useLang } from "@/lib/i18n";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seoHead({
      title: "لمحة عن التطبيق ومصادره — الموسوعة الإسلامية",
      description:
        "تعرّف على أقسام تطبيق الموسوعة الإسلامية: القراءة والمصحف صفحة صفحة والحفظ والتسميع والأذكار والسبحة ومواقيت الصلاة، ومصادر النص والتلاوات والتفاسير.",
      path: "/about",
      crumbs: [{ name: "حول التطبيق", path: "/about" }],
    }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLang();

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title={t("about.title")} subtitle={t("about.subtitle")} />

      <section className="mx-auto max-w-2xl px-4 pt-6">
        <div className="rounded-3xl border border-gold/40 bg-card p-6 shadow-glow">
          <span className="grid size-12 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground">
            <Info className="size-6" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t("app.name")}
          </h2>
          <p className="mt-3 text-sm leading-8 text-muted-foreground">{APP_BLURB}</p>
        </div>

        <h3 className="mt-8 flex items-center gap-2 text-base font-bold text-foreground">
          <BookOpen className="size-4 text-gold" /> {t("about.sections")}
        </h3>
        <div className="mt-3 grid gap-3">
          {APP_SECTIONS.map((s, i) => (
            <div
              key={s.title}
              style={{ animationDelay: `${i * 50}ms` }}
              className="animate-rise rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <p className="font-bold text-foreground">{s.title}</p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 flex items-center gap-2 text-base font-bold text-foreground">
          <HelpCircle className="size-4 text-gold" /> {t("about.faq")}
        </h3>
        <div className="mt-3 grid gap-2">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition-all open:border-gold/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-foreground [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

        <h3 className="mt-8 flex items-center gap-2 text-base font-bold text-foreground">
          <Library className="size-4 text-gold" /> {t("about.sources")}
        </h3>
        <div className="mt-3 grid gap-2">
          {SOURCES.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-gold/50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-gradient text-gold-foreground">
                <Heart className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">{s.name}</span>
                <span className="block text-xs text-muted-foreground">{s.role}</span>
              </span>
              <ArrowLeft className="size-4 text-primary rtl:block ltr:hidden" />
              <ArrowRight className="size-4 text-primary rtl:hidden ltr:block" />
            </a>
          ))}
        </div>

        <FeedbackLink
          to="/feedback"
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-gold-gradient px-5 py-3 text-sm font-bold text-gold-foreground shadow-soft transition-transform hover:-translate-y-0.5"
        >
          {t("about.share")}
        </FeedbackLink>

        <p className="mt-8 text-center text-xs leading-7 text-muted-foreground">{t("about.thanks")}</p>
      </section>
    </main>
  );
}
