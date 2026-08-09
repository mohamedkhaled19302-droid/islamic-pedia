
import { useEffect, useState } from "react";
import { subscribe } from "@/lib/storage";

/** Reads a localStorage-backed value and re-renders on changes. */
export function useLocalStore<T>(getter: () => T, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const sync = () => setValue(getter());
    sync();
    return subscribe(sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}


