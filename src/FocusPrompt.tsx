import { useEffect, useState } from "react";
import type { StudentItem } from "./data";

type Props = { item: StudentItem | null };

export default function FocusPrompt({ item }: Props) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { setRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const reset = () => { setRunning(false); setSeconds(25 * 60); };

  return (
    <section className="focus-panel" aria-labelledby="focus-title">
      <div><span className="focus-eyebrow">Focus mode</span><h2 id="focus-title">One clean block.</h2></div>
      <div className="focus-clock" aria-live="polite">{minutes}:{secs}</div>
      <p>{seconds === 0 ? "Session complete. Take a breath." : item ? `Start with ${item.title}.` : "Add an item to create your next study block."}</p>
      <div className="focus-actions">
        <button className="focus-start" onClick={() => setRunning((value) => !value)} disabled={!item || seconds === 0}>{running ? "Pause" : "Start 25 min"}</button>
        {seconds !== 25 * 60 && <button className="focus-reset" onClick={reset}>Reset</button>}
      </div>
    </section>
  );
}
