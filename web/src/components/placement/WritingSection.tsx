import React from "react";
import { Card, Textarea } from "../ui";

interface WritingSectionData {
  seconds: number;
  taskType: string;
  targetWords: number;
  prompt: string;
}

export interface WritingSectionProps {
  section: WritingSectionData;
  value: string;
  setValue: (val: string) => void;
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export const WritingSection: React.FC<WritingSectionProps> = ({
  section,
  value,
  setValue,
}) => {
  const wordCount = countWords(value);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Card className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {section.taskType === "task1" ? "Task 1" : "Task 2"}
        </p>
        <p className="text-sm text-[var(--color-text)] leading-relaxed">
          {section.prompt}
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          Target: at least {section.targetWords} words
        </p>
      </Card>

      <Textarea
        label="Your response"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        wordCount={wordCount}
        targetWords={section.targetWords}
        rows={14}
        placeholder="Write your response here…"
      />
    </div>
  );
};
