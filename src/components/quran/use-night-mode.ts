
import { useCallback, useEffect, useState } from "react";

const KEY = "bkl-night";

export function useNightMode() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
    setNight(stored);
    document.documentElement.classList.toggle("dark", stored);
  }, []);

  const toggle = useCallback(() => {
    setNight((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem(KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const set = useCallback((next: boolean) => {
    setNight(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(KEY, next ? "1" : "0");
  }, []);

  return { night, toggle, set };
}


