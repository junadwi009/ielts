import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JourneyProvider } from "../../lib/journey";
import { PlacementRunner } from "./PlacementRunner";
import { api } from "../../lib/api/client";

vi.mock("../../lib/api/client", () => ({
  api: {
    placementStart: vi.fn().mockResolvedValue({
      comboId: 1, targetMinutes: 50,
      sections: {
        listening: { seconds: 5, clips: [{ title: "c", transcript: "hello" }] },
        reading:   { seconds: 5, title: "t", passage: "A short passage." },
        writing:   { seconds: 5, taskType: "task2", targetWords: 150, prompt: "Discuss." },
        speaking:  { seconds: 5, part1: ["Q1"], part2: { cue: "Describe" }, part3: ["Why?"] },
      },
      items: [
        { id: 10, skill: "reading", bandTag: "B1", type: "tfng", payload: { stem: "True?", options: ["True","False","Not Given"] } },
      ],
    }),
    placementSubmit: vi.fn().mockResolvedValue({ perSkill: {}, overallBand: 5.5, cefr: "B2", gapToTarget: 1.0 }),
  },
  ApiError: class extends Error {},
}));

function setup() {
  return render(<JourneyProvider><PlacementRunner /></JourneyProvider>);
}

describe("PlacementRunner", () => {
  it("loads a combo and submits answers after walking the sections", async () => {
    setup();
    await screen.findByText(/begin/i);          // intro loaded
    fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    // listening -> reading -> writing -> speaking -> submit, clicking Next each time
    for (let i = 0; i < 3; i++) {
      fireEvent.click(await screen.findByRole("button", { name: /next/i }));
    }
    fireEvent.click(await screen.findByRole("button", { name: /submit/i }));
    await waitFor(() => expect(api.placementSubmit).toHaveBeenCalled());
    const body = (api.placementSubmit as any).mock.calls[0][0];
    expect(body.comboId).toBe(1);
    expect(body).toHaveProperty("answers");
    expect(body).toHaveProperty("speakingText");
  });
});
