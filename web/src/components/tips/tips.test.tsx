import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Tips } from "./Tips";

vi.mock("../../lib/api/client", () => ({
  api: { tips: vi.fn().mockResolvedValue({ title: "Reading strategy", bullets: ["Skim first", "Scan for detail"] }) },
  ApiError: class extends Error {},
}));

describe("Tips", () => {
  it("renders reading tips bullets", async () => {
    render(<Tips />);
    // expand reading (if collapsed) then see a bullet
    const reading = screen.getAllByText(/reading/i)[0];
    fireEvent.click(reading);
    await waitFor(() => expect(screen.getByText(/skim first/i)).toBeTruthy());
  });
});
