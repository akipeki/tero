'use client';

// AudioManager — Web Audio API chiptune. No audio files required.
// The theme song's notes live in game/music.ts; this file is the band.
//
// Music: four voices (lead, arpeggio, bass, noise drums) plus Tero's
// synthesized "da" for the hook, scheduled ahead with a look-ahead timer.
// `setFloorMood(0..1)` makes the muzak sadder the higher you climb: slower,
// warbly like a stretched tape, overdriven and muffled. `setTantrum(true)`
// bolts a distorted power-chord guitar and double kick onto whatever is
// playing: the muzak turns into metal while Tero rages.

import { SONGS, ARRANGEMENTS, DEFAULT_ARRANGEMENT, chordTones, hz, midi, type SongId, type Arrangement } from './music';
import { CUSTOM_SOUNDS } from './customSounds';

type SfxName =
  | 'jump' | 'stomp' | 'powerup' | 'hurt' | 'death'
  | 'goal' | 'block' | 'coin' | 'checkpoint' | 'text' | 'plop' | 'dada'
  | 'puff' | 'fire' | 'burn' | 'free' | 'ready' | 'roar'
  | 'laser' | 'bossHit' | 'click' | 'unlock' | 'sync' | 'hide' | 'fax' | 'boing' | 'alarm' | 'error'
  | 'boom' | 'woof';

interface ToneSpec {
  freq: number;
  duration: number;
  type: OscillatorType;
  freqs?: number[];
  /** Glide to this frequency over the tone (classic jump/hurt sweeps). */
  slideTo?: number;
  /** Add a short noise burst (impacts). */
  noise?: number;
  /** Highpass for the noise burst (Hz). Default 1800. */
  noiseHz?: number;
  /** Noise only, no tone (whooshes). */
  noiseOnly?: boolean;
  /** Per-tone gain; defaults to 0.2. */
  gain?: number;
}

const SFX_TONES: Record<Exclude<SfxName, 'dada' | 'roar'>, ToneSpec> = {
  jump:       { freq: 330, duration: 0.12, type: 'square', slideTo: 700, gain: 0.14 },
  stomp:      { freq: 300, duration: 0.14, type: 'square', slideTo: 70, noise: 0.08 },
  powerup:    { freq: 260, duration: 0.08, type: 'square', freqs: [260, 330, 392, 523, 659, 784] },
  hurt:       { freq: 520, duration: 0.30, type: 'sawtooth', slideTo: 140 },
  death:      { freq: 440, duration: 0.10, type: 'square', freqs: [440, 415, 392, 370, 349, 330, 165] },
  goal:       { freq: 523, duration: 0.12, type: 'square', freqs: [392, 440, 523, 659, 784] },
  block:      { freq: 180, duration: 0.08, type: 'square', slideTo: 110, noise: 0.05 },
  coin:       { freq: 988, duration: 0.07, type: 'square', freqs: [988, 1319] },
  checkpoint: { freq: 660, duration: 0.10, type: 'square', freqs: [660, 880, 990] },
  text:       { freq: 1400, duration: 0.015, type: 'square', gain: 0.05 },
  plop:       { freq: 660, duration: 0.035, type: 'sine', freqs: [660, 440], gain: 0.18 },
  // Fire. The puff is a toddler failing to breathe fire: "pff… hic".
  puff:       { freq: 900, duration: 0.06, type: 'square', slideTo: 520, gain: 0.07, noise: 0.07, noiseHz: 1200 },
  fire:       { freq: 0, duration: 0.14, type: 'square', noise: 0.14, noiseHz: 350, noiseOnly: true, gain: 0.16 },
  burn:       { freq: 140, duration: 0.18, type: 'square', slideTo: 60, gain: 0.1, noise: 0.22, noiseHz: 2500 },
  free:       { freq: 784, duration: 0.06, type: 'square', freqs: [784, 988, 1175, 1568], gain: 0.1 },
  ready:      { freq: 523, duration: 0.07, type: 'triangle', freqs: [523, 659, 784, 1047, 784, 1047], gain: 0.24 },
  // Boss fight
  laser:      { freq: 1800, duration: 0.25, type: 'sine', slideTo: 900, gain: 0.08 },
  bossHit:    { freq: 420, duration: 0.09, type: 'square', freqs: [420, 300, 520, 260], gain: 0.16 },
  click:      { freq: 2400, duration: 0.02, type: 'square', freqs: [2400, 1600], gain: 0.08 },
  unlock:     { freq: 784, duration: 0.18, type: 'triangle', freqs: [1047, 784], gain: 0.25 },   // ding-dong
  // Quick syncs: the "someone is calling you" knock, and a cardboard rustle
  sync:       { freq: 523, duration: 0.09, type: 'triangle', freqs: [523, 659, 523, 659], gain: 0.22 },
  hide:       { freq: 0, duration: 0.08, type: 'square', noise: 0.08, noiseHz: 900, noiseOnly: true, gain: 0.12 },
  // R&D: a modem handshake squeal, and the spring
  fax:        { freq: 1200, duration: 0.07, type: 'square', freqs: [1200, 2100, 1650, 2400, 980, 2100], gain: 0.07 },
  boing:      { freq: 180, duration: 0.3, type: 'square', slideTo: 720, gain: 0.14 },
  alarm:      { freq: 880, duration: 0.16, type: 'sawtooth', freqs: [880, 660, 880, 660, 880, 660], gain: 0.1 },
  // The Windows "chord" of disapproval
  error:      { freq: 220, duration: 0.11, type: 'square', freqs: [440, 330, 165], gain: 0.14 },
  boom:       { freq: 160, duration: 0.6, type: 'sawtooth', slideTo: 30, gain: 0.22, noise: 0.7, noiseHz: 120 },
  woof:       { freq: 260, duration: 0.12, type: 'square', freqs: [300, 220], gain: 0.16 },
};

