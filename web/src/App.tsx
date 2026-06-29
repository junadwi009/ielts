import { useEffect, useState } from "react";
import { api } from "./lib/api/client";
import { JourneyProvider, useJourney } from "./lib/journey";
import { Welcome } from "./components/welcome/Welcome";
import { Onboarding } from "./components/onboarding/Onboarding";
import { PlacementRunner } from "./components/placement/PlacementRunner";
import { Generating } from "./components/placement/Generating";
import { Results } from "./components/results/Results";

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <p className="text-[var(--color-muted)]">{name}</p>
    </div>
  );
}

function Journey() {
  const { step, go } = useJourney();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .skillLevels()
      .then((levels) => {
        if (!active) return;
        if (Array.isArray(levels) && levels.length > 0) go("app");
      })
      .catch(() => {
        /* stay at welcome on error */
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <p className="text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  }

  switch (step) {
    case "welcome":
      return <Welcome />;
    case "onboarding":
      return <Onboarding />;
    case "placement":
      return <PlacementRunner />;
    case "generating":
      return <Generating />;
    case "results":
      return <Results />;
    default:
      return <Placeholder name={step} />;
  }
}

export default function App() {
  return (
    <JourneyProvider>
      <Journey />
    </JourneyProvider>
  );
}
