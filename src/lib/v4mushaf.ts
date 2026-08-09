
/** Real Madinah Mushaf (QPC V4 Tajweed) — font-rendered 604 pages.
 * Fonts: bundled COLRv1/CPAL woff2 (Uthman Taha calligraphy, King Fahd Complex).
 * Colors are CPAL palettes inside each font: palette 0 = tajweed colors (light),
 * palette 1 = dark theme, palette 2 = sepia.
 */

export const V4_STYLE_ID = "v4";

export const V4_FONT_DIR = `${import.meta.env.BASE_URL}data/quran/v4/fonts`;
export const V4_PAGE_DIR = `${import.meta.env.BASE_URL}data/quran/v4/pages`;

export interface V4Word {
  /** code_v2 presentation-form glyph code */
  c: string;
  /** verse key "s:a" */
  k: string;
  /** char type: word | end | rub_el_hizb | sajdah | ... */
  t: string;
  /** position within surah */
  p: number;
  /** uthmani text of the word */
  u: string;
}

export interface V4Start {
  surah: number;
  /** line number (1-15) of the surah's first verse on this page */
  firstLine: number;
  /** true when the surah begins at the top of the page (ornament header shown) */
  top: boolean;
}

export interface V4Page {
  p: number;
  start: V4Start | null;
  /** 1-based index; lines[line] = words | null */
  lines: (V4Word[] | null)[];
}

const pageCache = new Map<number, Promise<V4Page>>();

export function fetchV4Page(page: number): Promise<V4Page> {
  let p = pageCache.get(page);
  if (!p) {
    p = fetch(`${V4_PAGE_DIR}/p${page}.json`).then((r) => {
      if (!r.ok) throw new Error(`v4 page ${page} missing`);
      return r.json() as Promise<V4Page>;
    });
    pageCache.set(page, p);
  }
  return p;
}

/** The four basmala glyphs (بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ), drawn as one run. */
export const BASMALA_GLYPHS = "\uFC41\uFC42\uFC43\uFC44";

export const V4_PAGE_LINES = 15;

export const PAPER_LIGHT = "#fbf7ec";
export const PAPER_DARK = "#17191c";

/** Day font-family for a page (palette 0 = printed tajweed colors). */
export function v4FontFamily(page: number, night: boolean): string {
  return night ? `v4-p${page}-n` : `v4-p${page}`;
}

/**
 * One @font-face per theme per page. Chromium ignores CSS `font-palette` for
 * COLRv0 fonts, so the night variant is a pre-baked font whose palette 0
 * already holds the dark-theme colors (see scripts/bake-night-fonts.mjs).
 */
export function v4FontCSS(page: number): string {
  const d = `v4-p${page}`;
  const n = `v4-p${page}-n`;
  return `
@font-face {
  font-family: '${d}';
  src: url('${V4_FONT_DIR}/p${page}.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: '${n}';
  src: url('${V4_FONT_DIR}/p${page}-n.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
.v4-active { background: rgba(210, 168, 52, 0.30); border-radius: 6px; }
`;
}
