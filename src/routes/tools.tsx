
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Coins,
  Loader2,
  PartyPopper,
  RefreshCw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SURAH_INDEX } from "@/lib/quran-index";
import { toArabicNumber } from "@/lib/quran";
import { ASMA_GROUPS, ASMA_MEANINGS, type AsmaGroup } from "@/lib/asma";
import {
  fetchAsmaAlHusna,
  fetchHijri,
  fetchHijriToGregorian,
  fetchMutashabihatBySurah,
  fetchRandomAyah,
  fetchRandomMutashabih,
  fetchUpcomingEvents,
} from "@/lib/islamic";
import { seoHead } from "@/lib/seo";
import { SeoIntro } from "@/components/SeoIntro";

export const Route = createFileRoute("/tools")({
  head: () =>
    seoHead({
      title: "أدوات إسلامية — أسماء الله الحسنى والزكاة والتقويم والمناسبات",
      description:
        "أسماء الله الحسنى بمعانيها العربية مع بحث وفلترة، حاسبة زكاة، تحويل التاريخ الهجري والميلادي، المناسبات الإسلامية، والآيات المتشابهات.",
      path: "/tools",
      crumbs: [{ name: "أدوات إسلامية", path: "/tools" }],
    }),
  component: Tools,
});

const TABS = [
  { id: "asma", label: "أسماء الله الحسنى" },
  { id: "hijri", label: "التقويم الهجري" },
  { id: "events", label: "المناسبات الإسلامية" },
  { id: "zakat", label: "حاسبة الزكاة" },
  { id: "mutashabihat", label: "الآيات المتشابهات" },
  { id: "ayah", label: "آية للتدبّر" },
] as const;

type Tab = (typeof TABS)[number]["id"];

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-gold/40 bg-card p-4 shadow-soft">{children}</div>;
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/* ------------------------- أسماء الله الحسنى ------------------------- */

