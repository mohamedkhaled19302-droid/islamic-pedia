export const APP_VERSION = "1.3.0";

export const APP_SITE = "https://islamic-pedia.vercel.app";

export const APP_RELEASE_TAG = "1.3.0";

export const APP_BINARY_URLS = {
  windows: `https://github.com/mohamedkhaled19302-droid/islamic-pedia/releases/download/${APP_RELEASE_TAG}/Islamic-Pedia-Setup-${APP_VERSION}.exe`,
  windowsPortable: `https://github.com/mohamedkhaled19302-droid/islamic-pedia/releases/download/${APP_RELEASE_TAG}/Islamic-Pedia-${APP_VERSION}.exe`,
  apk: `https://github.com/mohamedkhaled19302-droid/islamic-pedia/releases/download/${APP_RELEASE_TAG}/islamic-pedia-${APP_VERSION}.apk`,
};

export function isWindows() {
  if (typeof navigator === "undefined") return false;
  return /Windows/i.test(navigator.userAgent) && !/Android|iPhone|iPad|Linux|Mac/i.test(navigator.userAgent);
}
