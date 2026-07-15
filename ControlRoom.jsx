import { useState, useMemo, useEffect } from "react";

// ------------------------------------------------------------------
// Tokens — same identity as the owner brief, so the two feel like a suite
// ------------------------------------------------------------------
const T = {
  ink: "#1A2421", inkSoft: "#4A5450", paper: "#F2F3EE", card: "#FBFBF8",
  line: "rgba(26,36,33,0.14)", profit: "#1D9E75", loss: "#C0442E",
  sand: "#B98A3C", blue: "#2F6690",
};

// Baseline = Jun 2026 run-rate, reconstructed from the 14-month P&L (SAR K / month unless %)
const DEFAULTS = {
  grossSales: 4494, returns: 8.5,
  cogs: 56.9,
  discounts: 14.0, promos: 10.0, advertising: 12.0, commissions: 2.4,
  discards: 4.6,
  warehouse: 219, salesPay: 228, fleet: 92, freight: 25,
  mgmtFee: 364, gna: 350, badDebt: 66, fines: 24,
  waves: 0, anchorType: "cosmetics", waveSize: 1000, anchorMargin: 30,
};

const PRESETS = {
  "Today (actuals)": { ...DEFAULTS },
  "Lean ops": { ...DEFAULTS, mgmtFee: 0, gna: 70, badDebt: 20, fines: 0 },
  "Full turnaround": {
    ...DEFAULTS, mgmtFee: 0, gna: 70, badDebt: 20, fines: 0,
    discounts: 8, promos: 5, advertising: 7, commissions: 2,
    discards: 1.5, returns: 4,
    waves: 2, anchorType: "cosmetics", waveSize: 1000, anchorMargin: 30,
  },
};

// ------------------------------------------------------------------
// Small pieces
// ------------------------------------------------------------------
function Lever({ label, value, set, min, max, step = 1, unit = "%", accent = T.ink, note }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 13.5, color: T.inkSoft }}>{label}{note && <em style={{ fontStyle: "normal", color: "#9AA49D", fontSize: 12 }}> · {note}</em>}</span>
        <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: accent }}>
          {unit === "K" ? Math.round(value) + "K" : unit === "M" ? (value / 1000).toFixed(2) + "M" : value.toFixed(step < 1 ? 1 : 0) + (unit === "#" ? "" : unit)}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(+e.target.value)}
        aria-label={label}
        style={{ width: "100%", accentColor: accent, height: 4 }} />
    </div>
  );
}

function Panel({ title, tint, children, subtotal }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderTop: `3px solid ${tint}`, borderRadius: 12, padding: "16px 18px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: T.ink }}>{title}</h3>
        {subtotal && <span style={{ fontSize: 13, fontWeight: 600, color: tint, fontVariantNumeric: "tabular-nums" }}>{subtotal}</span>}
      </div>
      {children}
    </div>
  );
}

function RiyalStrip({ cogs, give, kept }) {
  const seg = (n, color, name) => (
    <div key={name} style={{ width: `${Math.max(n, 0)}%`, minWidth: n > 0.3 ? 2 : 0 }} title={`${name}: ${n.toFixed(1)} riyals per 100`}>
      <div style={{ height: 30, background: color, borderRadius: 3, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 8px)" }} />
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 3 }}>
        {seg(cogs, T.inkSoft, "Cost of goods")}
        {seg(give, T.loss, "Trade + waste")}
        {seg(kept, T.profit, "Kept")}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: T.inkSoft }}>
        <span><b style={{ color: T.ink }}>{cogs.toFixed(0)}</b> cost of goods</span>
        <span><b style={{ color: T.loss }}>{give.toFixed(1)}</b> trade + waste</span>
        <span><b style={{ color: kept > 0 ? T.profit : T.loss }}>{kept.toFixed(1)}</b> kept per 100</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// App
