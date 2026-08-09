
/** Local persistence for reading progress, bookmarks and contest history. */

export type ModeKey = "read" | "page" | "memorize";

export interface Progress {
  mode: ModeKey;
  label: string;
  /** surah number (read/memorize) or page number (page mode) */
  value: number;
  ayah?: number;
  at: number;
}

export interface Bookmark {
  id: string;
  kind: "ayah" | "page";
  surah?: number;
  surahName?: string;
  ayah?: number;
  page?: number;
  text?: string;
  at: number;
}

export interface ContestAnswer {
  prompt: string;
  verse: string;
  picked: string;
  answer: string;
  correct: boolean;
  quran: boolean;
  surahName?: string;
  /** رقم الآية العام لتشغيل تلاوة الإجابة الصحيحة */
  globalAyah?: number;
}

export interface ContestRun {
  id: string;
  at: number;
  scopeLabel: string;
  typeLabel: string;
  right: number;
  wrong: number;
  answers: ContestAnswer[];
}

const K = {
  progress: "bkl-progress",
  bookmarks: "bkl-bookmarks",
  contest: "bkl-contest-history",
};

const EVT = "bkl-storage";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
  } catch {
    /* quota */
  }
}

export function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

/* ---------- progress ---------- */

export const getProgress = () => read<Record<string, Progress>>(K.progress, {});

export function saveProgress(p: Progress) {
  const all = getProgress();
  all[p.mode] = p;
  write(K.progress, all);
}

export function clearProgress(mode: ModeKey) {
  const all = getProgress();
  delete all[mode];
  write(K.progress, all);
}

/* ---------- bookmarks ---------- */

export const getBookmarks = () => read<Bookmark[]>(K.bookmarks, []);

export function bookmarkId(b: Omit<Bookmark, "id" | "at">) {
  return b.kind === "page" ? `page-${b.page}` : `ayah-${b.surah}-${b.ayah}`;
}

export function toggleBookmark(b: Omit<Bookmark, "id" | "at">) {
  const id = bookmarkId(b);
  const list = getBookmarks();
  const exists = list.some((x) => x.id === id);
  const next = exists ? list.filter((x) => x.id !== id) : [{ ...b, id, at: Date.now() }, ...list];
  write(K.bookmarks, next.slice(0, 300));
  return !exists;
}

export function removeBookmark(id: string) {
  write(K.bookmarks, getBookmarks().filter((x) => x.id !== id));
}

/* ---------- contest history ---------- */

export const getContestHistory = () => read<ContestRun[]>(K.contest, []);

export function saveContestRun(run: ContestRun) {
  write(K.contest, [run, ...getContestHistory()].slice(0, 50));
}

export function clearContestHistory() {
  write(K.contest, []);
}

/* ---------- tasbih ---------- */

export interface TasbihState {
  /** counts per dhikr phrase */
  counts: Record<string, number>;
  /** total presses ever */
  total: number;
  /** ISO date -> presses that day */
  daily: Record<string, number>;
  target: number;
  active: string;
}

const TASBIH_KEY = "bkl-tasbih";

export const defaultTasbih = (): TasbihState => ({
  counts: {},
  total: 0,
  daily: {},
  target: 33,
  active: "سُبْحَانَ اللَّهِ",
});

export const getTasbih = () => ({ ...defaultTasbih(), ...read<Partial<TasbihState>>(TASBIH_KEY, {}) });

export function saveTasbih(s: TasbihState) {
  write(TASBIH_KEY, s);
}

/* ---------- feedback ---------- */

export interface FeedbackEntry {
  id: string;
  at: number;
  stars: number;
  name?: string;
  message: string;
}

const FEEDBACK_KEY = "bkl-feedback";

export const getFeedback = () => read<FeedbackEntry[]>(FEEDBACK_KEY, []);

export function saveFeedback(entry: Omit<FeedbackEntry, "id" | "at">) {
  const full: FeedbackEntry = { ...entry, id: `${Date.now()}`, at: Date.now() };
  write(FEEDBACK_KEY, [full, ...getFeedback()].slice(0, 100));
  return full;
}

/* ---------- prayer location ---------- */

export interface PrayerPlace {
  country: string;
  city: string;
  method: number;
}

const PRAYER_KEY = "bkl-prayer-place";

export const getPrayerPlace = () => read<PrayerPlace | null>(PRAYER_KEY, null);
export const savePrayerPlace = (p: PrayerPlace) => write(PRAYER_KEY, p);

/* ---------- athkar progress ---------- */

const ATHKAR_KEY = "bkl-athkar";

/** { "<date>|<category>|<index>": remainingCount } */
export const getAthkarState = () => read<Record<string, number>>(ATHKAR_KEY, {});
export const saveAthkarState = (s: Record<string, number>) => write(ATHKAR_KEY, s);

