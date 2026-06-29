import React, { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api/client";
import type { QuizQuestion, QuizSet } from "../../lib/types";
import type { CefrBand } from "../ui/LevelChip";
import { LevelChip } from "../ui/LevelChip";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { QuizNavigator } from "../ui/QuizNavigator";
import type { QuizStatus } from "../ui/QuizNavigator";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

const NEXT_BAND: Record<CefrBand, CefrBand> = {
  A1A2: "B1",
  B1: "B2",
  B2: "C1",
  C1: "C2",
  C2: "C2",
};

export interface QuizRunnerProps {
  skill: string;
  band?: CefrBand;
  mode: "reading" | "listening";
}

// ---------------------------------------------------------------------------
// component
// ---------------------------------------------------------------------------
export const QuizRunner: React.FC<QuizRunnerProps> = ({ skill, band, mode }) => {
  const [set, setSet] = useState<QuizSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // answers: indexed by question index, value = user's answer string
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // listening TTS state
  const [speaking, setSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // current question index (for navigator scroll target)
  const [current, setCurrent] = useState(0);

  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const load = () => {
    setLoading(true);
    setError(null);
    setAnswers({});
    setSubmitted(false);
    setSpeaking(false);
    setShowTranscript(false);
    setCurrent(0);
    api
      .practiceSet(skill, band)
      .then((data) => {
        setSet(data);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load set");
        setLoading(false);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [skill, band]);

  // ---- TTS ----
  const handlePlay = () => {
    if (!set?.transcript) return;
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not available in this browser.");
      return;
    }
    const utt = new SpeechSynthesisUtterance(set.transcript);
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  // ---- grading ----
  const handleSubmit = () => {
    if (!set) return;
    setSubmitted(true);
    if (mode === "listening") setShowTranscript(true);
  };

  const getStatus = (qi: number): QuizStatus => {
    if (!submitted) return answers[qi] !== undefined ? "answered" : "unanswered";
    const q = set!.questions[qi];
    return norm(answers[qi] ?? "") === norm(q.answer) ? "correct" : "wrong";
  };

  const correctCount = () => {
    if (!set) return 0;
    return set.questions.filter((q, i) => norm(answers[i] ?? "") === norm(q.answer)).length;
  };

  // ---- jump to question ----
  const handleJump = (idx: number) => {
    setCurrent(idx);
    questionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ---- render ----
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <p className="text-[var(--color-muted)]">Loading {skill} set…</p>
      </main>
    );
  }

  if (error || !set) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-[var(--color-danger)]">{error ?? "No set available."}</p>
        <Button onClick={load}>Retry</Button>
      </main>
    );
  }

  const n = set.questions.length;
  const statuses: QuizStatus[] = Array.from({ length: n }, (_, i) => getStatus(i));

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-3 z-10">
        <h1 className="text-base font-semibold text-[var(--color-text)] capitalize flex-1">
          {skill}
        </h1>
        {band && <LevelChip band={band} />}
        {band && (
          <span className="text-xs text-[var(--color-muted)] hidden sm:inline">
            Level: {band} · targeting {NEXT_BAND[band]}
          </span>
        )}
      </div>

      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Navigator */}
        <div className="mb-4">
          <QuizNavigator
            count={n}
            current={current}
            statuses={statuses}
            onJump={handleJump}
          />
        </div>

        {/* Score card (after submit) */}
        {submitted && (
          <Card className="mb-4 flex items-center gap-4 bg-[var(--color-surface-2)]">
            <span className="text-2xl font-bold text-[var(--color-text)]">
              {correctCount()} / {n}
            </span>
            <span className="text-sm text-[var(--color-muted)]">correct</span>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={load}>
              New set
            </Button>
          </Card>
        )}

        {/* Two-pane layout for reading */}
        <div className={mode === "reading" && set.passage ? "md:grid md:grid-cols-2 md:gap-6" : ""}>
          {/* Passage / Transcript */}
          {mode === "reading" && set.passage && (
            <div className="mb-4 md:mb-0">
              <Card className="h-full">
                <p
                  className="text-[var(--color-text)] leading-relaxed max-w-[66ch]"
                  style={{ fontSize: "1.125rem" }}
                >
                  {set.passage}
                </p>
              </Card>
            </div>
          )}

          {mode === "listening" && (
            <div className="mb-4">
              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePlay}
                    disabled={speaking}
                    aria-label={speaking ? "Playing…" : "Play audio"}
                  >
                    {speaking ? "Playing…" : "▶ Play"}
                  </Button>
                  {!window.speechSynthesis && (
                    <span className="text-xs text-[var(--color-warning)]">
                      TTS not available in this browser
                    </span>
                  )}
                </div>
                {showTranscript && set.transcript && (
                  <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                    <p className="text-xs font-medium text-[var(--color-muted)] mb-1">Transcript</p>
                    <p className="text-sm text-[var(--color-text)] leading-relaxed">
                      {set.transcript}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Questions */}
          <div className="flex flex-col gap-4">
            {set.questions.map((q: QuizQuestion, qi: number) => (
              <div
                key={qi}
                ref={(el) => { questionRefs.current[qi] = el; }}
                data-qi={qi}
              >
                <QuestionItem
                  question={q}
                  index={qi}
                  answer={answers[qi]}
                  submitted={submitted}
                  status={getStatus(qi)}
                  onChange={(val) => {
                    setAnswers((prev) => ({ ...prev, [qi]: val }));
                    setCurrent(qi);
                  }}
                />
              </div>
            ))}

            {/* Submit / New set */}
            {!submitted && (
              <Button
                className="mt-2 self-start"
                onClick={handleSubmit}
                disabled={Object.keys(answers).length === 0}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

// ---------------------------------------------------------------------------
// QuestionItem sub-component
// ---------------------------------------------------------------------------
interface QuestionItemProps {
  question: QuizQuestion;
  index: number;
  answer?: string;
  submitted: boolean;
  status: QuizStatus;
  onChange: (val: string) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  answer,
  submitted,
  status,
  onChange,
}) => {
  const borderColor =
    submitted
      ? status === "correct"
        ? "border-[var(--color-success)]"
        : "border-[var(--color-danger)]"
      : "border-[var(--color-border)]";

  return (
    <Card className={`border-2 ${borderColor}`}>
      <p className="text-sm font-medium text-[var(--color-text)] mb-3">
        <span className="text-[var(--color-muted)] mr-1">{index + 1}.</span>
        {question.stem}
      </p>

      {question.options ? (
        <fieldset>
          <legend className="sr-only">Question {index + 1} options</legend>
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => {
              const selected = answer === opt;
              const isCorrect = norm(opt) === norm(question.answer);
              let optColor = "border-[var(--color-border)] text-[var(--color-text)]";
              if (submitted && isCorrect) optColor = "border-[var(--color-success)] text-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)]";
              else if (submitted && selected && !isCorrect) optColor = "border-[var(--color-danger)] text-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)]";
              else if (selected) optColor = "border-[var(--color-primary-600)] text-[var(--color-primary-600)] bg-[color-mix(in_srgb,var(--color-primary-600)_8%,transparent)]";

              return (
                <label
                  key={opt}
                  className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border cursor-pointer text-sm transition-colors ${optColor}`}
                >
                  <input
                    type="radio"
                    name={`q-${index}`}
                    value={opt}
                    checked={selected}
                    disabled={submitted}
                    onChange={() => onChange(opt)}
                    className="sr-only"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <input
          type="text"
          value={answer ?? ""}
          disabled={submitted}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
          aria-label={`Answer for question ${index + 1}`}
          className="min-h-11 w-full px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]"
        />
      )}

      {submitted && question.explanation && (
        <p className="mt-2 text-xs text-[var(--color-muted)] border-t border-[var(--color-border)] pt-2">
          {question.explanation}
        </p>
      )}
    </Card>
  );
};
