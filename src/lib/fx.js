/**
 * fx — tiny synth blips + haptics for the closure ritual.
 * No assets, no dependencies, no network. All failures are swallowed.
 */

let ctx = null;

/** Short UI tick. Safe to call anywhere. */
export function tick(freq = 660, dur = 0.045, gain = 0.045) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {
    /* audio unavailable — silent */
  }
}

/** A two-note "shelved" chime for the moment of closure. */
export function shelvedChime() {
  tick(523, 0.09, 0.05);
  setTimeout(() => tick(784, 0.12, 0.05), 110);
}

/** Mobile haptic. No-op where unsupported. */
export function haptic(ms = 10) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* silent */
  }
}
