import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { BASELINE } from "./data.js";

// ------------------------------------------------------------------
// Tokens — identical to ControlRoom.jsx so the two read as one suite
// ------------------------------------------------------------------
const T = {
  ink: "#1A2421", inkSoft: "#4A5450", paper: "#F2F3EE", card: "#FBFBF8",
  line: "rgba(26,36,33,0.14)", profit: "#1D9E75", loss: "#C0442E",
  sand: "#B98A3C", blue: "#2F6690",
};

const SCENARIO = "july2026"; // the row this page reads/writes in Neon

// The months held in data.js. Add a key here when a new month is appended.
const MONTHS = [
  { key: "may", label: "May 2026", short: "May" },
  { key: "jun", label: "Jun 2026", short: "Jun" },
  { key: "jul", label: "Jul 2026", short: "Jul" },
];
const labelOf = (k) => (MONTHS.find((m) => m.key === k) || {}).label || k;

// May comes from the audited pack, June and July from the ledger export.
// Any comparison spanning the two carries a basis difference — flag it.
const SPLIT_BASIS = (a, b) => (a === "may") !== (b === "may");

// ------------------------------------------------------------------
// Formatting
// ------------------------------------------------------------------
const fmt = (n) =>
  (n < 0 ? "(" : "") + Math.abs(Math.round(n)).toLocaleString("en-US") + (n < 0 ? ")" : "");
const pct = (n, d = 1) => (n > 0 ? "+" : "") + (n * 100).toFixed(d) + "%";
const tone = (n) => (n < 0 ? T.loss : n > 0 ? T.profit : T.ink);

// ------------------------------------------------------------------
// The model — one pass over the rows, on either basis
// ------------------------------------------------------------------
const GROUP_ORDER = [...new Set(BASELINE.filter((r) => r.s === "OPEX").map((r) => r.g))];

function model(rows, month, basis) {
  const val = (r) => (basis === "norm" && r.o ? 0 : r[month]);
  const sum = (f) => rows.filter(f).reduce((a, r) => a + val(r), 0);
  const raw = (f) => rows.filter(f).reduce((a, r) => a + r[month], 0);

  const rev = raw((r) => r.c === "41000000");
  const ret = raw((r) => r.c === "41001000");
  const net = rev + ret;
  const cogs = sum((r) => r.s === "COGS");
  const gp = net - cogs;

  const groups = {};
  GROUP_ORDER.forEach((g) => (groups[g] = sum((r) => r.g === g)));
  const opex = Object.values(groups).reduce((a, b) => a + b, 0);

  const op = gp - opex;
  const noi = sum((r) => r.s === "NOI");
  const noe = sum((r) => r.s === "NOE");
  const dep = groups["Depreciation"] || 0;

  return {
    rev, ret, net, cogs, gp, groups, opex, op, noi, noe,
    profit: op + noi - noe, dep,
    gm: net ? gp / net : 0,
    retPct: rev ? -ret / rev : 0,
  };
}

