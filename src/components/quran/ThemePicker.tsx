
import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "./use-theme";
import { useLang } from "@/lib/i18n";

/** زر اختيار شكل التطبيق (ألوان متعددة) يوضع بجانب زر الوضع الليلي. */
export function ThemePicker({ className = "" }: { className?: string }) {
  const { theme, setTheme, themes } = useTheme();
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("theme.change")}
        title={t("theme.change")}
        className="grid size-10 place-items-center rounded-full border border-gold/50 bg-background/10 text-gold backdrop-blur transition-all hover:scale-105 hover:bg-background/20"
      >
        <Palette className="size-4" />
      </button>

      {open ? (
        <>
          <button
            aria-label="Close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-glow ltr:left-0 rtl:right-0">
            <p className="px-2 py-1 text-xs font-bold text-muted-foreground">{t("theme.choose")}</p>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-right text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <span
                  className="size-5 shrink-0 rounded-full border border-border"
                  style={{ backgroundImage: t.swatch }}
                />
                <span className="flex-1">{t.name}</span>
                {theme === t.id ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}