/* ---------- verse notes ---------- */

export interface Note {
  id: string;
  surah: number;
  surahName?: string;
  ayah: number;
  text: string;
  body: string;
  at: number;
}

const NOTES_KEY = "bkl-notes";

export const noteId = (surah: number, ayah: number) => `n-${surah}-${ayah}`;

export const getNotes = () => read<Note[]>(NOTES_KEY, []);

export function getNote(surah: number, ayah: number) {
  return getNotes().find((n) => n.id === noteId(surah, ayah)) ?? null;
}

export function saveNote(n: Omit<Note, "id" | "at">) {
  const id = noteId(n.surah, n.ayah);
  const rest = getNotes().filter((x) => x.id !== id);
  const body = n.body.trim();
  write(NOTES_KEY, body ? [{ ...n, body, id, at: Date.now() }, ...rest].slice(0, 500) : rest);
}

export function removeNote(id: string) {
  write(NOTES_KEY, getNotes().filter((x) => x.id !== id));
}

/* ---------- memorization sessions ---------- */

export interface MemoSession {
  id: string;
  at: number;
  surah: number;
  surahName: string;
  from: number;
  to: number;
  repeat: number;
  /** number of ayah playbacks completed in the session */
  plays: number;
}

const MEMO_KEY = "bkl-memo-sessions";

export const getMemoSessions = () => read<MemoSession[]>(MEMO_KEY, []);

export function startMemoSession(s: Omit<MemoSession, "id" | "at" | "plays">) {
  const full: MemoSession = { ...s, plays: 0, id: `${Date.now()}`, at: Date.now() };
  write(MEMO_KEY, [full, ...getMemoSessions()].slice(0, 200));
  return full.id;
}

export function bumpMemoSession(id: string) {
  const list = getMemoSessions();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return;
  list[i] = { ...list[i], plays: list[i].plays + 1 };
  write(MEMO_KEY, list);
}

export function clearMemoSessions() {
  write(MEMO_KEY, []);
}

/* ---------- recitation test (اختبار التسميع) ---------- */

export interface ReciteMistake {
  ayahIndex: number;
  globalAyah: number;
  surahName?: string;
  ayahNumber: number;
  wordIndex: number;
  expected: string;
  heard: string;
  kind: "missed" | "skipped";
  at: number;
}

export interface ReciteState {
  kind: "page" | "juz" | "surah";
  from: number;
  to: number;
  mode: "mic" | "self";
  sensitivity: number;
  noiseFloor?: number;
  pages: number[];
  page: number;
  revealed: number;
  wordIdx: number;
  mistakes: ReciteMistake[];
  at: number;
}

const RECITE_KEY = "bkl-recite-session";

export const getReciteState = () => read<ReciteState | null>(RECITE_KEY, null);
export const saveReciteState = (s: ReciteState) => write(RECITE_KEY, s);
export const clearReciteState = () => write(RECITE_KEY, null);

/* ---------- mushaf preferences ---------- */

export interface MushafPrefs {
  style: string;
  view: "mushaf" | "ayah" | "searchtruth";
}

const MUSHAF_KEY = "bkl-mushaf-prefs";

export const getMushafPrefs = (): MushafPrefs => ({
  style: "v4",
  view: "mushaf",
  ...read<Partial<MushafPrefs>>(MUSHAF_KEY, {}),
});

export const saveMushafPrefs = (p: MushafPrefs) => write(MUSHAF_KEY, p);

/* ---------- onboarding ---------- */

export interface OnboardingPrefs {
  done: boolean;
  theme: string;
  night: boolean;
  downloadNow: boolean;
  lang?: string;
  at: number;
}

const ONBOARD_KEY = "bkl-onboarding";

export const getOnboarding = () => read<OnboardingPrefs | null>(ONBOARD_KEY, null);

export const saveOnboarding = (p: Omit<OnboardingPrefs, "at">) =>
  write(ONBOARD_KEY, { ...p, at: Date.now() });

/** localStorage keys used across the app, for the "reset data" action. */
export const ALL_KEYS = [
  K.progress,
  K.bookmarks,
  K.contest,
  TASBIH_KEY,
  FEEDBACK_KEY,
  PRAYER_KEY,
  ATHKAR_KEY,
  NOTES_KEY,
  MEMO_KEY,
  RECITE_KEY,
  MUSHAF_KEY,
  "bkl-theme",
  "bkl-night",
  "bkl-lang",
  ONBOARD_KEY,
] as const;

export const clearAllData = async () => {
  for (const key of ALL_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  for (const name of ["bkl-offline-audio", "bkl-offline-audio-v2"]) {
    try {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    } catch {
      /* ignore */
    }
  }
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((n) => caches.delete(n)));
  } catch {
    /* ignore */
  }
  window.location.href = "/";
};


