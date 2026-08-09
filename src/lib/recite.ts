
/** Helpers for the recitation-test mode: Arabic normalization and word matching. */

const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

export function normalizeWord(w: string) {
  return w
    .replace(DIACRITICS, "")
    .replace(/[إأآٱا]/g, "ا")
    .replace(/[ىئي]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A]/g, "");
}

/** Strips leading conjunctions/prepositions and the definite article. */
function stem(w: string) {
  let s = w;
  if (s.length > 4 && /^(وال|فال|بال|كال|لل)/.test(s)) s = s.replace(/^(وال|فال|بال|كال|لل)/, "");
  else if (s.length > 3 && s.startsWith("ال")) s = s.slice(2);
  else if (s.length > 3 && /^[وفبكل]/.test(s)) s = s.slice(1);
  return s;
}

export const splitWords = (t: string) => t.split(/\s+/).filter(Boolean);

function distance(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** 1 = strict (letters must match), 2 = balanced (default), 3 = lenient. */
export type Sensitivity = 1 | 2 | 3;

/**
 * Tolerant comparison between a spoken word and the expected Qur'anic word.
 * The goal is to accept a word whenever the letters are essentially the same,
 * because speech recognition frequently drops or swaps a single letter.
 */
export function wordsMatch(spoken: string, expected: string, sensitivity: Sensitivity = 2) {
  const a = normalizeWord(spoken);
  const b = normalizeWord(expected);
  if (!a || !b) return false;
  if (a === b) return true;

  const sa = stem(a);
  const sb = stem(b);
  if (sa && sb && sa === sb) return true;

  if (sensitivity === 1) {
    // Strict: identical letters only, allow the definite article difference.
    return false;
  }

  // One of the words is contained in the other (recognizer merged/split words).
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  if (short.length >= 3 && long.includes(short)) return true;
  if (sa.length >= 3 && sb.length >= 3 && (sa.startsWith(sb) || sb.startsWith(sa))) return true;

  const len = Math.min(sa.length || a.length, sb.length || b.length);
  const d = distance(sa || a, sb || b);

  if (sensitivity === 3) {
    // Lenient: accept up to ~40% of letters differing.
    if (len >= 3 && d <= Math.max(1, Math.ceil(len * 0.4))) return true;
    return false;
  }

  // Balanced: one edit for short words, two for longer ones.
  if (len >= 3 && d <= 1) return true;
  if (len >= 5 && d <= 2) return true;
  return false;
}

export const randomOf = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- Web Speech API (typed loosely, browser-only) ---------- */

export interface SpeechResult {
  isFinal: boolean;
  0: { transcript: string; confidence?: number };
  length: number;
}

export interface SpeechLike {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult:
    | ((e: { results: ArrayLike<SpeechResult>; resultIndex: number }) => void)
    | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
}

export function isSpeechSupported() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

export function createRecognition(lang = "ar-SA"): SpeechLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechLike;
    webkitSpeechRecognition?: new () => SpeechLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  return rec;
}

/** Collects every alternative transcript of the newest results, best-first. */
export function alternativesOf(result: SpeechResult): string[] {
  const out: string[] = [];
  for (let i = 0; i < result.length; i++) {
    const alt = (result as unknown as Record<number, { transcript?: string }>)[i];
    if (alt?.transcript) out.push(alt.transcript);
  }
  return out;
}


