import React from "react";
import { Home, BookOpen, ClipboardCheck, Lightbulb, LineChart } from "lucide-react";
import { useView, type View } from "./viewContext";

interface TabEntry {
  view: View;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabEntry[] = [
  { view: "home", label: "Home", icon: <Home size={20} aria-hidden="true" /> },
  { view: "reading", label: "Practice", icon: <BookOpen size={20} aria-hidden="true" /> },
  { view: "test", label: "Test", icon: <ClipboardCheck size={20} aria-hidden="true" /> },
  { view: "tips", label: "Tips", icon: <Lightbulb size={20} aria-hidden="true" /> },
  { view: "progress", label: "Progress", icon: <LineChart size={20} aria-hidden="true" /> },
];

export const BottomTabs: React.FC = () => {
  const { view, setView } = useView();

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] z-50"
    >
      <ul className="flex items-stretch" role="list">
        {TABS.map((tab) => {
          const isActive = view === tab.view;
          return (
            <li key={tab.view} className="flex-1">
              <button
                onClick={() => setView(tab.view)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "w-full flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs font-medium transition-colors",
                  isActive
                    ? "text-[var(--color-primary-600)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
