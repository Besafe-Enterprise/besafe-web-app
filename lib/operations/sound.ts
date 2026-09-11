"use client";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Two-tone notification "dong" (E5 → C5), synthesized — no audio file needed. */
export function playDong(volume = 0.25) {
  try {
    const ac = getContext();
    if (!ac) return;
    const now = ac.currentTime;
    const notes: Array<[number, number]> = [
      [659.25, 0], // E5
      [523.25, 0.22], // C5
    ];
    for (const [freq, offset] of notes) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(volume, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.5);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.55);
    }
  } catch {
    // Audio is best-effort; never break the UI.
  }
}
