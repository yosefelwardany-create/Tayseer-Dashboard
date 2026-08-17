import { useState, useMemo } from "react";
import { BASELINE, MONTHS } from "./data.js";
import { LEGACY_BASELINE, LEGACY_MONTHS, LEGACY_LABEL, ALIASES } from "./legacy.js";

const T = {
  ink: "#1A2421", inkSoft: "#4A5450", paper: "#F2F3EE", card: "#FBFBF8",
  line: "rgba(26,36,33,0.14)", profit: "#1D9E75", loss: "#C0442E",
  sand: "#B98A3C", blue: "#2F6690",
};

const fmt = (n) => (n < 0 ? "(" : "") + Math.abs(Math.round(n)).toLocaleString("en-US") + (n < 0 ? ")" : "");
const sign = (n) => (n >= 0 ? "+" : "−") + Math.abs(Math.round(n)).toLocaleString("en-US");
const labelOf = (k) => (MONTHS.find((m) => m.key === k) || {}).label || k;

const secSum = (rows, s, m) => rows.filter((r) => r.s === s).reduce((a, r) => a + (r[m] || 0), 0);
const result = (rows, m) =>
  secSum(rows, "REV", m) - secSum(rows, "COGS", m) - secSum(rows, "OPEX", m) +
  secSum(rows, "NOI", m) - secSum(rows, "NOE", m);

// Effect of a booked-value change on the result, by section
const EFFECT = { REV: 1, NOI: 1, COGS: -1, OPEX: -1, NOE: -1 };

// The 10 Aug export carried four audited-pack accounts without Zoho codes
// (AUD-*); the 17 Aug export books the same substance under real codes.
const EXTRA_ALIASES = {
  "AUD-01": "75000000", // Withholding tax
  "AUD-02": "61401010", // Recruitment fees S&D
  "AUD-03": "62000000", // Bonus S&D
  "AUD-04": "62000170", // Overtime S&D
};

// One-to-many recodes: Zoho unbundled these parents into subaccounts between
// the exports. Comparing per-code would show offsetting phantom "removals" and
// "NEW" rows, so each family is compared as one concept instead.
const CONCEPTS = [
  {
    key: "subs",
    label: "Subscriptions & membership fees (incl. unbundled subaccounts)",
    group: "General & Administration",
    codes: new Set(["65100110", "65104026", "65104027", "65104028", "65104029", "65104030"]),
  },
  {
    key: "consult",
    label: "Technical consultancy (incl. unbundled subaccounts)",
    group: "Professional Fees",
    codes: new Set(["65104010", "65104021", "65104022", "65104023", "65104024"]),
  },
];
const conceptOf = (c) => CONCEPTS.find((x) => x.codes.has(c));

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

