
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Mail, Send, Star } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { getFeedback, saveFeedback, type FeedbackEntry } from "@/lib/storage";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "أرسل رأيك — ملاحظات واقتراحات | باحث كتاب الله" },
      {
        name: "description",
        content:
          "شاركنا رأيك في تطبيق باحث كتاب الله: اقتراح ميزة، أو بلاغ عن خلل، أو تقييم اختياري بالنجوم. رسالتك تصل مباشرة إلى فريق التطبيق.",
      },
      { property: "og:title", content: "أرسل رأيك — باحث كتاب الله" },
      { property: "og:description", content: "اقتراحاتك وملاحظاتك تصنع النسخة القادمة من التطبيق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [list, setList] = useState<FeedbackEntry[]>([]);

  useEffect(() => setList(getFeedback()), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    saveFeedback({ stars, name: name.trim() || undefined, message: message.trim() });
    setList(getFeedback());
    setSent(true);
    setMessage("");
    setStars(0);
  };

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title="أرسل رأيك" subtitle="رسالة صغيرة منك… تحسين كبير في التطبيق" />

      <section className="mx-auto max-w-2xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-card p-6 shadow-glow">
          <span className="pointer-events-none absolute -left-8 -top-8 grid size-28 place-items-center rounded-full bg-gold-gradient/30 opacity-30" />
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-soft">
              <Mail className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                رسالة إلى صاحب التطبيق
              </h2>
              <p className="text-xs text-muted-foreground">اكتب ما تشاء — والتقييم بالنجوم اختياري تماماً.</p>
            </div>
          </div>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-primary/40 bg-secondary/60 p-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-6" />
              </span>
              <p className="mt-3 font-bold text-foreground">وصلت رسالتك، جزاك الله خيراً</p>
              <p className="mt-1 text-xs text-muted-foreground">
                نقرأ كل رسالة، وسنأخذ ملاحظتك بعين الاعتبار في التحديث القادم.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">إن أحببت، يمكنك تقييم التطبيق (اختياري)</p>
                <div className="mt-2 flex justify-center gap-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} نجوم`}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setStars(stars === n ? 0 : n)}
                      className="p-1 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`size-7 transition-colors ${
                          n <= (hover || stars) ? "fill-gold text-gold" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-muted-foreground">اسمك (اختياري)</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أبو عبد الله"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-muted-foreground">رسالتك</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder="اقتراح، ملاحظة، أو خلل واجهته…"
                  className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-7 text-foreground outline-none focus:border-gold"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-bold text-gold-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <Send className="size-4" /> إرسال
              </button>
            </form>
          )}
        </div>

        {list.length ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <h3 className="text-sm font-bold text-foreground">رسائلك السابقة</h3>
            <div className="mt-3 grid gap-2">
              {list.slice(0, 5).map((f) => (
                <div key={f.id} className="rounded-xl bg-secondary/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(f.at).toLocaleString("ar")}
                    </span>
                    {f.stars ? (
                      <span className="flex gap-0.5" dir="ltr">
                        {Array.from({ length: f.stars }).map((_, i) => (
                          <Star key={i} className="size-3 fill-gold text-gold" />
                        ))}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-foreground">{f.message}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}


