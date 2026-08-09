import { Link } from "@tanstack/react-router";
import { MonitorDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { isWindows } from "@/lib/app-downloads";
import { cn } from "@/lib/utils";

export function InstallAppButton({
  variant = "icon",
  className = "",
}: {
  variant?: "icon" | "pill";
  className?: string;
}) {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isWindows()) return null;

  if (variant === "pill") {
    return (
      <Link
        to="/app"
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-glow transition-transform hover:scale-105",
          className,
        )}
      >
        <MonitorDown className="size-4" />
        {t("install.windows")} · {t("install.downloadNow")}
      </Link>
    );
  }

  return (
    <Link
      to="/app"
      aria-label={t("install.title")}
      title={t("install.title")}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border border-gold/50 bg-background/10 text-gold backdrop-blur transition-all hover:scale-105 hover:bg-background/20",
        className,
      )}
    >
      <MonitorDown className="size-4" />
    </Link>
  );
}
