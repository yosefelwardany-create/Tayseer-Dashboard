import { useState, useMemo } from "react";
import { structure, booked, TREATMENTS, AD_ACCOUNTS, AD_RUN_RATE, MGMT_AVG, MGMT_BY_MONTH, MGMT_ACCOUNT, SPAN, releasesIn, total, LISTING_ACCOUNTS, DOUBT_ACCOUNT } from "./finance.js";
import { MONTHS } from "./data.js";
import { FACTS } from "./facts.js";

const T = {
  ink: "#1A2421", inkSoft: "#4A5450", paper: "#F2F3EE", card: "#FBFBF8",
  line: "rgba(26,36,33,0.14)", profit: "#1D9E75", loss: "#C0442E",
  sand: "#B98A3C", blue: "#2F6690",
};

// The claim was "5.3M of sales and +100,000 of profit next month", made off a
// July that closed at (1,122,756). Two months have now answered it:
//   August   4.18M gross, +26,436 — missed the sales, made a small profit
//   September 5.70M gross, +141,189 — beat both numbers
// So the tab scores the claim against both months and then re-runs the same
// projection off whichever month you pick. The open question is no longer
// whether they can hit 5.3M — they did — but what the month cost: September
// books NO management fee at all, releases another 102,306 of near-expiry
// provision and takes a 65,716 BTL refund, and its gross margin fell from
// 35.1% to 28.3% of net revenue while receivables grew 1.7M.
const CLAIM_MONTH = "sep";
const SCORED_MONTHS = ["aug", "sep"];
const REMAINING = 12 - MONTHS.length;   // months of 2026 still to close

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
  const [base, setBase] = useState(CLAIM_MONTH);      // the month the projection stands on
  const [target, setTarget] = useState(5300000);
  const [mode, setMode] = useState("gross");          // is 5.3M gross sales or net revenue?
  const [returnRate, setReturnRate] = useState(6.1);  // September actual
  const [treatment, setTreatment] = useState("trade");
  const [claim, setClaim] = useState(100000);

  // Costs the base month's closed books carry that need a decision before projecting
  const [excludeListing, setExcludeListing] = useState(true);
  const [normaliseAd, setNormaliseAd] = useState(true);
  const [normaliseDoubt, setNormaliseDoubt] = useState(true);
  const [stripReleases, setStripReleases] = useState(true);
  const [useFee, setUseFee] = useState(true);
  const [mgmtFee, setMgmtFee] = useState(150000);

  const opts = useMemo(
    () => ({ treatment, mgmtFee: useFee ? mgmtFee : null, normaliseAd, excludeListing, normaliseDoubt, stripReleases }),
    [treatment, useFee, mgmtFee, normaliseAd, excludeListing, normaliseDoubt, stripReleases]
  );

  const s = useMemo(() => structure(base, opts), [base, opts]);
  const baseBooked = useMemo(() => booked(base), [base]);
  const baseGross = s.gross;
  const baseLabel = (MONTHS.find((m) => m.key === base) || {}).label || base;
  const baseShort = (MONTHS.find((m) => m.key === base) || {}).short || base;

  // The scorecard: the claim against each month that has answered it.
  const CLAIMED_GROSS = 5300000, CLAIMED_PROFIT = 100000;
  const scored = useMemo(
    () => SCORED_MONTHS.map((k) => {
      const asBooked = structure(k, {});
      return {
        key: k,
        short: (MONTHS.find((m) => m.key === k) || {}).short || k,
        gross: asBooked.gross,
        profit: booked(k),
        net: asBooked.net,
        cm: asBooked.cm,
        breakeven: asBooked.breakeven,
        headroom: asBooked.net - asBooked.breakeven,
        gm: (asBooked.net - total(k, (r) => r.s === "COGS")) / asBooked.net,
        returnRate: asBooked.returnRate,
        mgmt: total(k, (r) => r.c === MGMT_ACCOUNT),
        credits: FACTS[k === "sep" ? "sepCredits" : "augCredits"] || [],
      };
    }),
    []
  );
  const score = scored[scored.length - 1];
  const sepUnderlying = FACTS.sepUnderlying;

  const listingBooked = useMemo(() => total(base, (r) => LISTING_ACCOUNTS.includes(r.c)), [base]);
  const adBooked = useMemo(() => total(base, (r) => AD_ACCOUNTS.includes(r.c)), [base]);
  const doubtBooked = useMemo(() => total(base, (r) => r.c === DOUBT_ACCOUNT), [base]);
  const releaseLines = useMemo(() => releasesIn(base), [base]);
  const releaseSum = releaseLines.reduce((a, x) => a + x.v, 0);

  // Clamp so a stray "100" in the returns box cannot divide the maths to Infinity
  const rr = Math.min(Math.max(returnRate, 0), 95);
  const netTarget = mode === "gross" ? target * (1 - rr / 100) : target;
  const result = s.profitAt(netTarget);
  const volumeEffect = (netTarget - s.net) * s.cm;
  const grossImplied = mode === "gross" ? target : target / (1 - rr / 100);
  const salesLift = baseGross ? grossImplied / baseGross - 1 : 0;

  const matrix = useMemo(
    () => TREATMENTS.map((t) => {
      const x = structure(base, { ...opts, treatment: t.id });
      return { ...t, cm: x.cm, breakeven: x.breakeven, forClaim: x.revenueFor(claim), profit: x.profitAt(netTarget) };
    }),
    [base, opts, netTarget, claim]
  );

  // Eight months of history — the empirical test of "5.3M next month"
  const history = MONTHS.map((m) => ({ ...FACTS.sales.monthly[m.key], key: m.key, short: m.short }));
  const bestGross = Math.max(...history.map((h) => h.gross));
  const bestMonth = history.find((h) => h.gross === bestGross);
  const bm = FACTS.sales.monthly[base];
  const cartonsNeeded = grossImplied / bm.sarPerCarton;
  const maxHist = Math.max(bestGross, grossImplied);

  const yearEnd = FACTS.ytdJanSep + result * REMAINING;

  const bridge = [
    { l: `${baseShort} as closed in their books`, v: baseBooked, c: T.inkSoft },
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
            They said 5.3M and +100k. September delivered both<span style={{ color: T.sand }}>.</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: T.inkSoft, maxWidth: 740 }}>
            September sold {M(score.gross)} gross — a record, {((score.gross / CLAIMED_GROSS - 1) * 100).toFixed(0)}% past
            the 5.3M they promised — and booked {sign(score.profit)} against the {sign(CLAIMED_PROFIT)} claimed. On the
            two numbers they were judged on, they delivered. This tab no longer argues the target is unreachable. It asks
            what the month cost: September books <b>no management fee at all</b>, releases another 102,306 of near-expiry
            provision, takes a 65,716 BTL refund, and earns it at a gross margin of{" "}
            {(score.gm * 100).toFixed(1)}% against August&rsquo;s 35.1%.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600 }}>
              Project from
            </span>
            <select value={base} onChange={(e) => setBase(e.target.value)} style={{
              padding: "6px 10px", borderRadius: 7, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit",
              border: `1.5px solid ${T.line}`, background: T.card, color: T.ink,
            }}>
              {MONTHS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </header>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {kpi("September as booked", sign(score.profit), `Aug closed ${sign(scored[0].profit)}`, score.profit >= 0 ? T.profit : T.loss)}
          {kpi("September underlying", sign(sepUnderlying), "no mgmt fee, two credits added back", sepUnderlying >= 0 ? T.profit : T.loss)}
          {kpi("Result at this level", sign(result), `${baseShort} basis, cleaned`, result >= 0 ? T.profit : T.loss)}
          {kpi("Sales increase implied", (salesLift * 100).toFixed(1) + "%", `${M(grossImplied)} gross vs ${M(baseGross)} ${baseShort}`, salesLift > 0.15 ? T.sand : T.ink)}
          {kpi("Vs best month ever", ((grossImplied / bestGross - 1) * 100).toFixed(1) + "%", `${bestMonth.short} did ${M(bestGross)} — the record`, grossImplied > bestGross ? T.sand : T.profit)}
          {kpi(`Needed for ${sign(claim)}`, isFinite(s.revenueFor(claim)) ? M(s.revenueFor(claim)) : "—", "net revenue at these settings", T.sand)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          <Panel title="The claim, scored against both months" tint={T.profit} hint="as booked, no adjustments" span>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>&nbsp;</th>
                    <th>Claimed</th>
                    {scored.map((x) => <th key={x.key}>{x.short} as booked</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { l: "Gross sales", c: CLAIMED_GROSS, get: (x) => x.gross },
                    { l: "Result for the month", c: CLAIMED_PROFIT, get: (x) => x.profit },
                    { l: "Gross margin, % of net revenue", pct: true, get: (x) => x.gm },
                    { l: "Returns, % of gross", pct: true, get: (x) => x.returnRate },
                    { l: "Management fee booked", get: (x) => x.mgmt },
                    { l: "Headroom over breakeven", get: (x) => x.headroom },
                  ].map((r) => (
                    <tr key={r.l} style={{ borderTop: `1px solid ${T.line}` }}>
                      <td style={{ padding: "9px 8px 9px 0", fontSize: 13, fontWeight: 600 }}>{r.l}</td>
                      <td style={{ textAlign: "right", fontSize: 13, padding: "9px 8px", fontVariantNumeric: "tabular-nums", color: T.inkSoft }}>
                        {r.c === undefined ? "—" : fmt(r.c)}
                      </td>
                      {scored.map((x) => {
                        const v = r.get(x);
                        const hit = r.c !== undefined && v >= r.c;
                        return (
                          <td key={x.key} style={{
                            textAlign: "right", fontSize: 13, fontWeight: 600, padding: "9px 8px",
                            fontVariantNumeric: "tabular-nums",
                            color: r.c === undefined ? T.ink : hit ? T.profit : T.loss,
                          }}>
                            {r.pct ? (v * 100).toFixed(1) + "%" : fmt(v)}
                            {r.c !== undefined && <span style={{ fontSize: 11, marginLeft: 5 }}>{hit ? "✓" : "✗"}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{
              margin: "16px 0 0", padding: "12px 14px", borderRadius: 9, fontSize: 13, lineHeight: 1.65,
              background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.35)", color: T.ink,
            }}>
              <b>Verdict: they hit it.</b> This tab spent two months arguing that 5.3M was{" "}
              {((CLAIMED_GROSS / FACTS.sales.monthly.may.gross - 1) * 100).toFixed(0)}% above anything the company had
              recorded. September cleared it: {M(score.gross)} of gross sales, {M(score.gross - FACTS.sales.monthly.may.gross)}{" "}
              past May&rsquo;s old record, on {fmt(bm.cartons)} cartons at {bm.sarPerCarton.toFixed(0)} SAR each. The profit
              came with it, and at {fmt(score.headroom)} of headroom over breakeven — {((score.headroom / score.net) * 100).toFixed(1)}%
              of a month&rsquo;s sales — it is far less fragile than August&rsquo;s {fmt(scored[0].headroom)}. Give them the point.
            </p>
            <p style={{
              margin: "10px 0 0", padding: "12px 14px", borderRadius: 9, fontSize: 13, lineHeight: 1.65,
              background: "rgba(192,68,46,0.08)", border: "1px solid rgba(192,68,46,0.35)", color: T.ink,
            }}>
              <b>Then ask about the management fee.</b> September books <b>nil</b>. Every month from January to August
              booked between 144,339 and 354,856; August alone was 157,694. The missing fee is larger than the whole
              profit. July looked exactly like this in the 10 Aug export — nil, then 144,339 once the books were
              closed properly — which is the bridge on the Restatement tab. Until that fee is either booked or shown
              to have been cancelled in writing, September&rsquo;s {sign(score.profit)} is provisional.
            </p>
            <p style={{
              margin: "10px 0 0", padding: "12px 14px", borderRadius: 9, fontSize: 13, lineHeight: 1.65,
              background: "rgba(185,138,60,0.10)", border: "1px solid rgba(185,138,60,0.40)", color: T.ink,
            }}>
              <b>What {sign(score.profit)} becomes when you put it back.</b> Charge the fee at August&rsquo;s 157,694, add back
              the 102,306 near-expiry release and the 65,716 BTL refund, and September is{" "}
              <b>{fmt(sepUnderlying)}</b>. Two other things moved the wrong way while sales rose: gross margin fell from
              35.1% to {(score.gm * 100).toFixed(1)}% — Al-Ameed promotional discount alone went 268,469 to 571,931 — and
              receivables grew {M(-FACTS.cash.receivablesBuild)} in the month, so the record sales are sitting in the
              debtor book, not the bank. Volume is real; the price of it is the question.
            </p>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "10px 0 0" }}>
              One more reason to wait for the closed books: current-year earnings on the <b>18 Sep</b> balance sheet
              implied September was running at {fmt(FACTS.sepMidMonthImplied)} with twelve days to go. The closed month
              is {sign(score.profit)} — a swing of {sign(FACTS.sepLateSwing)} in the final fortnight. Ask what landed in
              those twelve days.
            </p>
          </Panel>

          <Panel title="Has this business ever done 5.3M?" tint={T.blue} hint={`${MONTHS.length} months of their own sales report`} span>
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
              The red line is their target. The record is now <b>{M(bestGross)}</b> ({bestMonth.short}) — and until
              September the record was May&rsquo;s {M(FACTS.sales.monthly.may.gross)}, which made 5.3M look unreachable
              for seven months running. {baseShort} sold <b>{fmt(bm.cartons)} cartons</b> at {bm.sarPerCarton.toFixed(0)} SAR
              per carton. At that price mix, {M(grossImplied)} means{" "}
              <b>{fmt(cartonsNeeded)} cartons</b>
              {(() => {
                // The base month is the yardstick, so comparing it with itself says nothing.
                const above = history.filter((h) => h.cartons >= cartonsNeeded && h.key !== base);
                if (above.length === 0) return <> — a carton count never reached in these {MONTHS.length} months.</>;
                return <>
                  {" "}— {bm.cartons >= cartonsNeeded ? <>which {baseShort} itself cleared, and before it </> : <>reached in </>}
                  {above.map((h) => h.short).join(", ")}, though every one of those at a cheaper mix
                  ({above.map((h) => h.sarPerCarton.toFixed(0)).join(", ")} SAR/carton against {baseShort}&rsquo;s{" "}
                  {bm.sarPerCarton.toFixed(0)}).
                </>;
              })()}
              {" "}September got there on both at once: 18,363 cartons, the most since May, at 311 SAR each, the
              highest price mix of the year. That is the combination this panel said was needed. What it does not
              show is the margin — the extra volume came through Al-Ameed at a promotional discount that nearly
              doubled, so gross margin fell to 28.3% even as the top line hit a record.
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
              {baseShort} ran returns at {(s.returnRate * 100).toFixed(1)}% of gross. The run since July is 11.5% &rarr;
              4.4% &rarr; 6.1%: much better than July, but September gave back part of August&rsquo;s gain, and the
              accounts were re-cut into two channels (B and G) that month, so the brand-level comparison needs their
              mapping before it means anything. Gross-or-net is still worth settling: the gap between the two
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

          <Panel title={`${baseLabel}, cleaned for projection`} tint={T.sand} hint={`what closed ${baseShort} carries that a run rate should not`}>
            <div style={{ display: "grid", gap: 4 }}>
              {toggleRow(stripReleases, () => setStripReleases((v) => !v),
                "Add back provision releases and reversals",
                releaseLines.length
                  ? `${baseShort} booked ${releaseLines.length} credit line${releaseLines.length > 1 ? "s" : ""} — money coming back, not cost avoided`
                  : `${baseShort} booked none`,
                <span style={{ textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{fmt(-releaseSum)}</span>)}
              {toggleRow(excludeListing, () => setExcludeListing((v) => !v),
                "One-time listing & registration fees", "Al-Ameed registration plus key-account branch-opening fees — not a monthly cost",
                <span style={{ textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{fmt(listingBooked)}</span>)}
              {toggleRow(normaliseAd, () => setNormaliseAd((v) => !v),
                "Advertising at the year's run rate", `${baseShort} booked ${fmt(adBooked)}; ${SPAN} averages ${fmt(AD_RUN_RATE)}`,
                <span style={{ textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{fmt(AD_RUN_RATE)}</span>)}
              {toggleRow(normaliseDoubt, () => setNormaliseDoubt((v) => !v),
                "Doubtful debts at nil", `${baseShort} booked ${fmt(doubtBooked)} — July was a 106,000 credit, August a 41,541 charge; neither is a run rate`,
                <span style={{ textAlign: "right", fontSize: 13, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{fmt(Math.abs(doubtBooked))}</span>)}
              {toggleRow(useFee, () => setUseFee((v) => !v),
                "Management fee going forward", `${baseShort} booked ${fmt(MGMT_BY_MONTH[base])}; ${SPAN} averaged ${fmt(MGMT_AVG)}; they claim 150,000`,
                <input type="number" value={mgmtFee} step={10000} onChange={(e) => setMgmtFee(+e.target.value || 0)}
                  disabled={!useFee} style={{ ...numStyle, width: 118, opacity: useFee ? 1 : 0.45 }} />)}
            </div>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "12px 0 0" }}>
              These settings define the {baseShort} the projection stands on. Every one of them is arguable — that is why
              they are switches and not assumptions. On September the management fee matters most — the month booked{" "}
              {fmt(MGMT_BY_MONTH[base])}, so the lever is the whole charge, not an adjustment to it — followed by the
              {" "}102,306 near-expiry release. Advertising at the run rate is another {fmt(AD_RUN_RATE - adBooked)}{" "}
              of cost the month never carried.
            </p>
          </Panel>

          <Panel title={`From ${baseShort} to the projection`} tint={T.ink} subtotal={sign(result)} hint="every step, in order">
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
                <span>{MONTHS.length < 12 ? `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][MONTHS.length]} to December at this level (${REMAINING} months)` : "No months left to close"}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: result >= 0 ? T.profit : T.loss }}>{sign(result * REMAINING)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.inkSoft }}>
                <span>Implied full-year result (YTD {fmt(FACTS.ytdJanSep)} + {REMAINING} months)</span>
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
              commissions they expect to stay unchanged through a 25% sales rise. September is the first real test of
              it: net revenue rose 34% on August and total operating expenses fell 8,197, which sounds like a fixed
              cost base — until you notice the management fee went from 157,694 to nil. Strip that one line out and
              operating costs rose 149,497 on a 34% sales rise, which is neither fixed nor fully variable. Ask them
              which of these lines they expect to scale, and get the management-fee position in writing first.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
