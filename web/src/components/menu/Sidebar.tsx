import React from "react";
import {
  Home,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  ClipboardCheck,
  Lightbulb,
  LineChart,
  Settings,
} from "lucide-react";
import { LevelChip } from "../ui/LevelChip";
import type { CefrBand } from "../ui/LevelChip";
import { useView, type View } from "./viewContext";

interface SidebarProps {
  levels: Record<string, CefrBand>;
}

interface NavEntry {
  view: View;
  label: string;
  icon: React.ReactNode;
  skill?: string;
}

const NAV_ENTRIES: NavEntry[] = [
  { view: "home", label: "Home", icon: <Home size={18} aria-hidden="true" /> },
  { view: "reading", label: "Reading", icon: <BookOpen size={18} aria-hidden="true" />, skill: "reading" },
  { view: "listening", label: "Listening", icon: <Headphones size={18} aria-hidden="true" />, skill: "listening" },
  { view: "speaking", label: "Speaking", icon: <Mic size={18} aria-hidden="true" />, skill: "speaking" },
  { view: "writing", label: "Writing", icon: <PenLine size={18} aria-hidden="true" />, skill: "writing" },
  { view: "test", label: "Test", icon: <ClipboardCheck size={18} aria-hidden="true" /> },
  { view: "tips", label: "Tips", icon: <Lightbulb size={18} aria-hidden="true" /> },
  { view: "progress", label: "Progress", icon: <LineChart size={18} aria-hidden="true" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ levels }) => {
  const { view, setView } = useView();

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col h-full w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] py-4"
    >
      <div className="px-4 mb-6">
        <span className="text-lg font-bold text-[var(--color-primary-600)]">IELTS Coach</span>
      </div>

      <ul className="flex-1 flex flex-col gap-0.5 px-2" role="list">
        {NAV_ENTRIES.map((entry) => {
          const isActive = view === entry.view;
          const band = entry.skill ? levels[entry.skill] : undefined;
          return (
            <li key={entry.view}>
              <button
                onClick={() => setView(entry.view)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--color-primary-600)_12%,transparent)] text-[var(--color-primary-600)]"
                    : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {entry.icon}
                <span className="flex-1 text-left">{entry.label}</span>
                {band && <LevelChip band={band} />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-2 mt-auto pt-2 border-t border-[var(--color-border)]">
        <button
          onClick={() => setView("settings")}
          aria-current={view === "settings" ? "page" : undefined}
          className={[
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors min-h-[44px]",
            view === "settings"
              ? "bg-[color-mix(in_srgb,var(--color-primary-600)_12%,transparent)] text-[var(--color-primary-600)]"
              : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Settings size={18} aria-hidden="true" />
          <span className="flex-1 text-left">Settings</span>
        </button>
      </div>
    </nav>
  );
};
