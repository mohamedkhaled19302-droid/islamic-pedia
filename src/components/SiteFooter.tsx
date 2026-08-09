import { Link } from "@tanstack/react-router";
import { MonitorDown, Smartphone } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/app-downloads";

export function SiteFooter() {
  const { t } = useLang();

  return (
    <footer className="border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {t("app.name")}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{t("footer.tagline")}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("common.version")} {APP_VERSION}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground">{t("footer.downloadApp")}</h3>
          <div className="mt-3 space-y-2">
            <Link
              to="/app"
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground transition-all hover:border-gold/50 hover:shadow-soft"
            >
              <Smartphone className="size-4 text-primary" />
              {t("install.apk")}
            </Link>
            <Link
              to="/app"
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground transition-all hover:border-gold/50 hover:shadow-soft"
            >
              <MonitorDown className="size-4 text-primary" />
              {t("install.windows")}
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground">{t("footer.quickLinks")}</h3>
          <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
            <Link to="/about" className="transition-colors hover:text-foreground">
              {t("footer.about")}
            </Link>
            <Link to="/downloads" className="transition-colors hover:text-foreground">
              {t("footer.downloads")}
            </Link>
            <Link to="/feedback" className="transition-colors hover:text-foreground">
              {t("footer.feedback")}
            </Link>
            <Link to="/settings" className="transition-colors hover:text-foreground">
              {t("common.settings")}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70 py-4 text-center text-[11px] text-muted-foreground">
        {t("footer.rights")}
      </div>
    </footer>
  );
}
