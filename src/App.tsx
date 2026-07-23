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
      <FocusPrompt />

      <header className="hero" data-animate>
        <div className="hero-badge">NYC Student Tool</div>
        <h1 className="hero-title">NYC Course Tracker</h1>
        <p className="hero-subtitle">
          NYC coursework dashboard. Add homework, labs, assignments, and
          due dates — all in one place.
        </p>
        <div className="hero-actions">
          <a href="#add-section" className="hero-btn primary">Get Started</a>
          <div className="visitor-bar">
            <span className="visitor-dot" />
            <span className="visitor-label">Visitors</span>
            <span className="visitor-count">{visitorCount}</span>
          </div>
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
          <ProgressTracker />
        </aside>
      </div>
    </div>
  );
}

export default App;
