
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
  ar: string[];
  en: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.3.2",
    ar: [
      "نافذة «تفاصيل النسخة»: اضغط أيقونة العين بجانب رقم النسخة لعرض آخر التحديثات بالتفصيل.",
    ],
    en: [
      "Version details window: press the eye icon next to the version number to see the latest changes.",
    ],
  },
  {
    version: "1.3.1",
    ar: [
      "زر «أرسل رأيك» يفتح صفحة الملاحظات في متصفح الجهاز من التطبيق المثبّت.",
      "إصلاح مشكلة بقاء النسخة القديمة ظاهرة في تطبيق ويندوز.",
    ],
    en: [
      "The feedback button now opens the site's feedback page in the device browser from installed apps.",
      "Fixed the Windows app showing an old cached version on every launch.",
    ],
  },
];

/** Version number with an eye button that opens the update details. The last
 *  line hides a word that silently opens the admin page. */
export function VersionBadge({ className }: { className?: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const goAdmin = () => {
    setOpen(false);
    void router.navigate({ to: "/admin" });
  };

  const secret = lang === "ar" ? "نور" : "light";

  return (
    <>
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span>
          {t("common.version")} {APP_VERSION}
        </span>
        <button
          type="button"
          aria-label={lang === "ar" ? "تفاصيل النسخة" : "Version details"}
          title={lang === "ar" ? "تفاصيل النسخة" : "Version details"}
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
              {lang === "ar" ? "تفاصيل النسخة" : "Version details"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar" ? "آخر ما جاء في تحديثات التطبيق." : "What's new in the app."}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] space-y-4 overflow-y-auto text-sm leading-7">
            {CHANGELOG.map((entry) => (
              <div key={entry.version}>
                <p className="font-bold text-gold">{entry.version}</p>
                <ul className="mt-1 list-disc space-y-1 ps-4 text-muted-foreground">
                  {(lang === "ar" ? entry.ar : entry.en).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {lang === "ar" ? (
              <>
                الكتابُ <span className="cursor-default" onClick={goAdmin}>{secret}</span> لمن قرأ
              </>
            ) : (
              <>
                The Book is <span className="cursor-default" onClick={goAdmin}>{secret}</span> for
                those who read
              </>
            )}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
