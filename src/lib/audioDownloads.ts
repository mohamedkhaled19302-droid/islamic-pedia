/** Offline audio downloads stored in IndexedDB, keyed by the CDN url.
 *
 * Blobs are kept in IndexedDB (survives reloads, works in the APK / desktop /
 * web builds) and turned into object URLs on demand right before playback.
 */

export interface DownloadedAudio {
  url: string;
  reciter: string;
  ayah: number;
  size: number;
  at: number;
}

const DB_NAME = "bkl-offline-audio-v2";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "url" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAudioBlob(
  url: string,
  reciter: string,
  ayah: number,
  blob: Blob,
): Promise<void> {
  await withStore("readwrite", (store) =>
    store.put({ url, reciter, ayah, blob, size: blob.size, at: Date.now() }),
  );
}

export async function getAudioBlob(url: string): Promise<Blob | null> {
  const row = await withStore<DownloadedAudio & { blob?: Blob } | undefined>(
    "readonly",
    (store) => store.get(url),
  );
  return row?.blob ?? null;
}

export async function removeAudioDownload(url: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(url));
}

export async function getAllAudioDownloads(): Promise<DownloadedAudio[]> {
  const rows = await withStore<DownloadedAudio[]>("readonly", (store) => store.getAll());
  return (rows ?? []).map((r) => ({
    url: r.url,
    reciter: r.reciter,
    ayah: r.ayah,
    size: r.size,
    at: r.at,
  }));
}

export async function isAudioDownloaded(url: string): Promise<boolean> {
  return (await getAudioBlob(url)) !== null;
}

function base64ToBlob(b64: string): Blob {
  const clean = b64.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "audio/mpeg" });
}

/** Download the mp3 bytes for an ayah, working around the CDN's missing CORS.
 *  - Android (Capacitor): native HTTP transport, immune to CORS. Its
 *    `arraybuffer` responses arrive as base64 strings on the native side, so
 *    the payload is decoded here.
 *  - Web + desktop: server function proxying through the app's Nitro server. */
export async function fetchAudioBlob(url: string): Promise<Blob> {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const { CapacitorHttp } = await import("@capacitor/core");
    const res = await CapacitorHttp.get({ url, responseType: "arraybuffer" });
    if (!res || res.status >= 400) throw new Error(String(res?.status ?? "network"));
    const data = res.data as unknown;
    if (data instanceof ArrayBuffer) return new Blob([data], { type: "audio/mpeg" });
    if (typeof data === "string") return base64ToBlob(data);
    throw new Error("unexpected audio payload");
  }
  const { fetchAudioBase64 } = await import("./audioProxy");
  const b64 = await fetchAudioBase64({ data: url });
  return base64ToBlob(b64);
}

/** object-url cache so a blob is only materialized once per session */
const blobUrlCache = new Map<string, string>();

/** Returns a playable url (object url when downloaded, otherwise the cdn url). */
export async function resolvePlayableUrl(url: string): Promise<string> {
  const hit = blobUrlCache.get(url);
  if (hit) return hit;
  const blob = await getAudioBlob(url);
  if (!blob) return url;
  const objectUrl = URL.createObjectURL(blob);
  blobUrlCache.set(url, objectUrl);
  return objectUrl;
}

/** Preload existing downloads so playback prefers the offline copy. */
export async function initOfflineAudio(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  return countDownloadedAudio();
}

export async function countDownloadedAudio(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  try {
    return (await getAllAudioDownloads()).length;
  } catch {
    return 0;
  }
}
