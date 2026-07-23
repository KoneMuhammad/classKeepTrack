import { useState } from "react";
import { ITEM_TYPES, type ItemType, type StudentItem } from "./data";

let nextId = 100;

type Props = {
  onAdd: (item: StudentItem) => void;
};

export default function ItemForm({ onAdd }: Props) {
  const [type, setType] = useState<ItemType>("Homework");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [className, setClassName] = useState("");
  const [week, setWeek] = useState("");

  const canSubmit = title.trim() && dueDate;

  function toDateInputValue(dateStr: string): string {
    const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[1]}-${m[2]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    return dateStr;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    onAdd({
      id: `item-${nextId++}`,
      type,
      title: title.trim(),
      dueDate: toDateInputValue(dueDate),
      className: className.trim() || undefined,
      week: week ? Number(week) : undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    });

    setTitle("");
    setDueDate("");
    setWeek("");
    setClassName("");
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-pills">
        {ITEM_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`form-pill ${t === type ? "active" : ""}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="form-fields">
        <input
          className="form-input"
          type="text"
          placeholder={`e.g. ${type} name or number`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="form-date-wrap">
          <label className="form-date-label">Due Date</label>
          <input
            className="form-input form-input-date"
            type="text"
            placeholder="MM/DD/YYYY"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <button className="form-submit" type="submit" disabled={!canSubmit}>
          +
        </button>
      </div>

      <button
        type="button"
        className="form-extra-toggle"
        onClick={() => setShowExtra(!showExtra)}
      >
        {showExtra ? "Less" : "More"} options
      </button>

      {showExtra && (
        <div className="form-extra">
          <input
            className="form-input"
            type="text"
            placeholder="Class name (e.g. MAT 301)"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
          <input
            className="form-input form-input-sm"
            type="number"
            placeholder="Week #"
            min={1}
            max={20}
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        </div>
      )}
    </form>
  );
}
