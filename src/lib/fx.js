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

/** A low shelf impact — the book lands. */
export function thud() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(96, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(52, ctx.currentTime + 0.16);
    g.gain.setValueAtTime(0.11, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.24);
  } catch {
    /* silent */
  }
}

/** Small celebratory dot-burst at an element (or screen centre if omitted). */
export function burst(el) {
  try {
    haptic(12);
    const host = el || document.body;
    const rect = host.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#E3EF4F', '#F4ACB7', '#FFE5D9', '#D8E2DC', '#EEE3B0', '#5882E8'];
    const layer = document.createElement('div');
    layer.style.cssText = `position:fixed;left:0;top:0;z-index:999;pointer-events:none;`;
    document.body.appendChild(layer);
    for (let i = 0; i < 18; i++) {
      const dot = document.createElement('span');
      const size = 5 + Math.random() * 7;
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.5;
      const dist = 60 + Math.random() * 90;
      dot.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:50%;background:${colors[i % colors.length]};`;
      layer.appendChild(dot);
      dot.animate(
        [
          { transform: 'translate(-50%,-50%)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist + 40}px))`, opacity: 0 }
        ],
        { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.15,.6,.4,1)', fill: 'forwards' }
      );
    }
    setTimeout(() => layer.remove(), 1200);
  } catch {
    /* silent */
  }
}
