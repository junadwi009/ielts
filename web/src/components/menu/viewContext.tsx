import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type View =
  | "home"
  | "reading"
  | "listening"
  | "speaking"
  | "writing"
  | "test"
  | "tips"
  | "progress"
  | "settings";

export interface ViewContextValue {
  view: View;
  setView: (v: View) => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setViewState] = useState<View>("home");

  const setView = useCallback((v: View) => setViewState(v), []);

  const value = useMemo<ViewContextValue>(() => ({ view, setView }), [view, setView]);

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
};

export function useView(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within a ViewProvider");
  return ctx;
}
