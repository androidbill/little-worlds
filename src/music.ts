import { assetUrl } from "./paths";

export const TRACKS = [
  {
    id: "sunny-orchard",
    name: "Sunny Orchard",
    mood: "Bright & breezy",
    detail: "Marimba · plucked strings",
    art: "lemon",
    duration: "2:34",
    seconds: 153.6,
  },
  {
    id: "berry-bounce",
    name: "Berry Bounce",
    mood: "A little pop of happy",
    detail: "Bubbly synths · playful beats",
    art: "strawberry",
    duration: "2:17",
    seconds: (64 * 4 * 60) / 112,
  },
  {
    id: "moonlit-garden",
    name: "Moonlit Garden",
    mood: "Soft, sparkly & serene",
    detail: "Gentle piano · dreamy pads",
    art: "butterfly",
    duration: "2:17",
    seconds: (48 * 4 * 60) / 84,
  },
] as const;
export type TrackId = (typeof TRACKS)[number]["id"];
type Preferences = {
  version: 1;
  welcomed: boolean;
  track: TrackId | null;
  volume: number;
};
type Voice = { id: TrackId; source: AudioBufferSourceNode; gain: GainNode };
const KEY = "little-worlds:music:v1";

/** One shared audio context; decode only the selected song, never all three. */
export class Music {
  private prefs: Preferences = {
    version: 1,
    welcomed: false,
    track: null,
    volume: 0.45,
  };
  private context?: AudioContext;
  private master?: GainNode;
  private voice?: Voice;
  private request?: AbortController;
  private generation = 0;
  private loading = false;
  private failed = false;
  private listeners = new Set<() => void>();

  constructor() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (
        raw?.version === 1 &&
        (raw.track === null || TRACKS.some((t) => t.id === raw.track))
      ) {
        this.prefs = {
          version: 1,
          welcomed: raw.welcomed === true,
          track: raw.track,
          volume:
            typeof raw.volume === "number" && Number.isFinite(raw.volume)
              ? Math.max(0, Math.min(1, raw.volume))
              : 0.45,
        };
      }
    } catch {
      /* Music preferences are independent of the player's game save. */
    }
    const gesture = () => {
      if (this.track) this.activate();
    };
    document.addEventListener("pointerdown", gesture, {
      capture: true,
      passive: true,
    });
    document.addEventListener("keydown", gesture, { capture: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        void this.context?.suspend().catch(() => {});
        this.emit();
      } else if (this.track && this.context) this.activate();
    });
    window.addEventListener("pagehide", () => {
      void this.context?.suspend().catch(() => {});
    });
    window.addEventListener("pageshow", () => {
      if (this.track && this.context) this.activate();
    });
  }

  get welcomed() {
    return this.prefs.welcomed;
  }
  get track() {
    return this.prefs.track;
  }
  get volume() {
    return this.prefs.volume;
  }
  get status(): "off" | "loading" | "error" | "paused" | "playing" | "ready" {
    if (!this.track) return "off";
    if (this.failed) return "error";
    if (this.loading) return "loading";
    if (document.hidden || this.context?.state === "suspended") return "paused";
    return this.voice?.id === this.track && this.context?.state === "running"
      ? "playing"
      : "ready";
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
  }
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.prefs));
    } catch {
      /* A blocked storage write must never interrupt a song or the game. */
    }
  }
  finishWelcome() {
    this.prefs.welcomed = true;
    this.save();
  }

  getContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      this.context.addEventListener("statechange", () => this.emit());
    }
    return this.context;
  }

  /** Called synchronously inside a real user gesture to satisfy mobile autoplay. */
  activate() {
    try {
      const context = this.getContext();
      if (document.hidden) return;
      if (context.state !== "running")
        void context
          .resume()
          .then(() => this.emit())
          .catch(() => this.emit());
      if (
        this.track &&
        !this.loading &&
        !this.failed &&
        this.voice?.id !== this.track
      )
        void this.play(this.track);
    } catch {
      this.failed = true;
      this.emit();
    }
  }

  select(track: TrackId | null) {
    if (this.track !== track || this.failed) {
      this.generation++;
      this.request?.abort();
      this.loading = false;
      this.failed = false;
    }
    this.prefs.track = track;
    this.save();
    if (track) this.activate();
    else {
      this.retire(this.voice);
      this.voice = undefined;
    }
    this.emit();
  }

  setVolume(value: number) {
    this.prefs.volume = Math.max(0, Math.min(1, value));
    if (this.context && this.master) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(
        this.volume,
        this.context.currentTime,
        0.05,
      );
    }
    this.save();
    this.emit();
  }

  private retire(voice?: Voice) {
    if (!voice || !this.context) return;
    const at = this.context.currentTime;
    voice.gain.gain.cancelScheduledValues(at);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, at);
    voice.gain.gain.linearRampToValueAtTime(0, at + 0.65);
    voice.source.stop(at + 0.7);
    voice.source.onended = () => {
      voice.source.disconnect();
      voice.gain.disconnect();
    };
  }

  private async play(id: TrackId) {
    const generation = ++this.generation;
    const request = new AbortController();
    this.request = request;
    this.loading = true;
    this.emit();
    const timeout = window.setTimeout(() => request.abort(), 30_000);
    try {
      const response = await fetch(assetUrl(`music/${id}.mp3`), {
        signal: request.signal,
      });
      if (!response.ok) throw new Error("Music unavailable");
      const bytes = await response.arrayBuffer();
      if (generation !== this.generation) return;
      const context = this.getContext();
      const buffer = await context.decodeAudioData(bytes);
      if (generation !== this.generation) return;
      const source = context.createBufferSource(),
        gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      source.loopEnd = Math.min(
        buffer.duration,
        TRACKS.find((t) => t.id === id)!.seconds,
      );
      source.connect(gain);
      gain.connect(this.master!);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(1, context.currentTime + 0.8);
      source.start();
      this.retire(this.voice);
      this.voice = { id, source, gain };
    } catch {
      if (generation === this.generation) {
        this.failed = true;
        this.retire(this.voice);
        this.voice = undefined;
      }
    } finally {
      clearTimeout(timeout);
      if (generation === this.generation) {
        this.loading = false;
        this.emit();
      }
    }
  }
}
