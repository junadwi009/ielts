import React from "react";
import type { CefrBand } from "../ui/LevelChip";
import { QuizRunner } from "../practice/QuizRunner";

export interface ListeningProps {
  band?: CefrBand;
}

export const Listening: React.FC<ListeningProps> = ({ band }) => (
  <QuizRunner skill="listening" band={band} mode="listening" />
);
