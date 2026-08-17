
import { useCallback, useEffect, useState } from "react";

export interface AppTheme {
  id: string;
  name: string;
  /** لون تعريفي يُعرض في زر الاختيار */
  swatch: string;
  desc: string;
}

export const THEMES: AppTheme[] = [
  {
    id: "classic",
    name: "الكلاسيكي",
    swatch: "linear-gradient(135deg,#1f5c4a,#d9b063)",
    desc: "الزمرد والذهب — التصميم الأصلي المريح للعين.",
  },
  {
    id: "modern",
    name: "العصري",
    swatch: "linear-gradient(135deg,#4338ca,#38bdf8)",
    desc: "بسيط ونظيف مع مساحات مفتوحة وظلال ناعمة.",
  },
  {
    id: "heritage",
    name: "التراثي",
    swatch: "linear-gradient(135deg,#2f5d46,#c9a14f)",
    desc: "أجواء المخطوطات القديمة بالورق العتيق والبرونز.",
  },
  {
    id: "cool",
    name: "البارد",
    swatch: "linear-gradient(135deg,#0e7490,#22d3ee)",
    desc: "زجاج داكن ولمسات سيان باردة متوهجة.",
  },
  {
    id: "futuristic",
    name: "المستقبلي",
    swatch: "linear-gradient(135deg,#6d28d9,#22d3ee)",
    desc: "فضاء داكن ونيون بنفسجي سماوي — مظهر تقني.",
  },
];

export const THEME_IDS = new Set(THEMES.map((t) => t.id));

const KEY = "bkl-theme";
const DEFAULT_THEME = "classic";

export function applyTheme(id: string) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = id;
}

export function useTheme() {
  const [theme, setThemeState] = useState(DEFAULT_THEME);

  useEffect(() => {
    let stored = DEFAULT_THEME;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw && THEME_IDS.has(raw)) stored = raw;
    } catch {
      /* ignore */
    }
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
    applyTheme(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme, setTheme, themes: THEMES };
}
