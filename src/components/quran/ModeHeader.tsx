
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ThemePicker } from "./ThemePicker";
import { InstallAppButton } from "./InstallAppButton";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";


export function ModeHeader({
  title,
  subtitle,
  right,
  children,
  hideOnScroll,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  hideOnScroll?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (!hideOnScroll) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (delta > 8 && y > 140) setHidden(true);
      else if (delta < -8) setHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnScroll]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/70 bg-hero text-hero-foreground shadow-soft transition-transform duration-300 ease-out",
        hidden && hideOnScroll && "-translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-3">
        <Link
          to="/"
          aria-label={t("common.home")}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-gold/40 bg-background/10 transition-colors hover:bg-background/20"
        >
          <Home className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h1>
          {subtitle ? <p className="truncate text-xs opacity-75">{subtitle}</p> : null}
        </div>
        <InstallAppButton variant="icon" className="size-9" />
        <ThemePicker className="shrink-0 [&>button]:size-9" />
        {right}

      </div>
      {children ? (
        <div className="mx-auto max-w-3xl px-3 pb-3">{children}</div>
      ) : null}
    </header>
  );
}


