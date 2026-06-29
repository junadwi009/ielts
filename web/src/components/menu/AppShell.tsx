import React, { useEffect, useState } from "react";
import { api } from "../../lib/api/client";
import type { CefrBand } from "../ui/LevelChip";
import { ViewProvider, useView, type View } from "./viewContext";
import { Sidebar } from "./Sidebar";
import { BottomTabs } from "./BottomTabs";
import { Home } from "./Home";

// ---------------------------------------------------------------------------
// View registry — Task 21: replace the placeholder <div> with the real
// skill screen component in a single line per view.
// ---------------------------------------------------------------------------
function Placeholder({ name }: { name: string }) {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <p className="text-[var(--color-muted)] capitalize">{name}</p>
    </main>
  );
}

type ViewRegistry = {
  [V in View]: (levels: Record<string, CefrBand>) => React.ReactNode;
};

const viewRegistry: ViewRegistry = {
  home: (levels) => <Home levels={levels} />,
  reading: () => <Placeholder name="Reading" />,
  listening: () => <Placeholder name="Listening" />,
  speaking: () => <Placeholder name="Speaking" />,
  writing: () => <Placeholder name="Writing" />,
  test: () => <Placeholder name="Test" />,
  tips: () => <Placeholder name="Tips" />,
  progress: () => <Placeholder name="Progress" />,
  settings: () => <Placeholder name="Settings" />,
};

// ---------------------------------------------------------------------------
// Inner shell — consumes view context
// ---------------------------------------------------------------------------
function ShellInner({ levels }: { levels: Record<string, CefrBand> }) {
  const { view } = useView();
  const content = viewRegistry[view](levels);

  return (
    <div className="flex h-screen bg-[var(--color-bg)]">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar levels={levels} />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {content}
      </div>

      {/* Bottom tabs — mobile only */}
      <div className="md:hidden">
        <BottomTabs />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppShell — loads skill levels, provides view context
// ---------------------------------------------------------------------------
export function AppShell() {
  const [levels, setLevels] = useState<Record<string, CefrBand>>({});

  useEffect(() => {
    let active = true;
    api
      .skillLevels()
      .then((data) => {
        if (!active) return;
        const map: Record<string, CefrBand> = {};
        for (const { skill, band } of data) {
          map[skill] = band as CefrBand;
        }
        setLevels(map);
      })
      .catch(() => {
        /* tolerate empty — show shell without chips */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ViewProvider>
      <ShellInner levels={levels} />
    </ViewProvider>
  );
}
