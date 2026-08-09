import { useEffect, useState } from "react";

/** Shared, app-wide audio player.
 *
 * A single Audio element is owned by this module so recitation keeps playing
 * while the user navigates between modes, and so downloaded (offline) audio can
 * be transparently substituted for the CDN stream everywhere.
 *
 * SSR-safe: the <audio> element is created lazily on first use in the browser.
 */

export interface TrackInfo {
  /** canonical CDN url — used as identity + for the mini player */
  src: string;
  /** actual source passed to <audio> (blob url when downloaded) */
  playSrc?: string;
  title: string;
  subtitle?: string;
  href?: string;
}

type EndHandler = () => void;

class AudioController {
  current: TrackInfo | null = null;
  playing = false;
  rate = 1;

  private el: HTMLAudioElement | null = null;
  private loadedPlaySrc: string | null = null;
  private listeners = new Set<() => void>();
  private endedHandler: EndHandler | null = null;

  private ensureEl(): HTMLAudioElement {
    if (this.el) return this.el;
    this.el = new Audio();
    this.el.preload = "auto";
    this.el.onended = () => {
      this.setPlaying(false);
      this.endedHandler?.();
    };
    this.el.onerror = () => {
      this.setPlaying(false);
      this.reportError();
    };
    return this.el;
  }

  private reportError() {
    const src = this.current?.playSrc ?? this.current?.src;
    const detail = { source: src };
    window.dispatchEvent(new CustomEvent("bkl:audio-error", { detail }));
  }

  private setPlaying(v: boolean) {
    if (this.playing === v) return;
    this.playing = v;
    this.emit();
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Load (if needed) and play. Same canonical src => just resume/continue. */
  play(track: TrackInfo, opts?: { rate?: number; onEnded?: EndHandler }) {
    const playSrc = track.playSrc ?? track.src;
    const isNew = this.current?.src !== track.src || this.loadedPlaySrc !== playSrc;
    this.current = { ...track };
    if (isNew) {
      this.loadedPlaySrc = playSrc;
      this.ensureEl().src = playSrc;
    }
    this.rate = opts?.rate ?? this.rate;
    this.ensureEl().playbackRate = this.rate;
    this.endedHandler = opts?.onEnded ?? null;
    this.ensureEl()
      .play()
      .then(() => this.setPlaying(true))
      .catch((e) => {
        this.setPlaying(false);
        if (e?.name === "NotAllowedError") return;
        this.reportError();
      });
    this.emit();
  }

  pause() {
    this.el?.pause();
    this.setPlaying(false);
  }

  resume() {
    if (!this.current) return;
    this.ensureEl()
      .play()
      .then(() => this.setPlaying(true))
      .catch((e) => {
        this.setPlaying(false);
        if (e?.name === "NotAllowedError") return;
        this.reportError();
      });
  }

  replay() {
    this.ensureEl().currentTime = 0;
    this.ensureEl()
      .play()
      .then(() => this.setPlaying(true))
      .catch((e) => {
        this.setPlaying(false);
        if (e?.name === "NotAllowedError") return;
        this.reportError();
      });
  }

  stop() {
    this.el?.pause();
    if (this.el) this.el.removeAttribute("src");
    this.loadedPlaySrc = null;
    this.current = null;
    this.endedHandler = null;
    this.setPlaying(false);
  }

  setRate(r: number) {
    this.rate = r;
    if (this.el) this.el.playbackRate = r;
    this.emit();
  }
}

export const globalAudio = new AudioController();

/** Re-render the component whenever the shared player state changes. */
export function useGlobalAudio() {
  const [, force] = useState(0);
  useEffect(() => globalAudio.subscribe(() => force((x) => x + 1)), []);
  return globalAudio;
}
