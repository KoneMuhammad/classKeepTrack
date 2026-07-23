import { useState, useEffect } from "react";

const STORAGE_KEY = "mathkeeptrack-progress";

type ProgressState = Record<string, { reviewed: boolean; nowDoAlone: boolean }>;

function loadProgress(): ProgressState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProgress(state: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function ProgressTracker() {
  const [progress] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  return (
    <div className="tracker">
      <header className="tracker-header">
        <h2>Progress Tracker</h2>
        <p className="subtitle">Mark chapters, labs, or topics as reviewed</p>
      </header>

      <p className="empty-state">
        Add your course topics above to start tracking progress.
      </p>
    </div>
  );
}
