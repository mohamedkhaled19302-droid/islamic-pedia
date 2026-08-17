
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, MapPin, Search } from "lucide-react";
import { ModeHeader } from "@/components/quran/ModeHeader";
import { getPrayerPlace, savePrayerPlace, type PrayerPlace } from "@/lib/storage";
import { toArabicNumber } from "@/lib/quran";
import { seoHead } from "@/lib/seo";
import { SeoIntro } from "@/components/SeoIntro";

export const Route = createFileRoute("/prayer")({
  head: () =>
    seoHead({
      title: "مواقيت الصلاة — اختر دولتك ومدينتك",
      description:
        "اعرف مواقيت الصلاة اليوم في أي دولة ومدينة: الفجر والشروق والظهر والعصر والمغرب والعشاء، مع العدّ التنازلي للصلاة القادمة.",
      path: "/prayer",
      crumbs: [{ name: "مواقيت الصلاة", path: "/prayer" }],
    }),
  component: PrayerPage,
});

const COUNTRIES: { code: string; name: string; cities: string[] }[] = [
  { code: "Saudi Arabia", name: "السعودية", cities: ["Mecca", "Medina", "Riyadh", "Jeddah", "Dammam", "Abha", "Tabuk"] },
  { code: "Egypt", name: "مصر", cities: ["Cairo", "Alexandria", "Giza", "Aswan", "Luxor", "Tanta", "Port Said"] },
  { code: "United Arab Emirates", name: "الإمارات", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain"] },
  { code: "Kuwait", name: "الكويت", cities: ["Kuwait City", "Hawalli", "Al Jahra"] },
  { code: "Qatar", name: "قطر", cities: ["Doha", "Al Rayyan", "Al Wakrah"] },
  { code: "Bahrain", name: "البحرين", cities: ["Manama", "Riffa", "Muharraq"] },
  { code: "Oman", name: "عُمان", cities: ["Muscat", "Salalah", "Sohar", "Nizwa"] },
  { code: "Yemen", name: "اليمن", cities: ["Sanaa", "Aden", "Taiz", "Hodeidah"] },
  { code: "Jordan", name: "الأردن", cities: ["Amman", "Zarqa", "Irbid", "Aqaba"] },
  { code: "Palestine", name: "فلسطين", cities: ["Jerusalem", "Gaza", "Hebron", "Nablus", "Ramallah"] },
  { code: "Syria", name: "سوريا", cities: ["Damascus", "Aleppo", "Homs", "Latakia"] },
  { code: "Lebanon", name: "لبنان", cities: ["Beirut", "Tripoli", "Sidon"] },
  { code: "Iraq", name: "العراق", cities: ["Baghdad", "Basra", "Mosul", "Erbil", "Najaf", "Karbala"] },
  { code: "Sudan", name: "السودان", cities: ["Khartoum", "Omdurman", "Port Sudan"] },
  { code: "Libya", name: "ليبيا", cities: ["Tripoli", "Benghazi", "Misrata"] },
  { code: "Tunisia", name: "تونس", cities: ["Tunis", "Sfax", "Sousse"] },
  { code: "Algeria", name: "الجزائر", cities: ["Algiers", "Oran", "Constantine", "Annaba"] },
  { code: "Morocco", name: "المغرب", cities: ["Casablanca", "Rabat", "Marrakesh", "Fes", "Tangier"] },
  { code: "Mauritania", name: "موريتانيا", cities: ["Nouakchott", "Nouadhibou"] },
  { code: "Somalia", name: "الصومال", cities: ["Mogadishu", "Hargeisa"] },
  { code: "Turkey", name: "تركيا", cities: ["Istanbul", "Ankara", "Izmir", "Bursa", "Konya"] },
  { code: "Pakistan", name: "باكستان", cities: ["Karachi", "Lahore", "Islamabad", "Peshawar"] },
  { code: "India", name: "الهند", cities: ["Delhi", "Mumbai", "Hyderabad", "Kolkata", "Chennai"] },
  { code: "Indonesia", name: "إندونيسيا", cities: ["Jakarta", "Surabaya", "Bandung", "Medan"] },
  { code: "Malaysia", name: "ماليزيا", cities: ["Kuala Lumpur", "Johor Bahru", "Penang"] },
  { code: "Bangladesh", name: "بنغلاديش", cities: ["Dhaka", "Chittagong", "Sylhet"] },
  { code: "Nigeria", name: "نيجيريا", cities: ["Lagos", "Kano", "Abuja"] },
  { code: "United Kingdom", name: "بريطانيا", cities: ["London", "Birmingham", "Manchester", "Leeds"] },
  { code: "France", name: "فرنسا", cities: ["Paris", "Marseille", "Lyon", "Lille"] },
  { code: "Germany", name: "ألمانيا", cities: ["Berlin", "Hamburg", "Munich", "Cologne"] },
  { code: "United States", name: "أمريكا", cities: ["New York", "Chicago", "Houston", "Los Angeles", "Detroit"] },
  { code: "Canada", name: "كندا", cities: ["Toronto", "Montreal", "Ottawa", "Calgary"] },
  { code: "Australia", name: "أستراليا", cities: ["Sydney", "Melbourne", "Perth"] },
];

const NAMES: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};
const ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

