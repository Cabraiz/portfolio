export type HomeArcadeSoundId =
  | "coin"
  | "hit"
  | "jump"
  | "turbo"
  | "win"
  | "lose"
  | "pause"
  | "resume"
  | "click";

export type HomeArcadeAudioEnvelope = Readonly<{
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}>;

export type HomeArcadeToneEvent = Readonly<{
  frequency: number;
  duration: number;
  startTime?: number;
  gain?: number;
  type?: OscillatorType;
}>;

export type HomeArcadeSoundDefinition = Readonly<{
  id: HomeArcadeSoundId;
  masterGain: number;
  envelope: HomeArcadeAudioEnvelope;
  tones: readonly HomeArcadeToneEvent[];
}>;

export type HomeArcadeAudioEngineOptions = Readonly<{
  enabled?: boolean;
  masterVolume?: number;
}>;

const DEFAULT_ENVELOPE: HomeArcadeAudioEnvelope = {
  attack: 0.005,
  decay: 0.06,
  sustain: 0.0,
  release: 0.08,
};

export const HOME_ARCADE_SOUND_LIBRARY: Record<
  HomeArcadeSoundId,
  HomeArcadeSoundDefinition
> = {
  click: {
    id: "click",
    masterGain: 0.18,
    envelope: {
      attack: 0.002,
      decay: 0.04,
      sustain: 0,
      release: 0.04,
    },
    tones: [
      { frequency: 880, duration: 0.04, gain: 0.9, type: "square" },
      { frequency: 1240, duration: 0.03, startTime: 0.025, gain: 0.55, type: "square" },
    ],
  },

  coin: {
    id: "coin",
    masterGain: 0.24,
    envelope: {
      attack: 0.002,
      decay: 0.08,
      sustain: 0,
      release: 0.06,
    },
    tones: [
      { frequency: 1046.5, duration: 0.05, gain: 0.85, type: "triangle" },
      { frequency: 1568, duration: 0.06, startTime: 0.04, gain: 0.75, type: "triangle" },
      { frequency: 2093, duration: 0.05, startTime: 0.085, gain: 0.55, type: "triangle" },
    ],
  },

  jump: {
    id: "jump",
    masterGain: 0.2,
    envelope: {
      attack: 0.002,
      decay: 0.05,
      sustain: 0,
      release: 0.08,
    },
    tones: [
      { frequency: 320, duration: 0.05, gain: 0.9, type: "square" },
      { frequency: 520, duration: 0.06, startTime: 0.035, gain: 0.7, type: "square" },
      { frequency: 720, duration: 0.05, startTime: 0.075, gain: 0.45, type: "square" },
    ],
  },

  turbo: {
    id: "turbo",
    masterGain: 0.18,
    envelope: {
      attack: 0.002,
      decay: 0.035,
      sustain: 0,
      release: 0.05,
    },
    tones: [
      { frequency: 220, duration: 0.035, gain: 0.85, type: "sawtooth" },
      { frequency: 330, duration: 0.03, startTime: 0.02, gain: 0.7, type: "sawtooth" },
      { frequency: 495, duration: 0.03, startTime: 0.04, gain: 0.5, type: "sawtooth" },
    ],
  },

  hit: {
    id: "hit",
    masterGain: 0.22,
    envelope: {
      attack: 0.001,
      decay: 0.06,
      sustain: 0,
      release: 0.08,
    },
    tones: [
      { frequency: 180, duration: 0.08, gain: 0.95, type: "sawtooth" },
      { frequency: 132, duration: 0.1, startTime: 0.025, gain: 0.7, type: "triangle" },
      { frequency: 96, duration: 0.12, startTime: 0.055, gain: 0.45, type: "triangle" },
    ],
  },

  pause: {
    id: "pause",
    masterGain: 0.16,
    envelope: DEFAULT_ENVELOPE,
    tones: [
      { frequency: 660, duration: 0.05, gain: 0.8, type: "square" },
      { frequency: 520, duration: 0.06, startTime: 0.05, gain: 0.65, type: "square" },
    ],
  },

  resume: {
    id: "resume",
    masterGain: 0.16,
    envelope: DEFAULT_ENVELOPE,
    tones: [
      { frequency: 520, duration: 0.05, gain: 0.8, type: "square" },
      { frequency: 660, duration: 0.06, startTime: 0.045, gain: 0.65, type: "square" },
    ],
  },

  win: {
    id: "win",
    masterGain: 0.24,
    envelope: {
      attack: 0.004,
      decay: 0.08,
      sustain: 0,
      release: 0.12,
    },
    tones: [
      { frequency: 523.25, duration: 0.08, gain: 0.7, type: "triangle" },
      { frequency: 659.25, duration: 0.08, startTime: 0.09, gain: 0.75, type: "triangle" },
      { frequency: 783.99, duration: 0.08, startTime: 0.18, gain: 0.78, type: "triangle" },
      { frequency: 1046.5, duration: 0.12, startTime: 0.29, gain: 0.85, type: "triangle" },
    ],
  },

  lose: {
    id: "lose",
    masterGain: 0.24,
    envelope: {
      attack: 0.002,
      decay: 0.09,
      sustain: 0,
      release: 0.12,
    },
    tones: [
      { frequency: 392, duration: 0.08, gain: 0.75, type: "sawtooth" },
      { frequency: 311.13, duration: 0.08, startTime: 0.09, gain: 0.68, type: "sawtooth" },
      { frequency: 246.94, duration: 0.12, startTime: 0.19, gain: 0.78, type: "triangle" },
      { frequency: 196, duration: 0.18, startTime: 0.31, gain: 0.9, type: "triangle" },
    ],
  },
} as const;

