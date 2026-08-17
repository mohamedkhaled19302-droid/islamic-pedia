import { APP_SITE } from "@/lib/app-downloads";

export const SITE_URL = APP_SITE;
export const SITE_NAME_AR = "الموسوعة الإسلامية";
export const SITE_NAME_EN = "Islamic Pedia";
export const SITE_TAGLINE =
  "قرآن كريم وحديث وتفسير وأذكار ومواقيت صلاة وأدوات إسلامية";

export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export interface Crumb {
  name: string;
  path: string;
}

export interface SeoOptions {
  /** Arabic page title without the site-name suffix. */
  title: string;
  /** Unique Arabic meta description (should match the page's real content). */
  description: string;
  /** Canonical path, e.g. "/read" or "/search". */
  path: string;
  ogType?: "website" | "article" | "book" | "music.radio_station";
  noIndex?: boolean;
  /** Breadcrumb trail (excluding the current page). */
  crumbs?: Crumb[];
}

export interface SeoHead {
  meta: Record<string, unknown>[];
  links: Record<string, unknown>[];
}

function fullTitle(title: string): string {
  return `${title} | ${SITE_NAME_AR}`;
}

export function pageUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

function crumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: pageUrl("/") },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
        item: pageUrl(c.path),
      })),
    ],
  };
}

function webPageJsonLd(opts: SeoOptions): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: fullTitle(opts.title),
    description: opts.description,
    url: pageUrl(opts.path),
    inLanguage: "ar",
    isPartOf: { "@type": "WebSite", name: SITE_NAME_EN, url: pageUrl("/") },
  };
}

/**
 * Builds the meta + links block used in every route `head()`.
 * Adds: unique title/description, canonical, Open Graph, Twitter, and
 * WebPage + BreadcrumbList JSON-LD (rendered by the router from the
 * `script:ld+json` meta entries).
 */
export function seoHead(opts: SeoOptions): SeoHead {
  const title = fullTitle(opts.title);
  const url = pageUrl(opts.path);
  const jsonLd: Record<string, unknown>[] = [webPageJsonLd(opts)];
  if (opts.crumbs?.length) jsonLd.push(crumbJsonLd(opts.crumbs));

  const meta: Record<string, unknown>[] = [
    { title },
    { name: "description", content: opts.description },
    { property: "og:title", content: title },
    { property: "og:description", content: opts.description },
    { property: "og:type", content: opts.ogType ?? "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME_EN },
    { property: "og:locale", content: "ar_AR" },
    { property: "og:image", content: OG_IMAGE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: OG_IMAGE },
    ...(opts.noIndex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ...jsonLd.map((block) => ({ "script:ld+json": block })),
  ];

  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}
