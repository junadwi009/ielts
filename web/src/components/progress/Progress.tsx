import React from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useView } from "../menu/viewContext";

export const Progress: React.FC = () => {
  const { setView } = useView();

  return (
    <main className="flex-1 overflow-y-auto">
      <div
        className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 z-10"
        style={{ boxShadow: "var(--shadow-e1)" }}
      >
        <h1 className="text-base font-semibold text-[var(--color-text)] tracking-tight">Progress</h1>
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card className="flex flex-col items-center gap-5 py-12 text-center">
          {/* Icon */}
          <div
            className="flex items-center justify-center w-14 h-14 rounded-[var(--radius-xl)]"
            style={{
              background: "color-mix(in srgb, var(--color-primary-600) 12%, transparent)",
            }}
            aria-hidden="true"
          >
            <TrendingUp size={26} className="text-[var(--color-primary-600)]" />
          </div>

          {/* Copy */}
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold text-[var(--color-text)]">No attempts yet</p>
            <p className="text-sm text-[var(--color-muted)] max-w-xs leading-relaxed">
              Your Writing and Speaking history, band trends, and analytics will appear here once you
              complete your first practice session.
            </p>
          </div>

          {/* CTA */}
          <Button onClick={() => setView("writing")}>
            Start practising
          </Button>
        </Card>
      </div>
    </main>
  );
};