const METHODS = [
  { id: 4, label: "أم القرى (مكة)" },
  { id: 5, label: "الهيئة المصرية العامة للمساحة" },
  { id: 3, label: "رابطة العالم الإسلامي" },
  { id: 2, label: "الجمعية الإسلامية لأمريكا الشمالية" },
  { id: 1, label: "جامعة العلوم الإسلامية بكراتشي" },
  { id: 13, label: "ديانة تركيا" },
];

function pad2(n: number) {
  return `${n < 10 ? toArabicNumber(0) : ""}${toArabicNumber(n)}`;
}

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h < 12 ? "ص" : "م";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${toArabicNumber(hh)}:${pad2(m)} ${period}`;
}

function PrayerPage() {
  const [place, setPlace] = useState<PrayerPlace>({ country: "Saudi Arabia", city: "Mecca", method: 4 });
  const [times, setTimes] = useState<Record<string, string> | null>(null);
  const [meta, setMeta] = useState<{ hijri: string; gregorian: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const saved = getPrayerPlace();
    if (saved) setPlace(saved);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(place.city)}&country=${encodeURIComponent(place.country)}&method=${place.method}`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json?.data?.timings) throw new Error("no data");
        setTimes(json.data.timings);
        setMeta({
          hijri: `${json.data.date.hijri.day} ${json.data.date.hijri.month.ar} ${json.data.date.hijri.year}هـ`,
          gregorian: json.data.date.readable,
        });
      })
      .catch(() => !cancelled && setError("تعذّر جلب المواقيت — تحقّق من الاتصال أو جرّب مدينة أخرى."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [place.city, place.country, place.method]);

  const next = useMemo(() => {
    if (!times) return null;
    const d = new Date(now);
    for (const k of ORDER) {
      if (k === "Sunrise") continue;
      const [h, m] = (times[k] ?? "").split(":").map(Number);
      const at = new Date(d);
      at.setHours(h, m, 0, 0);
      if (at.getTime() > now) return { key: k, at: at.getTime() };
    }
    const [h, m] = (times.Fajr ?? "").split(":").map(Number);
    const at = new Date(d);
    at.setDate(at.getDate() + 1);
    at.setHours(h, m, 0, 0);
    return { key: "Fajr", at: at.getTime() };
  }, [times, now]);

  const countdown = next
    ? (() => {
        const diff = Math.max(0, next.at - now);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        return `${toArabicNumber(h)}:${pad2(m)}:${pad2(sec)}`;
      })()
    : "";

  const country = COUNTRIES.find((c) => c.code === place.country) ?? COUNTRIES[0];

  const setAndSave = (p: PrayerPlace) => {
    setPlace(p);
    savePrayerPlace(p);
  };

  return (
    <main className="min-h-screen pb-16">
      <ModeHeader title="مواقيت الصلاة" subtitle={meta ? `${meta.hijri} — ${meta.gregorian}` : "اختر دولتك ومدينتك"} />

      <section className="mx-auto max-w-3xl px-4 pt-4">
        <SeoIntro
          title="مواقيت الصلاة في أي مدينة"
          links={[
            { to: "/athkar", label: "الأذكار الموثقة" },
            { to: "/tools", label: "التقويم الهجري والمناسبات" },
          ]}
        >
          اعرف مواقيت الصلاة اليوم في أي دولة ومدينة — الفجر والشروق والظهر والعصر
          والمغرب والعشاء — مع العدّ التنازلي للصلاة القادمة والتاريخين الهجري
          والميلادي.
        </SeoIntro>
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-muted-foreground">الدولة</span>
            <select
              value={place.country}
              onChange={(e) => {
                const c = COUNTRIES.find((x) => x.code === e.target.value)!;
                setAndSave({ ...place, country: c.code, city: c.cities[0] });
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-muted-foreground">المدينة</span>
            <select
              value={place.city}
              onChange={(e) => setAndSave({ ...place, city: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {country.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-muted-foreground">طريقة الحساب</span>
            <select
              value={place.method}
              onChange={(e) => setAndSave({ ...place, method: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {next && times ? (
          <div className="mt-4 rounded-2xl border border-gold/40 bg-hero p-5 text-center text-hero-foreground shadow-glow">
            <p className="flex items-center justify-center gap-2 text-xs opacity-80">
              <MapPin className="size-3.5" /> {country.name} — {place.city}
            </p>
            <p className="mt-3 text-sm text-gold">الصلاة القادمة</p>
            <p className="mt-1 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {NAMES[next.key]}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-gold">{countdown}</p>
            <p className="mt-1 text-xs opacity-75">متبقٍ على الأذان</p>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جارٍ جلب المواقيت…
          </div>
        ) : error ? (
          <div className="mt-4 rounded-2xl border border-destructive/40 bg-card p-6 text-center text-sm text-destructive">
            <Search className="mx-auto mb-2 size-5" />
            {error}
          </div>
        ) : times ? (
          <div className="mt-4 grid gap-2">
            {ORDER.map((k) => {
              const active = next?.key === k;
              return (
                <div
                  key={k}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${
                    active ? "border-gold bg-accent/60" : "border-border bg-card"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${
                        active ? "bg-gold-gradient text-gold-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Clock className="size-4" />
                    </span>
                    <span className="text-base font-bold text-foreground">{NAMES[k]}</span>
                  </span>
                  <span className="text-lg font-bold tabular-nums text-foreground">{fmt(times[k])}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          المواقيت من واجهة AlAdhan المفتوحة — تُحفظ مدينتك تلقائياً لزيارتك القادمة.
        </p>
      </section>
    </main>
  );
}


