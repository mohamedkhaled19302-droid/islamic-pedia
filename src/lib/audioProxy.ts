import { createServerFn } from "@tanstack/react-start";

/** Server-side proxy for downloading ayah audio.
 *
 * The audio CDN (cdn.islamic.network) sends no CORS headers, so a browser
 * fetch() of the raw mp3 bytes is blocked. On web + desktop (both served by the
 * app's Nitro server) this server function fetches the bytes server-side and
 * returns them as base64. On the Android APK the same function is bypassed in
 * favour of the native CapacitorHttp transport, which is not subject to CORS.
 */

const ALLOWED_HOSTS = new Set(["cdn.islamic.network"]);

export const fetchAudioBase64 = createServerFn()
  .validator((url: string) => url)
  .handler(async ({ data: url }) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("invalid audio url");
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) throw new Error("disallowed host");
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return btoa(binary);
  });
