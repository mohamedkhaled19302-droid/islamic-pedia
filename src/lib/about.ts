
/** نبذة التطبيق ومصادره والأسئلة الشائعة — تُستخدم في صفحة اللمحة والشريط المتحرك. */

export const APP_BLURB =
  "باحث كتاب الله رفيقٌ واحد لكتاب الله: تقرأ فيه القرآن كاملاً بوضع مستمر أو صفحة صفحة كما في المصحف المطبوع، وتستمع لتلاوات مختارة مع إمكانية تنزيلها والاستماع دون إنترنت، وتحفظ بالتكرار الذكي، وتسمّع ما حفظت بالميكروفون كلمةً كلمة مع مراجعة لأخطائك، وتحفظ علاماتك المرجعية وملاحظاتك، وتتابع مواقيت الصلاة في مدينتك، وتلازم أذكارك الموثقة من الكتاب والسنة، وتُسبّح بسبحة إلكترونية تحفظ عدّك، وتختبر معرفتك بمسابقة قرآنية ممتعة — كل ذلك بواجهة عربية هادئة تُشعرك بأنك تجلس مع مصحفك لا مع شاشة.";

export const APP_BLURB_EN =
  "Islamic Pedia is a single companion for the Book of Allah: read the whole Qur'an continuously or page by page like a printed mushaf, listen to selected recitations and download them for offline listening, memorize with smart repetition, test your memorization word by word with the microphone and review your mistakes, keep bookmarks and notes, follow prayer times in your city, keep the athkar of morning and evening, use an electronic tasbih that saves your count, and test your knowledge with a fun Qur'an quiz — all in a calm Arabic interface that feels like sitting with your mushaf rather than a screen.";

export interface AppSection {
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
}

export const APP_SECTIONS: AppSection[] = [
  {
    title: "الوضع المستمر",
    titleEn: "Continuous Mode",
    desc: "تصفّح القرآن كاملاً في شريط واحد متصل مع الترجمة والصوت والتمرير التلقائي مع التلاوة.",
    descEn: "Browse the whole Qur'an in one connected stream with translation, audio and auto-scroll with the recitation.",
  },
  {
    title: "صفحة صفحة",
    titleEn: "Page by Page",
    desc: "قراءة كما في المصحف المطبوع من الصفحة ١ إلى ٦٠٤، مع التكرار والعلامات المرجعية.",
    descEn: "Read like a printed mushaf from page 1 to 604, with repetition and bookmarks.",
  },
  {
    title: "المصحف المجوّد والتفسير",
    titleEn: "Tajweed & Tafsir",
    desc: "مصحف ملوّن بأحكام التجويد في الأعلى وتفسير الآية في الأسفل يتغيّر مع تلاوة الشيخ.",
    descEn: "A tajweed-colored mushaf with the tafsir of each verse below, synced with the reciter's audio.",
  },
  {
    title: "مكتبة الحديث",
    titleEn: "Hadith Library",
    desc: "البخاري ومسلم والسنن في أجزاء مرتبة، مع باب للأحاديث الضعيفة والموضوعة وبيان حكمها.",
    descEn: "Bukhari, Muslim and the Sunan in ordered volumes, plus a section for weak and fabricated hadith with their rulings.",
  },
  {
    title: "السيرة النبوية",
    titleEn: "Prophetic Biography",
    desc: "فصول السيرة من المولد إلى الرفيق الأعلى مع بحث داخل النصوص.",
    descEn: "Seerah chapters from birth to the final journey, with in-text search.",
  },
  {
    title: "التكرار للحفظ",
    titleEn: "Memorization",
    desc: "اختر السورة ونطاق الآيات وعدد مرات التكرار، ودع التلاوة تُعيد عليك حتى يرسخ الحفظ.",
    descEn: "Pick the surah, verse range and repeat count, and let the recitation repeat until the memorization sticks.",
  },
  {
    title: "اختبار التسميع",
    titleEn: "Recitation Test",
    desc: "سمّع بالميكروفون كلمةً كلمة مع ضبط الحساسية ومقياس الصوت، أو سمّع بنفسك ثم اكشف الآية.",
    descEn: "Recite word by word with the microphone and adjustable sensitivity, or test yourself and reveal the verse.",
  },
  {
    title: "الأذكار",
    titleEn: "Daily Athkar",
    desc: "أذكار الصباح والمساء والنوم والاستيقاظ وأدبار الصلوات ورمضان والحج والسفر — موثقة بمصادرها.",
    descEn: "Morning, evening, sleep, wake-up and after-prayer athkar for Ramadan, Hajj and travel — sourced and documented.",
  },
  {
    title: "السبحة",
    titleEn: "Tasbih Counter",
    desc: "عدّاد تسبيح بأهداف ٣٣ و٩٩ و١٠٠، يحفظ عدّك اليومي والإجمالي تلقائياً بلا تسجيل دخول.",
    descEn: "A dhikr counter with targets of 33, 99 and 100 that saves your daily and total counts automatically, no sign-in.",
  },
  {
    title: "مواقيت الصلاة",
    titleEn: "Prayer Times",
    desc: "اختر دولتك ومدينتك لترى مواقيت اليوم مع عدٍّ تنازلي للصلاة القادمة.",
    descEn: "Choose your country and city to see today's prayer times with a countdown to the next prayer.",
  },
  {
    title: "إذاعات القرآن",
    titleEn: "Quran Radio",
    desc: "بث مباشر لإذاعات القرآن الكريم من مختلف الدول باختيار الدولة.",
    descEn: "Live streams of Qur'an radio stations from many countries, chosen by country.",
  },
  {
    title: "البحث في الآيات",
    titleEn: "Verse Search",
    desc: "ابحث عن أي كلمة أو عبارة في المصحف كاملاً وانتقل مباشرة إلى موضعها.",
    descEn: "Search any word or phrase in the whole Qur'an and jump straight to its place.",
  },
  {
    title: "المسابقة القرآنية",
    titleEn: "Quran Contest",
    desc: "أسئلة متنوعة مع سجل للنتائج وشاشة مراجعة تعرض الإجابات الصحيحة.",
    descEn: "Varied questions with a results history and a review screen showing the correct answers.",
  },
  {
    title: "أدوات إسلامية",
    titleEn: "Islamic Tools",
    desc: "أسماء الله الحسنى، التقويم الهجري، المناسبات، حاسبة الزكاة، الآيات المتشابهات، وآية اليوم.",
    descEn: "The 99 names, Hijri calendar, occasions, zakat calculator, similar verses and verse of the day.",
  },
  {
    title: "لوحة تقدّم الحفظ",
    titleEn: "Memorization Dashboard",
    desc: "تابع نطاقات الحفظ المكتملة وسجل التكرار وكل ملاحظاتك على الآيات.",
    descEn: "Track completed memorization ranges, repetition history and all your verse notes.",
  },
  {
    title: "التنزيلات",
    titleEn: "Downloads",
    desc: "نزّل تلاوات السور وصفحات المصاحف على جهازك واستمع واقرأ دون اتصال بالإنترنت.",
    descEn: "Download surah recitations and mushaf pages to listen and read offline.",
  },
];

