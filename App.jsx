import { useState } from "react";
import ControlRoom from "./ControlRoom.jsx";
import JulyBrief from "./JulyBrief.jsx";

const T = { ink: "#1A2421", paper: "#F2F3EE", card: "#FBFBF8", line: "rgba(26,36,33,0.14)", inkSoft: "#4A5450" };

const VIEWS = [
  { id: "july", label: "July 2026 brief", el: <JulyBrief /> },
  { id: "control", label: "P&L control room", el: <ControlRoom /> },
];

export default function App() {
  const [view, setView] = useState("july");

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 20, background: T.paper,
        borderBottom: `1px solid ${T.line}`, padding: "10px 20px",
        display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
        fontFamily: "'Archivo', system-ui, sans-serif",
      }}>
        <span style={{ fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600, marginRight: 6 }}>
          Tayseer
        </span>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            aria-pressed={view === v.id}
            style={{
              padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${view === v.id ? T.ink : T.line}`,
              background: view === v.id ? T.ink : T.card,
              color: view === v.id ? T.paper : T.ink,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {v.label}
          </button>
        ))}
      </nav>
      {VIEWS.find((v) => v.id === view).el}
    </div>
  );
}
