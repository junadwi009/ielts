import React from "react";
import { Timer, ProgressBar, Button } from "../ui";

export interface TestFrameProps {
  sectionName: string;
  stepIndex: number;
  stepCount: number;
  seconds: number;
  onTimeUp: () => void;
  onNext: () => void;
  nextLabel?: string;
  children: React.ReactNode;
  running?: boolean;
}

export const TestFrame: React.FC<TestFrameProps> = ({
  sectionName,
  stepIndex,
  stepCount,
  seconds,
  onTimeUp,
  onNext,
  nextLabel = "Next",
  children,
  running = true,
}) => {
  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-[var(--color-bg)] border-b border-[var(--color-border)] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-[var(--color-text)]">
              {sectionName}
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              {stepIndex} of {stepCount}
            </span>
          </div>
          <Timer seconds={seconds} onExpire={onTimeUp} running={running} />
        </div>
        <ProgressBar value={stepIndex} max={stepCount} />
      </header>

      {/* Scrollable body */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {children}
      </main>

      {/* Sticky footer */}
      <footer className="sticky bottom-0 bg-[var(--color-bg)] border-t border-[var(--color-border)] px-4 py-3 flex justify-end">
        <Button onClick={onNext} size="lg">
          {nextLabel}
        </Button>
      </footer>
    </div>
  );
};