// ------------------------------------------------------------------
// Small pieces — Panel and Cell match the Control Room's shapes
// ------------------------------------------------------------------
function Panel({ title, tint, subtotal, hint, children, span }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.line}`, borderTop: `3px solid ${tint}`,
      borderRadius: 12, padding: "16px 18px 18px", gridColumn: span ? "1 / -1" : "auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: T.ink }}>
          {title}
          {hint && <em style={{ fontStyle: "normal", fontFamily: "'Archivo', sans-serif", color: "#9AA49D", fontSize: 12.5, fontWeight: 400 }}> · {hint}</em>}
        </h3>
        {subtotal && (
          <span style={{ fontSize: 13, fontWeight: 600, color: tint, fontVariantNumeric: "tabular-nums" }}>{subtotal}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// An editable figure. Shows formatted text; becomes a raw input on focus.
function Money({ value, onChange, edited, invert }) {
  const [draft, setDraft] = useState(null);
  const active = draft !== null;
  return (
    <input
      value={active ? draft : fmt(value)}
      onFocus={() => setDraft(String(Math.round(value)))}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = parseFloat(String(draft).replace(/[(),\s]/g, ""));
        const neg = /^\(.*\)$/.test(String(draft).trim());
        if (!isNaN(n)) onChange(neg ? -Math.abs(n) : n);
        setDraft(null);
      }}
      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setDraft(null); e.target.blur(); } }}
      inputMode="numeric"
      style={{
        width: "100%", textAlign: "right", font: "inherit", fontSize: 13,
        fontVariantNumeric: "tabular-nums",
        color: invert ? tone(-value) : tone(value),
        background: edited ? "rgba(47,102,144,0.10)" : "transparent",
        border: `1px solid ${active ? T.blue : "transparent"}`,
        borderRadius: 5, padding: "3px 6px", outline: "none",
        cursor: active ? "text" : "pointer",
      }}
    />
  );
}

function Row({ label, a, b, share, invert, weight, top, muted, flag, onClick, open, children }) {
  const d = b - a;
  const p = a ? d / Math.abs(a) : 0;
  return (
    <tr
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        borderTop: top ? `1.5px solid ${T.line}` : "none",
        color: muted ? T.inkSoft : T.ink,
      }}
    >
      <td style={{ padding: "6px 8px 6px 0", fontSize: 13, fontWeight: weight || 400 }}>
        {onClick && (
          <span style={{ display: "inline-block", width: 14, color: T.inkSoft, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
        )}
        {label}
        {flag && <span title="treated as one-off / non-cash" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: T.sand, marginLeft: 6, verticalAlign: "middle" }} />}
      </td>
      {children || (
        <>
          <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(a)}</td>
          <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(b)}</td>
        </>
      )}
      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "6px 8px", color: invert ? tone(-d) : tone(d) }}>{fmt(d)}</td>
      <td style={{ textAlign: "right", fontSize: 12.5, color: T.inkSoft, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{a ? pct(p) : "—"}</td>
      <td style={{ textAlign: "right", fontSize: 12.5, color: T.inkSoft, fontVariantNumeric: "tabular-nums", padding: "6px 0 6px 8px" }}>
        {share !== undefined ? (share * 100).toFixed(1) + "%" : ""}
      </td>
    </tr>
  );
}

// Composition of every 100 riyals of net revenue — the Control Room's strip, re-pointed
function RiyalStrip({ cogs, opex, kept }) {
  const seg = (n, color, name) => (
    <div key={name} style={{ width: `${Math.max(n, 0)}%`, minWidth: n > 0.3 ? 2 : 0 }} title={`${name}: ${n.toFixed(1)} per 100`}>
      <div style={{ height: 30, background: color, borderRadius: 3, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 8px)" }} />
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 3 }}>
        {seg(cogs, T.inkSoft, "Cost of goods")}
        {seg(opex, T.loss, "Operating expenses")}
        {seg(Math.max(kept, 0), T.profit, "Kept")}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: T.inkSoft }}>
        <span><b style={{ color: T.ink }}>{cogs.toFixed(0)}</b> cost of goods</span>
        <span><b style={{ color: T.loss }}>{opex.toFixed(1)}</b> operating expenses</span>
        <span><b style={{ color: kept >= 0 ? T.profit : T.loss }}>{kept.toFixed(1)}</b> {kept >= 0 ? "kept" : "lost"} per 100</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// App
// ------------------------------------------------------------------
export default function JulyBrief() {
  const [rows, setRows] = useState(() => BASELINE.map((r) => ({ ...r })));
  const [mA, setMA] = useState("jun"); // base month
  const [mB, setMB] = useState("jul"); // month being compared
  const [basis, setBasis] = useState("rep"); // rep | norm
  const [openGroups, setOpenGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const [updatedAt, setUpdatedAt] = useState(null);

  // Load the shared saved version on first render
  useEffect(() => {
    fetch(`/api/scenario/${SCENARIO}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data.rows)) {
          setRows(res.data.rows);
          setUpdatedAt(res.updated_at);
        }
      })
      .catch((err) => console.error("Load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/scenario/${SCENARIO}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
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

  const edit = useCallback((code, month, v) => {
    setRows((p) => p.map((r) => (r.c === code ? { ...r, [month]: v } : r)));
  }, []);
  const toggleOneOff = (code) =>
    setRows((p) => p.map((r) => (r.c === code ? { ...r, o: !r.o } : r)));
  const resetAll = () => setRows(BASELINE.map((r) => ({ ...r })));

  const isEdited = useMemo(() => {
    const base = Object.fromEntries(BASELINE.map((r) => [r.c, r]));
    return (code, month) => base[code] && Math.round(base[code][month]) !== Math.round(rows.find((r) => r.c === code)[month]);
  }, [rows]);

  const dirty = useMemo(
    () => rows.some((r, i) => MONTHS.some((m) => Math.round(r[m.key]) !== Math.round(BASELINE[i][m.key]))),
    [rows]
  );

  // Both bases, both months — the whole page reads off these four
  const { rJ, rL, nJ, nL, J, L } = useMemo(() => {
    const rJ = model(rows, mA, "rep"), rL = model(rows, mB, "rep");
    const nJ = model(rows, mA, "norm"), nL = model(rows, mB, "norm");
    return { rJ, rL, nJ, nL, J: basis === "rep" ? rJ : nJ, L: basis === "rep" ? rL : nL };
  }, [rows, basis, mA, mB]);

  const repGain = rL.profit - rJ.profit;
  const normGain = nL.profit - nJ.profit;
  const oneoffSwing = repGain - normGain;
  const scale = Math.max(Math.abs(repGain), 1);

  const oneoffTotal = (m) => rows.filter((r) => r.o).reduce((a, r) => a + r[m], 0);
  const flagged = rows.filter((r) => r.note);

  const swings = useMemo(
    () => [...rows].sort((x, y) => Math.abs(y[mB] - y[mA]) - Math.abs(x[mB] - x[mA])).slice(0, 12),
    [rows, mA, mB]
  );

  const opexSorted = useMemo(
    () => [...GROUP_ORDER].sort((a, b) => Math.abs(L.groups[b] - J.groups[b]) - Math.abs(L.groups[a] - J.groups[a])),
    [J, L]
  );
  const opexMax = Math.max(...GROUP_ORDER.map((g) => Math.max(J.groups[g], L.groups[g])), 1);

  const kpi = (label, val, delta, colour) => (
    <div key={label} style={{ flex: "1 1 140px", background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: colour || T.ink, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ fontSize: 11.5, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{delta}</div>
    </div>
  );

  const pill = (active, onClick, children, key) => (
    <button key={key} onClick={onClick} style={{
      padding: "8px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
      border: `1.5px solid ${active ? T.ink : T.line}`,
      background: active ? T.ink : T.card, color: active ? T.paper : T.ink,
    }}>{children}</button>
  );

  const shortA = (MONTHS.find((m) => m.key === mA) || {}).short || mA;
  const shortB = (MONTHS.find((m) => m.key === mB) || {}).short || mB;
  const selectStyle = {
    padding: "7px 11px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
    border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink,
    fontFamily: "inherit", cursor: "pointer",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.paper, color: T.inkSoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Archivo', system-ui, sans-serif" }}>
        Loading saved figures…
      </div>
    );
  }

  const bridge = [
    { l: "Net revenue", v: L.net, c: T.blue },
    { l: "Cost of goods", v: -L.cogs, c: T.inkSoft },
    { l: "Operating expenses", v: -L.opex, c: T.loss },
    { l: "Non-operating", v: L.noi - L.noe, c: T.sand },
  ];
  const maxAbs = Math.max(...bridge.map((b) => Math.abs(b.v)), 1);

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Archivo', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap');
        button{ font-family: inherit; cursor: pointer; }
        table{ width:100%; border-collapse: collapse; }
        th{ font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:${T.inkSoft};
            font-weight:600; text-align:right; padding:0 8px 8px; border-bottom:1px solid ${T.line}; }
        th:first-child{ text-align:left; padding-left:0; }
        th:last-child{ padding-right:0; }
        input[type=checkbox]{ accent-color:${T.sand}; width:15px; height:15px; }
        @media (prefers-reduced-motion: reduce){ *{ transition: none !important; } }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 20px 80px" }}>
        {/* Masthead */}
        <header style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.sand, fontWeight: 600 }}>
              Tayseer Trading · {labelOf(mB)} against {labelOf(mA)}
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.05 }}>
              The month, line by line<span style={{ color: T.sand }}>.</span>
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14.5, color: T.inkSoft, maxWidth: 660 }}>
              Every figure below is editable. Click a number, type a new one, and the statement, the bridge and the
              underlying result all recalculate.
            </p>
          </div>
          <div style={{ fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: T.inkSoft, lineHeight: 1.9, textAlign: "right" }}>
            Prepared <b style={{ color: T.ink }}>10 Aug 2026</b><br />
            Accrual basis · figures <b style={{ color: T.ink }}>SAR</b>
          </div>
        </header>

        {/* Month picker */}
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12,
          background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px",
        }}>
          <span style={{ fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600 }}>Compare</span>
          <select value={mA} onChange={(e) => setMA(e.target.value)} style={selectStyle}>
            {MONTHS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <span style={{ fontSize: 12.5, color: T.inkSoft }}>against</span>
          <select value={mB} onChange={(e) => setMB(e.target.value)} style={selectStyle}>
            {MONTHS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <button onClick={() => { setMA(mB); setMB(mA); }} title="Swap the two months" style={{
            padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink,
          }}>⇄ Swap</button>
          {mA === mB && (
            <span style={{ fontSize: 12.5, color: T.loss, fontWeight: 600 }}>Same month on both sides — pick two different months.</span>
          )}
          {mA !== mB && SPLIT_BASIS(mA, mB) && (
            <span style={{ fontSize: 12.5, color: T.sand, fontWeight: 600 }}>
              Mixed sources: May is the audited pack, June and July the ledger export. See the notes.
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          {pill(basis === "rep", () => setBasis("rep"), "As reported", "rep")}
          {pill(basis === "norm", () => setBasis("norm"), "Underlying", "norm")}
          <span style={{ fontSize: 12.5, color: T.inkSoft, marginRight: "auto" }}>
            {basis === "rep" ? "Every figure as booked." : "Ticked one-off and non-cash lines removed from both months."}
          </span>
          <button onClick={resetAll} disabled={!dirty} style={{
            padding: "8px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            border: `1.5px solid ${T.line}`, background: T.card, color: dirty ? T.ink : "#9AA49D",
            cursor: dirty ? "pointer" : "default",
          }}>Reset to actuals</button>
          <button onClick={handleSave} disabled={saveState === "saving"} style={{
            padding: "8px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            border: `1.5px solid ${T.profit}`, background: T.profit, color: T.paper,
            opacity: saveState === "saving" ? 0.6 : 1,
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
            {kpi("Net revenue", fmt(L.net), pct((L.net - J.net) / Math.abs(J.net || 1)) + " vs " + shortA)}
            {kpi("Gross margin", (L.gm * 100).toFixed(1) + "%", ((L.gm - J.gm) * 100).toFixed(1) + " pts vs " + shortA)}
            {kpi("Operating expenses", fmt(L.opex), pct((L.opex - J.opex) / Math.abs(J.opex || 1)) + " vs " + shortA, T.sand)}
            {kpi("Net result", fmt(L.profit), fmt(L.profit - J.profit) + " vs " + shortA, tone(L.profit))}
            {kpi("Annualised", (L.profit * 12 / 1e6).toFixed(2) + "M", "at this run rate", tone(L.profit))}
          </div>
          <RiyalStrip
            cogs={L.net ? (L.cogs / L.net) * 100 : 0}
            opex={L.net ? (L.opex / L.net) * 100 : 0}
            kept={L.net ? (L.profit / L.net) * 100 : 0}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          {/* Reported vs underlying */}
          <Panel title={`Two versions of ${labelOf(mB)}`} tint={T.blue} hint="read this before the headline">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { lab: "As reported", v: rL.profit, gain: repGain, base: rJ.profit, cap: `The result for ${labelOf(mB)} exactly as booked.` },
                { lab: "Underlying", v: nL.profit, gain: normGain, base: nJ.profit, cap: "One-off and non-cash charges stripped from both months." },
              ].map((x) => (
                <div key={x.lab}>
                  <div style={{ fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkSoft }}>{x.lab}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 27, fontWeight: 700, color: tone(x.v), fontVariantNumeric: "tabular-nums", margin: "4px 0 6px" }}>
                    {fmt(x.v)}
                  </div>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.5 }}>{x.cap}</div>
                  <div style={{
                    display: "inline-block", marginTop: 8, padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                    background: "rgba(29,158,117,0.12)", color: T.profit,
                  }}>
                    {x.gain >= 0 ? "Loss cut" : "Loss widened"} {Math.abs(Math.round((x.gain / Math.abs(x.base || 1)) * 100))}% against {shortA}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.line}`, display: "grid", gap: 7 }}>
              {[
                { l: "Reported improvement", v: repGain, c: T.profit },
                { l: `${shortA} one-offs rolling off`, v: -oneoffSwing, c: T.sand },
                { l: "Underlying improvement", v: normGain, c: T.profit },
              ].map((b) => (
                <div key={b.l} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 70px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: T.inkSoft }}>{b.l}</span>
                  <div style={{ height: 14, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                    <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${Math.min((Math.abs(b.v) / scale) * 100, 100)}%`, background: b.c, borderRadius: 3, opacity: 0.85 }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", color: b.c }}>{fmt(b.v)}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "12px 0 0" }}>
              Of the SAR {fmt(Math.abs(repGain))} the reported result {repGain >= 0 ? "improved" : "worsened"} by, SAR{" "}
              {fmt(Math.abs(oneoffSwing))} is one-off and non-cash charges not repeating between the two months. The
              underlying movement is SAR {fmt(normGain)}. On the underlying basis {labelOf(mB)} loses roughly SAR{" "}
              {fmt(-nL.profit)} before any of it is explained by trading.
            </p>
          </Panel>

          {/* Returns */}
          <Panel title="The returns problem" tint={T.loss} hint="largest adverse swing in the file">
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 27, fontWeight: 700, color: T.loss, fontVariantNumeric: "tabular-nums" }}>
              {fmt(rL.ret)}
            </div>
            <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6, margin: "8px 0 14px" }}>
              Gross sales moved {pct((rL.rev - rJ.rev) / Math.abs(rJ.rev))} month on month. Returns moved{" "}
              {pct((Math.abs(rL.ret) - Math.abs(rJ.ret)) / Math.abs(rJ.ret || 1), 0)} and swallowed it — net revenue finished{" "}
              <b style={{ color: tone(rL.net - rJ.net) }}>{pct((rL.net - rJ.net) / Math.abs(rJ.net))}</b>.
            </div>
            {[["a", labelOf(mA), rJ.retPct, "rgba(26,36,33,0.25)"], ["b", labelOf(mB), rL.retPct, T.loss]].map(([k, lab, v, c]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "70px 1fr 52px", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: T.inkSoft }}>{lab}</span>
                <div style={{ height: 14, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                  <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${Math.min((v / Math.max(rJ.retPct, rL.retPct, 0.0001)) * 100, 100)}%`, background: c, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{(v * 100).toFixed(1)}%</span>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: "#9AA49D", marginTop: 4 }}>Returns as a share of gross sales</div>
            <ul style={{ margin: "16px 0 0", paddingLeft: 18, fontSize: 12.5, color: T.inkSoft, lineHeight: 1.7 }}>
              <li>One customer rejecting a shipment, or spread across the base?</li>
              <li>Expiry-driven? That would connect it to the near-expiry allowance and the RTV line.</li>
              <li>Were the goods credited back into inventory, or written off?</li>
              <li>Gross margin still improved. Confirm the returns carried cost back out with them — if not, margin is overstated.</li>
            </ul>
          </Panel>

          {/* Bridge */}
          <Panel title="From revenue to result" tint={T.ink} subtotal={fmt(L.profit)} hint={basis === "rep" ? "as reported" : "underlying"}>
            <div style={{ display: "grid", gap: 7 }}>
              {bridge.map((b) => (
                <div key={b.l} style={{ display: "grid", gridTemplateColumns: "140px 1fr 80px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: T.inkSoft }}>{b.l}</span>
                  <div style={{ height: 14, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                    <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${(Math.abs(b.v) / maxAbs) * 100}%`, background: b.c, borderRadius: 3, opacity: 0.85 }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", color: b.v >= 0 ? T.ink : T.loss }}>{fmt(b.v)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1.5px solid ${T.ink}`, marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Net result</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: tone(L.profit), fontVariantNumeric: "tabular-nums" }}>{fmt(L.profit)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.inkSoft }}>
                <span>Result before depreciation</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(L.profit + L.dep)}</span>
              </div>
            </div>
          </Panel>

          {/* Opex by group */}
          <Panel title="Operating expenses by group" tint={T.sand} hint="sorted by size of movement">
            <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: T.inkSoft, marginBottom: 10 }}>
              <span><i style={{ display: "inline-block", width: 9, height: 9, background: "rgba(26,36,33,0.25)", borderRadius: 2, marginRight: 5 }} />{labelOf(mA)}</span>
              <span><i style={{ display: "inline-block", width: 9, height: 9, background: T.ink, borderRadius: 2, marginRight: 5 }} />{labelOf(mB)}</span>
            </div>
            <div style={{ display: "grid", gap: 9 }}>
              {opexSorted.map((g) => {
                const j = J.groups[g], l = L.groups[g], d = l - j;
                return (
                  <div key={g} style={{ display: "grid", gridTemplateColumns: "125px 1fr 68px 68px", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: T.inkSoft }}>{g}</span>
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ height: 7, width: `${Math.max((j / opexMax) * 100, 0)}%`, background: "rgba(26,36,33,0.25)", borderRadius: 2 }} />
                      <div style={{ height: 7, width: `${Math.max((l / opexMax) * 100, 0)}%`, background: T.ink, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12.5, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(l)}</span>
                    <span style={{ fontSize: 12.5, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: tone(-d) }}>{fmt(d)}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Judgement calls */}
          <Panel title="Judgement calls" tint={T.sand} hint="untick anything Tayseer disputes" span>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 12px" }}>
              These lines are treated as one-off or non-cash. That classification is ours, not Tayseer's accounting policy.
              Get it confirmed before the underlying figure is quoted as fact.
            </p>
            <div style={{ display: "grid", gap: 2 }}>
              {flagged.map((r) => (
                <label key={r.c} style={{
                  display: "grid", gridTemplateColumns: "22px 1fr 110px 110px", gap: 8, alignItems: "center",
                  padding: "8px 6px", borderRadius: 7, cursor: "pointer",
                  background: r.o ? "rgba(185,138,60,0.08)" : "transparent",
                  opacity: r.o ? 1 : 0.5,
                }}>
                  <input type="checkbox" checked={r.o} onChange={() => toggleOneOff(r.c)} />
                  <span style={{ fontSize: 13 }}>
                    <b>{r.n}</b>
                    <span style={{ display: "block", fontSize: 12, color: T.inkSoft }}>{r.note}</span>
                  </span>
                  <span style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{fmt(r[mA])}</span>
                  <span style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{fmt(r[mB])}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 110px 110px", gap: 8, marginTop: 8, paddingTop: 10, borderTop: `1.5px solid ${T.ink}`, fontSize: 13, fontWeight: 600 }}>
              <span /><span>Total stripped from each period</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(oneoffTotal(mA))}</span>
              <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(oneoffTotal(mB))}</span>
            </div>
          </Panel>

          {/* The statement */}
          <Panel title="Profit &amp; loss" tint={T.blue} hint="click a group to open it · click any figure to change it" span>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 240 }}>Account</th>
                    <th>{labelOf(mA)}</th><th>{labelOf(mB)}</th><th>Change</th><th>Change %</th><th>% of net rev</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Gross sales revenue" a={J.rev} b={L.rev} share={L.net ? L.rev / L.net : 0} />
                  <Row label="Sales returns" a={J.ret} b={L.ret} share={L.net ? L.ret / L.net : 0} />
                  <Row label="Net revenue" a={J.net} b={L.net} share={1} weight={600} top />
                  <Row label="Cost of goods sold" a={J.cogs} b={L.cogs} share={L.net ? L.cogs / L.net : 0} invert />
                  <Row label="Gross profit" a={J.gp} b={L.gp} share={L.net ? L.gp / L.net : 0} weight={600} top />

                  <tr><td colSpan={6} style={{ padding: "16px 0 4px", fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600 }}>Operating expenses</td></tr>

                  {GROUP_ORDER.map((g) => (
                    <Fragment key={g}>
                      <Row
                        label={g}
                        a={J.groups[g]}
                        b={L.groups[g]}
                        share={L.net ? L.groups[g] / L.net : 0}
                        invert
                        weight={600}
                        onClick={() => setOpenGroups((p) => ({ ...p, [g]: !p[g] }))}
                        open={openGroups[g]}
                      />
                      {openGroups[g] &&
                        rows.filter((r) => r.g === g).map((r) => {
                          const shown = basis === "norm" && r.o;
                          return (
                            <Row
                              key={r.c}
                              label={<span style={{ paddingLeft: 16, color: shown ? "#9AA49D" : T.inkSoft, textDecoration: shown ? "line-through" : "none" }}>{r.n}</span>}
                              a={shown ? 0 : r[mA]}
                              b={shown ? 0 : r[mB]}
                              invert
                              flag={r.o}
                            >
                              <td style={{ padding: "2px 4px", width: 110 }}>
                                <Money value={r[mA]} onChange={(v) => edit(r.c, mA, v)} edited={isEdited(r.c, mA)} invert />
                              </td>
                              <td style={{ padding: "2px 4px", width: 110 }}>
                                <Money value={r[mB]} onChange={(v) => edit(r.c, mB, v)} edited={isEdited(r.c, mB)} invert />
                              </td>
                            </Row>
                          );
                        })}
                    </Fragment>
                  ))}

                  <Row label="Total operating expenses" a={J.opex} b={L.opex} share={L.net ? L.opex / L.net : 0} invert weight={600} top />
                  <Row label="Operating result" a={J.op} b={L.op} share={L.net ? L.op / L.net : 0} weight={600} top />
                  <Row label="Non-operating income" a={J.noi} b={L.noi} share={L.net ? L.noi / L.net : 0} />
                  <Row label="Non-operating expense" a={J.noe} b={L.noe} share={L.net ? L.noe / L.net : 0} invert />
                  <Row label="Net result" a={J.profit} b={L.profit} share={L.net ? L.profit / L.net : 0} weight={700} top />
                  <Row label="Memo — result before depreciation" a={J.profit + J.dep} b={L.profit + L.dep} muted />
                </tbody>
              </table>
            </div>

            {/* Revenue lines are edited here, since they drive everything above */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600, marginBottom: 8 }}>
                Revenue and cost of sales — edit directly
              </div>
              <table>
                <tbody>
                  {rows.filter((r) => r.s === "REV" || r.s === "COGS" || r.s === "NOI" || r.s === "NOE").map((r) => (
                    <Row key={r.c} label={r.n} a={r[mA]} b={r[mB]} invert={r.s === "COGS" || r.s === "NOE"} flag={r.o}>
                      <td style={{ padding: "2px 4px", width: 110 }}>
                        <Money value={r[mA]} onChange={(v) => edit(r.c, mA, v)} edited={isEdited(r.c, mA)} />
                      </td>
                      <td style={{ padding: "2px 4px", width: 110 }}>
                        <Money value={r[mB]} onChange={(v) => edit(r.c, mB, v)} edited={isEdited(r.c, mB)} />
                      </td>
                    </Row>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Swings */}
          <Panel title="Twelve largest swings" tint={T.ink} hint="line level, by absolute size" span>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Account</th>
                    <th style={{ textAlign: "left" }}>Group</th>
                    <th>{labelOf(mA)}</th><th>{labelOf(mB)}</th><th>Swing</th><th>Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {swings.map((r) => {
                    const d = r[mB] - r[mA];
                    const good = r.s === "COGS" || r.s === "OPEX" || r.s === "NOE" ? d < 0 : d > 0;
                    return (
                      <tr key={r.c}>
                        <td style={{ padding: "6px 8px 6px 0", fontSize: 13 }}>
                          {r.n}
                          {r.o && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: T.sand, marginLeft: 6, verticalAlign: "middle" }} />}
                        </td>
                        <td style={{ fontSize: 12, color: T.inkSoft, padding: "6px 8px" }}>{r.g}</td>
                        <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(r[mA])}</td>
                        <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(r[mB])}</td>
                        <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(d)}</td>
                        <td style={{ textAlign: "right", fontSize: 12.5, fontWeight: 600, padding: "6px 0 6px 8px", color: good ? T.profit : T.loss }}>
                          {good ? "Favourable" : "Adverse"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Notes */}
          <Panel title="Notes and caveats" tint={T.inkSoft} span>
            <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.65, display: "grid", gap: 10, maxWidth: 860 }}>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Where the figures come from.</b> May 2026 is taken from the audited analysis pack and ties to that pack&rsquo;s own subtotals to the riyal. June and July come from the later ledger export. The two do not agree on June: 16 accounts differ, and in total the ledger shows June SAR 189,706 worse than the audited pack — the largest single differences being the near-expiry inventory allowance (321,891 against 200,000), the Nongshim liquidation discount (46,292 against nil) and product listing fees (53,968 against 17,968). A June-to-July comparison is clean, since both sides come from the same export. A May-to-June comparison carries that basis difference inside it. Reconcile the two Junes before either month is presented externally.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Cross-check.</b> The July net loss of SAR 295,646 as booked agrees exactly to the net income line on the July cash flow statement. The two statements are consistent.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Advertising (June/July).</b> SAR 1,040,763 in June against SAR 16,137 in July looks like a campaign accrual or annual booking rather than monthly spend. If it covers a full year, roughly SAR 87k a month belongs in the run rate.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Listing fees (June/July).</b> +53,968 in June and −53,968 in July is a straight reversal. July is flattered by that credit.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Management fees (June/July).</b> SAR 310,592 hit June and nothing in July. If the billing is quarterly, July is understated and the underlying gap is wider than shown.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Balance sheet flags.</b> Several balances sit the wrong way round: advance payments to supplier (122,999), prepaid medical insurance (15,398), ATL marketing support (79,826), Zoho payroll bank account (31,000). Worth clearing before these statements reach a lender or auditor.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Receivables presentation.</b> The AR control account carries SAR 0.01 while domestic receivables of SAR 7,375,338 sit under other assets. Presentation rather than substance, but it will be queried.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>The bigger question.</b> Current year earnings on the balance sheet stand at (8,306,219). Two months of P&amp;L cannot explain that. The year-to-date picture is the conversation this leads to.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>Four added accounts.</b> Withholding tax, S&amp;D recruitment fees, S&amp;D bonus and S&amp;D overtime carry May activity in the audited pack but no account code, and they do not appear in the June/July export at all. They are shown with codes beginning AUD- and nil in June and July. Confirm whether they were reclassified or simply stopped.</p>
              <p style={{ margin: 0 }}><b style={{ color: T.ink }}>What is missing.</b> No budget and no prior-year comparative were provided, and there is no volume, price or customer mix data — so the revenue movement cannot yet be split into rate against volume.</p>
              {dirty && (
                <p style={{ margin: 0, color: T.blue }}>
                  <b>Figures edited.</b> Some numbers on this page no longer match the underlying accounts. Reset to actuals before circulating.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
