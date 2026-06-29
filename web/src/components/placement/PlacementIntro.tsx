import React from "react";
import { Card, Button } from "../ui";
import { ClipboardList, Clock, Mic } from "lucide-react";

export interface PlacementIntroProps {
  onBegin: () => void;
}

export const PlacementIntro: React.FC<PlacementIntroProps> = ({ onBegin }) => {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-lg flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            Placement Test
          </h1>
          <p className="text-[var(--color-muted)] text-sm">
            Find your starting level — not pass/fail
          </p>
        </div>

        <ul className="flex flex-col gap-3 text-sm text-[var(--color-text)]">
          <li className="flex items-start gap-3">
            <Clock size={18} className="mt-0.5 shrink-0 text-[var(--color-primary-600)]" aria-hidden="true" />
            <span>
              <strong>~50 minutes</strong> · four short sections, each timed independently
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ClipboardList size={18} className="mt-0.5 shrink-0 text-[var(--color-primary-600)]" aria-hidden="true" />
            <span>
              Covers <strong>Listening, Reading, Writing, and Speaking</strong> — the result sets
              your personalised study plan
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Mic size={18} className="mt-0.5 shrink-0 text-[var(--color-primary-600)]" aria-hidden="true" />
            <span>
              Speaking uses a <strong>typed response</strong> in this version — speech recognition
              is coming soon. Type what you would say naturally.
            </span>
          </li>
        </ul>

        <p className="text-xs text-[var(--color-muted)] border-t border-[var(--color-border)] pt-4">
          Need extended time or other accommodations? Adjust in{" "}
          <strong>Settings → Accommodations</strong> before starting.
        </p>

        <Button size="lg" onClick={onBegin} className="self-end">
          Begin
        </Button>
      </Card>
    </div>
  );
};