/** Music bus level before the volume slider. */
const MUSIC_LEVEL = 0.09;
const LOOKAHEAD_S = 0.15;
const TICK_MS = 25;

export class AudioManager {
  private ac: AudioContext | null = null;
  private muted = false;
  private masterScale = 1;
  private noiseBuf: AudioBuffer | null = null;

  // Music graph: voices → bus → drive → muffle → musicGain → out
  private musicGain: GainNode | null = null;
  private bus: GainNode | null = null;
  /** Input of the metal guitar's own distortion (bypasses the muffle). */
  private metal: WaveShaperNode | null = null;
  private tantrum = false;
  private boss = false;
  /** The song for the current floor; the boss song replaces it in fights. */
  private baseSong: SongId = 'main';
  private song: SongId = 'main';
  private arr: Arrangement = DEFAULT_ARRANGEMENT;
  /** Everything that isn't music goes through here (its own volume). */
  private sfxOut: GainNode | null = null;
  private sfxScale = 1;
  /** Recordings from customSounds.ts, once decoded. */
  private customMusic = new Map<SongId, AudioBuffer>();
  private customSfx = new Map<string, AudioBuffer>();
  /** Casual Friday: the lead is a plinky ukulele-ish triangle, a bit faster. */
  private casual = false;
  private lfoDepth: GainNode | null = null;
  private musicNodes = new Set<AudioScheduledSourceNode>();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextStepAt = 0;
  private mood = 0;

