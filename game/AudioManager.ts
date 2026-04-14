'use client';

// AudioManager — Tier 1: Web Audio API tones (works with zero audio files)
// Tier 2: Howler.js (add real MP3s to /public/audio/ and wire up here)

type SfxName = 'jump' | 'stomp' | 'powerup' | 'hurt' | 'death' | 'goal' | 'block';

interface ToneSpec {
  freq: number;
  duration: number;
  type: OscillatorType;
  freqs?: number[];
}

const SFX_TONES: Record<SfxName, ToneSpec> = {
  jump:    { freq: 520,  duration: 0.10, type: 'square' },
  stomp:   { freq: 160,  duration: 0.18, type: 'sawtooth' },
  powerup: { freq: 260,  duration: 0.08, type: 'square', freqs: [260, 330, 392, 523] },
  hurt:    { freq: 180,  duration: 0.25, type: 'sawtooth' },
  death:   { freq: 440,  duration: 0.08, type: 'square', freqs: [440, 330, 220, 110] },
  goal:    { freq: 523,  duration: 0.12, type: 'square', freqs: [392, 440, 523, 659, 784] },
  block:   { freq: 300,  duration: 0.12, type: 'square' },
};

export class AudioManager {
  private ac: AudioContext | null = null;
  private muted = false;
  private musicGain: GainNode | null = null;
  private musicOscs: OscillatorNode[] = [];
  private musicStarted = false;
  private loopTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Must be called after the first user gesture (browser autoplay policy) */
  init(): void {
    if (this.ac) return;
    this.ac = new AudioContext();
    this.startMusic();
  }

  play(name: SfxName): void {
    if (this.muted || !this.ac) return;
    const spec = SFX_TONES[name];

    if (spec.freqs) {
      spec.freqs.forEach((f, i) => {
        const t = this.ac!.currentTime + i * spec.duration;
        this.playTone(f, spec.duration * 0.9, spec.type, 0.18, t);
      });
    } else {
      this.playTone(spec.freq, spec.duration, spec.type, 0.2);
    }
  }

  toggleMute(): void {
    this.muted = !this.muted;
    if (this.musicGain) {
      this.musicGain.gain.value = this.muted ? 0 : 0.06;
    }
  }

  get isMuted(): boolean { return this.muted; }

  stopMusic(): void {
    // Cancel any pending loop reschedule
    if (this.loopTimeoutId !== null) {
      clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
    }
    for (const o of this.musicOscs) {
      try { o.stop(); o.disconnect(); } catch {}
    }
    this.musicOscs = [];
    this.musicStarted = false;
    this.musicGain = null;
  }

  /** Start (or restart) the background music */
  startMusic(): void {
    if (!this.ac) return;
    this.stopMusic();           // clean up any previous session first
    this.scheduleChiptune();
  }

  private playTone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain = 0.2,
    startAt?: number,
  ): void {
    if (!this.ac) return;
    const g = this.ac.createGain();
    const t0 = startAt ?? this.ac.currentTime;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    g.connect(this.ac.destination);

    const o = this.ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.01);
  }

  // ─── Chiptune background music ──────────────────────────────────────────────

  private scheduleChiptune(): void {
    if (!this.ac) return;
    this.musicStarted = true;

    const master = this.ac.createGain();
    master.gain.value = this.muted ? 0 : 0.06;
    master.connect(this.ac.destination);
    this.musicGain = master;

    const BPM  = 140;
    const BEAT = 60 / BPM;

    const melody = [
      523, 659, 784, 659, 523, 440, 392, 440,
      523, 784, 880, 784, 659, 523, 440, 392,
    ];
    const durations = melody.map(() => BEAT * 0.5);
    const loopDur   = durations.reduce((s, d) => s + d, 0);

    const scheduleLoop = (startTime: number) => {
      if (!this.ac || !this.musicStarted) return;

      let t = startTime;
      for (let i = 0; i < melody.length; i++) {
        const o = this.ac.createOscillator();
        o.type = 'square';
        o.frequency.value = melody[i];

        const g = this.ac.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(1, t + 0.01);
        g.gain.setValueAtTime(1, t + durations[i] * 0.7);
        g.gain.linearRampToValueAtTime(0.001, t + durations[i]);

        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + durations[i] + 0.02);
        this.musicOscs.push(o);

        t += durations[i];
      }

      const nextStart = startTime + loopDur;
      const delay     = Math.max(0, (nextStart - this.ac.currentTime - 0.1) * 1000);

      // Store timeout ID so stopMusic() can cancel it
      this.loopTimeoutId = setTimeout(() => {
        this.loopTimeoutId = null;
        if (this.musicStarted) scheduleLoop(nextStart);
      }, delay);
    };

    scheduleLoop(this.ac.currentTime + 0.1);
  }
}
