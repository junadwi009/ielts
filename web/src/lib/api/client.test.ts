import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "./client";

beforeEach(() => { vi.restoreAllMocks(); });

describe("api client", () => {
  it("health calls /api/health and returns parsed json", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, statusText: "OK",
      text: async () => JSON.stringify({ ok: true, llmMode: "stub", providerConfigured: false, asrReady: false }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const h = await api.health();
    expect(h.ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/health");
  });

  it("throws ApiError with code on non-2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 422, statusText: "Unprocessable",
      text: async () => JSON.stringify({ error: { code: "VALIDATION", message: "bad" } }),
    }));
    await expect(api.onboarding({ name: "", goal: "work", targetBand: 6.5 } as never)).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
