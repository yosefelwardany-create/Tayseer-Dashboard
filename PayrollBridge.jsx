import { useState, useMemo } from "react";
import { MONTHS } from "./data.js";
import { payroll, PAYROLL_ROWS, ONE_TIME_CANDIDATES, DEFAULT_ONE_TIME } from "./finance.js";

const T = {
  ink: "#1A2421", inkSoft: "#4A5450", paper: "#F2F3EE", card: "#FBFBF8",
  line: "rgba(26,36,33,0.14)", profit: "#1D9E75", loss: "#C0442E",
  sand: "#B98A3C", blue: "#2F6690",
};

const fmt = (n) => (n < 0 ? "(" : "") + Math.abs(Math.round(n)).toLocaleString("en-US") + (n < 0 ? ")" : "");
const pct = (n, d = 1) => (n > 0 ? "+" : "") + (n * 100).toFixed(d) + "%";
const shortOf = (k) => (MONTHS.find((m) => m.key === k) || {}).short || k;
const labelOf = (k) => (MONTHS.find((m) => m.key === k) || {}).label || k;

function Panel({ title, tint, hint, subtotal, children, span }) {
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
        {subtotal && <span style={{ fontSize: 13, fontWeight: 600, color: tint, fontVariantNumeric: "tabular-nums" }}>{subtotal}</span>}
      </div>
      {children}
    </div>
  );
}

