import { useState, useMemo } from "react";
import { structure, booked, TREATMENTS, AD_RUN_RATE, MGMT_AVG, MGMT_BY_MONTH } from "./finance.js";
import { MONTHS } from "./data.js";
import { FACTS } from "./facts.js";

const T = {
  ink: "#1A2421", inkSoft: "#4A5450", paper: "#F2F3EE", card: "#FBFBF8",
  line: "rgba(26,36,33,0.14)", profit: "#1D9E75", loss: "#C0442E",
  sand: "#B98A3C", blue: "#2F6690",
};

const BASE = "jul";      // the month they are projecting from
const REMAINING = 5;     // Aug..Dec

const fmt = (n) => (n < 0 ? "(" : "") + Math.abs(Math.round(n)).toLocaleString("en-US") + (n < 0 ? ")" : "");
const M = (n) => (n / 1e6).toFixed(2) + "M";
const sign = (n) => (n >= 0 ? "+" : "−") + Math.abs(Math.round(n)).toLocaleString("en-US");

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

export default function SalesTest() {
  const [target, setTarget] = useState(5300000);
  const [mode, setMode] = useState("gross");          // is 5.3M gross sales or net revenue?
  const [returnRate, setReturnRate] = useState(11.5); // July actual
  const [treatment, setTreatment] = useState("trade");
  const [claim, setClaim] = useState(100000);

  // Costs July's closed books carry that need a decision before projecting
  const [excludeListing, setExcludeListing] = useState(true);
  const [normaliseAd, setNormaliseAd] = useState(true);
  const [normaliseDoubt, setNormaliseDoubt] = useState(true);
  const [useFee, setUseFee] = useState(true);
  const [mgmtFee, setMgmtFee] = useState(150000);

  const opts = useMemo(
    () => ({ treatment, mgmtFee: useFee ? mgmtFee : null, normaliseAd, excludeListing, normaliseDoubt }),
    [treatment, useFee, mgmtFee, normaliseAd, excludeListing, normaliseDoubt]
  );

  const s = useMemo(() => structure(BASE, opts), [opts]);
  const julyBooked = useMemo(() => booked(BASE), []);
  const julyGross = s.gross;

  // Clamp so a stray "100" in the returns box cannot divide the maths to Infinity
  const rr = Math.min(Math.max(returnRate, 0), 95);
  const netTarget = mode === "gross" ? target * (1 - rr / 100) : target;
  const result = s.profitAt(netTarget);
  const volumeEffect = (netTarget - s.net) * s.cm;
  const grossImplied = mode === "gross" ? target : target / (1 - rr / 100);
  const salesLift = julyGross ? grossImplied / julyGross - 1 : 0;

  const matrix = useMemo(
    () => TREATMENTS.map((t) => {
      const x = structure(BASE, { ...opts, treatment: t.id });
      return { ...t, cm: x.cm, breakeven: x.breakeven, forClaim: x.revenueFor(claim), profit: x.profitAt(netTarget) };
    }),
    [opts, netTarget, claim]
  );

  // Seven months of history — the empirical test of "5.3M next month"
  const history = MONTHS.map((m) => ({ ...FACTS.sales.monthly[m.key], key: m.key, short: m.short }));
  const bestGross = Math.max(...history.map((h) => h.gross));
  const bestMonth = history.find((h) => h.gross === bestGross);
  const jul = FACTS.sales.monthly.jul;
  const cartonsNeeded = grossImplied / jul.sarPerCarton;
  const maxHist = Math.max(bestGross, grossImplied);

  const yearEnd = FACTS.ytdJanJul + result * REMAINING;

  const bridge = [
    { l: "July as closed in their books", v: julyBooked, c: T.inkSoft },
    ...s.adj.map((a) => ({ l: a.label, v: a.amount, c: a.amount < 0 ? T.loss : T.profit })),
    { l: `Extra volume at ${(s.cm * 100).toFixed(1)}% margin`, v: volumeEffect, c: volumeEffect >= 0 ? T.profit : T.loss },
  ];
  const maxAbs = Math.max(...bridge.map((b) => Math.abs(b.v)), Math.abs(result), 1);

  const kpi = (label, val, sub, colour) => (
    <div key={label} style={{ flex: "1 1 150px", background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: colour || T.ink, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ fontSize: 11.5, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{sub}</div>
    </div>
  );

  const chip = (active, onClick, label, key) => (
    <button key={key} onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
      border: `1.5px solid ${active ? T.ink : T.line}`,
      background: active ? T.ink : T.paper, color: active ? T.paper : T.ink,
    }}>{label}</button>
  );

  const numStyle = {
    width: 130, padding: "6px 9px", borderRadius: 7, fontSize: 14, fontWeight: 600,
    border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink,
    fontFamily: "inherit", fontVariantNumeric: "tabular-nums", textAlign: "right",
  };

  const toggleRow = (checked, onChange, title, sub, right) => (
    <label style={{ display: "grid", gridTemplateColumns: "22px 1fr 120px", gap: 8, alignItems: "center", padding: "9px 6px", borderRadius: 7, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span style={{ fontSize: 13 }}>
        <b>{title}</b>
        <span style={{ display: "block", fontSize: 12, color: T.inkSoft }}>{sub}</span>
      </span>
      {right}
    </label>
  );

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
            Tayseer Trading · Sales projection
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.05 }}>
            What 5.3M actually produces<span style={{ color: T.sand }}>.</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: T.inkSoft, maxWidth: 700 }}>
            Built on July as closed in their own books — a loss of {fmt(julyBooked)}, not the {fmt(-295646)} in the
            earlier export. The one setting that decides the answer is which costs grow when sales grow.
          </p>
        </header>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {kpi("Result at this level", sign(result), `against ${fmt(julyBooked)} July closed`, result >= 0 ? T.profit : T.loss)}
          {kpi("Sales increase implied", (salesLift * 100).toFixed(1) + "%", `${M(grossImplied)} gross vs ${M(julyGross)} July`, salesLift > 0.15 ? T.sand : T.ink)}
          {kpi("Vs best month ever", ((grossImplied / bestGross - 1) * 100).toFixed(1) + "%", `${bestMonth.short} did ${M(bestGross)} — the record`, grossImplied > bestGross ? T.loss : T.profit)}
          {kpi(`Needed for ${sign(claim)}`, isFinite(s.revenueFor(claim)) ? M(s.revenueFor(claim)) : "—", "net revenue at these settings", T.sand)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          <Panel title="Has this business ever done 5.3M?" tint={T.blue} hint="seven months of their own sales report" span>
            <div style={{ display: "grid", gap: 6 }}>
              {history.map((h) => (
                <div key={h.key} style={{ display: "grid", gridTemplateColumns: "40px 1fr 210px", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: T.inkSoft }}>{h.short}</span>
                  <div style={{ height: 16, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                    <div style={{
                      position: "absolute", inset: "0 auto 0 0", width: `${(h.gross / maxHist) * 100}%`,
                      background: h.gross === bestGross ? T.blue : "rgba(26,36,33,0.30)", borderRadius: 3,
                    }} />
                    {/* target marker */}
                    <div style={{ position: "absolute", top: -2, bottom: -2, left: `${(grossImplied / maxHist) * 100}%`, width: 2, background: T.loss }} />
                  </div>
                  <span style={{ fontSize: 12, color: T.inkSoft, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    <b style={{ color: T.ink }}>{M(h.gross)}</b> · {fmt(h.cartons)} crt · {h.sarPerCarton.toFixed(0)}/crt
                  </span>
                </div>
              ))}
            </div>
            <p style={{
              margin: "14px 0 0", padding: "12px 14px", borderRadius: 9, fontSize: 13, lineHeight: 1.65,
              background: "rgba(192,68,46,0.08)", border: "1px solid rgba(192,68,46,0.35)",
            }}>
              The red line is their target. Gross sales have never exceeded <b>{M(bestGross)}</b> ({bestMonth.short}) —
              the target is {((grossImplied / bestGross - 1) * 100).toFixed(0)}% above the best month in the company&rsquo;s
              recorded history, from a July that sold <b>{fmt(jul.cartons)} cartons</b>, the second-lowest volume since
              February and down 16% on June. At July&rsquo;s price mix ({jul.sarPerCarton.toFixed(0)} SAR/carton), {M(grossImplied)} means{" "}
              <b>{fmt(cartonsNeeded)} cartons</b>
              {(() => {
                const above = history.filter((h) => h.cartons >= cartonsNeeded);
                if (above.length === 0) return <> — a carton count never reached in these seven months.</>;
                return <>
                  {" "}— reached in {above.map((h) => h.short).join(", ")}, but every time at a much cheaper mix
                  ({above.map((h) => h.sarPerCarton.toFixed(0)).join(", ")} SAR/carton against July&rsquo;s{" "}
                  {jul.sarPerCarton.toFixed(0)}).
                </>;
              })()}
              {" "}Volume is falling while price rises; the target needs record volume and July&rsquo;s premium mix at once.
            </p>
          </Panel>

          <Panel title="Their claim" tint={T.blue} hint="type the numbers they give you">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: T.inkSoft }}>Monthly sales of</span>
              <input type="number" value={target} step={50000} onChange={(e) => setTarget(+e.target.value || 0)} style={numStyle} />
              {chip(mode === "gross", () => setMode("gross"), "gross", "g")}
              {chip(mode === "net", () => setMode("net"), "net", "n")}
            </div>
            <input type="range" min={3000000} max={9000000} step={50000} value={target}
              onChange={(e) => setTarget(+e.target.value)} aria-label="Monthly sales"
              style={{ width: "100%", accentColor: T.blue, height: 4, marginBottom: 14 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: T.inkSoft }}>producing a profit of</span>
              <input type="number" value={claim} step={25000} onChange={(e) => setClaim(+e.target.value || 0)} style={numStyle} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: T.inkSoft }}>with returns at</span>
              <input type="number" value={returnRate} step={0.5} onChange={(e) => setReturnRate(+e.target.value || 0)}
                style={{ ...numStyle, width: 80 }} />
              <span style={{ fontSize: 13, color: T.inkSoft }}>% of gross</span>
            </div>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "10px 0 0" }}>
              July ran returns at {(s.returnRate * 100).toFixed(1)}% of gross — 359,562 of it Nongshim, a 23% return
              rate on that brand alone. June ran 3.0%. Gross-or-net is worth settling first: the gap between the two
              readings of &ldquo;5.3M&rdquo; is {M(target / (1 - rr / 100) - target)} of sales.
            </p>
          </Panel>

          <Panel title="Which costs grow with sales" tint={T.loss} hint="the setting that decides everything">
            <div style={{ display: "grid", gap: 8 }}>
              {TREATMENTS.map((t) => (
                <label key={t.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 62px", gap: 10, alignItems: "center", cursor: "pointer",
                  padding: "10px 12px", borderRadius: 9,
                  border: `1.5px solid ${treatment === t.id ? T.ink : T.line}`,
                  background: treatment === t.id ? "rgba(26,36,33,0.04)" : "transparent",
                }} onClick={() => setTreatment(t.id)}>
                  <span>
                    <b style={{ fontSize: 13 }}>{t.label}</b>
                    <span style={{ display: "block", fontSize: 12, color: T.inkSoft, lineHeight: 1.5, marginTop: 2 }}>{t.blurb}</span>
                  </span>
                  <span style={{ textAlign: "right", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: treatment === t.id ? T.ink : T.inkSoft }}>
                    {(matrix.find((x) => x.id === t.id).cm * 100).toFixed(1)}%
                  </span>
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: "#9AA49D", marginTop: 8 }}>Contribution margin on the right</div>
          </Panel>

          <Panel title="July, cleaned for projection" tint={T.sand} hint="what closed July carries that a run rate should not">
            <div style={{ display: "grid", gap: 4 }}>
              {toggleRow(excludeListing, () => setExcludeListing((v) => !v),
                "Al-Ameed listing fee is one-time", "273,200 booked in July — registration, not a monthly cost",
                <span style={{ textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>273,200</span>)}
              {toggleRow(normaliseAd, () => setNormaliseAd((v) => !v),
                "Advertising at the year's run rate", `July booked 456,323; Jan–Jul averages ${fmt(AD_RUN_RATE)}`,
                <span style={{ textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{fmt(AD_RUN_RATE)}</span>)}
              {toggleRow(normaliseDoubt, () => setNormaliseDoubt((v) => !v),
                "Remove July's doubtful-debt credit", "A 106,000 release flattered the month; run rate is a charge, not a credit",
                <span style={{ textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>106,000</span>)}
              {toggleRow(useFee, () => setUseFee((v) => !v),
                "Management fee going forward", `July booked ${fmt(MGMT_BY_MONTH.jul)}; Jan–Jul averaged ${fmt(MGMT_AVG)}; they claim 150,000`,
                <input type="number" value={mgmtFee} step={10000} onChange={(e) => setMgmtFee(+e.target.value || 0)}
                  disabled={!useFee} style={{ ...numStyle, width: 118, opacity: useFee ? 1 : 0.45 }} />)}
            </div>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "12px 0 0" }}>
              These settings define the July the projection stands on. Every one of them is arguable — that is why
              they are switches and not assumptions.
            </p>
          </Panel>

          <Panel title="From July to the projection" tint={T.ink} subtotal={sign(result)} hint="every step, in order">
            <div style={{ display: "grid", gap: 7 }}>
              {bridge.map((b, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "190px 1fr 90px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: T.inkSoft }}>{b.l}</span>
                  <div style={{ height: 14, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                    <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${(Math.abs(b.v) / maxAbs) * 100}%`, background: b.c, borderRadius: 3, opacity: 0.85 }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", color: b.v >= 0 ? T.ink : T.loss }}>{sign(b.v)}</span>
                </div>
              ))}
              <div style={{ borderTop: `1.5px solid ${T.ink}`, marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Result at {M(grossImplied)} gross</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: result >= 0 ? T.profit : T.loss, fontVariantNumeric: "tabular-nums" }}>
                  {sign(result)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>
                <span>August to December at this level ({REMAINING} months)</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: result >= 0 ? T.profit : T.loss }}>{sign(result * REMAINING)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.inkSoft }}>
                <span>Implied full-year result (YTD {fmt(FACTS.ytdJanJul)} + five months)</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: yearEnd >= 0 ? T.profit : T.loss }}>{fmt(yearEnd)}</span>
              </div>
            </div>
          </Panel>

          <Panel title="The same claim under each assumption" tint={T.loss} hint="this is the comparison to show them" span>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 260 }}>Which costs grow with sales</th>
                    <th>Contribution margin</th>
                    <th>Breakeven</th>
                    <th>Needed for {sign(claim)}</th>
                    <th>Result at {M(grossImplied)}</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((x) => (
                    <tr key={x.id} style={{
                      background: x.id === treatment ? "rgba(47,102,144,0.07)" : "transparent",
                      borderTop: `1px solid ${T.line}`,
                    }}>
                      <td style={{ padding: "9px 8px 9px 0", fontSize: 13, fontWeight: x.id === treatment ? 600 : 400 }}>
                        {x.label}
                        {x.id === "cogs" && <span style={{ display: "block", fontSize: 11.5, color: T.sand, fontWeight: 600 }}>their assumption</span>}
                      </td>
                      <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "9px 8px" }}>{(x.cm * 100).toFixed(2)}%</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "9px 8px" }}>{isFinite(x.breakeven) ? fmt(x.breakeven) : "—"}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "9px 8px" }}>{isFinite(x.forClaim) ? fmt(x.forClaim) : "—"}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "9px 0 9px 8px", color: x.profit >= 0 ? T.profit : T.loss }}>{sign(x.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{
              margin: "16px 0 0", padding: "12px 14px", borderRadius: 9, fontSize: 13, lineHeight: 1.65,
              background: "rgba(192,68,46,0.08)", border: "1px solid rgba(192,68,46,0.35)", color: T.ink,
            }}>
              Read the middle column. Their {sign(claim)} needs between {fmt(Math.min(...matrix.filter((x) => isFinite(x.forClaim)).map((x) => x.forClaim)))} and{" "}
              {fmt(Math.max(...matrix.filter((x) => isFinite(x.forClaim)).map((x) => x.forClaim)))} of net revenue depending only
              on which costs are held flat — and even the smallest of those figures has never been achieved in this
              company&rsquo;s recorded history. Ask which of freight, warehouse labour, casual labour, rebates and
              commissions they expect to stay unchanged through a 25% sales rise.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
