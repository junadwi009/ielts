import React from "react";
import { Card, Textarea } from "../ui";
import { Mic } from "lucide-react";

interface SpeakingPart2Cue {
  cue: string;
}

interface SpeakingSectionData {
  seconds: number;
  part1: string[];
  part2: SpeakingPart2Cue;
  part3: string[];
}

export interface SpeakingSectionProps {
  section: SpeakingSectionData;
  value: string;
  setValue: (val: string) => void;
}

export const SpeakingSection: React.FC<SpeakingSectionProps> = ({
  section,
  value,
  setValue,
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Part 1 */}
      {section.part1.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            Part 1 — Introduction & Interview
          </h2>
          <ol className="flex flex-col gap-2">
            {section.part1.map((q, i) => (
              <li key={i} className="text-sm text-[var(--color-text)] flex gap-2">
                <span className="text-[var(--color-muted)] shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Part 2 */}
      {section.part2?.cue && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            Part 2 — Individual Long Turn
          </h2>
          <Card variant="stat" className="text-sm text-[var(--color-text)]">
            {section.part2.cue}
          </Card>
        </div>
      )}

      {/* Part 3 */}
      {section.part3.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide">
            Part 3 — Two-way Discussion
          </h2>
          <ol className="flex flex-col gap-2">
            {section.part3.map((q, i) => (
              <li key={i} className="text-sm text-[var(--color-text)] flex gap-2">
                <span className="text-[var(--color-muted)] shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Record placeholder */}
      <div className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)]"
        >
          <Mic size={18} />
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Recording button placeholder — speech recognition coming soon
        </p>
      </div>

      {/* Typed transcript fallback */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-[var(--color-primary-600)] uppercase tracking-wide">
          Typed transcript (ASR deferred — Phase 1 fallback)
        </p>
        <Textarea
          label="Type or paste what you would say (speech recognition coming soon)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={8}
          placeholder="Write your spoken responses here, covering all three parts…"
        />
      </div>
    </div>
  );
};
