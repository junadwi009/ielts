import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JourneyProvider } from "../../lib/journey";
import { Program } from "./Program";
import { api } from "../../lib/api/client";

vi.mock("../../lib/api/client", () => ({
  api: { program: vi.fn().mockResolvedValue({ program: { id: 1, lengthDays: 90, status: "active" }, milestones: [] }) },
  ApiError: class extends Error {},
}));

describe("Program", () => {
  it("starting the 90-day plan posts lengthDays 90", async () => {
    render(<JourneyProvider><Program /></JourneyProvider>);
    // pick the 90-day option (RadioCard role="radio" with accessible name "90-day plan")
    fireEvent.click(screen.getByRole("radio", { name: /90-day plan/i }));
    fireEvent.click(screen.getByRole("button", { name: /start.*plan/i }));
    await waitFor(() => expect(api.program).toHaveBeenCalledWith(90));
  });
});
