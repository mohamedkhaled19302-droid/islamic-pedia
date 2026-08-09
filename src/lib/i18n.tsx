
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "ar" | "en";

export const LANG_KEY = "bkl-lang";

export const LANGS: { id: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { id: "ar", label: "العربية", dir: "rtl" },
  { id: "en", label: "English", dir: "ltr" },
];

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function formatNumber(n: number, lang: Lang) {
  return lang === "ar"
    ? String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)])
    : n.toLocaleString("en-US");
}

const ar = {
  "app.name": "الموسوعة الإسلامية",
  "app.bismillah": "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",

  "common.home": "الرئيسية",
  "common.back": "رجوع",
  "common.next": "التالي",
  "common.startNow": "ابدأ الآن",
  "common.settings": "الإعدادات",
  "common.version": "النسخة",
  "common.dataLocal": "كل شيء محفوظ على جهازك فقط — بلا حساب",

  "home.heroTag":
    "قرآن كريم وتفسير وحديث وسيرة وأذكار ومواقيت صلاة وأدوات إسلامية — في واجهة واحدة موحّدة.",
  "home.resume": "متابعة القراءة",
  "home.bookmarks": "العلامات المرجعية",
  "home.bookmarksEmpty": "احفظ الآيات والصفحات للعودة إليها لاحقاً",
  "home.bookmarksCount": "آية وصفحة محفوظة — اقفز إليها فوراً",
  "home.footerNote": "المصحف والتلاوات من مصادر مفتوحة — نسأل الله القبول والإخلاص.",

  "install.title": "تثبيت التطبيق",
  "install.windows": "تطبيق ويندوز",
  "install.windowsShort": "ويندوز",
  "install.windowsDesc": "حمّل النسخة الكاملة لسطح المكتب على نظام ويندوز وتصفح بلا متصفح.",
  "install.apk": "تطبيق أندرويد (APK)",
  "install.apkShort": "أندرويد",
  "install.apkDesc": "حمّل ملف APK مباشرة على هاتفك الأندرويد.",
  "install.downloadNow": "تحميل الآن",

  "footer.tagline": "رفيقك في القرآن والحديث والسيرة والأذكار ومواقيت الصلاة — يعمل دون إنترنت بعد تحميل ما تريد.",
  "footer.downloadApp": "حمّل التطبيق",
  "footer.quickLinks": "روابط سريعة",
  "footer.about": "لمحة عن التطبيق",
  "footer.feedback": "شارك رأيك",
  "footer.downloads": "التحميلات دون إنترنت",
  "footer.rights": "الموسوعة الإسلامية — كل الحقوق محفوظة.",

  "onb.stepWelcome": "مرحباً",
  "onb.stepLang": "اللغة",
  "onb.stepTheme": "شكل التطبيق",
  "onb.stepLook": "المظهر",
  "onb.stepAudio": "التلاوات",
  "onb.welcomeDesc":
    "قرآن وتفسير وحديث وسيرة وأذكار ومواقيت صلاة — كل شيء في تطبيق واحد يعمل بدون إنترنت بعد تحميل ما تريده. لا تحتاج حساباً ولا تسجيل دخول، بياناتك محفوظة على جهازك فقط.",
  "onb.ready": "خطوتان وتكون جاهزاً للقراءة",
  "onb.chooseLang": "اختر لغة التطبيق",
  "onb.chooseLangHint": "يمكنك تغيير اللغة لاحقاً من صفحة الإعدادات.",
  "onb.chooseTheme": "اختر شكل التطبيق",
  "onb.chooseThemeHint": "يمكنك تغيير هذا لاحقاً من صفحة الإعدادات.",
  "onb.chooseLook": "ما المظهر المفضل لديك؟",
  "onb.chooseLookHint": "ينعكس الاختيار فوراً حتى تختار ما يناسب عينيك.",
  "onb.day": "النهار",
  "onb.dayDesc": "مشرق وواضح",
  "onb.night": "الليل",
  "onb.nightDesc": "مريح للعين",
  "onb.downloadAudio": "تحميل التلاوات",
  "onb.downloadAudioHint": "يمكنك التحميل الآن أو لاحقاً من صفحة التحميلات في أي وقت.",
  "onb.downloadNow": "حمّل التلاوات الآن",
  "onb.downloadNowDesc": "انتقل مباشرة إلى صفحة التحميلات لاختيار القارئ والسور",
  "onb.startReading": "ابدأ القراءة الآن",
  "onb.startReadingDesc": "حمّل التلاوات لاحقاً من صفحة التحميلات",
  "onb.footerNote": "المصحف والتلاوات من مصادر مفتوحة — لا توجد حسابات ولا جمع بيانات.",

  "settings.title": "الإعدادات",
  "settings.subtitle": "Settings",
  "settings.langTitle": "لغة التطبيق",
  "settings.langHint": "اختر اللغة التي تفضّلها — المحتوى الشرعي يبقى بلغته العربية.",
  "settings.themeTitle": "شكل التطبيق",
  "settings.nightTitle": "الوضع الليلي",
  "settings.day": "نهار",
  "settings.night": "ليل",
  "settings.downloadsTitle": "التحميلات والعمل دون إنترنت",
  "settings.downloadsCount": "تلاوة محمّلة على هذا الجهاز",
  "settings.downloadsEmpty": "لم تُحمّل أي تلاوة بعد",
  "settings.aboutTitle": "حول التطبيق",
  "settings.aboutText":
    "الموسوعة الإسلامية — تطبيق محلي بالكامل. لا يحتاج حساباً ولا تسجيل دخول، ولا يُرسل بياناتك إلى أي خادم. تقدمك وعلاماتك وملاحظاتك وتحميلاتك تبقى على جهازك.",
  "settings.resetTitle": "إعادة تعيين البيانات",
  "settings.resetDesc": "حذف التقدم والعلامات وسجل المسابقة والملاحظات والتلاوات المحمّلة والإعدادات من هذا الجهاز.",
  "settings.resetBtn": "مسح كل البيانات",
  "settings.confirmReset":
    "سيتم حذف كل البيانات المحفوظة على هذا الجهاز (التقدم والعلامات والتحميلات والإعدادات). هل تريد المتابعة؟",

  "radio.title": "إذاعات القرآن",
  "radio.subtitle": "Quran Radio · بث مباشر من العالم",
  "radio.chooseCountry": "اختر الدولة",
  "radio.note": "البث مقدَّم من إذاعات القرآن الكريم الرسمية في كل دولة — قد يتأثر التشغيل بجودة الاتصال.",
  "radio.selectedNote":
    "ملاحظة: أسماء القرّاء في هذه القائمة قد لا تطابق الصوت الفعلي دائمًا — إذ قد تقوم محطات البث بتغيير الملفات أو نسب التلاوة أحياناً.",
  "radio.play": "تشغيل",
  "radio.stop": "إيقاف",
  "radio.errorPlay": "تعذّر تشغيل هذه الإذاعة الآن، جرّب إذاعة أخرى.",
  "radio.errorStream": "انقطع البث، جرّب مرة أخرى أو اختر إذاعة أخرى.",
  "radio.volume": "مستوى الصوت",

  "about.title": "لمحة عن التطبيق",
  "about.subtitle": "ما هو التطبيق، وماذا يقدّم لك",
  "about.sections": "أقسام التطبيق",
  "about.sources": "المصادر وجزاهم الله خيراً",
  "about.faq": "الأسئلة الشائعة",
  "about.share": "شاركنا رأيك في التطبيق",
  "about.thanks": "نسأل الله أن يجعل هذا العمل خالصاً لوجهه الكريم، وأن ينفع به كل من قرأ فيه حرفاً من كتابه.",

  "app.title": "تحميل التطبيق",
  "app.subtitle": "نزّل الموسوعة الإسلامية على جهازك واقرأ بلا متصفح",
  "app.windowsTitle": "ويندوز (سطح المكتب)",
  "app.windowsDesc":
    "نسخة كاملة تعمل مثل أي برنامج ويندوز — تُثبّت مرة واحدة، وتعمل بلا متصفح. ابدأ بتشغيل ملف التثبيت واتبع الخطوات.",
  "app.windowsInstallSteps": "بعد تنزيل الملف، افتحه واضغط «تثبيت». قد يطلب ويندوز التأكيد، فاضغط «نعم».",
  "app.windowsWarnTitle": "هل سيظهر تحذير من ويندوز؟",
  "app.windowsWarnDesc":
    "لأن التطبيق لم يُوقَّع بعد بشهادة موثوقة، قد يعرض ويندوز رسالة «الناشر غير معروف» عند فتح ملف التثبيت. هذا أمر طبيعي وآمن — الملف يأتي من موقعنا الرسمي.",
  "app.windowsWarnStep1": "اضغط «معلومات أكثر» (More info) في الرسالة.",
  "app.windowsWarnStep2": "اضغط «التشغيل على أي حال» (Run anyway).",
  "app.windowsWarnStep3": "أكمل خطوات التثبيت كالمعتاد.",
  "app.androidTitle": "أندرويد (ملف APK)",
  "app.androidDesc":
    "بما أن التطبيق غير متوفر في متجر جوجل، ننزّله لك مباشرة من هذا الموقع. الملف آمن ١٠٠٪ — نفس ملف التطبيق المعتمد، موقعّع ومطابق للنسخة المنشورة.",
  "app.androidSteps": "خطوات التثبيت على أندرويد",
  "app.androidStep1": "حمّل ملف APK من الزر أدناه.",
  "app.androidStep2": "افتح الملف من شريط التنزيلات أو مجلد التنزيلات.",
  "app.androidStep3": "قد يعرض الهاتف «التثبيت من مصادر غير معروفة» — اضغط «السماح» أو «الإعدادات» وفعّل الخيار.",
  "app.androidStep4": "اضغط «تثبيت» ثم «فتح» — وسيظهر التطبيق في قائمة التطبيقات.",
  "app.androidSafe": "هل ملف APK آمن؟",
  "app.androidSafeDesc":
    "نعم. الملف يُبنى من نفس كود الموقع الرسمي islamic-pedia.vercel.app وموقّع بشهادة خاصة، ولا يطلب أذونات غير ضرورية ولا يجمع أي بيانات.",
  "app.playStoreTitle": "لماذا لا يوجد التطبيق في متجر جوجل بلاي؟",
  "app.playStoreDesc":
    "متجر جوجل بلاي يفرض شروطاً تقنية ومالية ومراجعات قد تستغرق وقتاً طويلاً لتطبيقات مجانية مستقلة. لذلك ننشر التطبيق مباشرة من الموقع الرسمي، وهو نفس الأسلوب الذي تتبعه تطبيقات إسلامية مشهورة.",
  "app.webNote": "تستخدم متصفحاً؟ النسخة الإلكترونية تعمل كاملة من islamic-pedia.vercel.app ويمكنك حفظها على شاشتك الرئيسية كتطبيق من قائمة المتصفح.",
  "app.alreadyInstalled":
    "أنت تستخدم الآن نسخة التطبيق المثبّتة على جهازك — لا حاجة لتنزيل نسخة أخرى. كل أقسام التطبيق متاحة لك من القائمة.",
  "app.download": "تحميل",

  "downloads.title": "التحميلات والعمل دون إنترنت",
  "downloads.subtitle": "حمّل ما تحتاجه واقرأ واستمع دون اتصال",
  "downloads.appNote": "حمّل تطبيق كامل للهاتف أو الكمبيوتر من صفحة تحميل التطبيق.",
  "downloads.appLink": "صفحة تحميل التطبيق",

  "theme.change": "تغيير شكل التطبيق",
  "theme.choose": "اختر شكل التطبيق",
};

