import React, { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api/client";
import { useJourney } from "../../lib/journey";
import { ProgressBar } from "../ui/ProgressBar";

const STEPS = [
  "Building your Reading set…",
  "Preparing Listening clips…",
  "Drafting Speaking prompts…",
  "Assembling Writing tasks…",
];

export const Generating: React.FC = () => {
  const { go } = useJourney();
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function start() {
      let jobId: string;
      try {
        const res = await api.practiceGenerate();
        if (!mounted.current) return;
        jobId = res.jobId;
      } catch {
        // stay on screen — server might not have this endpoint yet
        return;
      }

      intervalId = setInterval(async () => {
        if (!mounted.current) {
          if (intervalId) clearInterval(intervalId);
          return;
        }
        try {
          const status = await api.practiceStatus(jobId);
          if (!mounted.current) return;
          setProgress(Math.round((status.progress ?? 0) * 100));
          // advance visible step label
          setStepIdx((idx) => Math.min(STEPS.length - 1, Math.round((status.progress ?? 0) * (STEPS.length - 1))));
          if (status.done) {
            if (intervalId) clearInterval(intervalId);
            go("results");
          }
        } catch {
          if (intervalId) clearInterval(intervalId);
        }
      }, 600);
    }

    start();

    return () => {
      mounted.current = false;
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 p-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-center text-[var(--color-text)]">
          Personalising your practice plan…
        </h1>

        {/* stepped checklist */}
        <ul className="flex flex-col gap-3" role="list">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={[
                "flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3",
                "bg-[var(--color-surface)] border border-[var(--color-border)]",
                i < stepIdx ? "opacity-50" : i === stepIdx ? "opacity-100" : "opacity-30",
              ].join(" ")}
            >
              <span
                className={[
                  "h-2 w-2 rounded-full flex-shrink-0",
                  i < stepIdx
                    ? "bg-[var(--color-success)]"
                    : i === stepIdx
                    ? "bg-[var(--color-primary-600)] animate-pulse"
                    : "bg-[var(--color-border)]",
                ].join(" ")}
                aria-hidden="true"
              />
              <span className="text-sm text-[var(--color-text)]">{label}</span>
            </li>
          ))}
        </ul>

        <ProgressBar value={progress} max={100} label="Generating practice content" />

        <p
          className="text-center text-sm text-[var(--color-muted)]"
          aria-live="polite"
        >
          {STEPS[stepIdx]}
        </p>

        <p className="text-center text-xs text-[var(--color-muted)] opacity-70">
          Usually takes a few seconds. Hang tight!
        </p>
      </div>
    </div>
  );
};
