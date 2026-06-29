import React, { useState } from "react";
import { QuizNavigator } from "../ui";
import { Play } from "lucide-react";
import type { PlacementItem } from "../../lib/types";

interface ListeningClip {
  title: string;
  transcript: string;
}

interface ListeningSectionData {
  seconds: number;
  clips: ListeningClip[];
}

export interface ListeningSectionProps {
  section: ListeningSectionData;
  items: PlacementItem[];
  answers: Record<number, string>;
  setAnswer: (id: number, val: string) => void;
}

export const ListeningSection: React.FC<ListeningSectionProps> = ({
  section,
  items,
  answers,
  setAnswer,
}) => {
  const [played, setPlayed] = useState<Set<number>>(new Set());
  const [currentQ, setCurrentQ] = useState(0);

  const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;

  const playClip = (index: number) => {
    if (!hasSpeechSynthesis) return;
    const clip = section.clips[index];
    if (!clip) return;
    const utterance = new SpeechSynthesisUtterance(clip.transcript);
    window.speechSynthesis.speak(utterance);
    setPlayed((prev) => new Set([...prev, index]));
  };

  const statuses = items.map((item) =>
    answers[item.id] !== undefined && answers[item.id] !== ""
      ? ("answered" as const)
      : ("unanswered" as const)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Audio clips */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide">
          Audio Clips
        </h2>
        {!hasSpeechSynthesis && (
          <p className="text-sm text-[var(--color-muted)] italic">
            Speech synthesis is not available in this environment. Read the questions below.
          </p>
        )}
        {section.clips.map((clip, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]"
          >
            <button
              type="button"
              onClick={() => playClip(i)}
              disabled={played.has(i) || !hasSpeechSynthesis}
              aria-label={`Play clip: ${clip.title}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary-600)] text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary-700)] transition-colors"
            >
              <Play size={14} aria-hidden="true" />
              {played.has(i) ? "Played" : "Play"}
            </button>
            <span className="text-sm text-[var(--color-text)]">{clip.title}</span>
          </div>
        ))}
      </div>

      {/* Question navigator */}
      {items.length > 0 && (
        <QuizNavigator
          count={items.length}
          current={currentQ}
          statuses={statuses}
          onJump={setCurrentQ}
        />
      )}

      {/* Questions */}
      <div className="flex flex-col gap-6">
        {items.map((item, qi) => {
          const payload = item.payload as { stem: string; options?: string[] };
          const hasOptions = Array.isArray(payload.options) && payload.options.length > 0;

          return (
            <div
              key={item.id}
              id={`q-${qi}`}
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
                          name={`listening-q-${item.id}`}
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
  );
};
