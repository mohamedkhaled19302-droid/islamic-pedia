
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, FileText, Trash2 } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { useLocalStore } from "@/components/quran/use-local-store";
import { getBookmarks, removeBookmark, type Bookmark } from "@/lib/storage";
import { toArabicNumber } from "@/lib/quran";
import { seoHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bookmarks")({
  head: () =>
    seoHead({
      title: "العلامات المرجعية — آياتي وصفحاتي المحفوظة",
      description:
        "قائمة سريعة بكل الآيات والصفحات التي حفظتها في الموسوعة الإسلامية، للعودة إليها فوراً في وضع القراءة أو المصحف.",
      path: "/bookmarks",
      crumbs: [{ name: "العلامات المرجعية", path: "/bookmarks" }],
      noIndex: true,
    }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const list = useLocalStore<Bookmark[]>(getBookmarks, []);

  return (
    <main className="min-h-screen pb-24">
      <ModeHeader title="العلامات المرجعية" subtitle={`${toArabicNumber(list.length)} عنصر محفوظ`} />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {list.length === 0 ? (
          <div className="animate-pop rounded-3xl border border-dashed border-border p-10 text-center">
            <BookMarked className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              لا توجد علامات بعد — اضغط على أيقونة العلامة بجانب أي آية أو صفحة لحفظها هنا.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {list.map((b, i) => (
              <li
                key={b.id}
                style={{ animationDelay: `${i * 45}ms` }}
                className="animate-rise flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-gradient text-gold-foreground">
                  {b.kind === "page" ? <FileText className="size-4" /> : <BookMarked className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground">
                    {b.kind === "page"
                      ? `الصفحة ${toArabicNumber(b.page ?? 0)}`
                      : `${b.surahName ?? ""} — الآية ${toArabicNumber(b.ayah ?? 0)}`}
                  </p>
                  {b.text ? (
                    <p className="font-quran mt-1 line-clamp-2 text-lg leading-[2] text-muted-foreground">
                      {b.text}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    {b.kind === "page" ? (
                      <Button asChild size="sm" className="h-8">
                        <Link to="/page" search={{ p: b.page }}>
                          فتح الصفحة
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="h-8">
                        <Link to="/read" search={{ s: b.surah, a: b.ayah }}>
                          فتح الآية
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1 text-destructive"
                      onClick={() => removeBookmark(b.id)}
                    >
                      <Trash2 className="size-3.5" /> حذف
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}


