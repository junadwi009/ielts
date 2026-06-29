// jsdom doesn't have ResizeObserver — Recharts' ResponsiveContainer needs it.
// Provide a no-op stub so tests don't crash.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
