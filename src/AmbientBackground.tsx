import { useEffect, useRef } from "react";

const MATH_GLYPHS = [
  "f(x)", "π", "∫", "dy/dx", "∂/∂x", "∇f", "√x", "∞",
  "∑", "Δ", "θ", "λ", "φ", "α", "β", "x²", "e^{iπ}",
  "∫ₐᵇ", "x/y", "lim", "mx + b", "xⁿ", "1/x", "|x|",
  "sin θ", "cos θ", "log x", "eˣ",
];

type Dot = {
  x: number; y: number; vx: number; vy: number;
  r: number; alpha: number; alphaDir: number;
};

type FloatSymbol = {
  x: number; y: number; baseY: number;
  vx: number; vy: number;
  text: string; size: number; alpha: number; alphaDir: number;
  rotation: number; rotationSpeed: number;
  phase: number; freq: number; amp: number;
};

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let dots: Dot[] = [];
    let floatSymbols: FloatSymbol[] = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initDots() {
      const count = Math.min(50, Math.floor((window.innerWidth * window.innerHeight) / 20000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25 - 0.1,
        r: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.35 + 0.08,
        alphaDir: Math.random() > 0.5 ? 0.002 : -0.002,
      }));
    }

    function initFloatSymbols() {
      const count = Math.min(20, Math.floor((window.innerWidth * window.innerHeight) / 50000));
      floatSymbols = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseY: 0,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        text: MATH_GLYPHS[Math.floor(Math.random() * MATH_GLYPHS.length)],
        size: Math.random() * 10 + 11,
        alpha: Math.random() * 0.10 + 0.04,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * (0.001 + Math.random() * 0.002),
        rotation: (Math.random() - 0.5) * 0.3,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        phase: Math.random() * Math.PI * 2,
        freq: 0.002 + Math.random() * 0.003,
        amp: 4 + Math.random() * 8,
      }));
    }

    function handleMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = mouseRef.current.x;
      const cy = mouseRef.current.y;

      // ── Dots ──
      for (const p of dots) {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = ((200 - dist) / 200) * 0.02;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }

        p.vx *= 0.999;
        p.vy *= 0.999;
        p.x += p.vx;
        p.y += p.vy;

        p.alpha += p.alphaDir;
        if (p.alpha > 0.4 || p.alpha < 0.05) p.alphaDir *= -1;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(67, 97, 238, ${p.alpha})`;
        ctx.fill();
      }

      // ── Floating math symbols ──
      for (const s of floatSymbols) {
        const dx = cx - s.x;
        const dy = cy - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = ((180 - dist) / 180) * 0.01;
          s.vx -= (dx / dist) * force;
          s.vy -= (dy / dist) * force;
        }

        s.vx *= 0.998;
        s.vy *= 0.998;
        s.x += s.vx;
        s.y += s.vy + Math.sin(Date.now() * s.freq + s.phase) * 0.15;
        s.rotation += s.rotationSpeed;

        s.alpha += s.alphaDir;
        if (s.alpha > 0.15 || s.alpha < 0.03) s.alphaDir *= -1;

        if (s.x < -30) s.x = canvas.width + 30;
        if (s.x > canvas.width + 30) s.x = -30;
        if (s.y < -30) s.y = canvas.height + 30;
        if (s.y > canvas.height + 30) s.y = -30;

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.font = `500 ${s.size}px "Times New Roman", "Georgia", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#4361ee";
        ctx.fillText(s.text, 0, 0);
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    initDots();
    initFloatSymbols();
    draw();

    const onResize = () => {
      resize();
      initDots();
      initFloatSymbols();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", handleMouse);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="ambient-bg"
      aria-hidden="true"
    />
  );
}
