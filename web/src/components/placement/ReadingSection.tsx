import React, { useState } from "react";
import { QuizNavigator } from "../ui";
import type { PlacementItem } from "../../lib/types";

interface ReadingSectionData {
  seconds: number;
  title: string;
  passage: string;
}

export interface ReadingSectionProps {
  section: ReadingSectionData;
  items: PlacementItem[];
  answers: Record<number, string>;
  setAnswer: (id: number, val: string) => void;
}

export const ReadingSection: React.FC<ReadingSectionProps> = ({
  section,
  items,
  answers,
  setAnswer,
}) => {
  const [currentQ, setCurrentQ] = useState(0);

  const statuses = items.map((item) =>
    answers[item.id] !== undefined && answers[item.id] !== ""
      ? ("answered" as const)
      : ("unanswered" as const)
  );

  return (
    <div className="md:grid md:grid-cols-2 md:gap-6 flex flex-col gap-6">
      {/* Left pane: passage */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {section.title}
        </h2>
        <div
          aria-label="Reading passage"
          className="text-[18px] leading-[1.7] max-w-[66ch] text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-reading, Georgia, serif)" }}
        >
          {section.passage.split("\n").map((para, i) => (
            <p key={i} className="mb-3">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Right pane: questions */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide">
          Questions
        </h2>

        {items.length > 0 && (
          <QuizNavigator
            count={items.length}
            current={currentQ}
            statuses={statuses}
            onJump={setCurrentQ}
          />
        )}

        <div className="flex flex-col gap-6">
          {items.map((item, qi) => {
            const payload = item.payload as { stem: string; options?: string[] };
            const hasOptions = Array.isArray(payload.options) && payload.options.length > 0;

            return (
              <div
                key={item.id}
                id={`rq-${qi}`}
                data-qi={qi}
                className="flex flex-col gap-2"
              >
                <p className="text-sm font-medium text-[var(--color-text)]">
                  <span className="text-[var(--color-muted)] mr-2">{qi + 1}.</span>
                  {payload.stem}
                </p>

                {hasOptions ? (
                  <fieldset>
                    <legend className="sr-only">Question {qi + 1}</legend>
                    <div className="flex flex-col gap-2">
                      {payload.options!.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text)]"
                        >
                          <input
                            type="radio"
                            name={`reading-q-${item.id}`}
                            value={opt}
                            checked={answers[item.id] === opt}
                            onChange={() => {
                              setAnswer(item.id, opt);
                              setCurrentQ(qi);
                            }}
                            className="w-4 h-4 accent-[var(--color-primary-600)]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <input
                    type="text"
                    aria-label={`Answer for question ${qi + 1}`}
                    value={answers[item.id] ?? ""}
                    onChange={(e) => {
                      setAnswer(item.id, e.target.value);
                      setCurrentQ(qi);
                    }}
                    className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]"
                    placeholder="Your answer"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
