import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JourneyProvider } from "../../lib/journey";
import { Onboarding } from "./Onboarding";
import { api } from "../../lib/api/client";

vi.mock("../../lib/api/client", () => ({
  api: { onboarding: vi.fn().mockResolvedValue({ id: 1 }) },
  ApiError: class extends Error {},
}));

function setup() {
  return render(
    <JourneyProvider>
      <Onboarding />
    </JourneyProvider>
  );
}

describe("Onboarding", () => {
  it("walks the 3 steps and posts the profile", async () => {
    setup();
    // Step 1: name
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Arjuna" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    // Step 2: goal
    fireEvent.click(screen.getByText(/work/i));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    // Step 3: target -> finish
    fireEvent.click(screen.getByRole("button", { name: /start placement/i }));
    await waitFor(() => expect(api.onboarding).toHaveBeenCalled());
    const arg = (api.onboarding as any).mock.calls[0][0];
    expect(arg).toMatchObject({ name: "Arjuna", goal: "work" });
    expect(arg.targetBand).toBeGreaterThanOrEqual(4.0);
  });

  it("disables Next on step 1 until a name is entered", () => {
    setup();
    const next = screen.getByRole("button", {
      name: /next/i,
    }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });
});
