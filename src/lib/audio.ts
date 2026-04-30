/**
 * Tiny WebAudio engine for the four game SFX. No external assets — every
 * sound is synthesised on demand so the APK ships lean.
 *
 *   engine(charge):  rumble that scales with charge 0..1  (idle <-> hot)
 *   whoosh():        release thwack
 *   thud():          tower impact
 *   pop():           confetti pop
 */

type EngineHandle = {
  setCharge: (charge: number) => void;
  stop: () => void;
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private noiseBuffer: AudioBuffer | null = null;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.7;
  }

  /** Resume the AudioContext after a user gesture (mobile autoplay policy). */
  async unlock(): Promise<void> {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        /* ignored */
      }
    }
  }

  private init(): void {
    if (this.ctx) return;
    const Ctor =
      typeof AudioContext !== "undefined"
        ? AudioContext
        : (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(this.ctx.destination);

    const length = this.ctx.sampleRate * 1.0;
    this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  startEngine(): EngineHandle {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.master) return { setCharge: () => {}, stop: () => {} };

    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.0;
    out.connect(this.master);

    // Low-frequency rumble: square + sine
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = 60;
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.value = 0.4;
    osc1.connect(osc1Gain).connect(out);

    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.value = 120;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.18;
    osc2.connect(osc2Gain).connect(out);

    // Filtered noise for grit
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 280;
    noiseFilter.Q.value = 1.4;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.18;
    noise.connect(noiseFilter).connect(noiseGain).connect(out);

    osc1.start();
    osc2.start();
    noise.start();

    return {
      setCharge: (charge: number) => {
        const c = Math.max(0, Math.min(1, charge));
        const target = 0.05 + c * 0.45;
        out.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
        osc1.frequency.setTargetAtTime(50 + c * 90, ctx.currentTime, 0.08);
        osc2.frequency.setTargetAtTime(110 + c * 220, ctx.currentTime, 0.08);
        noiseFilter.frequency.setTargetAtTime(220 + c * 800, ctx.currentTime, 0.08);
      },
      stop: () => {
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(out.gain.value, t);
        out.gain.linearRampToValueAtTime(0, t + 0.18);
        osc1.stop(t + 0.22);
        osc2.stop(t + 0.22);
        noise.stop(t + 0.22);
      },
    };
  }

  whoosh(): void {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.master || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.42);
    filter.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.55, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    noise.connect(filter).connect(g).connect(this.master);
    noise.start(t);
    noise.stop(t + 0.45);
  }

  thud(): void {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.32);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.7, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.45);

    if (this.noiseBuffer) {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
      const nf = ctx.createBiquadFilter();
      nf.type = "lowpass";
      nf.frequency.value = 600;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.4, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      n.connect(nf).connect(ng).connect(this.master);
      n.start(t);
      n.stop(t + 0.2);
    }
  }

  pop(): void {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  click(): void {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.07);
  }
}

export const audio = new AudioEngine();
