import React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { LevelChip } from "../ui/LevelChip";
import type { CefrBand } from "../ui/LevelChip";
import { useView } from "./viewContext";
import type { Skill } from "../../lib/types";

interface HomeProps {
  levels: Record<string, CefrBand>;
}

const SKILLS: { skill: Skill; label: string; next: CefrBand }[] = [
  { skill: "reading", label: "Reading", next: "C2" },
  { skill: "listening", label: "Listening", next: "B2" },
  { skill: "speaking", label: "Speaking", next: "B2" },
  { skill: "writing", label: "Writing", next: "B2" },
];

const NEXT_BAND: Record<CefrBand, CefrBand> = {
  A1A2: "B1",
  B1: "B2",
  B2: "C1",
  C1: "C2",
  C2: "C2",
};

export const Home: React.FC<HomeProps> = ({ levels }) => {
  const { setView } = useView();

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Dashboard</h1>

      {/* Today card */}
      <section aria-labelledby="today-heading" className="mb-6">
        <Card variant="hero" className="flex items-center justify-between gap-4">
          <div>
            <h2 id="today-heading" className="text-lg font-semibold mb-1">Today</h2>
            <p className="text-sm opacity-90">Continue your next practice session</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setView("reading")}
            className="shrink-0"
          >
            Start
          </Button>
        </Card>
      </section>

      {/* Skill map */}
      <section aria-labelledby="skills-heading" className="mb-6">
        <h2 id="skills-heading" className="text-base font-semibold text-[var(--color-text)] mb-3">
          Your Skills
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map(({ skill, label }) => {
            const band = levels[skill];
            const nextBand = band ? NEXT_BAND[band] : "B1";
            return (
              <Card key={skill} variant="stat">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
                  {band && <LevelChip band={band} />}
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  {band ? `Targeting ${nextBand}` : "Not assessed yet"}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Milestone progress placeholder */}
      <section aria-labelledby="milestones-heading" className="mb-6">
        <h2 id="milestones-heading" className="text-base font-semibold text-[var(--color-text)] mb-3">
          Milestone Progress
        </h2>
        <Card>
          <div className="h-3 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-primary-600)] transition-all"
              style={{ width: "30%" }}
              role="progressbar"
              aria-valuenow={30}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-2">30% towards your next milestone</p>
        </Card>
      </section>

      {/* Quick links */}
      <section aria-labelledby="quicklinks-heading">
        <h2 id="quicklinks-heading" className="text-base font-semibold text-[var(--color-text)] mb-3">
          Quick Access
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setView("reading")}>
            Practice
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setView("test")}>
            Test
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setView("tips")}>
            Tips
          </Button>
        </div>
      </section>
    </main>
  );
};
