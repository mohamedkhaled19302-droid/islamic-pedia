
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Check, Clipboard, DatabaseBackup, Download, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toArabicNumber } from "@/lib/quran";

const VAULT_KEYS = [
  "bkl-progress",
  "bkl-bookmarks",
  "bkl-contest-history",
  "bkl-tasbih",
  "bkl-feedback",
  "bkl-prayer-place",
  "bkl-athkar",
  "bkl-notes",
  "bkl-memo-sessions",
  "bkl-recite-session",
  "bkl-mushaf-prefs",
  "bkl-theme",
  "bkl-night",
  "qk_admin_account_v1",
];

interface BackupPayload {
  app: string;
  kind: "backup";
  exportedAt: string;
  data: Record<string, unknown>;
}

function collectKeys() {
  const data: Record<string, unknown> = {};
  for (const key of VAULT_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) data[key] = JSON.parse(raw);
    } catch {
      /* skip */
    }
  }
  return data;
}

function buildBackup(): BackupPayload {
  return {
    app: "islamic-pedia",
    kind: "backup",
    exportedAt: new Date().toISOString(),
    data: collectKeys(),
  };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CodeVault() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ keys: 0, bytes: 0 });
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const data = collectKeys();
    const keys = Object.keys(data);
    let bytes = 0;
    for (const key of keys) {
      bytes += (key.length + JSON.stringify(data[key]).length) * 2;
    }
    setStats({ keys: keys.length, bytes });
  }, []);

  const flash = (text: string, ok = true) => {
    setStatus({ ok, text });
    window.setTimeout(() => setStatus(null), 4000);
  };

  const onExport = () => {
    const payload = buildBackup();
    download(
      `islamic-pedia-backup-${payload.exportedAt.slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
    );
    flash("تم تنزيل النسخة الاحتياطية.");
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildBackup()));
      flash("تم نسخ كل البيانات إلى الحافظة.");
    } catch {
      flash("تعذّر الوصول إلى الحافظة.", false);
    }
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as BackupPayload;
      if (parsed.app !== "islamic-pedia" || parsed.kind !== "backup" || !parsed.data) {
        flash("الملف غير صالح: ليس نسخة احتياطية من هذا التطبيق.", false);
        return;
      }
      const n = Object.keys(parsed.data).length;
      if (!window.confirm(`سيتم استبدال البيانات الحالية بـ ${toArabicNumber(n)} مدخلاً من النسخة. متابعة؟`)) {
        return;
      }
      for (const [key, value] of Object.entries(parsed.data)) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
      window.location.reload();
    } catch {
      flash("تعذّر قراءة الملف، تأكد أنه ملف JSON صالح.", false);
    }
  };

  const onClear = () => {
    if (
      !window.confirm(
        "سيتم حذف كل بيانات التطبيق على هذا الجهاز نهائياً (تقدم القراءة، العلامات، الملاحظات، الأذكار، الإعدادات، وحساب المشرف). متابعة؟",
      )
    ) {
      return;
    }
    for (const key of VAULT_KEYS) {
      window.localStorage.removeItem(key);
    }
    try {
      window.sessionStorage.removeItem("qk_admin_session_v1");
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <section className="rounded-2xl border border-gold/40 bg-card p-4 shadow-glow">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-gradient text-gold-foreground shadow-soft">
          <DatabaseBackup className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground">خزنة البيانات</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            نسخة احتياطية كاملة من بيانات هذا الجهاز: تقدم القراءة، العلامات، الملاحظات، الأذكار،
            التسبيح، نتائج المسابقة، الإعدادات، وحساب المشرف.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
          <p className="font-hand text-2xl text-gold">{toArabicNumber(stats.keys)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">مفاتيح فيها بيانات</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/50 p-3 text-center">
          <p className="font-hand text-2xl text-gold">{formatBytes(stats.bytes)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">حجم النسخة</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button onClick={onExport} className="gap-2">
          <Download className="size-4" /> تصدير نسخة احتياطية
        </Button>
        <Button variant="outline" onClick={onCopy} className="gap-2">
          <Clipboard className="size-4" /> نسخ البيانات
        </Button>
        <Button variant="secondary" onClick={() => inputRef.current?.click()} className="gap-2">
          <Upload className="size-4" /> استيراد نسخة
        </Button>
        <Button variant="destructive" onClick={onClear} className="gap-2">
          <Trash2 className="size-4" /> مسح كل البيانات
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onPick}
        />
      </div>

      {status ? (
        <p
          className={`mt-3 flex items-center gap-2 text-xs ${status.ok ? "text-primary" : "text-destructive"}`}
        >
          {status.ok ? <Check className="size-3.5" /> : null}
          {status.text}
        </p>
      ) : null}
    </section>
  );
}
