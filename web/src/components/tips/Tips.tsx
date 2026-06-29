import React, { useState } from "react";
import { api } from "../../lib/api/client";
import type { Tips as TipsData } from "../../lib/types";
import { Card } from "../ui/Card";

const SKILLS = ["reading", "listening", "writing", "speaking"] as const;
type Skill = (typeof SKILLS)[number];

const SKILL_LABELS: Record<Skill, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

interface AccordionState {
  open: boolean;
  data: TipsData | null;
  loading: boolean;
  error: string | null;
}

export const Tips: React.FC = () => {
  const [sections, setSections] = useState<Record<Skill, AccordionState>>(() =>
    Object.fromEntries(
      SKILLS.map((s) => [s, { open: false, data: null, loading: false, error: null }])
    ) as Record<Skill, AccordionState>
  );

  const toggleSection = (skill: Skill) => {
    const section = sections[skill];
    const nowOpen = !section.open;

    // If opening for the first time and no data yet, fetch
    if (nowOpen && !section.data && !section.loading) {
      setSections((prev) => ({
        ...prev,
        [skill]: { ...prev[skill], open: true, loading: true },
      }));
      api
        .tips(skill)
        .then((data) => {
          setSections((prev) => ({
            ...prev,
            [skill]: { open: true, data, loading: false, error: null },
          }));
        })
        .catch((e: unknown) => {
          setSections((prev) => ({
            ...prev,
            [skill]: {
              ...prev[skill],
              loading: false,
              error: e instanceof Error ? e.message : "Failed to load",
            },
          }));
        });
    } else {
      setSections((prev) => ({
        ...prev,
        [skill]: { ...prev[skill], open: nowOpen },
      }));
    }
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 z-10">
        <h1 className="text-base font-semibold text-[var(--color-text)]">Tips</h1>
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-3">
        {SKILLS.map((skill) => {
          const section = sections[skill];
          const headingId = `tips-heading-${skill}`;
          const panelId = `tips-panel-${skill}`;

          return (
            <Card key={skill} className="p-0 overflow-hidden">
              {/* Accordion trigger */}
              <button
                type="button"
                id={headingId}
                aria-expanded={section.open}
                aria-controls={panelId}
                onClick={() => toggleSection(skill)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-600)]"
              >
                <span>{SKILL_LABELS[skill]}</span>
                <span
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${section.open ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </button>

              {/* Accordion panel */}
              {section.open && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headingId}
                  className="px-4 pb-4"
                >
                  {section.loading && (
                    <p className="text-xs text-[var(--color-muted)]">Loading…</p>
                  )}
                  {section.error && (
                    <p className="text-xs text-[var(--color-danger)]">{section.error}</p>
                  )}
                  {section.data && (
                    <>
                      {section.data.title && (
                        <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide mb-2">
                          {section.data.title}
                        </p>
                      )}
                      <ul className="flex flex-col gap-1 text-sm text-[var(--color-text)] leading-relaxed list-disc list-inside">
                        {section.data.bullets.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
};
