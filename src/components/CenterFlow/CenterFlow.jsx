import { useEffect, useRef } from 'react';

/**
 * CenterFlow — a hub with pulses flowing out to connected nodes.
 * Ported from the provided canvas source; adapted so that:
 *  - the canvas is transparent (page owns the background — theme aware)
 *  - colors arrive as props and update live with the active theme
 *  - it sizes itself to its parent container (ResizeObserver + DPR)
 *  - prefers-reduced-motion renders a static frame
 */
const CONFIG = {
  nodeCount: 8,
  hubRadius: 34,
  nodeRadius: 14,
  orbitRadiusRatio: 0.35,
  pulseSpawnRate: 0.06,
  pulseSpeed: 0.012
};

function rgba(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function quadraticPoint(t, p0, p1, p2) {
  const invT = 1 - t;
  return {
    x: invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x,
    y: invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y
  };
}

export default function CenterFlow({
  primary = '#e3ef4f',
  secondary = '#5882e8',
  nodeFill = '#350051',
  nodeStroke = null,
  height = 420,
  className = '',
  style = {}
}) {
  const canvasRef = useRef(null);
  const colorsRef = useRef({ primary, secondary, nodeFill, nodeStroke });
  colorsRef.current = { primary, secondary, nodeFill, nodeStroke };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let alive = true;
    let width = 0;
    let heightPx = 0;
    let cx = 0;
    let cy = 0;
    const nodes = [];
    const pulses = [];

    const initNodes = () => {
      nodes.length = 0;
      const radius = Math.min(width, heightPx) * CONFIG.orbitRadiusRatio;
      for (let i = 0; i < CONFIG.nodeCount; i += 1) {
        const angle = (i / CONFIG.nodeCount) * Math.PI * 2;
        const midAngle = angle + 0.25;
        nodes.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          cpX: cx + Math.cos(midAngle) * (radius * 0.55),
          cpY: cy + Math.sin(midAngle) * (radius * 0.55),
          pulseScale: 0
        });
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      heightPx = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(heightPx * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${heightPx}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      cy = heightPx / 2;
      initNodes();
      if (reduceMotion) draw(false);
    };

    const spawnPulse = () => {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      pulses.push({ target, progress: 0, speed: CONFIG.pulseSpeed + Math.random() * 0.005 });
    };

    const draw = (advance) => {
      const { primary: p1, secondary: p2, nodeFill: nf, nodeStroke: ns } = colorsRef.current;
      ctx.clearRect(0, 0, width, heightPx);

      // 1. connection lines
      ctx.beginPath();
      nodes.forEach((node) => {
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(node.cpX, node.cpY, node.x, node.y);
      });
      ctx.strokeStyle = rgba(p1, 0.22);
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. pulses hub -> node
      if (advance && Math.random() < CONFIG.pulseSpawnRate) spawnPulse();
      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pl = pulses[i];
        if (advance) pl.progress += pl.speed;
        if (pl.progress >= 1) {
          pl.target.pulseScale = 1;
          pulses.splice(i, 1);
          continue;
        }
        const pos = quadraticPoint(pl.progress, { x: cx, y: cy }, { x: pl.target.cpX, y: pl.target.cpY }, pl.target);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p1;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p1;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. outer nodes + arrival ripples
      nodes.forEach((node) => {
        if (node.pulseScale > 0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, CONFIG.nodeRadius + (1 - node.pulseScale) * 18, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(p1, node.pulseScale * 0.6);
          ctx.lineWidth = 2;
          ctx.stroke();
          if (advance) node.pulseScale -= 0.03;
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, CONFIG.nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = nf;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = ns || p1;
        ctx.stroke();
      });

      // 4. central hub with breathing glow
      const time = Date.now() * 0.003;
      const hubGlow = advance ? Math.sin(time) * 5 + 20 : 20;
      ctx.beginPath();
      ctx.arc(cx, cy, CONFIG.hubRadius, 0, Math.PI * 2);
      ctx.fillStyle = p2;
      ctx.shadowBlur = hubGlow;
      ctx.shadowColor = p2;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(cx, cy, CONFIG.hubRadius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    };

    const animate = () => {
      if (!alive) return;
      draw(true);
      raf = requestAnimationFrame(animate);
    };

    const ro = new ResizeObserver(() => resize());
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    if (reduceMotion) {
      draw(false);
    } else {
      raf = requestAnimationFrame(animate);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: `${height}px`, ...style }}
    />
  );
}
