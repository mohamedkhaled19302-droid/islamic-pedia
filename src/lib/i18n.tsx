import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function formatNumber(n: number) {
  return String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

const dict = {
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
  "onb.stepTheme": "شكل التطبيق",
  "onb.stepLook": "المظهر",
  "onb.stepAudio": "التلاوات",
  "onb.welcomeDesc":
    "قرآن وتفسير وحديث وسيرة وأذكار ومواقيت صلاة — كل شيء في تطبيق واحد يعمل بدون إنترنت بعد تحميل ما تريده. لا تحتاج حساباً ولا تسجيل دخول، بياناتك محفوظة على جهازك فقط.",
  "onb.ready": "خطوتان وتكون جاهزاً للقراءة",
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
  "settings.subtitle": "الإعدادات",
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
  "radio.subtitle": "إذاعات القرآن الكريم · بث مباشر من العالم",
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

export type I18nKey = keyof typeof dict;

export function tFor(key: I18nKey): string {
  return dict[key] ?? key;
}

interface LangCtx {
  dir: "rtl";
  t: (key: I18nKey) => string;
  num: (n: number) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useMemo<LangCtx>(() => ({ dir: "rtl", t: tFor, num: formatNumber }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
