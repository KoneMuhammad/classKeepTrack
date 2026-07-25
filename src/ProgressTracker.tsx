import { useEffect, useMemo, useState } from "react";
import type { StudentItem } from "./data";

const STORAGE_KEY = "mathkeeptrack-progress-v2";

const STEPS = [
  { id: "plan", label: "Plan", note: "Break down the work", minutes: 5 },
  { id: "review", label: "Review", note: "Read notes and examples", minutes: 15 },
  { id: "practice", label: "Practice", note: "Work independently", minutes: 25 },
  { id: "submit", label: "Submit", note: "Check and turn it in", minutes: 5 },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type ProgressState = Record<string, StepId[]>;

function loadProgress(): ProgressState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function dueLabel(item: StudentItem) {
  const days = Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

type Props = { items: StudentItem[] };

export default function ProgressTracker({ items }: Props) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)), [progress]);

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [items]
  );
  const active = orderedItems.find((item) => item.id === activeId) ?? orderedItems[0];
  const completedSteps = items.reduce((sum, item) => sum + (progress[item.id]?.length ?? 0), 0);
  const totalSteps = items.length * STEPS.length;
  const completion = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  function toggleStep(itemId: string, step: StepId) {
    setProgress((current) => {
      const completed = current[itemId] ?? [];
      const isComplete = completed.includes(step);
      return {
        ...current,
        [itemId]: isComplete ? completed.filter((id) => id !== step) : [...completed, step],
      };
    });
  }

  if (!items.length) {
    return (
      <section className="tracker tracker-empty" aria-labelledby="tracker-title">
        <div className="tracker-kicker">Study system</div>
        <h2 id="tracker-title">Your progress, mapped.</h2>
        <p>Once you add coursework, its plan → review → practice → submit path will appear here.</p>
        <div className="tracker-empty-orbit" aria-hidden="true"><span>L = Σ(y − ŷ)²</span><i /><b>w ← w − η∇J(w)</b></div>
      </section>
    );
  }

  const done = progress[active.id] ?? [];
  const currentStep = STEPS.find((step) => !done.includes(step.id));
  const remaining = STEPS.filter((step) => !done.includes(step.id)).reduce((sum, step) => sum + step.minutes, 0);
  const isComplete = done.length === STEPS.length;
  const overdue = new Date(active.dueDate).getTime() < Date.now() && !isComplete;

  return (
    <section className="tracker" aria-labelledby="tracker-title">
      <div className="tracker-topline">
        <div>
          <div className="tracker-kicker">Study system</div>
          <h2 id="tracker-title">Progress map</h2>
        </div>
        <span className={`status-chip ${completion === 100 ? "success" : ""}`}>{completion}% complete</span>
      </div>

      <div className="progress-meter" aria-label={`${completion}% course progress`}>
        <span style={{ width: `${completion}%` }} />
      </div>
      <div className="tracker-summary">
        <span>{completedSteps} of {totalSteps} milestones</span>
        <span>{items.length} active {items.length === 1 ? "item" : "items"}</span>
      </div>

      <div className="task-tabs" aria-label="Select coursework to track">
        {orderedItems.map((item) => {
          const itemProgress = progress[item.id]?.length ?? 0;
          return (
            <button key={item.id} onClick={() => setActiveId(item.id)} className={item.id === active.id ? "active" : ""}>
              <span>{item.title}</span><i>{itemProgress}/{STEPS.length}</i>
            </button>
          );
        })}
      </div>

      <div className={`active-task ${isComplete ? "is-success" : overdue ? "is-error" : ""}`}>
        <div className="active-task-heading">
          <div>
            <span className="task-type">{active.type}{active.className ? ` · ${active.className}` : ""}</span>
            <h3>{active.title}</h3>
          </div>
          <span className="due-status">{isComplete ? "Complete" : dueLabel(active)}</span>
        </div>

        <div className="timeline" role="list">
          {STEPS.map((step, index) => {
            const checked = done.includes(step.id);
            const isCurrent = !checked && currentStep?.id === step.id;
            return (
              <button key={step.id} role="listitem" className={`timeline-step ${checked ? "complete" : ""} ${isCurrent ? "current" : ""}`} onClick={() => toggleStep(active.id, step.id)} aria-pressed={checked}>
                <span className="timeline-dot">{checked ? "✓" : index + 1}</span>
                <span className="timeline-copy"><b>{step.label}</b><small>{checked ? "Completed" : isCurrent ? `Now · ${step.note}` : step.note}</small></span>
                <span className="step-time">{checked ? "Done" : `${step.minutes}m`}</span>
              </button>
            );
          })}
        </div>

        <div className="tracker-feedback" aria-live="polite">
          {isComplete ? <><strong>Nice work — this item is ready.</strong><span>All four milestones are complete.</span></> : overdue ? <><strong>This item needs attention.</strong><span>It is overdue; pick up with {currentStep?.label.toLowerCase()}.</span></> : <><strong>Current stage: {currentStep?.label}</strong><span>About {remaining} minutes remain in this study path.</span></>}
        </div>
      </div>
    </section>
  );
}
