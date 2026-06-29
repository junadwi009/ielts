import React from "react";
import { useJourney } from "../../lib/journey";
import { Button } from "../ui/Button";
import { LevelChip } from "../ui/LevelChip";
import type { CefrBand } from "../ui/LevelChip";

const SKILL_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export const Milestones: React.FC = () => {
  const { milestones, go } = useJourney();

  if (!milestones || milestones.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-[var(--color-muted)]">
          No milestones found. Please choose a program first.
        </p>
        <Button variant="secondary" onClick={() => go("program")}>
          Back to program
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 max-w-lg mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Your milestones
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Track your progress toward each skill target.
        </p>
      </div>

      <ol className="flex flex-col gap-4 list-none">
        {milestones.map((m) => (
          <li
            key={m.idx}
            className="flex flex-col gap-2 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                Day {m.dayTarget}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {m.title}
            </p>
            {m.targets && Object.keys(m.targets).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(m.targets).map(([skill, band]) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1"
                  >
                    <span className="text-xs text-[var(--color-muted)]">
                      {SKILL_LABELS[skill] ?? skill}
                    </span>
                    <LevelChip band={band as CefrBand} />
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="pt-2">
        <Button
          size="lg"
          onClick={() => go("app")}
          className="w-full"
        >
          Go to my dashboard
        </Button>
      </div>
    </div>
  );
};