export default function PayrollBridge() {
  const [oneTime, setOneTime] = useState(DEFAULT_ONE_TIME);
  const [mA, setMA] = useState("jun");
  const [mB, setMB] = useState("jul");

  const toggle = (code) =>
    setOneTime((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));

  const byMonth = useMemo(
    () => Object.fromEntries(MONTHS.map((m) => [m.key, payroll(m.key, oneTime)])),
    [oneTime]
  );

  const A = byMonth[mA], B = byMonth[mB];
  const dUnder = B.underlying - A.underlying;
  const pUnder = A.underlying ? dUnder / A.underlying : 0;
  const dBasic = B.basic - A.basic;
  const pBasic = A.basic ? dBasic / A.basic : 0;
  const dOut = B.outsourced - A.outsourced;
  const pOut = A.outsourced ? dOut / A.outsourced : 0;

  const candidates = ONE_TIME_CANDIDATES
    .map((c) => PAYROLL_ROWS.find((r) => r.c === c))
    .filter(Boolean);

  const movers = useMemo(
    () => [...PAYROLL_ROWS]
      .map((r) => ({ ...r, d: (r[mB] || 0) - (r[mA] || 0) }))
      .filter((r) => Math.abs(r.d) > 500)
      .sort((x, y) => Math.abs(y.d) - Math.abs(x.d))
      .slice(0, 10),
    [mA, mB]
  );

  const maxUnder = Math.max(...MONTHS.map((m) => byMonth[m.key].underlying), 1);

  const kpi = (label, val, sub, colour) => (
    <div key={label} style={{ flex: "1 1 150px", background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: colour || T.ink, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ fontSize: 11.5, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{sub}</div>
    </div>
  );

  const selectStyle = {
    padding: "7px 11px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
    border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink,
    fontFamily: "inherit", cursor: "pointer",
  };

  // The conclusion is written from the numbers, so it stays honest whatever
  // gets ticked as one-time. Three cases: recurring flat, recurring up on flat
  // headcount (rates or substitution), recurring up alongside basic salaries
  // (hiring or raises).
  const flat = Math.abs(pUnder) < 0.02;
  const basicMoved = Math.abs(pBasic) > 0.05;
  const verdict = flat
    ? `With ${oneTime.length} line${oneTime.length === 1 ? "" : "s"} set aside as one-time, recurring payroll is essentially flat between ${labelOf(mA)} and ${labelOf(mB)} (${pct(pUnder)}). On these books the one-time explanation holds for the headline.${basicMoved ? ` But the mix moved underneath it: basic salaries went ${pct(pBasic)}, offset elsewhere — ask what was hired and what was cut.` : ""}`
    : dUnder > 0
      ? basicMoved
        ? `Even with ${oneTime.length} line${oneTime.length === 1 ? "" : "s"} set aside as one-time, recurring payroll rose SAR ${fmt(dUnder)} (${pct(pUnder)}) between ${labelOf(mA)} and ${labelOf(mB)}, and basic salaries rose ${pct(pBasic)} with it — hiring or pay rises, not one-time costs. Ask for headcount by month.`
        : `Even with ${oneTime.length} line${oneTime.length === 1 ? "" : "s"} set aside as one-time, recurring payroll rose SAR ${fmt(dUnder)} (${pct(pUnder)}) between ${labelOf(mA)} and ${labelOf(mB)} while basic salaries moved only ${pct(pBasic)} — so it is not headcount. The rise sits in rates, allowances or outsourced substitution, and the one-time explanation does not cover it.`
      : `With these lines set aside, recurring payroll fell SAR ${fmt(-dUnder)} (${pct(pUnder)}) between ${labelOf(mA)} and ${labelOf(mB)}. On this classification the one-time explanation holds — check whether every line ticked above is genuinely non-recurring before accepting it.`;

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Archivo', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap');
        button{ font-family: inherit; cursor: pointer; }
        table{ width:100%; border-collapse: collapse; }
        th{ font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:${T.inkSoft};
            font-weight:600; text-align:right; padding:0 8px 8px; border-bottom:1px solid ${T.line}; }
        th:first-child{ text-align:left; padding-left:0; }
        input[type=checkbox]{ accent-color:${T.sand}; width:15px; height:15px; }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 20px 80px" }}>
        <header style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.sand, fontWeight: 600 }}>
            Tayseer Trading · Payroll
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.05 }}>
            Was it really one-time<span style={{ color: T.sand }}>?</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: T.inkSoft, maxWidth: 660 }}>
            Tick whichever lines Tayseer claims are non-recurring. Whatever is left is what turns up again next
            month — and that is the number the payroll question turns on.
          </p>
        </header>

        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16,
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
          <button onClick={() => { setMA(mB); setMB(mA); }} style={{
            padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink,
          }}>⇄ Swap</button>
          <button onClick={() => setOneTime(DEFAULT_ONE_TIME)} style={{
            padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink, marginLeft: "auto",
          }}>Reset to notice pay only</button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {kpi("Recurring payroll", fmt(B.underlying), `${fmt(dUnder)} vs ${shortOf(mA)}`, dUnder > 0 ? T.loss : T.profit)}
          {kpi("Change", pct(pUnder), "excluding ticked lines", dUnder > 0 ? T.loss : T.profit)}
          {kpi("Basic salaries", fmt(B.basic), `${pct(pBasic)} vs ${shortOf(mA)} · headcount proxy`, Math.abs(pBasic) < 0.05 ? T.ink : T.sand)}
          {kpi("Outsourced labour", fmt(B.outsourced), `${pct(pOut)} vs ${shortOf(mA)}`, dOut > 0 ? T.loss : T.profit)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          <Panel title="What Tayseer calls one-time" tint={T.sand} hint="tick to set aside" span>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 12px" }}>
              Notice pay is ticked to begin with — a termination cost is non-recurring on any reading. Everything
              else is offered because someone might argue for it, not because it qualifies. Visas, iqamas and school
              fees recur annually; bonuses recur by policy.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
              {candidates.map((r) => (
                <label key={r.c} style={{
                  display: "grid", gridTemplateColumns: "22px 1fr 90px", gap: 8, alignItems: "center",
                  padding: "7px 6px", borderRadius: 7, cursor: "pointer",
                  background: oneTime.includes(r.c) ? "rgba(185,138,60,0.10)" : "transparent",
                }}>
                  <input type="checkbox" checked={oneTime.includes(r.c)} onChange={() => toggle(r.c)} />
                  <span style={{ fontSize: 12.5 }}>{r.n}</span>
                  <span style={{ textAlign: "right", fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: T.inkSoft }}>{fmt(r[mB] || 0)}</span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Payroll by month" tint={T.blue} hint="all three months, as filed" span>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Component</th>
                    {MONTHS.map((m) => <th key={m.key}>{m.label}</th>)}
                    <th>{shortOf(mA)} → {shortOf(mB)}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { l: "Core payroll — salaries, allowances, GOSI", k: "core" },
                    { l: "Outsourced & casual labour", k: "outsourced" },
                    { l: "Set aside as one-time", k: "oneOff", muted: true },
                  ].map((row) => (
                    <tr key={row.k} style={{ color: row.muted ? T.inkSoft : T.ink }}>
                      <td style={{ padding: "6px 8px 6px 0", fontSize: 13 }}>{row.l}</td>
                      {MONTHS.map((m) => (
                        <td key={m.key} style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>
                          {fmt(byMonth[m.key][row.k])}
                        </td>
                      ))}
                      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "6px 8px", color: B[row.k] - A[row.k] > 0 ? T.loss : T.profit }}>
                        {fmt(B[row.k] - A[row.k])}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `1.5px solid ${T.line}` }}>
                    <td style={{ padding: "8px 8px 6px 0", fontSize: 13, fontWeight: 700 }}>Recurring payroll</td>
                    {MONTHS.map((m) => (
                      <td key={m.key} style={{ textAlign: "right", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", padding: "8px 8px 6px" }}>
                        {fmt(byMonth[m.key].underlying)}
                      </td>
                    ))}
                    <td style={{ textAlign: "right", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", padding: "8px 8px 6px", color: dUnder > 0 ? T.loss : T.profit }}>
                      {fmt(dUnder)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 8px 6px 0", fontSize: 13, color: T.inkSoft }}>Total as filed</td>
                    {MONTHS.map((m) => (
                      <td key={m.key} style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px", color: T.inkSoft }}>
                        {fmt(byMonth[m.key].gross)}
                      </td>
                    ))}
                    <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px", color: T.inkSoft }}>{fmt(B.gross - A.gross)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "6px 8px 6px 0", fontSize: 13, color: T.inkSoft }}>Basic salaries only — headcount proxy</td>
                    {MONTHS.map((m) => (
                      <td key={m.key} style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px", color: T.inkSoft }}>
                        {fmt(byMonth[m.key].basic)}
                      </td>
                    ))}
                    <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px", color: T.inkSoft }}>{fmt(dBasic)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600, marginBottom: 10 }}>
                Recurring payroll, month on month
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {MONTHS.map((m) => (
                  <div key={m.key} style={{ display: "grid", gridTemplateColumns: "80px 1fr 90px", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, color: T.inkSoft }}>{m.label}</span>
                    <div style={{ height: 16, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                      <div style={{
                        position: "absolute", inset: "0 auto 0 0",
                        width: `${(byMonth[m.key].underlying / maxUnder) * 100}%`,
                        background: m.key === mB ? T.loss : "rgba(26,36,33,0.30)", borderRadius: 3,
                      }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(byMonth[m.key].underlying)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p style={{
              margin: "16px 0 0", padding: "12px 14px", borderRadius: 9, fontSize: 13, lineHeight: 1.65,
              background: dUnder > 0 ? "rgba(192,68,46,0.08)" : "rgba(29,158,117,0.08)",
              border: `1px solid ${dUnder > 0 ? "rgba(192,68,46,0.35)" : "rgba(29,158,117,0.35)"}`,
              color: T.ink,
            }}>
              {verdict}
            </p>
          </Panel>

          <Panel title="Where the movement is" tint={T.ink} hint={`line level · ${shortOf(mA)} → ${shortOf(mB)}`} span>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 260 }}>Account</th>
                    <th style={{ textAlign: "left" }}>Header</th>
                    <th>{labelOf(mA)}</th><th>{labelOf(mB)}</th><th>Change</th><th>Treatment</th>
                  </tr>
                </thead>
                <tbody>
                  {movers.map((r) => (
                    <tr key={r.c}>
                      <td style={{ padding: "6px 8px 6px 0", fontSize: 13 }}>{r.n}</td>
                      <td style={{ fontSize: 12, color: T.inkSoft, padding: "6px 8px" }}>{r.g}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(r[mA] || 0)}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(r[mB] || 0)}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "6px 8px", color: r.d > 0 ? T.loss : T.profit }}>{fmt(r.d)}</td>
                      <td style={{ textAlign: "right", fontSize: 12.5, fontWeight: 600, padding: "6px 0 6px 8px", color: oneTime.includes(r.c) ? T.sand : T.ink }}>
                        {oneTime.includes(r.c) ? "Set aside" : "Recurring"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "14px 0 0", maxWidth: 780 }}>
              Ask for headcount by month. Basic salaries are a proxy, not a count — they cannot separate fewer people
              on higher pay from more people on lower pay, and that distinction decides whether outsourced labour is
              a saving or a substitution.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
