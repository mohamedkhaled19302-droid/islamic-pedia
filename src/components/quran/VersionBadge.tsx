
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Eye, Sparkles } from "lucide-react";
import { APP_VERSION } from "@/lib/app-downloads";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChangelogEntry {
  version: string;
  lines: string[];
}

const CHANGELOG: ChangelogEntry[] = [];

/** Version number with an eye button that opens the update details. The last
 *  line hides a word that silently opens the admin page. */
export function VersionBadge({ className }: { className?: string }) {
  const { t } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const goAdmin = () => {
    setOpen(false);
    void router.navigate({ to: "/admin" });
  };

  const secret = "نور";

  return (
    <>
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span>
          {t("common.version")} {APP_VERSION}
        </span>
        <button
          type="button"
          aria-label="تفاصيل النسخة"
          title="تفاصيل النسخة"
          onClick={() => setOpen(true)}
          className="grid size-6 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold"
        >
          <Eye className="size-3.5" />
        </button>
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border-gold/40 bg-card text-foreground shadow-glow">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-gold" />
              تفاصيل النسخة
            </DialogTitle>
            <DialogDescription>
              آخر ما جاء في تحديثات التطبيق.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] space-y-4 overflow-y-auto text-sm leading-7">
            {CHANGELOG.map((entry) => (
              <div key={entry.version}>
                <p className="font-bold text-gold">{entry.version}</p>
                <ul className="mt-1 list-disc space-y-1 ps-4 text-muted-foreground">
                  {entry.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            الكتابُ <span className="cursor-default" onClick={goAdmin}>{secret}</span> لمن قرأ
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
