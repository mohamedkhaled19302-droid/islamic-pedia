
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  CloudDownload,
  Database,
  HardDriveDownload,
  Loader2,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { ReciterSelect } from "@/components/quran/ReciterSelect";
import { Button } from "@/components/ui/button";
import { MUSHAF_STYLES } from "@/lib/mushaf";
import { audioUrl, fetchJuz, fetchPage, fetchSurah, fetchSurahs, toArabicNumber, RECITERS } from "@/lib/quran";
import { useLang } from "@/lib/i18n";
import {
  countDownloadedAudio,
  fetchAudioBlob,
  getAllAudioDownloads,
  getAudioBlob,
  removeAudioDownload,
  saveAudioBlob,
  type DownloadedAudio,
} from "@/lib/audioDownloads";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "التحميلات والعمل دون إنترنت — الموسوعة الإسلامية" },
      {
        name: "description",
        content:
          "حمّل تلاوات القراء وصفحات المصاحف للاستخدام دون اتصال، واعرف أي أجزاء التطبيق تعمل أصلاً دون إنترنت.",
      },
      { property: "og:title", content: "التحميلات والعمل دون إنترنت" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Downloads,
});

type Scope = "surah" | "juz" | "page" | "all";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} بايت`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} كيلوبايت`;
  return `${(n / (1024 * 1024)).toFixed(1)} ميغابايت`;
}

function runPool<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  onProgress: (done: number, total: number) => void,
  limit = 4,
): Promise<string[]> {
  const total = items.length;
  let done = 0;
  let idx = 0;
  const errors: string[] = [];
  const fails = new Set<number>();
  async function run() {
    while (idx < total) {
      const cur = idx++;
      try {
        await worker(items[cur]);
      } catch {
        fails.add(cur);
      }
      done++;
      onProgress(done, total);
    }
  }
  return Promise.all(Array.from({ length: Math.min(limit, total) }, run)).then(() => {
    errors.push(...[...fails].map(String));
    return errors;
  });
}

