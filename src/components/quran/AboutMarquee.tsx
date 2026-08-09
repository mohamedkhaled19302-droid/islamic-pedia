
import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { APP_BLURB } from "@/lib/about";

/**
 * شريط سفلي يمرّر نبذة التطبيق، مع زر دائري صغير (i) يفتح صفحة اللمحة كاملة
 * لمن لم يلحق بقراءة النص المتحرك.
 */
export function AboutMarquee() {
  return (
    <section className="border-t border-gold/25 bg-hero py-5 text-hero-foreground">
      <h2
        className="text-center text-sm font-bold text-gold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        لمحة عن التطبيق
      </h2>

      <div className="relative mt-3 overflow-hidden" dir="ltr">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[color-mix(in_oklab,var(--emerald-deep)_92%,transparent)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[color-mix(in_oklab,var(--emerald-deep)_92%,transparent)] to-transparent" />
        <div className="animate-marquee flex w-max gap-16">
          {[0, 1].map((k) => (
            <p
              key={k}
              dir="rtl"
              aria-hidden={k === 1}
              className="whitespace-nowrap text-sm leading-8 text-hero-foreground/90"
            >
              {APP_BLURB}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Link
          to="/about"
          aria-label="لمحة عن التطبيق"
          title="لمحة عن التطبيق"
          className="grid size-10 place-items-center rounded-full border border-gold/60 bg-background/10 text-gold shadow-glow transition-transform hover:scale-110"
        >
          <Info className="size-5" />
        </Link>
      </div>
    </section>
  );
}


