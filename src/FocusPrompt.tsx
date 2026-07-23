import { useState, useEffect, useRef } from "react";

const CYCLE_MS = 240_000;
const BREATHE_MS = 2000;

export default function FocusPrompt() {
  const [cycle, setCycle] = useState(0);
  const [breathe, setBreathe] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const c = Math.min(elapsed / CYCLE_MS, 1);
      setCycle(c);

      if (c >= 1) {
        startRef.current = Date.now();
        setCycle(0);
      }
    }, 100);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setBreathe((Math.sin(Date.now() / BREATHE_MS) + 1) / 2);
    }, 50);

    return () => clearInterval(id);
  }, []);

  const intensity = cycle;
  const opacity = 0.2 + intensity * 0.8;
  const glow = intensity * 24;
  const scale = 1 + intensity * 0.04 + breathe * 0.02;

  return (
    <div
      className={`focus-prompt ${intensity >= 1 ? "flash" : ""}`}
      style={{
        opacity,
        transform: `scale(${scale})`,
        "--glow": `${glow}px`,
      } as React.CSSProperties}
    >
      <span className="focus-prompt-text">FOCUS I'M ON IT</span>
    </div>
  );
}