export type I18nKey = keyof typeof ar;

const en: Record<I18nKey, string> = {
  "app.name": "Islamic Pedia",
  "app.bismillah": "In the name of Allah, the Most Gracious, the Most Merciful",

  "common.home": "Home",
  "common.back": "Back",
  "common.next": "Next",
  "common.startNow": "Start now",
  "common.settings": "Settings",
  "common.version": "Version",
  "common.dataLocal": "Everything is stored on your device only — no account",

  "home.heroTag":
    "The Noble Qur'an, Tafsir, Hadith, Seerah, Athkar, Prayer Times and Islamic tools — all in one unified interface.",
  "home.resume": "Continue reading",
  "home.bookmarks": "Bookmarks",
  "home.bookmarksEmpty": "Save verses and pages to return to them later",
  "home.bookmarksCount": "saved verses and pages — jump to them instantly",
  "home.footerNote": "The Qur'an and recitations come from open sources — we ask Allah to accept this work.",

  "install.title": "Install the app",
  "install.windows": "Windows app",
  "install.windowsShort": "Windows",
  "install.windowsDesc": "Download the full desktop version for Windows and browse without a browser.",
  "install.apk": "Android app (APK)",
  "install.apkShort": "Android",
  "install.apkDesc": "Download the APK file directly on your Android phone.",
  "install.downloadNow": "Download now",

  "footer.tagline": "Your companion for the Qur'an, Hadith, Seerah, Athkar and Prayer Times — works offline after you download what you need.",
  "footer.downloadApp": "Download the app",
  "footer.quickLinks": "Quick links",
  "footer.about": "About the app",
  "footer.feedback": "Send feedback",
  "footer.downloads": "Offline downloads",
  "footer.rights": "Islamic Pedia — All rights reserved.",

  "onb.stepWelcome": "Welcome",
  "onb.stepLang": "Language",
  "onb.stepTheme": "Theme",
  "onb.stepLook": "Appearance",
  "onb.stepAudio": "Audio",
  "onb.welcomeDesc":
    "Qur'an, Tafsir, Hadith, Seerah, Athkar and Prayer Times — everything in one app that works offline after you download what you need. No account and no sign-in required; your data stays on your device.",
  "onb.ready": "A few steps and you're ready to read",
  "onb.chooseLang": "Choose your language",
  "onb.chooseLangHint": "You can change the language later from Settings.",
  "onb.chooseTheme": "Choose a theme",
  "onb.chooseThemeHint": "You can change this later from Settings.",
  "onb.chooseLook": "Which appearance do you prefer?",
  "onb.chooseLookHint": "The change applies instantly so you can pick what suits your eyes.",
  "onb.day": "Day",
  "onb.dayDesc": "Bright and clear",
  "onb.night": "Night",
  "onb.nightDesc": "Gentle on the eyes",
  "onb.downloadAudio": "Download audio",
  "onb.downloadAudioHint": "You can download now or later from the Downloads page at any time.",
  "onb.downloadNow": "Download audio now",
  "onb.downloadNowDesc": "Jump straight to the Downloads page to pick your reciter and surahs",
  "onb.startReading": "Start reading now",
  "onb.startReadingDesc": "Download audio later from the Downloads page",
  "onb.footerNote": "The Qur'an and recitations come from open sources — no accounts and no data collection.",

  "settings.title": "Settings",
  "settings.subtitle": "الإعدادات",
  "settings.langTitle": "App language",
  "settings.langHint": "Choose your preferred language — religious content stays in its original Arabic.",
  "settings.themeTitle": "App theme",
  "settings.nightTitle": "Night mode",
  "settings.day": "Day",
  "settings.night": "Night",
  "settings.downloadsTitle": "Downloads & offline",
  "settings.downloadsCount": "recitations downloaded on this device",
  "settings.downloadsEmpty": "No recitations downloaded yet",
  "settings.aboutTitle": "About the app",
  "settings.aboutText":
    "Islamic Pedia is a fully local app. No account and no sign-in needed, and your data is never sent to any server. Your progress, bookmarks, notes and downloads stay on your device.",
  "settings.resetTitle": "Reset data",
  "settings.resetDesc": "Delete progress, bookmarks, contest history, notes, downloaded audio and settings from this device.",
  "settings.resetBtn": "Clear all data",
  "settings.confirmReset":
    "All data saved on this device will be deleted (progress, bookmarks, downloads and settings). Continue?",

  "radio.title": "Quran Radio",
  "radio.subtitle": "إذاعات القرآن · Live from around the world",
  "radio.chooseCountry": "Choose a country",
  "radio.note": "Streams are provided by the official Quran radio stations of each country — playback may be affected by connection quality.",
  "radio.selectedNote":
    "Note: the reciter names in this list may not always match the actual audio — broadcast stations sometimes change files or attributions.",
  "radio.play": "Play",
  "radio.stop": "Stop",
  "radio.errorPlay": "Couldn't play this station right now, try another one.",
  "radio.errorStream": "The stream stopped, try again or choose another station.",
  "radio.volume": "Volume",

  "about.title": "About the app",
  "about.subtitle": "What the app is, and what it offers you",
  "about.sections": "App sections",
  "about.sources": "Sources — may Allah reward them",
  "about.faq": "Frequently asked questions",
  "about.share": "Share your feedback",
  "about.thanks": "We ask Allah to make this work sincerely for His sake, and to benefit everyone who reads from it.",

  "app.title": "Download the app",
  "app.subtitle": "Install Islamic Pedia on your device and read without a browser",
  "app.windowsTitle": "Windows (Desktop)",
  "app.windowsDesc":
    "A full version that works like any Windows program — installed once and runs without a browser. Run the installer and follow the steps.",
  "app.windowsInstallSteps": "After downloading, open the file and press «Install». Windows may ask for confirmation — press «Yes».",
  "app.windowsWarnTitle": "Will Windows show a warning?",
  "app.windowsWarnDesc": "The app is not yet signed with a trusted certificate, so Windows may show an 'Unknown publisher' message when you open the installer. That is expected and safe — the file comes from our official website.",
  "app.windowsWarnStep1": "Click 'More info' on the warning message.",
  "app.windowsWarnStep2": "Click 'Run anyway'.",
  "app.windowsWarnStep3": "Complete the installation as usual.",
  "app.androidTitle": "Android (APK file)",
  "app.androidDesc":
    "Since the app is not on Google Play, we offer it for direct download from this site. The file is 100% safe — the same trusted app build, signed and identical to the published version.",
  "app.androidSteps": "How to install on Android",
  "app.androidStep1": "Download the APK file from the button below.",
  "app.androidStep2": "Open the file from the notification bar or your Downloads folder.",
  "app.androidStep3": "The phone may show «Install from unknown sources» — tap «Allow» or «Settings» and enable it.",
  "app.androidStep4": "Tap «Install» then «Open» — the app appears in your app list.",
  "app.androidSafe": "Is the APK safe?",
  "app.androidSafeDesc":
    "Yes. The file is built from the same code as the official site islamic-pedia.vercel.app, signed with a private certificate, asks for no unnecessary permissions and collects no data.",
  "app.playStoreTitle": "Why isn't the app on Google Play?",
  "app.playStoreDesc":
    "Google Play imposes technical, financial and review requirements that can take a long time for free independent apps. So we publish directly from the official website — the same approach used by well-known Islamic apps.",
  "app.webNote": "Using a browser? The web version works fully at islamic-pedia.vercel.app, and you can add it to your home screen from the browser menu.",
  "app.alreadyInstalled": "You are using the installed app on this device — no need to download another copy. All sections are available from the menu.",
  "app.download": "Download",

  "downloads.title": "Offline & Downloads",
  "downloads.subtitle": "Download what you need and read & listen offline",
  "downloads.appNote": "Download a full app for your phone or computer from the app download page.",
  "downloads.appLink": "App download page",

  "theme.change": "Change theme",
  "theme.choose": "Choose a theme",
};

const dict = { ar, en };

export function tFor(lang: Lang, key: I18nKey): string {
  return (dict[lang] as Record<string, string>)[key] ?? dict.ar[key] ?? key;
}

export function applyLang(lang: Lang) {
  if (typeof document === "undefined") return;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const el = document.documentElement;
  el.lang = lang;
  el.dir = dir;
  el.dataset.lang = lang;
}

interface LangCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: I18nKey) => string;
  num: (n: number) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    let stored: Lang = "ar";
    try {
      const raw = window.localStorage.getItem(LANG_KEY);
      if (raw === "en") stored = "en";
    } catch {
      /* ignore */
    }
    setLangState(stored);
    applyLang(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    applyLang(l);
    try {
      window.localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: I18nKey) => tFor(lang, key), [lang]);
  const num = useCallback((n: number) => formatNumber(n, lang), [lang]);
  const value = useMemo<LangCtx>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, t, num }),
    [lang, setLang, t, num],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