export default function Restatement() {
  const [m, setM] = useState("jul");

  const { oldRes, newRes, moved, sections, movers, grossDelta, retDelta } = useMemo(() => {
    const oldRes = result(LEGACY_BASELINE, m);
    const newRes = result(BASELINE, m);

    // Section-level deltas, as effect on the result
    const sections = ["REV", "COGS", "OPEX", "NOI", "NOE"].map((s) => {
      const o = secSum(LEGACY_BASELINE, s, m);
      const n = secSum(BASELINE, s, m);
      return { s, old: o, now: n, effect: (n - o) * EFFECT[s] };
    });

    // Account-level movers for the expense sections. Revenue and cost-of-sales
    // were split into channel subaccounts between the two exports, so their
    // account rows are recode noise — the section rows above carry them.
    // Renumbered accounts are matched via aliases; unbundled families via
    // CONCEPTS — both sides of a family sum into one row.
    const scope = new Set(["OPEX", "NOI", "NOE"]);
    const acc = {}; // key -> { name, group, sec, old, now, oldSeen }
    const add = (r, side) => {
      if (!scope.has(r.s)) return;
      const code = side === "old" ? (ALIASES[r.c] || EXTRA_ALIASES[r.c] || r.c) : r.c;
      const concept = conceptOf(code);
      const key = concept ? "concept:" + concept.key : code;
      const slot = acc[key] || (acc[key] = {
        n: concept ? concept.label : r.n,
        g: concept ? concept.group : r.g,
        sec: r.s, old: 0, now: 0, oldSeen: false,
      });
      if (side === "old") { slot.old += r[m] || 0; slot.oldSeen = slot.oldSeen || Math.abs(r[m] || 0) > 0.005; }
      else slot.now += r[m] || 0;
      if (side === "new") { slot.n = concept ? concept.label : r.n; slot.g = concept ? concept.group : r.g; }
    };
    for (const r of LEGACY_BASELINE) add(r, "old");
    for (const r of BASELINE) add(r, "new");

    const movers = [];
    for (const [key, x] of Object.entries(acc)) {
      const effect = (x.now - x.old) * EFFECT[x.sec];
      if (Math.abs(effect) < 2000) continue;
      movers.push({ c: key, n: x.n, g: x.g, old: x.old, now: x.now, effect, fresh: !x.oldSeen });
    }
    movers.sort((x, y) => x.effect - y.effect);

    // Revenue reclass detail for the narrative: gross vs returns inside REV
    const grossOf = (rows) => rows.filter((r) => r.s === "REV" && !r.c.startsWith("41001")).reduce((a, r) => a + (r[m] || 0), 0);
    const retOf = (rows) => rows.filter((r) => r.s === "REV" && r.c.startsWith("41001")).reduce((a, r) => a + (r[m] || 0), 0);
    const grossDelta = grossOf(BASELINE) - grossOf(LEGACY_BASELINE);
    const retDelta = retOf(BASELINE) - retOf(LEGACY_BASELINE);

    return { oldRes, newRes, moved: newRes - oldRes, sections, movers, grossDelta, retDelta };
  }, [m]);

  const SEC_LABEL = {
    REV: "Net revenue", COGS: "Cost of goods sold", OPEX: "Operating expenses",
    NOI: "Non-operating income", NOE: "Non-operating expense",
  };
  const maxAbs = Math.max(...movers.map((x) => Math.abs(x.effect)), 1);

  const kpi = (label, val, sub, colour) => (
    <div key={label} style={{ flex: "1 1 170px", background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: colour || T.ink, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ fontSize: 11.5, color: T.inkSoft }}>{sub}</div>
    </div>
  );

  const worst = movers.filter((x) => x.effect < 0).slice(0, 3);

  return (
    <div style={{ minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: "'Archivo', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Archivo:wght@400;500;600&display=swap');
        button{ font-family: inherit; cursor: pointer; }
        table{ width:100%; border-collapse: collapse; }
        th{ font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:${T.inkSoft};
            font-weight:600; text-align:right; padding:0 8px 8px; border-bottom:1px solid ${T.line}; }
        th:first-child{ text-align:left; padding-left:0; }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 20px 80px" }}>
        <header style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.sand, fontWeight: 600 }}>
            Tayseer Trading · Restatement
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.05 }}>
            The month they showed, and the month they booked<span style={{ color: T.sand }}>.</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: T.inkSoft, maxWidth: 700 }}>
            Left: the ledger as exported on 10 Aug — the basis of every figure quoted so far, theirs and ours.
            Right: the same months in the 17 Aug export. The difference is what was booked in between.
          </p>
        </header>

        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16,
          background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px",
        }}>
          <span style={{ fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600 }}>Month</span>
          {LEGACY_MONTHS.map((k) => (
            <button key={k} onClick={() => setM(k)} style={{
              padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${m === k ? T.ink : T.line}`,
              background: m === k ? T.ink : T.paper, color: m === k ? T.paper : T.ink,
            }}>{labelOf(k)}</button>
          ))}
          <span style={{ fontSize: 12.5, color: T.inkSoft }}>
            Months before May exist only in the 17 Aug export, so there is nothing earlier to restate against.
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {kpi(`Result · ${LEGACY_LABEL}`, fmt(oldRes), "what was being quoted", T.inkSoft)}
          {kpi("Result · 17 Aug export", fmt(newRes), "what their books say now", newRes < oldRes ? T.loss : T.profit)}
          {kpi("Booked in between", sign(moved), moved < 0 ? "the month got worse" : "the month improved", moved < 0 ? T.loss : T.profit)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          <Panel title="Where it landed" tint={T.ink} subtotal={sign(moved)} hint="by statement section">
            <div style={{ display: "grid", gap: 7 }}>
              {sections.map((x) => (
                <div key={x.s} style={{ display: "grid", gridTemplateColumns: "170px 1fr 90px", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: T.inkSoft }}>{SEC_LABEL[x.s]}</span>
                  <div style={{ height: 14, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                    <div style={{
                      position: "absolute", inset: "0 auto 0 0",
                      width: `${Math.min((Math.abs(x.effect) / Math.max(Math.abs(moved), 1)) * 100, 100)}%`,
                      background: x.effect < 0 ? T.loss : T.profit, borderRadius: 3, opacity: 0.85,
                    }} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", color: x.effect < 0 ? T.loss : x.effect > 0 ? T.profit : T.inkSoft }}>
                    {Math.abs(x.effect) < 0.5 ? "—" : sign(x.effect)}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: `1.5px solid ${T.ink}`, marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Result moved</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: moved < 0 ? T.loss : T.profit, fontVariantNumeric: "tabular-nums" }}>{sign(moved)}</span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "12px 0 0" }}>
              {Math.abs(grossDelta) < 1 && Math.abs(retDelta) < 1
                ? <>Revenue did not move — what changed is cost. The gross and returns lines are identical in both
                    exports for {labelOf(m)}; every riyal of movement is expense booked after the earlier cut.</>
                : <>Gross sales and returns moved by offsetting amounts (gross {sign(grossDelta)}, returns {sign(retDelta)},
                    net {sign(grossDelta + retDelta)}) — a reclassification, not new revenue. The movement that matters
                    is cost booked after the earlier cut.</>}
            </p>
          </Panel>

          <Panel title="What this does to the story" tint={T.loss}>
            <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.7 }}>
              {m === "jul" ? (
                <>
                  <p style={{ margin: "0 0 10px" }}>
                    The July that supported &ldquo;we&rsquo;ll turn a profit next month&rdquo; was a loss of{" "}
                    <b>{fmt(Math.abs(oldRes) * -1)}</b>. July as their books now stand is a loss of{" "}
                    <b style={{ color: T.loss }}>{fmt(newRes)}</b> — {(Math.abs(newRes / oldRes)).toFixed(1)}× larger.
                    The improvement they pointed to was mostly costs that had not been booked yet.
                  </p>
                  <p style={{ margin: 0 }}>
                    The management fee is part of it: the 10 Aug cut showed July at nil, which looked like the fee had
                    stopped. The closed month carries <b>144,339</b> — close to the 150,000 they now quote. Lowered, yes.
                    Gone, no — and the same closing round added{" "}
                    {worst.map((w, i) => (
                      <span key={w.c}>
                        {i > 0 && (i === worst.length - 1 ? " and " : ", ")}
                        <b>{fmt(Math.abs(w.effect))}</b> of {w.n.toLowerCase().replace(/ ~ .*/, "")}
                      </span>
                    ))}.
                  </p>
                </>
              ) : (
                <p style={{ margin: 0 }}>
                  {labelOf(m)} moved {sign(moved)} between the two exports. The largest additions:{" "}
                  {worst.map((w, i) => (
                    <span key={w.c}>
                      {i > 0 && (i === worst.length - 1 ? " and " : ", ")}
                      <b>{fmt(Math.abs(w.effect))}</b> ({w.n})
                    </span>
                  ))}. Every figure quoted from the earlier export overstates the month by this amount.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Booked after 10 Aug, line by line" tint={T.sand} hint={`${labelOf(m)} · effect on the result · movements under 2,000 omitted`} span>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 250 }}>Account</th>
                    <th style={{ textAlign: "left" }}>Group</th>
                    <th>{LEGACY_LABEL}</th>
                    <th>17 Aug export</th>
                    <th style={{ minWidth: 140 }}></th>
                    <th>Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {movers.map((x) => (
                    <tr key={x.c} style={{ borderTop: `1px solid ${T.line}` }}>
                      <td style={{ padding: "7px 8px 7px 0", fontSize: 13 }}>
                        {x.n}
                        {x.fresh && <span style={{
                          marginLeft: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em",
                          color: T.sand, textTransform: "uppercase",
                        }}>new</span>}
                      </td>
                      <td style={{ fontSize: 12, color: T.inkSoft, padding: "7px 8px" }}>{x.g}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "7px 8px", color: T.inkSoft }}>{fmt(x.old)}</td>
                      <td style={{ textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", padding: "7px 8px" }}>{fmt(x.now)}</td>
                      <td style={{ padding: "7px 8px" }}>
                        <div style={{ height: 12, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                          <div style={{
                            position: "absolute", inset: "0 auto 0 0",
                            width: `${(Math.abs(x.effect) / maxAbs) * 100}%`,
                            background: x.effect < 0 ? T.loss : T.profit, borderRadius: 3, opacity: 0.8,
                          }} />
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", padding: "7px 0 7px 8px", color: x.effect < 0 ? T.loss : T.profit }}>
                        {sign(x.effect)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "14px 0 0", maxWidth: 860 }}>
              Revenue and cost-of-sales accounts were renumbered into channel subaccounts between the two exports,
              so they are compared at section level in the bridge on the left, not line by line here. Renamed accounts
              (rebates, the Al-Ameed cash discount) are matched across their old and new codes. Accounts marked{" "}
              <b style={{ color: T.sand }}>NEW</b> had nothing booked in the earlier export.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
