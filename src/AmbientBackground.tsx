import { useEffect, useRef } from "react";

const NOTEBOOK_EXPRESSIONS = [
  "f(x) = x² + 3x + 2",
  "P(A|B) = P(B|A)P(A) / P(B)",
  "ŷ = Wx + b",
  "w ← w − η∇J(w)",
  "L = Σ(y − ŷ)²",
  "softmax(x)ᵢ = eˣⁱ / Σⱼeˣʲ",
  "AᵀA x = Aᵀb",
  "O(n log n)",
  "∀x ∈ X,  ∃ y ∈ Y",
  "limₓ→∞ (1 + 1/x)ˣ = e",
  "∫₀¹ x² dx = 1/3",
  "h⁽ˡ⁺¹⁾ = σ(W⁽ˡ⁾h⁽ˡ⁾ + b⁽ˡ⁾)",
  "argmaxₖ P(y = k | x)",
  "if dist[u] + w < dist[v]",
  "Ax = b,  x ∈ ℝⁿ",
];

type Dot = {
  x: number; y: number; vx: number; vy: number;
  r: number; alpha: number; alphaDir: number;
};

type FloatExpression = {
  x: number; y: number;
  vx: number; vy: number;
  text: string; size: number; alpha: number; alphaDir: number;
  rotation: number; rotationSpeed: number;
  phase: number; freq: number; amp: number;
};

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    const drawingContext = canvasElement?.getContext("2d");
    if (!canvasElement || !drawingContext) return;
    // Keep stable, non-null references inside the animation callbacks.
    const canvas: HTMLCanvasElement = canvasElement;
    const ctx: CanvasRenderingContext2D = drawingContext;

    let animId: number | undefined;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots: Dot[] = [];
    let floatExpressions: FloatExpression[] = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initDots() {
      const count = Math.min(50, Math.floor((window.innerWidth * window.innerHeight) / 20000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08 - 0.03,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.025 + 0.02,
        alphaDir: Math.random() > 0.5 ? 0.0003 : -0.0003,
      }));
    }

    function initFloatExpressions() {
      const count = Math.min(14, Math.floor((window.innerWidth * window.innerHeight) / 65000));
      floatExpressions = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.05,
        text: NOTEBOOK_EXPRESSIONS[Math.floor(Math.random() * NOTEBOOK_EXPRESSIONS.length)],
        size: Math.random() * 13 + 16,
        alpha: Math.random() * 0.035 + 0.035,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * (0.0002 + Math.random() * 0.0003),
        rotation: (Math.random() - 0.5) * 0.08,
        rotationSpeed: (Math.random() - 0.5) * 0.001,
        phase: Math.random() * Math.PI * 2,
        freq: 0.002 + Math.random() * 0.003,
        amp: 3 + Math.random() * 6,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Dots ──
      for (const p of dots) {
        p.vx *= 0.999;
        p.vy *= 0.999;
        p.x += p.vx;
        p.y += p.vy;

        p.alpha += p.alphaDir;
        if (p.alpha > 0.055 || p.alpha < 0.015) p.alphaDir *= -1;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(67, 97, 238, ${p.alpha})`;
        ctx.fill();
      }

      // ── Drifting research-notebook expressions ──
      for (const s of floatExpressions) {
        s.vx *= 0.998;
        s.vy *= 0.998;
        s.x += s.vx;
        s.y += s.vy + Math.sin(Date.now() * s.freq + s.phase) * 0.15;
        s.rotation += s.rotationSpeed;

        s.alpha += s.alphaDir;
        if (s.alpha > 0.08 || s.alpha < 0.03) s.alphaDir *= -1;

        if (s.x < -30) s.x = canvas.width + 30;
        if (s.x > canvas.width + 30) s.x = -30;
        if (s.y < -30) s.y = canvas.height + 30;
        if (s.y > canvas.height + 30) s.y = -30;

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.font = `500 ${s.size}px "SFMono-Regular", Consolas, "Liberation Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#4361ee";
        ctx.fillText(s.text, 0, 0);
        ctx.restore();
      }

      if (!prefersReducedMotion) animId = requestAnimationFrame(draw);
    }

    resize();
    initDots();
    initFloatExpressions();
    draw();

    const onResize = () => {
      resize();
      initDots();
      initFloatExpressions();
      if (prefersReducedMotion) draw();
    };

    window.addEventListener("resize", onResize);

    return () => {
      if (animId !== undefined) cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
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
