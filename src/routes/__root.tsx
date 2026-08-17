
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

import appCss from "../styles.css?url";
import { MiniPlayer } from "@/components/quran/MiniPlayer";
import { Toaster } from "@/components/ui/sonner";
import { SiteFooter } from "@/components/SiteFooter";
import { LanguageProvider } from "@/lib/i18n";
import { SITE_NAME_AR, SITE_NAME_EN, SITE_URL } from "@/lib/seo";
import { toast } from "sonner";
import { getOnboarding } from "@/lib/storage";
import { isPackagedApp } from "@/lib/app-downloads";

const PRE_PAINT_SCRIPT = `(function(){try{var K=['classic','modern','heritage','cool','futuristic'],t=localStorage.getItem('bkl-theme'),n=localStorage.getItem('bkl-night'),d=document.documentElement;d.lang='ar';d.dir='rtl';if(t&&K.indexOf(t)>=0){d.setAttribute('data-theme',t);}else{d.setAttribute('data-theme','classic');}if(n==='1'){d.classList.add('dark');}}catch(e){}})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          لم تتحمّل الصفحة
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حدث خطأ غير متوقع. يمكنك تحديث الصفحة أو العودة للرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "zKJFvXerbeIdiJcFWerqzCedw6vmkr-ete0cYhpxzxo" },
      { title: "الموسوعة الإسلامية — قرآن وحديث وأذكار ومواقيت الصلاة" },
      {
        name: "description",
        content:
          "الموسوعة الإسلامية: قرآن كريم بعدة مصاحف وتفاسير، مكتبة حديث، سيرة نبوية، أذكار وسبحة، مواقيت صلاة، وأدوات إسلامية متنوعة.",
      },
      { name: "author", content: "الموسوعة الإسلامية" },
      { property: "og:title", content: "الموسوعة الإسلامية — Islamic Pedia" },
      {
        property: "og:description",
        content: "قرآن كريم وتفسير وحديث وسيرة وأذكار ومواقيت صلاة وأدوات إسلامية في تطبيق واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "الموسوعة الإسلامية — Islamic Pedia" },
      { name: "twitter:description", content: "قرآن كريم وتفسير وحديث وسيرة وأذكار ومواقيت صلاة وأدوات إسلامية في تطبيق واحد." },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME_EN,
          alternateName: SITE_NAME_AR,
          url: SITE_URL,
          inLanguage: "ar",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@400;600;700;900&family=Reem+Kufi:wght@500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    /* The service worker is only useful for offline caching on the web. In the
     * packaged apps the content is bundled locally (Electron serves it from a
     * local server, Capacitor from local assets), so the SW would only cache a
     * stale shell and delay the new version — skip it there entirely. */
    if ("serviceWorker" in navigator && !import.meta.env.DEV && !isPackagedApp()) {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => {});
    }
    const onAudioError = () => {
      toast.error("تعذّر تشغيل التلاوة. تحقق من اتصال الإنترنت أو أعد تحميل الملف من صفحة التنزيلات.");
    };
    window.addEventListener("bkl:audio-error", onAudioError);
    return () => window.removeEventListener("bkl:audio-error", onAudioError);
  }, []);

  useEffect(() => {
    const done = getOnboarding()?.done ?? false;
    if (!done && pathname !== "/onboarding") {
      void router.navigate({ to: "/onboarding" });
    }
  }, [pathname, router]);

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <div key={pathname} className="animate-page">
          <Outlet />
        </div>
        <MiniPlayer />
        {pathname === "/" ? <SiteFooter /> : null}
        <Toaster richColors position="bottom-center" />
      </QueryClientProvider>
    </LanguageProvider>
  );
}


