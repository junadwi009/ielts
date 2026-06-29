import React from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useView } from "../menu/viewContext";

export const Progress: React.FC = () => {
  const { setView } = useView();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 z-10">
        <h1 className="text-base font-semibold text-[var(--color-text)]">Progress</h1>
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="text-4xl" aria-hidden="true">📈</span>
          <p className="text-[var(--color-text)] font-medium">No attempts yet</p>
          <p className="text-sm text-[var(--color-muted)] max-w-xs">
            Your Writing/Speaking history and trends will appear here once you complete your first
            practice session.
          </p>
          <Button variant="secondary" onClick={() => setView("writing")}>
            Start practising
          </Button>
        </Card>
      </div>
    </main>
  );
};
