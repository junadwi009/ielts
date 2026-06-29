import React from "react";
import type { CefrBand } from "../ui/LevelChip";
import { QuizRunner } from "../practice/QuizRunner";

export interface ReadingProps {
  band?: CefrBand;
}

export const Reading: React.FC<ReadingProps> = ({ band }) => (
  <QuizRunner skill="reading" band={band} mode="reading" />
);
