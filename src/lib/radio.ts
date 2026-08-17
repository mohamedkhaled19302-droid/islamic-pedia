
export interface RadioStation {
  id: string;
  country: string;
  flag: string;
  station: string;
  url: string;
  hls?: boolean;
}

/** Curated live Quran radio streams, one or more per country. */
export const RADIO_STATIONS: RadioStation[] = [
  {
    id: "sa-makkah",
    country: "السعودية",
    flag: "🇸🇦",
    station: "إذاعة القرآن الكريم — مكة المكرمة",
    url: "https://stream.radiojar.com/4wqre23fytzuv",
  },
  {
    id: "sa-tarateel",
    country: "السعودية",
    flag: "🇸🇦",
    station: "إذاعة ترتيل",
    url: "https://qurango.net/radio/tarateel",
  },
  {
    id: "eg-cairo",
    country: "مصر",
    flag: "🇪🇬",
    station: "إذاعة القرآن الكريم — القاهرة",
    url: "https://stream.radiojar.com/8s5u5tpdtwzuv",
  },
  {
    id: "ae-sharjah",
    country: "الإمارات",
    flag: "🇦🇪",
    station: "إذاعة القرآن الكريم — الشارقة",
    url: "https://l3.itworkscdn.net/smcquranlive/quranradiolive/icecast.audio",
  },
  {
    id: "om-quran",
    country: "عُمان",
    flag: "🇴🇲",
    station: "إذاعة القرآن الكريم — سلطنة عُمان",
    url: "https://partwota.cdn.mgmlcdn.com/quranrdoorg/quranrdo.stream_aac/chunklist.m3u8",
    hls: true,
  },
  {
    id: "bh-quran",
    country: "البحرين",
    flag: "🇧🇭",
    station: "إذاعة القرآن الكريم — البحرين ١٠٦٫١",
    url: "https://5c7b683162943.streamlock.net/live/ngrp:radio-106-1_all/playlist.m3u8",
    hls: true,
  },
  {
    id: "kw-minshawi",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "محمد صديق المنشاوي",
    url: "https://serverkw.quran-uni.com:8018/;*.mp3",
  },
  {
    id: "kw-sudais",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "عبد الرحمن السديس",
    url: "https://serverkw.quran-uni.com:8196/;*.mp3",
  },
  {
    id: "kw-abdulbasit",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "عبد الباسط عبد الصمد",
    url: "https://serverkw.quran-uni.com:8004/;*.mp3",
  },
  {
    id: "kw-husary",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "محمود خليل الحصري",
    url: "https://serverkw.quran-uni.com:8002/;*.mp3",
  },
  {
    id: "kw-shuraym",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "سعود الشريم",
    url: "https://serverkw.quran-uni.com:8194/;*.mp3",
  },
  {
    id: "kw-muaiqly",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "ماهر المعيقلي",
    url: "https://serverkw.quran-uni.com:8014/;*.mp3",
  },
  {
    id: "kw-mustafaismail",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "مصطفى إسماعيل",
    url: "https://serverkw.quran-uni.com:8024/;*.mp3",
  },
  {
    id: "kw-tablawi",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "محمد الطبلاوي",
    url: "https://serverkw.quran-uni.com:8078/;*.mp3",
  },
  {
    id: "kw-ghamadi",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "سعد الغامدي",
    url: "https://serverkw.quran-uni.com:8026/;*.mp3",
  },
  {
    id: "kw-albanna",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "محمود علي البنا",
    url: "https://serverkw.quran-uni.com:8022/;*.mp3",
  },
  {
    id: "kw-alafasy",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "مشاري العفاسي",
    url: "https://serverkw.quran-uni.com:8168/;*.mp3",
  },
  {
    id: "kw-qatami",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "ناصر القطامي",
    url: "https://serverkw.quran-uni.com:8162/;*.mp3",
  },
  {
    id: "kw-dossari",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "ياسر الدوسري",
    url: "https://serverkw.quran-uni.com:8166/;*.mp3",
  },
  {
    id: "kw-ayyoub",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "محمد أيوب",
    url: "https://serverkw.quran-uni.com:8154/;*.mp3",
  },
  {
    id: "kw-jibreel",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "محمد جبريل",
    url: "https://serverkw.quran-uni.com:8158/;*.mp3",
  },
  {
    id: "kw-basfar",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "عبد الله بصفر",
    url: "https://serverkw.quran-uni.com:8182/;*.mp3",
  },
  {
    id: "kw-alajmy",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "أحمد بن علي العجمي",
    url: "https://serverkw.quran-uni.com:8184/;*.mp3",
  },
  {
    id: "kw-hudhaify",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "علي الحذيفي",
    url: "https://serverkw.quran-uni.com:8186/;*.mp3",
  },
  {
    id: "kw-shaatree",
    country: "تلاوات مختارة",
    flag: "🎧",
    station: "أبو بكر الشاطري",
    url: "https://serverkw.quran-uni.com:8160/;*.mp3",
  },
  {
    id: "ye-sanaa",
    country: "اليمن",
    flag: "🇾🇪",
    station: "إذاعة القرآن الكريم — صنعاء",
    url: "https://halo.streamerr.co/listen/quran_kareem/radio.mp3",
  },
  {
    id: "dz-coran",
    country: "الجزائر",
    flag: "🇩🇿",
    station: "إذاعة القرآن الكريم الجزائرية",
    url: "https://radiocoran.ice.infomaniak.ch/coran.mp3",
  },
  {
    id: "pk-soutul",
    country: "باكستان",
    flag: "🇵🇰",
    station: "صوت القرآن — إسلام آباد",
    url: "https://whmsonic.radio.gov.pk:7002/stream?type=http&nocache=12",
  },
  {
    id: "id-sayang",
    country: "إندونيسيا",
    flag: "🇮🇩",
    station: "راديو سايانغ قرآن",
    url: "https://radio.sayangquran.com/listen/radiosq/radio.mp3",
  },
  {
    id: "za-husnaa",
    country: "جنوب أفريقيا",
    flag: "🇿🇦",
    station: "إذاعة الحسنى للقرآن",
    url: "https://stream.zeno.fm/pyc8kax6f2zuv",
  },
  {
    id: "us-soul",
    country: "الولايات المتحدة",
    flag: "🇺🇸",
    station: "Quran for the Soul",
    url: "https://islamicbulletin.site:8102/stream",
  },
  {
    id: "world-mix",
    country: "إذاعات عالمية",
    flag: "🌍",
    station: "تلاوات مختارة — بث متنوع",
    url: "https://backup.qurango.net/radio/mix",
  },
];

export const RADIO_COUNTRIES = Array.from(
  new Map(
    RADIO_STATIONS.map((s) => [s.country, { country: s.country, flag: s.flag }]),
  ).values(),
);


