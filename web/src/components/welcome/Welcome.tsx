import React from "react";
import { Button } from "../ui";
import { useJourney } from "../../lib/journey";

export const Welcome: React.FC = () => {
  const { go } = useJourney();

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          IELTS Coach
        </h1>
        <p className="text-base text-[var(--color-muted)]">
          Find your level, then improve it — with feedback on Writing &amp;
          Speaking you can&apos;t grade yourself
        </p>
        <div className="flex w-full flex-col gap-3">
          <Button size="lg" onClick={() => go("onboarding")}>
            Get started
          </Button>
          <Button variant="ghost" onClick={() => go("app")}>
            I already have a profile
          </Button>
        </div>
      </div>
    </div>
  );
};
