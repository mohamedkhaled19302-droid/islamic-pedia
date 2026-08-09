
import { useCallback, useEffect, useState } from "react";

export interface AppTheme {
  id: string;
  name: string;
  /** لون تعريفي يُعرض في زر الاختيار */
  swatch: string;
}

export const THEMES: AppTheme[] = [
  { id: "rainbow", name: "قوس قزح المتحرك", swatch: "linear-gradient(90deg,#f56a6a,#f0a35c,#d9d45c,#6ac86a,#5ca8e8,#a06ae8,#f56a6a)" },
  { id: "classic", name: "الزمرد الكلاسيكي", swatch: "linear-gradient(135deg,#1f5c4a,#d9b063)" },
  { id: "ocean", name: "أزرق المحيط", swatch: "linear-gradient(135deg,#123a5c,#7fc4e8)" },
  { id: "rose", name: "العنّاب الوردي", swatch: "linear-gradient(135deg,#5c1f33,#e0a1b4)" },
  { id: "midnight", name: "بنفسج الليل", swatch: "linear-gradient(135deg,#2b2150,#a892e8)" },
  { id: "sand", name: "رمال الصحراء", swatch: "linear-gradient(135deg,#6b4b21,#e8cf9a)" },
  { id: "mono", name: "الحبر والورق", swatch: "linear-gradient(135deg,#2a2a2a,#c9c9c9)" },
];

const KEY = "bkl-theme";
const DEFAULT_THEME = "classic";

export function applyTheme(id: string) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = id;
}

export function useTheme() {
  const [theme, setThemeState] = useState(DEFAULT_THEME);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(KEY)) || DEFAULT_THEME;
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


