import React from "react";

export type CefrBand = "A1A2" | "B1" | "B2" | "C1" | "C2";

export interface LevelChipProps {
  band: CefrBand;
  label?: string;
}

const bandColor: Record<CefrBand, string> = {
  A1A2: "var(--color-cefr-a)",
  B1: "var(--color-cefr-b1)",
  B2: "var(--color-cefr-b2)",
  C1: "var(--color-cefr-c1)",
  C2: "var(--color-cefr-c2)",
};

const bandLabel: Record<CefrBand, string> = {
  A1A2: "A1/A2",
  B1: "B1",
  B2: "B2",
  C1: "C1",
  C2: "C2",
};

export const LevelChip: React.FC<LevelChipProps> = ({ band, label }) => {
  const color = bandColor[band];
  const displayLabel = label ?? bandLabel[band];

  return (
    <span
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
      }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border"
    >
      {displayLabel}
    </span>
  );
};
