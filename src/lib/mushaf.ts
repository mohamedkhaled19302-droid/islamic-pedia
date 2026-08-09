/** Mushaf page sources. */

import { PAPER_DARK, PAPER_LIGHT } from "./v4mushaf";

export type MushafStyleId = "v4" | "ksu" | "madani" | "madani_hd";

export interface MushafStyle {
  id: MushafStyleId;
  name: string;
  hint: string;
  url: (page: number) => string;
  /** matches a cached page url to this style */
  matches: (url: string) => boolean;
  /** paper tint behind the scan */
  paper: string;
}

/** The font-rendered V4 mushaf is a separate style handled by MushafV4. */
export const V4_STYLE: MushafStyle = {
  id: "v4",
  name: "مصحف المدينة مجوّد ملون (خط عثمان طه)",
  hint: "نسخة مجمع الملك فهد ١٤٤١هـ بألوان التجويد داخل الخط نفسه",
  url: () => "",
  matches: () => false,
  paper: PAPER_LIGHT,
};

export const V4_PAPER = (night: boolean) => (night ? PAPER_DARK : PAPER_LIGHT);

const clamp = (p: number) => Math.min(604, Math.max(1, Math.round(p)));
const pad3 = (n: number) => String(n).padStart(3, "0");

export const MUSHAF_STYLES: MushafStyle[] = [
  V4_STYLE,
  {
    id: "ksu",
    name: "مصحف المدينة (مجمع الملك فهد)",
    hint: "خط عثماني كبير وواضح — جامعة الملك سعود",
    url: (p) => `https://quran.ksu.edu.sa/png_big/${clamp(p)}.png`,
    matches: (u) => u.includes("quran.ksu.edu.sa/png_big/"),
    paper: "#fdfaf1",
  },
  {
    id: "madani",
    name: "مصحف المدينة — نسخة خفيفة",
    hint: "أسرع تحميل، مناسب للاتصال البطيء",
    url: (p) => `https://files.quran.app/hafs/madani/width_1024/page${pad3(clamp(p))}.png`,
    matches: (u) => u.includes("/hafs/madani/width_1024/"),
    paper: "#fbf7ec",
  },
  {
    id: "madani_hd",
    name: "مصحف المدينة — دقة عالية",
    hint: "أوضح خط عند التكبير",
    url: (p) => `https://files.quran.app/hafs/madani/width_1920/page${pad3(clamp(p))}.png`,
    matches: (u) => u.includes("/hafs/madani/width_1920/"),
    paper: "#fbf7ec",
  },
];

export const getMushafStyle = (id: string): MushafStyle =>
  MUSHAF_STYLES.find((s) => s.id === id) ?? MUSHAF_STYLES[0];



