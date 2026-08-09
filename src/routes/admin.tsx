
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Lock, LogOut, ShieldCheck, UserPlus } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { CodeVault } from "@/components/quran/CodeVault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBookmarks, getFeedback, getNotes, getProgress } from "@/lib/storage";
import { toArabicNumber } from "@/lib/quran";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة المشرف — باحث كتاب الله" },
      {
        name: "description",
        content: "لوحة تحكّم خاصة بمالك التطبيق لمتابعة الاستخدام والملاحظات والتقييمات.",
      },
      { property: "og:title", content: "لوحة المشرف — باحث كتاب الله" },
      { property: "og:description", content: "دخول خاص بمالك التطبيق فقط." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

const KEY = "qk_admin_account_v1";
const SESSION = "qk_admin_session_v1";

async function hash(user: string, pass: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${user.trim().toLowerCase()}::${pass}`),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function Admin() {
  const [account, setAccount] = useState<{ user: string; hash: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setAccount(JSON.parse(raw));
      setAuthed(sessionStorage.getItem(SESSION) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user.trim() || pass.length < 6) {
      setError("أدخل اسم المستخدم وكلمة مرور لا تقل عن ٦ أحرف.");
      return;
    }
    const h = await hash(user, pass);
    if (!account) {
      const next = { user: user.trim(), hash: h };
      localStorage.setItem(KEY, JSON.stringify(next));
      setAccount(next);
      sessionStorage.setItem(SESSION, "1");
      setAuthed(true);
      return;
    }
    if (account.user.toLowerCase() === user.trim().toLowerCase() && account.hash === h) {
      sessionStorage.setItem(SESSION, "1");
      setAuthed(true);
      setPass("");
    } else {
      setError("بيانات الدخول غير صحيحة. هذه اللوحة مخصّصة لأول حساب مسجّل فقط.");
    }
  };

  if (!ready) return null;

  if (!authed) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-3xl border-2 border-gold/50 bg-card p-6 shadow-soft"
        >
          <div className="mb-4 text-center">
            <span className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground">
              {account ? <Lock className="size-5" /> : <UserPlus className="size-5" />}
            </span>
            <h1 className="font-hand text-2xl text-foreground">
              {account ? "دخول المشرف" : "تسجيل حساب المشرف"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {account
                ? "هذه اللوحة مغلقة على الحساب الأول فقط."
                : "أول حساب يُسجَّل هنا هو المشرف الدائم، ولن يُقبل غيره بعد ذلك."}
            </p>
          </div>
          <div className="space-y-3">
            <Input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="اسم المستخدم"
              aria-label="اسم المستخدم"
              autoComplete="username"
            />
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="كلمة المرور"
              aria-label="كلمة المرور"
              autoComplete={account ? "current-password" : "new-password"}
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full gap-2">
              <KeyRound className="size-4" />
              {account ? "دخول" : "إنشاء الحساب وقفله"}
            </Button>
          </div>
        </form>
      </main>
    );
  }

  const notes = getNotes();
  const bookmarks = getBookmarks();
  const progress = Object.keys(getProgress());

  const feedback = getFeedback();

  const stats = [
    { label: "رسائل المستخدمين", value: feedback.length },
    { label: "الملاحظات المحفوظة", value: notes.length },
    { label: "العلامات المرجعية", value: bookmarks.length },
    { label: "جلسات القراءة المسجّلة", value: progress.length },
  ];

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title="لوحة المشرف" subtitle={`مرحباً ${account?.user ?? ""}`}>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1"
          onClick={() => {
            sessionStorage.removeItem(SESSION);
            setAuthed(false);
          }}
        >
          <LogOut className="size-3.5" /> خروج
        </Button>
      </ModeHeader>

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft"
            >
              <p className="font-hand text-3xl text-gold">{toArabicNumber(s.value)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h2 className="mb-2 font-bold text-foreground">صندوق الرسائل (من صفحة أرسل رأيك)</h2>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد رسائل بعد.</p>
          ) : (
            <ul className="space-y-2">
              {feedback.map((f) => (
                <li key={f.id} className="rounded-xl border border-border bg-secondary/50 p-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">{f.name || "زائر"}</span>
                    <span>· {toArabicNumber(f.stars)} نجوم</span>
                    <span className="flex-1" />
                    <span>{new Date(f.at).toLocaleDateString("ar")}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{f.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <CodeVault />



        <div className="rounded-2xl border border-border bg-card p-4 text-sm leading-7 text-muted-foreground shadow-soft">
          <h2 className="mb-1 flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="size-4 text-primary" /> عن هذه اللوحة
          </h2>
          حسابك مقفل على هذا الجهاز؛ أول حساب سُجِّل هو المشرف الدائم ولا يمكن تسجيل غيره. البيانات
          المعروضة محفوظة محلياً على الجهاز، فإن أردت لوحة مشرف مشتركة بين كل الأجهزة مع تجميع
          التقييمات والرسائل من كل المستخدمين، فعّل قاعدة بيانات للتطبيق.
        </div>
      </div>
    </main>
  );
}


