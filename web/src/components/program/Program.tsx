import React, { useState } from "react";
import { useJourney } from "../../lib/journey";
import { api } from "../../lib/api/client";
import { RadioCard } from "../ui/RadioCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface PlanOption {
  days: number;
  intensity: string;
  note: string;
}

const PLANS: PlanOption[] = [
  {
    days: 30,
    intensity: "~45 min/day",
    note: "Intensive sprint — best for a small gap or upcoming exam.",
  },
  {
    days: 90,
    intensity: "~25 min/day",
    note: "Steady progress — enough depth to move up one CEFR level.",
  },
  {
    days: 180,
    intensity: "~15 min/day",
    note: "Long game — comfortable pace for a larger gap.",
  },
];

function getRecommended(gap: number): number {
  if (gap <= 0.5) return 30;
  if (gap <= 1.5) return 90;
  return 180;
}

export const Program: React.FC = () => {
  const { go, placementResult, setMilestones } = useJourney();
  const gap = placementResult?.gapToTarget ?? 1.0;
  const recommended = getRecommended(gap);

  const [selected, setSelected] = useState<number>(recommended);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await api.program(selected);
      setMilestones(res.milestones);
      go("milestones");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 max-w-lg mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Choose your program
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          We recommend the{" "}
          <strong className="text-[var(--color-text)]">{recommended}-day plan</strong>{" "}
          based on your gap to target.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Program duration"
        className="flex flex-col gap-3"
      >
        {PLANS.map(({ days, intensity, note }) => {
          const isRecommended = days === recommended;
          return (
            <div key={days} className="relative">
              {isRecommended && (
                <div className="absolute -top-2 right-3 z-10">
                  <Badge tone="success">Recommended</Badge>
                </div>
              )}
              <RadioCard
                selected={selected === days}
                onSelect={() => setSelected(days)}
                title={`${days}-day plan`}
                description={`${intensity} · ${note}`}
              />
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <Button
          size="lg"
          loading={loading}
          onClick={handleStart}
          className="w-full"
        >
          Start {selected}-day plan
        </Button>
      </div>
    </div>
  );
};
