export const APP_VERSION = "1.3.3";

export const APP_SITE = "https://islamic-pedia.vercel.app";

export const APP_RELEASE_TAG = "1.3.3";

export const APP_BINARY_URLS = {
  windows: `https://github.com/mohamedkhaled19302-droid/islamic-pedia/releases/download/${APP_RELEASE_TAG}/Islamic-Pedia-Setup-${APP_VERSION}.exe`,
  windowsPortable: `https://github.com/mohamedkhaled19302-droid/islamic-pedia/releases/download/${APP_RELEASE_TAG}/Islamic-Pedia-${APP_VERSION}.exe`,
  apk: `https://github.com/mohamedkhaled19302-droid/islamic-pedia/releases/download/${APP_RELEASE_TAG}/islamic-pedia-${APP_VERSION}.apk`,
};

export function isWindows() {
  if (typeof navigator === "undefined") return false;
  return /Windows/i.test(navigator.userAgent) && !/Android|iPhone|iPad|Linux|Mac/i.test(navigator.userAgent);
}

export function isPackagedApp() {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) return true;
  const appInfo = (window as unknown as { appInfo?: { name?: string } }).appInfo;
  if (appInfo && appInfo.name === "islamic-pedia") return true;
  return false;
}

/** Open a URL in the system browser (Chrome Custom Tabs on Android, the default
 *  browser in the Electron app). Falls back to a plain window.open elsewhere. */
export async function openExternal(url: string) {
  if (typeof window === "undefined") return;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    } catch {
      /* plugin missing — fall back to window.open */
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