function Downloads() {
  const { t } = useLang();
  const [reciter, setReciter] = useState("ar.alafasy");
  const [scope, setScope] = useState<Scope>("surah");
  const [scopeValue, setScopeValue] = useState(1);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioProgress, setAudioProgress] = useState<{ done: number; total: number } | null>(null);
  const [audioBytes, setAudioBytes] = useState(0);
  const [downloaded, setDownloaded] = useState<DownloadedAudio[]>([]);
  const [mushafBusy, setMushafBusy] = useState<string | null>(null);
  const [mushafProgress, setMushafProgress] = useState<{ id: string; done: number; total: number } | null>(null);
  const [mushafCounts, setMushafCounts] = useState<Record<string, number>>({});
  const [storage, setStorage] = useState<{ used: number; quota: number | null } | null>(null);
  const [mushafProgressKey, setMushafProgressKey] = useState(0);
  const [scopeAyahs, setScopeAyahs] = useState<number[]>([]);

  const surahs = useQuery({ queryKey: ["surahs"], queryFn: fetchSurahs, staleTime: Infinity });

  const refreshDownloads = () => {
    void getAllAudioDownloads().then(setDownloaded);
  };

  useEffect(() => {
    refreshDownloads();
  }, []);

  const buildAyahList = async (): Promise<number[]> => {
    if (scope === "all") {
      const all: number[] = [];
      for (let s = 1; s <= 114; s++) {
        const data = await fetchSurah(s);
        all.push(...data.ayahs.map((a) => a.number));
      }
      return all;
    }
    if (scope === "surah") {
      const d = await fetchSurah(scopeValue);
      return d.ayahs.map((a) => a.number);
    }
    if (scope === "juz") {
      const d = await fetchJuz(scopeValue);
      return d.ayahs.map((a) => a.number);
    }
    const d = await fetchPage(scopeValue);
    return d.ayahs.map((a) => a.number);
  };

  useEffect(() => {
    let cancelled = false;
    setScopeAyahs([]);
    void buildAyahList().then((list) => {
      if (!cancelled) setScopeAyahs(list);
    });
    return () => {
      cancelled = true;
    };
  }, [scope, scopeValue, surahs.data]);

  const downloadedKeys = useMemo(
    () => new Set(downloaded.map((d) => `${d.reciter}:${d.ayah}`)),
    [downloaded],
  );
  const missingInScope = scopeAyahs.filter((a) => !downloadedKeys.has(`${reciter}:${a}`));
  const fullyDownloaded = scopeAyahs.length > 0 && missingInScope.length === 0;

  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        setStorage({ used: usage ?? 0, quota: quota ?? null });
      });
    }
  }, [audioProgress, downloaded.length, mushafProgressKey]);

  const audioSize = useMemo(
    () => downloaded.reduce((sum, d) => sum + d.size, 0),
    [downloaded],
  );

  const reciterName = RECITERS.find((r) => r.id === reciter)?.name ?? reciter;

  const downloadAudio = async () => {
    setAudioBusy(true);
    setAudioBytes(0);
    setAudioProgress({ done: 0, total: 1 });
    try {
      const ayahs = await buildAyahList();
      const beforeMissing = ayahs.filter((a) => !downloadedKeys.has(`${reciter}:${a}`)).length;
      setAudioProgress({ done: 0, total: ayahs.length });
      let bytes = 0;
      const errors = await runPool(
        ayahs,
        async (ayah) => {
          const url = audioUrl(reciter, ayah);
          if ((await getAudioBlob(url)) !== null) return;
          const blob = await fetchAudioBlob(url);
          bytes += blob.size;
          setAudioBytes(bytes);
          await saveAudioBlob(url, reciter, ayah, blob);
        },
        (done, total) => setAudioProgress({ done, total }),
      );
      refreshDownloads();
      const succeeded = ayahs.length - beforeMissing - errors.length;
      if (errors.length) {
        toast.error(
          `تعذّر تحميل ${toArabicNumber(errors.length)} من ${toArabicNumber(ayahs.length)} ملف. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.`,
        );
      } else if (succeeded > 0) {
        toast.success(`تم التحميل بنجاح: ${toArabicNumber(succeeded)} ${succeeded === 1 ? "ملف" : "ملفات"} من ${scopeLabel}`);
      } else {
        toast.info("كل ملفات هذا النطاق محمّلة بالفعل على جهازك.");
      }
    } finally {
      setAudioBusy(false);
      setAudioProgress(null);
    }
  };

  const removeAudio = async (url: string) => {
    await removeAudioDownload(url);
    refreshDownloads();
  };

  const clearAllAudio = async () => {
    if (!window.confirm("حذف جميع التلاوات المحمّلة؟")) return;
    for (const d of downloaded) await removeAudioDownload(d.url);
    refreshDownloads();
  };

  const countMushafPages = async (id: string) => {
    try {
      const style = MUSHAF_STYLES.find((s) => s.id === id);
      const cache = await caches.open("mushaf-images");
      const keys = await cache.keys();
      const n = style ? keys.filter((r) => style.matches(r.url)).length : 0;
      setMushafCounts((c) => ({ ...c, [id]: n }));
    } catch {
      setMushafCounts((c) => ({ ...c, [id]: 0 }));
    }
  };

  useEffect(() => {
    for (const s of MUSHAF_STYLES) if (s.id !== "v4") void countMushafPages(s.id);
  }, [mushafProgressKey]);

  const downloadMushaf = async (id: string) => {
    const style = MUSHAF_STYLES.find((s) => s.id === id);
    if (!style || id === "v4") return;
    setMushafBusy(id);
    setMushafProgress({ id, done: 0, total: 604 });
    try {
      const cache = await caches.open("mushaf-images");
      const pages = Array.from({ length: 604 }, (_, i) => i + 1);
      const errors = await runPool(
        pages,
        async (page) => {
          const url = style.url(page);
          if ((await cache.match(url)) !== undefined) return;
          const res = await fetch(url, { mode: "no-cors" });
          await cache.put(url, res);
        },
        (done, total) => setMushafProgress({ id, done, total }),
        3,
      );
      if (!errors.length) {
        toast.success(`تم تنزيل مصحف ${style.name} بالكامل (604 صفحات) بنجاح ✓`);
      } else {
        toast.error(`تعذّر تنزيل ${toArabicNumber(errors.length)} صفحة من مصحف ${style.name}. أعد المحاولة لإكمالها.`);
      }
    } finally {
      setMushafBusy(null);
      setMushafProgress(null);
      setMushafProgressKey((k) => k + 1);
    }
  };

  const scopeLabel =
    scope === "surah"
      ? `سورة ${surahs.data?.find((s) => s.number === scopeValue)?.name ?? scopeValue}`
      : scope === "juz"
        ? `الجزء ${toArabicNumber(scopeValue)}`
        : scope === "page"
          ? `الصفحة ${toArabicNumber(scopeValue)}`
          : "المصحف كاملاً";

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title={t("downloads.title")} subtitle={t("downloads.subtitle")} />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* حالة التخزين */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Database className="size-4 text-gold" /> مساحة التخزين
          </h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            التلاوات المحمّلة: {toArabicNumber(downloaded.length)} آية ({fmtBytes(audioSize)})
            {storage?.quota
              ? ` · المستخدم من المتصفح: ${fmtBytes(storage.used)} من ${fmtBytes(storage.quota)}`
              : ""}
          </p>
        </section>

        {/* تحميل التلاوات */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CloudDownload className="size-4 text-gold" /> تحميل التلاوات للعمل دون إنترنت
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            التلاوة المحمّلة تعمل في <b>كل أقسام التطبيق</b> (الوضع المستمر، صفحة صفحة، المجوّد
            والتفسير، التكرار للحفظ) عبر المشغّل المشترك — حتى بلا إنترنت.
          </p>

          <div className="mt-3 grid gap-2">
            <ReciterSelect value={reciter} onChange={setReciter} className="h-9 w-full text-sm" />

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as Scope)}
                aria-label="نطاق التحميل"
                className="h-8 rounded-lg border border-input bg-background px-2 text-foreground"
              >
                <option value="surah">سورة</option>
                <option value="juz">جزء</option>
                <option value="page">صفحة</option>
                <option value="all">المصحف كاملاً</option>
              </select>

              {scope === "surah" ? (
                <select
                  value={scopeValue}
                  onChange={(e) => setScopeValue(Number(e.target.value))}
                  aria-label="رقم السورة"
                  className="h-8 rounded-lg border border-input bg-background px-2 text-foreground"
                >
                  {(surahs.data ?? []).map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number} — {s.name}
                    </option>
                  ))}
                </select>
              ) : scope === "juz" ? (
                <select
                  value={scopeValue}
                  onChange={(e) => setScopeValue(Number(e.target.value))}
                  aria-label="رقم الجزء"
                  className="h-8 rounded-lg border border-input bg-background px-2 text-foreground"
                >
                  {Array.from({ length: 30 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      الجزء {i + 1}
                    </option>
                  ))}
                </select>
              ) : scope === "page" ? (
                <select
                  value={scopeValue}
                  onChange={(e) => setScopeValue(Number(e.target.value))}
                  aria-label="رقم الصفحة"
                  className="h-8 rounded-lg border border-input bg-background px-2 text-foreground"
                >
                  {Array.from({ length: 604 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      الصفحة {i + 1}
                    </option>
                  ))}
                </select>
              ) : null}

              {audioBusy ? (
                <Button size="sm" disabled className="gap-1">
                  <Loader2 className="size-4 animate-spin" /> جاري التحميل…
                </Button>
              ) : fullyDownloaded ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-green-600/15 px-3 py-1.5 text-xs font-bold text-green-600 animate-pop">
                  <CheckCircle2 className="size-4" /> تم التحميل — {scopeLabel}
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => void downloadAudio()}
                  className="gap-1"
                >
                  <HardDriveDownload className="size-4" />
                  {missingInScope.length && missingInScope.length < scopeAyahs.length
                    ? `تحميل المتبقي (${toArabicNumber(missingInScope.length)} ${missingInScope.length === 1 ? "آية" : "آيات"})`
                    : `تحميل (${scopeLabel} — ${reciterName})`}
                </Button>
              )}
            </div>

            {audioProgress ? (
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {toArabicNumber(audioProgress.done)} / {toArabicNumber(audioProgress.total)} آية
                  </span>
                  <span>{fmtBytes(audioBytes)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gold-gradient transition-all"
                    style={{ width: `${(audioProgress.done / audioProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-foreground">
                التلاوات المحمّلة — {toArabicNumber(downloaded.length)} آية
              </h3>
              <Button
                size="sm"
                variant="destructive"
                disabled={!downloaded.length}
                onClick={() => void clearAllAudio()}
                className="gap-1"
              >
                <Trash2 className="size-4" /> حذف الكل
              </Button>
            </div>
            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto text-xs">
              {downloaded.slice(0, 50).map((d) => (
                <div
                  key={d.url}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary/60 px-2 py-1"
                >
                  <span className="truncate">
                    {RECITERS.find((r) => r.id === d.reciter)?.name ?? d.reciter} — الآية{" "}
                    {toArabicNumber(d.ayah)} · {fmtBytes(d.size)}
                  </span>
                  <button
                    onClick={() => void removeAudio(d.url)}
                    aria-label="حذف هذا الملف"
                    className="shrink-0 text-destructive transition-transform hover:scale-110"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {downloaded.length > 50 ? (
                <p className="text-center text-[10px] text-muted-foreground">
                  …وغيرها من {toArabicNumber(downloaded.length - 50)} آية
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* تنزيل المصاحف */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CloudDownload className="size-4 text-gold" /> تنزيل المصاحف
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            نمط <b>المجوّد الملوّن (الافتراضي)</b> يعمل دون إنترنت تلقائياً لأنه مدمج داخل التطبيق.
            أنماط الصور تُحمَّل من الإنترنت عند العرض، ويمكنك حفظها كلها لتتصفّحها بلا إنترنت.
          </p>

          <div className="mt-3 grid gap-2">
            {MUSHAF_STYLES.map((s) => {
              const isV4 = s.id === "v4";
              const cached = mushafCounts[s.id] ?? 0;
              const busy = mushafBusy === s.id;
              const progress =
                mushafProgress?.id === s.id ? mushafProgress : null;
              return (
                <div key={s.id} className="rounded-xl border border-border bg-secondary/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        {isV4 ? (
                          <>
                            <WifiOff className="size-3.5 text-green-600" /> يعمل دون إنترنت —
                            مدمج داخل التطبيق
                          </>
                        ) : (
                          <>
                            <Wifi className="size-3.5" /> {s.hint} · محفوظ: {toArabicNumber(cached)} صفحة
                          </>
                        )}
                      </p>
                    </div>
                    {isV4 ? null : cached >= 604 ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-600/15 px-3 py-1.5 text-xs font-bold text-green-600 animate-pop">
                        <CheckCircle2 className="size-4" /> محفوظ بالكامل
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void downloadMushaf(s.id)}
                        className="shrink-0 gap-1"
                      >
                        <HardDriveDownload className="size-4" />
                        {busy ? "جاري التنزيل…" : "تنزيل كل الصفحات"}
                      </Button>
                    )}
                  </div>
                  {progress ? (
                    <div className="mt-2">
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gold-gradient transition-all"
                          style={{ width: `${(progress.done / progress.total) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {toArabicNumber(progress.done)} / {toArabicNumber(progress.total)} صفحة
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <p className="flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
          <Loader2 className="size-3.5" /> التحميلات تُحفظ على جهازك ولا تحتاج إنترنت بعد اكتمالها.
        </p>
      </div>
    </main>
  );
}
