import { useEffect, useRef, useState } from "react";
import { type StudentItem } from "./data";
import ProgressTracker from "./ProgressTracker";
import AmbientBackground from "./AmbientBackground";
import FocusPrompt from "./FocusPrompt";
import ItemForm from "./ItemForm";

function getNextDue(list: StudentItem[]): StudentItem | null {
  const now = new Date();
  const upcoming = list
    .filter((a) => new Date(a.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return upcoming[0] ?? null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const typeColors: Record<string, string> = {
  Homework: "#4361ee",
  Lab: "#2ec4b6",
  Assignment: "#f72585",
};

function StudentCard({ item, highlight }: { item: StudentItem; highlight?: boolean }) {
  const due = new Date(item.dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays >= 0 && diffDays <= 2;

  return (
    <div className={`card${highlight ? " next" : ""}`}>
      <div className="card-header">
        <span className="title">{item.title}</span>
        <span
          className="weight"
          style={{ color: typeColors[item.type] ?? "var(--accent)" }}
        >
          {formatDate(item.dueDate)}
        </span>
      </div>
      <div className="card-meta">
        <span className="category">{item.type}</span>
        <span className="due">
          {item.className && `${item.className}`}
          {item.week && `  •  Wk ${item.week}`}
          {isUrgent && `  •  Due ${diffDays === 0 ? "today" : `${diffDays}d`}`}
        </span>
      </div>
      {highlight && <span className="next-badge">Next Due</span>}
    </div>
  );
}

function groupByType(list: StudentItem[]): Map<string, StudentItem[]> {
  const map = new Map<string, StudentItem[]>();
  for (const item of list) {
    const group = map.get(item.type) ?? [];
    group.push(item);
    map.set(item.type, group);
  }
  return map;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>("[data-animate]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    for (const t of targets) observer.observe(t);
    return () => observer.disconnect();
  }, []);

  return ref;
}

const CALCULATION_EXPRESSIONS = [
  "L = Σ(y − ŷ)²",
  "ŷ = Wx + b",
  "w ← w − η∇J(w)",
  "O(n log n)",
];

function AnimatedCounter({ count }: { count: number }) {
  const [display, setDisplay] = useState(0);
  const [expressions, setExpressions] = useState<string[]>([]);
  const [calculating, setCalculating] = useState(true);

  useEffect(() => {
    setCalculating(true);
    const start = Date.now();

    let flashInterval: ReturnType<typeof setInterval>;
    flashInterval = setInterval(() => {
      setExpressions(
        Array.from({ length: 3 }, () =>
          CALCULATION_EXPRESSIONS[Math.floor(Math.random() * CALCULATION_EXPRESSIONS.length)]
        )
      );
    }, 150);

    const countInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed > 1200) {
        clearInterval(countInterval);
        clearInterval(flashInterval);
        setDisplay(count);
        setExpressions([]);
        setCalculating(false);
      } else {
        const progress = elapsed / 1200;
        const range = Math.max(count * 2, 50);
        const near = Math.floor(count * progress * (0.5 + Math.random() * 0.5));
        setDisplay(Math.min(near + Math.floor(Math.random() * 20), range));
      }
    }, 50);

    return () => {
      clearInterval(countInterval);
      clearInterval(flashInterval);
    };
  }, [count]);

  return (
    <div className={`counter-anim ${calculating ? "is-calculating" : "is-done"}`}>
      <div className="counter-math-expressions">
        {expressions.map((expression, i) => (
          <span key={i} className="counter-float-expression" style={{ animationDelay: `${i * 0.1}s` }}>
            {expression}
          </span>
        ))}
      </div>
      <span className="counter-number">{display.toLocaleString()}</span>
    </div>
  );
}

function useVisitorCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/visitor")
      .then((r) => r.json())
      .then((data) => setCount(data.count))
      .catch(() => setCount(0));
  }, []);

  return count;
}

function App() {
  const [items, setItems] = useState<StudentItem[]>([]);
  const visitorCount = useVisitorCount();
  const next = getNextDue(items);
  const groups = groupByType(items);
  const rootRef = useReveal();

  const handleAdd = (item: StudentItem) => {
    setItems((prev) => [item, ...prev]);
  };

  const typeOrder = ["Homework", "Lab", "Assignment"];
  const sortedGroups = [...groups.entries()].sort(
    ([a], [b]) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
  );

  const totalCount = items.length;

  return (
    <div className="app" ref={rootRef}>
      <AmbientBackground />

      <header className="hero" data-animate>
        <div className="hero-badge">track your assignments</div>
        <h1 className="hero-title">Coursework, in motion.</h1>
        <p className="hero-subtitle">
          A study desk for NYC coursework — organize what is due, follow a
          clear path, and make steady progress.
        </p>
        <div className="hero-actions">
          <a href="#add-section" className="hero-btn primary">Add coursework <span>→</span></a>
        </div>
      </header>

      {next && (
        <section className="next-up" data-animate>
          <h2>Up Next</h2>
          <StudentCard item={next} highlight />
        </section>
      )}

      <div className="layout">
        <div className="layout-main">
          <section className="add-section" id="add-section" data-animate>
            <h2>Add Item</h2>
            <ItemForm onAdd={handleAdd} />
          </section>

          <section className="breakdown" data-animate>
            <h2>Overview</h2>
            <div className="breakdown-grid">
              {sortedGroups.map(([type, groupItems]) => (
                <div key={type} className="breakdown-row">
                  <span className="cat-name">{type}</span>
                  <span className="cat-weight" style={{ color: typeColors[type] }}>
                    {groupItems.length}
                  </span>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{
                        width: `${(groupItems.length / Math.max(totalCount, 1)) * 100}%`,
                        background: `linear-gradient(90deg, ${typeColors[type]}, color-mix(in srgb, ${typeColors[type]} 70%, white))`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="breakdown-row total">
                <span className="cat-name">Total Items</span>
                <span className="cat-weight">{totalCount}</span>
              </div>
            </div>
          </section>

          <section className="all-items" data-animate>
            <h2>My Items</h2>
            {sortedGroups.map(([type, groupItems]) => (
              <div key={type} className="category-group">
                <h3>{type}</h3>
                {groupItems.map((item) => (
                  <StudentCard
                    key={item.id}
                    item={item}
                    highlight={next?.id === item.id}
                  />
                ))}
              </div>
            ))}
            {items.length === 0 && (
              <p className="empty-state">
                Nothing here yet. Use the form above to add your first
                homework, lab, or assignment.
              </p>
            )}
          </section>
        </div>

        <aside className="layout-side" data-animate>
          <ProgressTracker items={items} />
          <FocusPrompt item={next} />
        </aside>
      </div>

      <footer className="visitor-section" data-animate>
        <div className="visitor-section-inner">
          <div className="visitor-section-header">
            <span className="visitor-section-icon">O(n log n)</span>
            <span className="visitor-section-label">Unique Visitors</span>
          </div>
          <AnimatedCounter count={visitorCount} />
          <p className="visitor-section-note">
            Each unique browser counted once
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