  /** Must be called after the first user gesture (browser autoplay policy) */
  init(): void {
    if (this.ac) return;
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext ||
        // legacy webkit
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ac = new Ctor();
      this.sfxOut = this.ac.createGain();
      this.sfxOut.connect(this.ac.destination);
      this.applySfxLevel();
      this.loadCustomSounds();
      this.startMusic();
    } catch {
      // Some locked-down browsers throw; degrade gracefully to silent.
      this.ac = null;
    }
  }

  play(name: SfxName): void {
    if (this.muted || !this.ac) return;
    const now = this.ac.currentTime;
    const custom = this.customSfx.get(name);
    if (custom) {
      const src = this.ac.createBufferSource();
      src.buffer = custom;
      src.connect(this.out);
      src.start(now);
      return;
    }
    if (name === 'roar') {
      // "RAAAAH" — Tero's war cry, sliding down an octave
      this.voice(hz(midi('G5')), now, 0.75, this.out, 0.9, true, hz(midi('G4')));
      this.noise(now, 0.4, 0.15, this.out, 600);
      return;
    }
    if (name === 'dada') {
      // "Da-da?" — rising, like the title
      this.voice(hz(midi('E5')), now, 0.22, this.out, 0.8, false);
      this.voice(hz(midi('G5')), now + 0.26, 0.42, this.out, 0.8, true);
      return;
    }
    const spec = SFX_TONES[name];
    const gain = spec.gain ?? (spec.freqs ? 0.18 : 0.2);

    if (spec.freqs) {
      spec.freqs.forEach((f, i) => {
        this.playTone(f, spec.duration * 0.9, spec.type, gain, now + i * spec.duration);
      });
    } else if (!spec.noiseOnly) {
      this.playTone(spec.freq, spec.duration, spec.type, gain, now, spec.slideTo);
    }
    if (spec.noise) {
      const noiseGain = spec.noiseOnly ? gain : 0.25;
      this.noise(now, spec.noise, noiseGain, this.out, spec.noiseHz ?? 1800);
    }
  }

  toggleMute(): void {
    this.setMuted(!this.muted);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMusicLevel();
    this.applySfxLevel();
  }

  /** 0..1, multiplies the music gain. */
  setMasterVolume(scale: number): void {
    this.masterScale = Math.max(0, Math.min(1, scale));
    this.applyMusicLevel();
  }

  /** 0..1, the sound effects' own volume. */
  setSfxVolume(scale: number): void {
    this.sfxScale = Math.max(0, Math.min(1, scale));
    this.applySfxLevel();
  }

  private applySfxLevel(): void {
    if (this.sfxOut) this.sfxOut.gain.value = this.muted ? 0 : this.sfxScale;
  }

  /** Where sound effects go: their own bus (falls back to the speakers). */
  private get out(): AudioNode {
    return this.sfxOut ?? this.ac!.destination;
  }

  /** The floor's song ('vents' in the vents, 'main' elsewhere). */
  setBaseSong(id: SongId): void {
    this.baseSong = id;
    this.setSong(this.boss ? 'boss' : id);
  }

  /** How the floor plays it (by décor id; unknown ids get the default). */
  setArrangement(decor: string | undefined): void {
    this.arr = (decor && ARRANGEMENTS[decor]) || DEFAULT_ARRANGEMENT;
  }

  private setSong(id: SongId): void {
    if (this.song === id) return;
    this.song = id;
    if (this.musicGain) this.startMusic();   // switch right away
  }

  /** Fetches and decodes the recordings listed in customSounds.ts. */
  private loadCustomSounds(): void {
    const ac = this.ac;
    if (!ac || typeof fetch === 'undefined') return;
    const get = (file: string) => fetch(`/audio/${file}`)
      .then((r) => { if (!r.ok) throw new Error(`[Tero] sound not found: /audio/${file}`); return r.arrayBuffer(); })
      .then((b) => ac.decodeAudioData(b));
    for (const [id, file] of Object.entries(CUSTOM_SOUNDS.music) as [SongId, string][]) {
      get(file).then((buf) => {
        this.customMusic.set(id, buf);
        if (id === this.song && this.musicGain) this.startMusic();
      }, (e) => console.warn((e as Error).message));
    }
    for (const [name, file] of Object.entries(CUSTOM_SOUNDS.sfx)) {
      get(file).then((buf) => { this.customSfx.set(name, buf); }, (e) => console.warn((e as Error).message));
    }
  }

  get isMuted(): boolean { return this.muted; }

  setCasual(on: boolean): void { this.casual = on; }

  /** Boss fight: the boss song takes over (and the snare doubles). */
  setBoss(on: boolean): void {
    this.boss = on;
    this.setSong(on ? 'boss' : this.baseSong);
  }

  /** Metal mode on/off — applies from the next eighth note. */
  setTantrum(on: boolean): void {
    this.tantrum = on;
  }

  /** 0 = ground floor muzak, 1 = the penthouse, where the tape is melting.
   *  Takes effect on the next `startMusic()`. */
  setFloorMood(mood: number): void {
    this.mood = Math.max(0, Math.min(1, mood));
  }

  stopMusic(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    for (const n of this.musicNodes) {
      try { n.stop(); n.disconnect(); } catch { /* ignore */ }
    }
    this.musicNodes.clear();
    try { this.musicGain?.disconnect(); } catch { /* ignore */ }
    this.musicGain = null;
    this.bus = null;
    this.metal = null;
    this.lfoDepth = null;
  }

  /** Start (or restart) the theme from bar 1. */
  startMusic(): void {
    if (!this.ac) return;
    this.stopMusic();
    const ac = this.ac;
    const m = this.mood;

    const out = ac.createGain();
    out.connect(ac.destination);
    this.musicGain = out;
    this.applyMusicLevel();

    // Higher floors: the speaker in the ceiling tile is dying.
    const muffle = ac.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 14000 - m * 11000;
    muffle.Q.value = 0.7 + m * 3;
    muffle.connect(out);

    const drive = ac.createWaveShaper();
    drive.curve = driveCurve(m * 30);
    drive.connect(muffle);

    const bus = ac.createGain();
    bus.gain.value = 1 - m * 0.35;   // drive adds loudness back
    bus.connect(drive);
    this.bus = bus;

    // The tantrum guitar: its own heavy fuzz, straight to the output.
    const metal = ac.createWaveShaper();
    metal.curve = driveCurve(70);
    const metalLevel = ac.createGain();
    metalLevel.gain.value = 0.55;
    metal.connect(metalLevel);
    metalLevel.connect(out);
    this.metal = metal;

    // Tape warble: one slow LFO bends every pitched voice.
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.6 + m * 3.4;
    const depth = ac.createGain();
    depth.gain.value = m * 38;      // cents
    lfo.connect(depth);
    lfo.start();
    this.lfoDepth = depth;
    this.musicNodes.add(lfo);

    // A recording for this song? Loop it through the same bus (so floors
    // still muffle it) instead of running the sequencer.
    const rec = this.customMusic.get(this.song);
    if (rec) {
      const src = ac.createBufferSource();
      src.buffer = rec;
      src.loop = true;
      src.connect(bus);
      src.start(ac.currentTime + 0.05);
      this.musicNodes.add(src);
      return;
    }

    this.step = 0;
    this.nextStepAt = ac.currentTime + 0.1;
    this.timerId = setInterval(() => this.scheduleAhead(), TICK_MS);
    this.scheduleAhead();
  }

  private applyMusicLevel(): void {
    if (this.musicGain) {
      // Overdrive on high floors is louder; pull it back so every floor sits level.
      const makeup = 1 - 0.35 * this.mood;
      this.musicGain.gain.value = this.muted ? 0 : MUSIC_LEVEL * this.masterScale * makeup;
    }
  }

  // ─── Sequencer ─────────────────────────────────────────────────────────────

  private scheduleAhead(): void {
    if (!this.ac || !this.bus) return;
    while (this.nextStepAt < this.ac.currentTime + LOOKAHEAD_S) {
      this.playStep(this.step, this.nextStepAt);
      this.nextStepAt += this.stepDur;
      this.step = (this.step + 1) % (SONGS[this.song].melody.length * 8);
    }
  }

  /** One eighth note. Slower on higher floors — everyone's exhausted. */
  private get stepDur(): number {
    const bpm = SONGS[this.song].bpm + (this.song === 'boss' ? 0 : this.arr.bpm);
    return 60 / (bpm - this.mood * 18 + (this.casual ? 10 : 0)) / 2;
  }

  /** The penthouse is a semitone flat. Nobody has noticed. */
  private get transpose(): number {
    return this.arr.transpose + (this.mood >= 0.95 ? -1 : 0);
  }

  private playStep(step: number, t: number): void {
    const bus = this.bus!;
    const song = SONGS[this.song];
    const MELODY = song.melody, CHORDS = song.chords;
    const DRUMS = this.song === 'boss' ? song.drums : (this.arr.drums ?? song.drums);
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const sd = this.stepDur;

    // Lead: count how many '-' follow to get the note length.
    const tok = MELODY[bar][beat];
    if (tok !== '-' && tok !== '.') {
      let len = 1;
      while (beat + len < 8 && MELODY[bar][beat + len] === '-') len++;
      const sung = tok.startsWith('da:');
      const f = hz(midi(sung ? tok.slice(3) : tok) + this.transpose);
      if (sung) {
        this.voice(f, t, len * sd * 0.92, bus, 1.3, beat + len >= 8);
      } else {
        if (this.casual) {
          // ukulele: a quick triangle pluck an octave up, plus a strum
          this.pitched(f * 2, t, Math.min(len * sd, 0.22), 'triangle', 0.42, bus, 0.002);
          this.pitched(f * 1.5, t + 0.012, Math.min(len * sd, 0.18), 'triangle', 0.18, bus, 0.002);
        } else {
          this.pitched(f, t, len * sd * 0.9, this.song === 'boss' ? 'square' : this.arr.lead, this.arr.leadGain ?? 0.32, bus, 0.01);
        }
        // Upper floors: a second, slightly sour copy of the lead.
        if (this.mood > 0.4) {
          this.pitched(f, t, len * sd * 0.9, 'square', 0.12 * this.mood, bus, 0.01, this.mood * 28);
        }
      }
    }

    // Chords: two per bar means the second takes over at beat 4.
    const chords = CHORDS[bar];
    const chord = chordTones(chords.length > 1 && beat >= 4 ? chords[1] : chords[0])
      .map((n) => n + this.transpose);

    // Bass: root, octave, root, octave…
    const bassNote = chord[0] + (beat % 2 === 1 ? 12 : 0);
    this.pitched(hz(bassNote), t, sd * 0.8, 'triangle', 0.55, bus, 0.005);

    // Arpeggio two octaves up, quiet: 1-3-5-3 … ('fast' doubles it, 'off' skips it)
    const arpMode = this.song === 'boss' ? 'fast' : this.arr.arp;
    if (arpMode !== 'off') {
      const arp = [0, 1, 2, 1][beat % 4];
      this.pitched(hz(chord[arp] + 24), t, sd * 0.5, 'square', 0.07, bus, 0.003);
      if (arpMode === 'fast') this.pitched(hz(chord[(arp + 1) % 3] + 24), t + sd / 2, sd * 0.45, 'square', 0.06, bus, 0.003);
    }

    // Tantrum: fuzz power chords on every eighth and a double kick.
    if (this.tantrum && this.metal) {
      const root = chord[0];   // same register as the bass
      this.pitched(hz(root), t, sd * 0.85, 'sawtooth', 0.35, this.metal, 0.003);
      this.pitched(hz(root + 7), t, sd * 0.85, 'sawtooth', 0.3, this.metal, 0.003);
      if (DRUMS[beat] !== 'k') this.kick(t, bus);
    }

    // Boss: an extra snare on the last eighth of every bar.
    if (this.boss && beat === 7) this.noise(t, 0.08, 0.22, bus, 1500);

    // Drums
    switch (DRUMS[beat]) {
      case 'k': this.kick(t, bus); break;
      case 's': this.noise(t, 0.12, 0.3, bus, 1500); break;
      case 'h': this.noise(t, 0.03, 0.08, bus, 7000); break;
    }
  }

  // ─── Instruments ───────────────────────────────────────────────────────────

  private pitched(
    freq: number, t: number, dur: number, type: OscillatorType,
    gain: number, dest: AudioNode, attack: number, detune = 0,
  ): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const lfo = this.lfoDepth;
    lfo?.connect(o.detune);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest);
    this.track(o, g, t, dur, () => lfo?.disconnect(o.detune));
  }

  private kick(t: number, dest: AudioNode): void {
    const ac = this.ac!;
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g);
    g.connect(dest);
    this.track(o, g, t, 0.16);
  }

  private noise(t: number, dur: number, gain: number, dest: AudioNode, highpass: number): void {
    const ac = this.ac!;
    const src = ac.createBufferSource();
    src.buffer = this.noiseBuffer();
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = highpass;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp);
    hp.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.01);
    if (dest !== ac.destination && dest !== this.sfxOut) this.musicNodes.add(src);
    src.onended = () => {
      this.musicNodes.delete(src);
      try { src.disconnect(); hp.disconnect(); g.disconnect(); } catch { /* ignore */ }
    };
  }

  /** Tero sings "da": a buzzy source through three formant filters for an
   *  "ah" vowel, with the formants sliding in from a "d" at the start.
   *  `wobble` adds the little vibrato a toddler holds the last note with. */
  private voice(
    freq: number, t: number, dur: number, dest: AudioNode, gain: number, wobble: boolean, glideTo?: number,
  ): void {
    const ac = this.ac!;
    const src = ac.createOscillator();
    src.type = 'sawtooth';
    src.frequency.setValueAtTime(freq * 1.04, t);
    src.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
    if (glideTo) src.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    const lfo = dest === this.bus ? this.lfoDepth : null;
    lfo?.connect(src.detune);

    let vib: OscillatorNode | null = null;
    if (wobble) {
      vib = ac.createOscillator();
      vib.frequency.value = 6;
      const vibDepth = ac.createGain();
      vibDepth.gain.setValueAtTime(0, t);
      vibDepth.gain.linearRampToValueAtTime(30, t + dur);
      vib.connect(vibDepth);
      vibDepth.connect(src.detune);
      vib.start(t);
      vib.stop(t + dur + 0.05);
    }

    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.025);
    env.gain.setValueAtTime(gain, t + dur * 0.75);
    env.gain.linearRampToValueAtTime(0.0001, t + dur);
    env.connect(dest);

    // [start Hz (the "d"), vowel Hz, Q, level] — child-sized "ah"
    const formants: [number, number, number, number][] = [
      [450, 1150, 7, 1.0],
      [1900, 1650, 9, 0.7],
      [3400, 3300, 12, 0.3],
    ];
    const nodes: AudioNode[] = [env];
    for (const [from, to, q, level] of formants) {
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = q;
      bp.frequency.setValueAtTime(from, t);
      bp.frequency.exponentialRampToValueAtTime(to, t + 0.045);
      const lv = ac.createGain();
      lv.gain.value = level;
      src.connect(bp);
      bp.connect(lv);
      lv.connect(env);
      nodes.push(bp, lv);
    }
    src.start(t);
    src.stop(t + dur + 0.02);
    if (dest === this.bus) this.musicNodes.add(src);
    if (vib && dest === this.bus) this.musicNodes.add(vib);
    src.onended = () => {
      this.musicNodes.delete(src);
      if (vib) this.musicNodes.delete(vib);
      try { src.disconnect(); for (const n of nodes) n.disconnect(); lfo?.disconnect(src.detune); } catch { /* ignore */ }
    };

    // The "d" itself: a tiny click of breath
    this.noise(t, 0.012, gain * 0.25, dest, 3000);
  }

  private track(o: OscillatorNode, g: GainNode, t: number, dur: number, cleanup?: () => void): void {
    o.start(t);
    o.stop(t + dur + 0.02);
    this.musicNodes.add(o);
    o.onended = () => {
      this.musicNodes.delete(o);
      try { o.disconnect(); g.disconnect(); cleanup?.(); } catch { /* ignore */ }
    };
  }

  private noiseBuffer(): AudioBuffer {
    if (!this.noiseBuf) {
      const ac = this.ac!;
      const buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    return this.noiseBuf;
  }

  private playTone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain = 0.2,
    startAt?: number,
    slideTo?: number,
  ): void {
    if (!this.ac) return;
    const g = this.ac.createGain();
    const t0 = startAt ?? this.ac.currentTime;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    g.connect(this.out);

    const o = this.ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    o.connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.01);
    // Tidy up after the tone ends.
    o.onended = () => { try { g.disconnect(); } catch { /* ignore */ } };
  }
}

/** Soft-clip curve; amount 0 = clean. */
function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(n);
  const k = Math.max(0.001, amount);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}