export interface Faq {
  q: string;
  qEn: string;
  a: string;
  aEn: string;
}

export const FAQS: Faq[] = [
  {
    q: "هل التطبيق مجاني؟",
    qEn: "Is the app free?",
    a: "نعم، التطبيق مجاني بالكامل بلا إعلانات ولا اشتراكات.",
    aEn: "Yes, the app is completely free with no ads and no subscriptions.",
  },
  {
    q: "هل يحتاج حساباً أو تسجيل دخول؟",
    qEn: "Does it require an account or sign-in?",
    a: "لا. لا توجد حسابات ولا تسجيل دخول — كل بياناتك (تقدّمك، علاماتك، ملاحظاتك، تحميلاتك) محفوظة على جهازك فقط.",
    aEn: "No. There are no accounts and no sign-in — all your data (progress, bookmarks, notes, downloads) is stored only on your device.",
  },
  {
    q: "هل يعمل دون إنترنت؟",
    qEn: "Does it work offline?",
    a: "النص القرآني والمصحف الملوّن والأذكار والسبحة تعمل دون إنترنت مباشرة. حمّل التلاوات وصفحات المصاحف من صفحة التحميلات لتستمع وتقرأ بلا اتصال.",
    aEn: "The Qur'an text, colored mushaf, athkar and tasbih work offline right away. Download recitations and mushaf pages from the Downloads page to listen and read offline.",
  },
  {
    q: "كيف أحمّل التطبيق على هاتفي الأندرويد؟",
    qEn: "How do I install the app on my Android phone?",
    a: "افتح صفحة تحميل التطبيق من الموقع، حمّل ملف APK، ثم افتحه ووافق على التثبيت من مصادر غير معروفة. التطبيق آمن وموقّع ولا يجمع أي بيانات.",
    aEn: "Open the app download page on the site, download the APK file, then open it and allow installing from unknown sources. The app is safe, signed and collects no data.",
  },
  {
    q: "لماذا لا يوجد التطبيق في متجر جوجل بلاي؟",
    qEn: "Why isn't the app on Google Play?",
    a: "شروط متجر جوجل للمراجعات والتكاليف تجعل نشر تطبيق مجاني مستقل صعباً، لذلك ننشر التطبيق مباشرة من الموقع الرسمي.",
    aEn: "Google Play's review and cost requirements make publishing a free independent app difficult, so we publish directly from the official website.",
  },
  {
    q: "ما مصادر المحتوى؟",
    qEn: "What are the content sources?",
    a: "النص القرآني والتراجم من مشروع تنزيل، وصور المصحف من مجمع الملك فهد، والتفاسير من موقع مصحف، والتلاوات من Verse by Verse Quran — وتفاصيلها في قسم المصادر.",
    aEn: "The Qur'an text and translations come from Tanzil, mushaf page images from King Fahd Complex, tafsir from Mushaf, and recitations from Verse by Verse Quran — details in the Sources section.",
  },
  {
    q: "كيف أشارك ملاحظاتي أو أطلب ميزة؟",
    qEn: "How can I share feedback or request a feature?",
    a: "من صفحة «شاركنا رأيك» داخل التطبيق — نقرأ كل الملاحظات ونستجيب بقدر الاستطاعة.",
    aEn: "From the 'Share your feedback' page inside the app — we read every note and respond as much as we can.",
  },
];

export const SOURCES = [
  {
    name: "مجمع الملك فهد لطباعة المصحف الشريف",
    role: "مصدر صور صفحات المصحف والخط العثماني",
    url: "https://qurancomplex.gov.sa",
  },
  {
    name: "مشروع تنزيل (Tanzil)",
    role: "مصدر النص القرآني والتراجم",
    url: "https://tanzil.net",
  },
  {
    name: "موقع مصحف (Mushaf)",
    role: "مصدر التفاسير",
    url: "https://mushafapp.com",
  },
  {
    name: "Verse by Verse Quran",
    role: "مصدر التلاوات الصوتية آية بآية",
    url: "https://everyayah.com",
  },
];
