export const APP_VERSION = "1.3.0";

export const APP_SITE = "https://islamic-pedia.vercel.app";

export const APP_BINARY_URLS = {
  windows: `${APP_SITE}/downloads/Islamic-Pedia-Setup-${APP_VERSION}.exe`,
  windowsPortable: `${APP_SITE}/downloads/Islamic-Pedia-${APP_VERSION}.exe`,
  apk: `${APP_SITE}/downloads/islamic-pedia-${APP_VERSION}.apk`,
};

export function isWindows() {
  if (typeof navigator === "undefined") return false;
  return /Windows/i.test(navigator.userAgent) && !/Android|iPhone|iPad|Linux|Mac/i.test(navigator.userAgent);
}
