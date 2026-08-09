
import { useMemo, useState } from "react";
import { List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { JUZ_INDEX, SURAH_INDEX } from "@/lib/quran-index";
import { toArabicNumber } from "@/lib/quran";
import { cn } from "@/lib/utils";

export interface QuranNavTarget {
  page: number;
  surah: number;
  ayah: number;
}

interface Props {
  /** called with the chosen target (page + surah + first ayah) */
  onSelect: (t: QuranNavTarget) => void;
  label?: string;
  className?: string;
}

type Tab = "surah" | "juz" | "page";

const TABS: { id: Tab; label: string }[] = [
  { id: "surah", label: "السور" },
  { id: "juz", label: "الأجزاء" },
  { id: "page", label: "الصفحات" },
];

/** Unified navigator: search & jump by surah, juz, or page — used in every Quran screen. */
export function QuranNav({ onSelect, label = "تصفّح", className }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("surah");
  const [q, setQ] = useState("");

  const needle = q.trim();

  const surahs = useMemo(
    () =>
      SURAH_INDEX.filter(
        (s) =>
          !needle ||
          s.name.includes(needle) ||
          s.english.toLowerCase().includes(needle.toLowerCase()) ||
          String(s.number) === needle,
      ),
    [needle],
  );

  const juzs = useMemo(
    () => JUZ_INDEX.filter((j) => !needle || j.name.includes(needle) || String(j.number) === needle),
    [needle],
  );

  const pages = useMemo(() => {
    const all = Array.from({ length: 604 }, (_, i) => i + 1);
    if (!needle) return all;
    return all.filter((p) => String(p).startsWith(needle));
  }, [needle]);

  const pick = (t: QuranNavTarget) => {
    onSelect(t);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="secondary" className={cn("gap-1", className)}>
          <List className="size-4" /> {label}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>البحث والتنقّل</SheetTitle>
          <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs transition-colors",
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                tab === "surah"
                  ? "ابحث باسم السورة أو رقمها…"
                  : tab === "juz"
                    ? "ابحث برقم الجزء…"
                    : "اكتب رقم الصفحة…"
              }
              className="pr-9"
              aria-label="بحث"
            />
          </div>
        </SheetHeader>

        <div className="h-[calc(100vh-190px)] overflow-y-auto p-2">
          {tab === "surah"
            ? surahs.map((s) => (
                <button
                  key={s.number}
                  onClick={() => pick({ page: s.page, surah: s.number, ayah: 1 })}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right transition-colors hover:bg-accent"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
                    {toArabicNumber(s.number)}
                  </span>
                  <span className="flex-1">
                    <span className="font-quran block text-lg">{s.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {toArabicNumber(s.ayahs)} آية · صفحة {toArabicNumber(s.page)} · الجزء{" "}
                      {toArabicNumber(s.juz)}
                    </span>
                  </span>
                </button>
              ))
            : tab === "juz"
              ? juzs.map((j) => (
                  <button
                    key={j.number}
                    onClick={() => pick({ page: j.page, surah: j.surah, ayah: j.ayah })}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right transition-colors hover:bg-accent"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
                      {toArabicNumber(j.number)}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold">{j.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        يبدأ من صفحة {toArabicNumber(j.page)} · سورة{" "}
                        {SURAH_INDEX[j.surah - 1].name} آية {toArabicNumber(j.ayah)}
                      </span>
                    </span>
                  </button>
                ))
              : (
                  <div className="grid grid-cols-5 gap-1.5 p-1">
                    {pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          const s = [...SURAH_INDEX].reverse().find((x) => x.page <= p) ?? SURAH_INDEX[0];
                          pick({ page: p, surah: s.number, ayah: 1 });
                        }}
                        className="rounded-lg border border-border py-1.5 text-xs transition-colors hover:border-gold hover:bg-accent"
                      >
                        {toArabicNumber(p)}
                      </button>
                    ))}
                  </div>
                )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


