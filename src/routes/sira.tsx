
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Search as SearchIcon, Sparkles } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { SIRA_CHAPTERS } from "@/lib/sira";
import { toArabicNumber } from "@/lib/quran";
import { seoHead } from "@/lib/seo";
import { SeoIntro } from "@/components/SeoIntro";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sira")({
  head: () =>
    seoHead({
      title: "السيرة النبوية الشريفة — من المولد إلى الرفيق الأعلى",
      description:
        "اقرأ السيرة النبوية الشريفة مرتّبة في فصول: النسب والمولد وبدء الوحي والدعوة والهجرة والغزوات وحجة الوداع ووفاته ﷺ، بأسلوب ميسّر مع بحث في الفصول.",
      path: "/sira",
      crumbs: [{ name: "السيرة النبوية", path: "/sira" }],
    }),
  component: SiraPage,
});

function SiraPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(SIRA_CHAPTERS[0].id);

  const list = useMemo(() => {
    const n = q.trim();
    if (!n) return SIRA_CHAPTERS;
    return SIRA_CHAPTERS.filter(
      (c) => c.title.includes(n) || c.period.includes(n) || c.body.some((b) => b.includes(n)),
    );
  }, [q]);

  return (
    <main className="min-h-screen pb-20">
      <ModeHeader title="السيرة النبوية الشريفة" subtitle="سيرة خير البرية ﷺ في فصول مرتّبة">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في فصول السيرة…"
            className="h-10 bg-card pr-9 text-card-foreground"
            aria-label="بحث في السيرة"
          />
        </div>
      </ModeHeader>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <SeoIntro
          title="السيرة النبوية الشريفة"
          links={[
            { to: "/hadith", label: "مكتبة الحديث" },
            { to: "/read", label: "قراءة القرآن الكريم" },
          ]}
        >
          اقرأ السيرة النبوية العطرة مرتّبة في فصول زمنية: النسب والمولد وبدء
          الوحي والدعوة والهجرة والغزوات وحجة الوداع ووفاته ﷺ، بأسلوب ميسّر مع
          بحث سريع في جميع الفصول.
        </SeoIntro>
        <div className="mb-5 rounded-2xl border border-gold/40 bg-card p-4 text-sm leading-7 text-muted-foreground shadow-soft">
          <h2 className="mb-1 flex items-center gap-2 font-bold text-foreground">
            <Sparkles className="size-4 text-gold" /> لمحة
          </h2>
          السيرة النبوية هي تفسير عمليّ للقرآن الكريم؛ فيها تُقرأ الأخلاق والأحكام والدعوة سلوكاً
          حيّاً. وهذه فصولها مرتّبة زمنياً.
        </div>

        <ol className="space-y-3">
          {list.map((c, i) => {
            const isOpen = open === c.id;
            return (
              <li key={c.id}>
                <article
                  className="overflow-hidden rounded-3xl border-2 border-gold/40 shadow-soft"
                  style={{ background: "#fdfaf1" }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : c.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-right"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-gold-foreground">
                      {toArabicNumber(i + 1)}
                    </span>
                    <span className="flex-1">
                      <span className="font-hand block text-xl" style={{ color: "#5b4a1f" }}>
                        {c.title}
                      </span>
                      <span className="block text-[11px]" style={{ color: "#8a7a4f" }}>
                        {c.period}
                      </span>
                    </span>
                    <BookOpen
                      className={cn("size-4 transition-transform", isOpen && "rotate-12")}
                      style={{ color: "#8a7a4f" }}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-gold/30 px-5 py-4">
                      {c.body.map((p, k) => (
                        <p
                          key={k}
                          className="mb-3 text-[17px] leading-[2.1] last:mb-0"
                          style={{ color: "#2a2418" }}
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>

        {list.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
        ) : null}
      </div>
    </main>
  );
}