function AsmaPanel() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<AsmaGroup | "all">("all");
  const [open, setOpen] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["asma"],
    queryFn: fetchAsmaAlHusna,
    staleTime: Infinity,
  });

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((n) => {
      const info = ASMA_MEANINGS[n.number];
      if (group !== "all" && info?.group !== group) return false;
      if (!needle) return true;
      return (
        n.name.includes(q.trim()) ||
        n.transliteration.toLowerCase().includes(needle) ||
        n.en.meaning.toLowerCase().includes(needle) ||
        (info?.meaning ?? "").includes(q.trim())
      );
    });
  }, [data, q, group]);

  if (isLoading) return <Spinner />;
  if (isError) return <p className="py-8 text-center text-sm text-destructive">تعذّر التحميل.</p>;

  return (
    <div className="space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو بالمعنى…" />

      <div className="flex flex-wrap gap-1.5">
        {(["all", ...ASMA_GROUPS] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g as AsmaGroup | "all")}
            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
              group === g
                ? "border-gold bg-gold-gradient text-gold-foreground"
                : "border-border bg-card text-muted-foreground hover:border-gold/60"
            }`}
          >
            {g === "all" ? "الكل" : g}
          </button>
        ))}
        <span className="self-center text-[11px] text-muted-foreground">
          {toArabicNumber(list.length)} اسم
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((n) => {
          const info = ASMA_MEANINGS[n.number];
          const expanded = open === n.number;
          return (
            <button
              key={n.number}
              onClick={() => setOpen(expanded ? null : n.number)}
              className={`rounded-2xl border p-4 text-center shadow-soft transition-all hover:-translate-y-0.5 ${
                expanded ? "border-gold bg-accent" : "border-gold/40 bg-card"
              }`}
            >
              <span className="text-[11px] text-muted-foreground">{toArabicNumber(n.number)}</span>
              <p className="font-quran text-2xl text-primary">{n.name}</p>
              <p className="mt-1 text-xs text-foreground">{info?.meaning ?? n.en.meaning}</p>
              {expanded ? (
                <div className="mt-2 space-y-1 border-t border-gold/30 pt-2 text-[11px] text-muted-foreground">
                  <p>{n.transliteration}</p>
                  <p>{n.en.meaning}</p>
                  {info ? <p className="text-primary">التصنيف: {info.group}</p> : null}
                </div>
              ) : null}
            </button>
          );
        })}
        {list.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">لا نتائج.</p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */


/* --------------------------- التقويم الهجري --------------------------- */

function HijriPanel() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [h, setH] = useState({ d: 1, m: 1, y: 1447 });
  const [greg, setGreg] = useState<string | null>(null);
  const [hErr, setHErr] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hijri", date],
    queryFn: () => fetchHijri(new Date(date)),
    staleTime: Infinity,
  });

  const convert = async () => {
    setHErr("");
    try {
      setGreg(await fetchHijriToGregorian(h.d, h.m, h.y));
    } catch {
      setHErr("تعذّر التحويل، تحقّق من التاريخ.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <CalendarDays className="size-4 text-primary" />
          <span>ميلادي ← هجري</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
          />
        </label>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : isError || !data ? (
        <p className="py-8 text-center text-sm text-destructive">تعذّر التحويل.</p>
      ) : (
        <Card>
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground">{data.hijri.weekday.ar}</p>
            <p className="font-quran mt-2 text-3xl text-primary">
              {toArabicNumber(Number(data.hijri.day))} {data.hijri.month.ar}{" "}
              {toArabicNumber(Number(data.hijri.year))} هـ
            </p>
            <p className="mt-2 text-xs text-muted-foreground">الموافق {data.gregorian.date} م</p>
          </div>
        </Card>
      )}

      <Card>
        <p className="mb-2 text-sm font-bold">هجري ← ميلادي</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-20"
            inputMode="numeric"
            placeholder="يوم"
            value={h.d}
            onChange={(e) => setH((s) => ({ ...s, d: Number(e.target.value) || 1 }))}
          />
          <Input
            className="w-20"
            inputMode="numeric"
            placeholder="شهر"
            value={h.m}
            onChange={(e) => setH((s) => ({ ...s, m: Number(e.target.value) || 1 }))}
          />
          <Input
            className="w-24"
            inputMode="numeric"
            placeholder="سنة"
            value={h.y}
            onChange={(e) => setH((s) => ({ ...s, y: Number(e.target.value) || 1447 }))}
          />
          <Button size="sm" onClick={convert}>
            حوّل
          </Button>
          {greg ? <span className="text-sm text-primary">الموافق {greg} م</span> : null}
        </div>
        {hErr ? <p className="mt-2 text-xs text-destructive">{hErr}</p> : null}
      </Card>
    </div>
  );
}

/* ------------------------- المناسبات الإسلامية ------------------------- */

function EventsPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["islamic-events"],
    queryFn: fetchUpcomingEvents,
    staleTime: 1000 * 60 * 60 * 12,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return <p className="py-8 text-center text-sm text-destructive">تعذّر تحميل المناسبات.</p>;

  return (
    <ul className="space-y-2">
      {data.map((e) => (
        <li
          key={e.name}
          className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-card p-4 shadow-soft"
        >
          <PartyPopper className="size-5 shrink-0 text-gold" />
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{e.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {e.date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">
            {e.days === 0 ? "اليوم" : `بعد ${toArabicNumber(e.days)} يوماً`}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------- حاسبة الزكاة ---------------------------- */

function ZakatPanel() {
  const [cash, setCash] = useState(0);
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [goods, setGoods] = useState(0);
  const [debts, setDebts] = useState(0);
  const [goldPrice, setGoldPrice] = useState(250);

  const total = cash + gold + silver + goods - debts;
  const nisab = 85 * goldPrice; // نصاب الذهب: ٨٥ غراماً
  const due = total >= nisab ? total * 0.025 : 0;

  const field = (label: string, value: number, set: (n: number) => void) => (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        className="w-36"
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => set(Number(e.target.value) || 0)}
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          {field("النقود والأرصدة", cash, setCash)}
          {field("قيمة الذهب", gold, setGold)}
          {field("قيمة الفضة", silver, setSilver)}
          {field("عروض التجارة", goods, setGoods)}
          {field("الديون المستحقّة عليك", debts, setDebts)}
          {field("سعر غرام الذهب اليوم", goldPrice, setGoldPrice)}
        </div>
      </Card>

      <Card>
        <div className="space-y-2 py-2 text-center">
          <Coins className="mx-auto size-5 text-gold" />
          <p className="text-xs text-muted-foreground">
            النصاب (٨٥ غراماً ذهباً) = {nisab.toLocaleString("ar-EG")}
          </p>
          <p className="text-xs text-muted-foreground">
            صافي المال الزكوي = {total.toLocaleString("ar-EG")}
          </p>
          <p className="text-2xl font-bold text-primary">
            {due > 0 ? `الزكاة الواجبة: ${due.toLocaleString("ar-EG")}` : "لم يبلغ المال النصاب"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            زكاة المال ٢٫٥٪ بعد حولان الحول وبلوغ النصاب — هذه حاسبة استرشادية.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* --------------------------- المتشابهات والآية --------------------------- */

function MutashabihatPanel() {
  const [surah, setSurah] = useState(0);
  const random = useQuery({
    queryKey: ["mutashabih-random"],
    queryFn: fetchRandomMutashabih,
    enabled: surah === 0,
  });
  const bySurah = useQuery({
    queryKey: ["mutashabihat", surah],
    queryFn: () => fetchMutashabihatBySurah(surah),
    enabled: surah > 0,
  });

  const items = surah === 0 ? (random.data ? [random.data] : []) : (bySurah.data ?? []);
  const loading = surah === 0 ? random.isLoading : bySurah.isLoading;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            value={surah}
            onChange={(e) => setSurah(Number(e.target.value))}
            aria-label="السورة"
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value={0}>آية عشوائية متشابهة</option>
            {SURAH_INDEX.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. {s.name}
              </option>
            ))}
          </select>
          {surah === 0 ? (
            <Button size="sm" variant="secondary" className="gap-1" onClick={() => random.refetch()}>
              <Shuffle className="size-4" /> غيّر
            </Button>
          ) : null}
          <span className="text-[11px] text-muted-foreground">
            المتشابهات تساعد الحفّاظ على تمييز الآيات المتقاربة.
          </span>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">لا توجد متشابهات لهذه السورة.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.verse_key} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-[11px] text-muted-foreground">
                {m.surah_name_arabic} — {m.verse_key}
              </p>
              <p className="font-quran mt-1 text-xl leading-9 text-foreground">{m.arabic}</p>
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                {(m.similar_verses ?? []).map((v) => (
                  <div key={v.verse_key}>
                    <p className="text-[11px] text-primary">{v.verse_key}</p>
                    <p className="font-quran text-lg leading-9 text-muted-foreground">{v.arabic}</p>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AyahPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["random-ayah"],
    queryFn: fetchRandomAyah,
  });

  return (
    <Card>
      {isLoading ? (
        <Spinner />
      ) : !data ? (
        <p className="py-8 text-center text-sm text-destructive">تعذّر التحميل.</p>
      ) : (
        <div className="space-y-4 py-4 text-center">
          <Sparkles className="mx-auto size-5 text-gold" />
          <p className="font-quran text-2xl leading-[2.4] text-foreground">{data.verse.arabic}</p>
          <p className="text-xs text-muted-foreground">
            {data.surah.name_arabic} — آية {toArabicNumber(data.verse.ayah)}
          </p>
          <Button variant="secondary" className="gap-1" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> آية أخرى
          </Button>
        </div>
      )}
    </Card>
  );
}

function Tools() {
  const [tab, setTab] = useState<Tab>("asma");

  return (
    <main className="min-h-screen pb-20">
      <ModeHeader
        title="أدوات إسلامية"
        subtitle="الأسماء الحسنى · التقويم · المناسبات · الزكاة"
      >
        <div className="flex flex-wrap gap-1 rounded-lg bg-secondary p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </ModeHeader>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <SeoIntro
          title="أدوات إسلامية متنوعة"
          links={[
            { to: "/prayer", label: "مواقيت الصلاة" },
            { to: "/athkar", label: "الأذكار الموثقة" },
          ]}
        >
          أسماء الله الحسنى بمعانيها مع بحث وفلترة، وحاسبة الزكاة، والتقويم الهجري
          وتحويل التاريخ، والمناسبات الإسلامية القادمة، والآيات المتشابهات، وآية
          للتدبّر اليومي.
        </SeoIntro>
        {tab === "asma" ? (
          <AsmaPanel />
        ) : tab === "hijri" ? (
          <HijriPanel />
        ) : tab === "events" ? (
          <EventsPanel />
        ) : tab === "zakat" ? (
          <ZakatPanel />
        ) : tab === "mutashabihat" ? (
          <MutashabihatPanel />
        ) : (
          <AyahPanel />
        )}
      </div>
    </main>
  );
}