function canUseAudioContext(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    (typeof globalThis.AudioContext !== "undefined" ||
      typeof (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== "undefined")
  );
}

function createAudioContextInstance(): AudioContext | null {
  if (!canUseAudioContext()) {
    return null;
  }

  const ContextCtor =
    globalThis.AudioContext ??
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!ContextCtor) {
    return null;
  }

  return new ContextCtor();
}

export class HomeArcadeAudioEngine {
  private context: AudioContext | null = null;

  private master: GainNode | null = null;

  private enabled = true;

  private masterVolume = 1;

  constructor(options: HomeArcadeAudioEngineOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.masterVolume = options.masterVolume ?? 1;
  }

  public setEnabled(value: boolean): void {
    this.enabled = value;
  }

  public setMasterVolume(value: number): void {
    this.masterVolume = Math.min(1, Math.max(0, value));

    if (this.master) {
      this.master.gain.value = this.masterVolume;
    }
  }

  public async prime(): Promise<void> {
    const context = this.ensureContext();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        // noop
      }
    }
  }

  public async play(soundId: HomeArcadeSoundId): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const context = this.ensureContext();

    if (!context || !this.master) {
      return;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }

    const definition = HOME_ARCADE_SOUND_LIBRARY[soundId];

    if (!definition) {
      return;
    }

    const now = context.currentTime;

    definition.tones.forEach((tone) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      const startTime = now + (tone.startTime ?? 0);
      const duration = Math.max(0.01, tone.duration);
      const peakGain = (tone.gain ?? 1) * definition.masterGain;

      oscillator.type = tone.type ?? "triangle";
      oscillator.frequency.setValueAtTime(tone.frequency, startTime);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(
        peakGain,
        startTime + definition.envelope.attack,
      );
      gainNode.gain.linearRampToValueAtTime(
        peakGain * definition.envelope.sustain,
        startTime + definition.envelope.attack + definition.envelope.decay,
      );
      gainNode.gain.linearRampToValueAtTime(
        0.0001,
        startTime + duration + definition.envelope.release,
      );

      oscillator.connect(gainNode);
      if (this.master) {
        gainNode.connect(this.master);
      }

      oscillator.start(startTime);
      oscillator.stop(startTime + duration + definition.envelope.release + 0.01);
    });
  }

  public destroy(): void {
    if (this.context) {
      try {
        void this.context.close();
      } catch {
        // noop
      }
    }

    this.context = null;
    this.master = null;
  }

  private ensureContext(): AudioContext | null {
    if (this.context && this.master) {
      return this.context;
    }

    const context = createAudioContextInstance();

    if (!context) {
      return null;
    }

    const master = context.createGain();
    master.gain.value = this.masterVolume;
    master.connect(context.destination);

    this.context = context;
    this.master = master;

    return context;
  }
}

let sharedHomeArcadeAudioEngine: HomeArcadeAudioEngine | null = null;

export function getHomeArcadeAudioEngine(): HomeArcadeAudioEngine {
  if (!sharedHomeArcadeAudioEngine) {
    sharedHomeArcadeAudioEngine = new HomeArcadeAudioEngine({
      enabled: true,
      masterVolume: 0.9,
    });
  }

  return sharedHomeArcadeAudioEngine;
}

export function playHomeArcadeSound(soundId: HomeArcadeSoundId): void {
  void getHomeArcadeAudioEngine().play(soundId);
}
