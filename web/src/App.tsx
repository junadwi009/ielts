import { useEffect, useState } from "react";
import { api } from "./lib/api/client";

type Status = "loading" | "ok" | "error";

export default function App() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    api
      .health()
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      {status === "loading" && <p>Connecting…</p>}
      {status === "ok" && <p>IELTS Coach — API: ok</p>}
      {status === "error" && <p>IELTS Coach — API: unreachable</p>}
    </div>
  );
}