// ------------------------------------------------------------------
export default function ControlRoom() {
  const [s, setS] = useState({ ...DEFAULTS });
  const set = (k) => (v) => setS((p) => ({ ...p, [k]: v }));
  const applyPreset = (name) => setS({ ...PRESETS[name] });

  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [updatedAt, setUpdatedAt] = useState(null);

  // Load the shared saved scenario on first render
  useEffect(() => {
    fetch("/api/scenario")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setS(res.data);
          setUpdatedAt(res.updated_at);
        }
      })
      .catch((err) => console.error("Failed to load scenario:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
      setUpdatedAt(new Date().toISOString());
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const r = useMemo(() => {
    const net = s.grossSales * (1 - s.returns / 100); // K/mo
    const cogsV = net * s.cogs / 100;
    const tradePct = s.discounts + s.promos + s.advertising + s.commissions;
    const tradeV = net * tradePct / 100;
    const discardV = net * s.discards / 100;
    const baseContrib = net - cogsV - tradeV - discardV;

    const aOps = s.anchorType === "food" ? 0.0487 : 0.02;
    const aRev = s.waves * s.waveSize;
    const aContrib = aRev * (s.anchorMargin / 100 - aOps);

    const ops = s.warehouse + s.salesPay + s.fleet + s.freight;
    const over = s.mgmtFee + s.gna + s.badDebt + s.fines;
    const pl = baseContrib + aContrib - ops - over;

    const totalRev = net + aRev;
    const keptPct = ((baseContrib + aRev * s.anchorMargin / 100) / totalRev) * 100;
    const givePct = ((tradeV + discardV + aRev * (1 - s.anchorMargin / 100) * 0.25) / totalRev) * 100; // anchor giveback approx inside its margin
    // Simpler, honest strip: blend base + anchors by revenue
    const cogsPct = ((cogsV + aRev * (1 - s.anchorMargin / 100 - 0.10)) / totalRev) * 100;
    const stripCogs = Math.min(Math.max(cogsPct, 0), 100);
    const stripKept = Math.max(keptPct, 0);
    const stripGive = Math.max(100 - stripCogs - stripKept, 0);

    const baseKeptFrac = 1 - s.cogs / 100 - tradePct / 100 - s.discards / 100;
    const fixedToCover = ops + over - aContrib;
    const breakeven = baseKeptFrac > 0.001 ? fixedToCover / baseKeptFrac : Infinity;

    return { net, cogsV, tradePct, tradeV, discardV, baseContrib, aRev, aContrib, ops, over, pl, stripCogs, stripGive, stripKept, breakeven, totalRev };
  }, [s]);

  const kpi = (label, val, tone) => (
    <div style={{ flex: "1 1 130px", background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: tone || T.ink, fontVariantNumeric: "tabular-nums" }}>{val}</div>
    </div>
  );

  // Bridge rows for the mini waterfall
  const bridge = [
    { l: "Net revenue", v: r.net, c: T.blue },
    { l: "Cost of goods", v: -r.cogsV, c: T.inkSoft },
    { l: "Trade spend", v: -r.tradeV, c: T.loss },
    { l: "Discards & returns waste", v: -r.discardV, c: T.loss },
    { l: "Anchor contribution", v: r.aContrib, c: T.profit },
    { l: "Operations", v: -r.ops, c: T.sand },
    { l: "Overheads", v: -r.over, c: T.sand },
  ];
  const maxAbs = Math.max(...bridge.map((b) => Math.abs(b.v)), 1);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.paper, color: T.inkSoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Archivo', system-ui, sans-serif" }}>
        Loading saved data…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Archivo', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap');
        button{ font-family: inherit; cursor: pointer; }
        @media (prefers-reduced-motion: reduce){ *{ transition: none !important; } }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "30px 20px 80px" }}>
        <header style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.sand, fontWeight: 600 }}>Tayseer Trading · P&L control room</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.05 }}>
            Every lever on the P&L<span style={{ color: T.sand }}>.</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: T.inkSoft, maxWidth: 640 }}>
            Baseline is the June 2026 run-rate rebuilt from the 14-month accounts. Move any lever; the result recalculates instantly.
          </p>
        </header>

        {/* Presets + Save */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          {Object.keys(PRESETS).map((p) => (
            <button key={p} onClick={() => applyPreset(p)} style={{
              padding: "8px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              border: `1.5px solid ${T.line}`, background: T.card, color: T.ink,
            }}>{p}</button>
          ))}
          <button onClick={handleSave} disabled={saveState === "saving"} style={{
            padding: "8px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            border: `1.5px solid ${T.profit}`, background: T.profit, color: T.paper,
            marginLeft: "auto", opacity: saveState === "saving" ? 0.6 : 1,
          }}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : saveState === "error" ? "Save failed" : "Save changes"}
          </button>
          {updatedAt && (
            <span style={{ fontSize: 12, color: T.inkSoft, width: "100%" }}>
              Last saved: {new Date(updatedAt).toLocaleString()}
            </span>
          )}
        </div>

        {/* Sticky results */}
        <div style={{ position: "sticky", top: 0, zIndex: 5, background: T.paper, paddingTop: 8, paddingBottom: 12, borderBottom: `1px solid ${T.line}`, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {kpi("Monthly result", (r.pl >= 0 ? "+" : "−") + Math.abs(Math.round(r.pl)) + "K", r.pl >= 0 ? T.profit : T.loss)}
            {kpi("Annualized", (r.pl >= 0 ? "+" : "−") + Math.abs(r.pl * 12 / 1000).toFixed(1) + "M", r.pl >= 0 ? T.profit : T.loss)}
            {kpi("Total revenue", (r.totalRev / 1000).toFixed(2) + "M")}
            {kpi("Breakeven revenue", isFinite(r.breakeven) && r.breakeven > 0 ? (r.breakeven / 1000).toFixed(1) + "M" : "—", r.breakeven <= r.totalRev ? T.profit : T.sand)}
          </div>
          <RiyalStrip cogs={r.stripCogs} give={r.stripGive} kept={r.stripKept} />
        </div>

        {/* Lever panels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))", gap: 14 }}>
          <Panel title="Revenue" tint={T.blue} subtotal={`net ${(r.net / 1000).toFixed(2)}M`}>
            <Lever label="Gross sales" value={s.grossSales} set={set("grossSales")} min={1500} max={9000} step={50} unit="M" accent={T.blue} />
            <Lever label="Sales returns" value={s.returns} set={set("returns")} min={0} max={12} step={0.1} note="actuals 8.5 · healthy 2–3" accent={T.blue} />
          </Panel>

          <Panel title="Product cost" tint={T.inkSoft} subtotal={`−${Math.round(r.cogsV)}K`}>
            <Lever label="True COGS, % of net revenue" value={s.cogs} set={set("cogs")} min={45} max={75} step={0.1} note="clean actuals 56.9" accent={T.inkSoft} />
          </Panel>

          <Panel title="Trade spend" tint={T.loss} subtotal={`${r.tradePct.toFixed(1)}% · −${Math.round(r.tradeV)}K`}>
            <Lever label="Discounts, rebates & LIQ" value={s.discounts} set={set("discounts")} min={0} max={20} step={0.1} accent={T.loss} />
            <Lever label="Promotions & QTY deals" value={s.promos} set={set("promos")} min={0} max={16} step={0.1} accent={T.loss} />
            <Lever label="Advertising & marketing" value={s.advertising} set={set("advertising")} min={0} max={16} step={0.1} accent={T.loss} />
            <Lever label="Commissions & merchandising" value={s.commissions} set={set("commissions")} min={0} max={6} step={0.1} accent={T.loss} />
          </Panel>

          <Panel title="Waste & credit" tint={T.loss} subtotal={`−${Math.round(r.discardV + s.badDebt + s.fines)}K`}>
            <Lever label="Discards: expiry, write-offs, RTV" value={s.discards} set={set("discards")} min={0} max={8} step={0.1} note="actuals 4.6" accent={T.loss} />
            <Lever label="Doubtful debts" value={s.badDebt} set={set("badDebt")} min={0} max={150} step={1} unit="K" accent={T.loss} />
            <Lever label="Fines & penalties" value={s.fines} set={set("fines")} min={0} max={60} step={1} unit="K" accent={T.loss} />
          </Panel>

          <Panel title="Operations" tint={T.sand} subtotal={`−${Math.round(r.ops)}K`}>
            <Lever label="Warehouse: labour, rent, handling" value={s.warehouse} set={set("warehouse")} min={100} max={400} step={1} unit="K" accent={T.sand} />
            <Lever label="Sales team payroll" value={s.salesPay} set={set("salesPay")} min={50} max={400} step={1} unit="K" accent={T.sand} />
            <Lever label="Vans & fleet" value={s.fleet} set={set("fleet")} min={30} max={200} step={1} unit="K" accent={T.sand} />
            <Lever label="Outward freight" value={s.freight} set={set("freight")} min={0} max={80} step={1} unit="K" accent={T.sand} />
          </Panel>

          <Panel title="Overheads" tint={T.sand} subtotal={`−${Math.round(s.mgmtFee + s.gna)}K`}>
            <Lever label="Management fees" value={s.mgmtFee} set={set("mgmtFee")} min={0} max={800} step={1} unit="K" note="actuals 364" accent={T.sand} />
            <Lever label="G&A payroll, rent, admin" value={s.gna} set={set("gna")} min={40} max={600} step={5} unit="K" note="lean floor ≈ 70" accent={T.sand} />
          </Panel>

          <Panel title="Anchor launches" tint={T.profit} subtotal={r.aRev > 0 ? `+${Math.round(r.aContrib)}K net` : "none"}>
            <Lever label="Launches live" value={s.waves} set={set("waves")} min={0} max={6} step={1} unit="#" accent={T.profit} />
            <div style={{ display: "flex", gap: 8, marginBottom: 13 }}>
              {["cosmetics", "food"].map((k) => (
                <button key={k} onClick={() => setS((p) => ({
                  ...p, anchorType: k,
                  waveSize: k === "food" ? 1870 : 1000,
                  anchorMargin: k === "food" ? 15 : 30,
                }))} style={{
                  padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  border: `1.5px solid ${s.anchorType === k ? T.ink : T.line}`,
                  background: s.anchorType === k ? T.ink : "transparent",
                  color: s.anchorType === k ? T.paper : T.inkSoft,
                }}>{k === "cosmetics" ? "Cosmetics" : "Food"}</button>
              ))}
            </div>
            <Lever label="Revenue per launch" value={s.waveSize} set={set("waveSize")} min={400} max={2500} step={10} unit="M" accent={T.profit} />
            <Lever label="Margin after COGS & trade" value={s.anchorMargin} set={set("anchorMargin")} min={8} max={40} step={0.5} accent={T.profit} />
          </Panel>

          {/* Bridge */}
          <Panel title="From revenue to result" tint={T.ink} subtotal={(r.pl >= 0 ? "+" : "−") + Math.abs(Math.round(r.pl)) + "K"}>
            <div style={{ display: "grid", gap: 7, paddingBottom: 10 }}>
              {bridge.map((b) => (
                <div key={b.l} style={{ display: "grid", gridTemplateColumns: "150px 1fr 60px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: T.inkSoft }}>{b.l}</span>
                  <div style={{ height: 14, position: "relative", background: "rgba(26,36,33,0.05)", borderRadius: 3 }}>
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${(Math.abs(b.v) / maxAbs) * 100}%`, background: b.c, borderRadius: 3, opacity: 0.85 }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", color: b.v >= 0 ? T.ink : T.loss }}>
                    {(b.v >= 0 ? "+" : "−") + Math.abs(Math.round(b.v)) + "K"}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: `1.5px solid ${T.ink}`, marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Monthly result</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: r.pl >= 0 ? T.profit : T.loss, fontVariantNumeric: "tabular-nums" }}>
                  {(r.pl >= 0 ? "+" : "−") + Math.abs(Math.round(r.pl)) + "K"}
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <p style={{ marginTop: 22, fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, maxWidth: 720 }}>
          Baseline levers reflect the reconstructed June 2026 run-rate; the "Today" preset lands near the actual ~1.3M monthly burn.
          Breakeven revenue assumes the base-basket margin structure and treats anchor contribution as an offset to the fixed base.
          Analysis built from the 14-month management accounts — verify cash position and management-fee terms independently.
        </p>
      </div>
    </div>
  );
}
