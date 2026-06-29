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
    <div className="flex flex-col gap-7 max-w-2xl">
      {/* Part 1 */}
      {section.part1.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest">
            Part 1 — Introduction &amp; Interview
          </h2>
          <ol className="flex flex-col gap-2">
            {section.part1.map((q, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] leading-relaxed"
                style={{ boxShadow: "var(--shadow-e1)" }}
              >
                <span className="text-[var(--color-muted)] shrink-0 tabular-nums">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Part 2 */}
      {section.part2?.cue && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest">
            Part 2 — Individual Long Turn
          </h2>
          <Card variant="stat" className="text-sm text-[var(--color-text)] leading-relaxed border-l-4 border-l-[var(--color-primary-600)]">
            {section.part2.cue}
          </Card>
        </div>
      )}

      {/* Part 3 */}
      {section.part3.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest">
            Part 3 — Two-way Discussion
          </h2>
          <ol className="flex flex-col gap-2">
            {section.part3.map((q, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] leading-relaxed"
                style={{ boxShadow: "var(--shadow-e1)" }}
              >
                <span className="text-[var(--color-muted)] shrink-0 tabular-nums">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Record placeholder — styled */}
      <div
        className="flex items-center gap-4 p-5 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-primary-600)] bg-[color-mix(in_srgb,var(--color-primary-600)_5%,transparent)]"
      >
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))",
            boxShadow: "var(--shadow-e2)",
          }}
        >
          <Mic size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">
            Speech recording — coming soon
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            For now, type your responses in the box below
          </p>
        </div>
      </div>

      {/* Typed transcript fallback */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-[var(--color-primary-600)] uppercase tracking-widest">
          Your typed response
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
