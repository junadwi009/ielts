import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LevelChip, Timer, Button } from "./index";

describe("ui primitives", () => {
  it("LevelChip renders the band label", () => {
    render(<LevelChip band="C1" />);
    expect(screen.getByText("C1")).toBeTruthy();
  });

  it("Button loading is disabled", () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  });

  it("Timer calls onExpire at zero", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    render(<Timer seconds={1} onExpire={onExpire} />);
    act(() => { vi.advanceTimersByTime(1100); });
    expect(onExpire).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
