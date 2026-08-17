import { useState, useMemo } from "react";
import { BASELINE } from "./data.js";
import { FACTS } from "./facts.js";

const T = {
  ink: "#1A2421", inkSoft: "#4A5450", paper: "#F2F3EE", card: "#FBFBF8",
  line: "rgba(26,36,33,0.14)", profit: "#1D9E75", loss: "#C0442E",
  sand: "#B98A3C", blue: "#2F6690",
};

const fmt = (n) => (n < 0 ? "(" : "") + Math.abs(Math.round(n)).toLocaleString("en-US") + (n < 0 ? ")" : "");
const M = (n) => (n / 1e6).toFixed(2) + "M";

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

export default function Stock() {
  const inv = FACTS.inventory;
  const rec = FACTS.receivables;
  const ag = FACTS.aging;
  const sm = FACTS.sales.monthly;

  const grossInv = inv.tradingGoods + inv.delistedSkus + inv.tradingSmall;
  const provisions = -(inv.provisionNearExpiry + inv.provisionDelisted);
  const netInv = grossInv - provisions;

  // Recent run rates, from the ledger and the sales report
  const cogs3 = useMemo(() => {
    const S = (m) => BASELINE.filter((r) => r.s === "COGS").reduce((a, r) => a + (r[m] || 0), 0);
    return (S("may") + S("jun") + S("jul")) / 3;
  }, []);
  const cartons3 = (sm.may.cartons + sm.jun.cartons + sm.jul.cartons) / 3;

  // The order: 400,000 + 100,000, unit unknown — that ambiguity is the point
  const [orderValue, setOrderValue] = useState(500000);
  const [unit, setUnit] = useState("sar"); // sar | cartons
  const [lifeMonths, setLifeMonths] = useState(18);

  const monthsCover = netInv / cogs3;
  const orderMonths = unit === "sar" ? orderValue / cogs3 : orderValue / cartons3;
  const sellPerMonth = orderValue / lifeMonths;
  const pctOfVelocity = unit === "sar" ? sellPerMonth / cogs3 : sellPerMonth / cartons3;

  const bsRecTotal = rec.domestic + rec.legalAction;
  const agingGap = bsRecTotal - ag.totalOutstanding;

  const buckets = Object.entries(ag.buckets);
  const maxBucket = Math.max(...buckets.map(([, v]) => v), 1);

  const kpi = (label, val, sub, colour) => (
    <div key={label} style={{ flex: "1 1 160px", background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: colour || T.ink, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ fontSize: 11.5, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>{sub}</div>
    </div>
  );

  const numStyle = {
    width: 130, padding: "6px 9px", borderRadius: 7, fontSize: 14, fontWeight: 600,
    border: `1.5px solid ${T.line}`, background: T.paper, color: T.ink,
    fontFamily: "inherit", fontVariantNumeric: "tabular-nums", textAlign: "right",
  };
  const chip = (active, onClick, label, key) => (
    <button key={key} onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
      border: `1.5px solid ${active ? T.ink : T.line}`,
      background: active ? T.ink : T.paper, color: active ? T.paper : T.ink,
    }}>{label}</button>
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
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "30px 20px 80px" }}>
        <header style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.sand, fontWeight: 600 }}>
            Tayseer Trading · Stock &amp; receivables · balance sheet of {FACTS.asOf}
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.05 }}>
            What the order lands on<span style={{ color: T.sand }}>.</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: T.inkSoft, maxWidth: 700 }}>
            They plan a new order of 400,000 + 100,000 — unit unconfirmed — into 18 months of product lifetime.
            This is the stock and the debtor book it lands on.
          </p>
        </header>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {kpi("Inventory, net", M(netInv), `${monthsCover.toFixed(1)} months of cover at current COGS`)}
          {kpi("Already provided against", M(provisions), `${(provisions / grossInv * 100).toFixed(1)}% of gross stock`, T.loss)}
          {kpi("Receivables outstanding", M(ag.totalOutstanding), `${ag.customers} customers · aging report`)}
          {kpi("Overdue", M(ag.overdue), `${(ag.overdue / ag.totalOutstanding * 100).toFixed(0)}% of the book`, T.sand)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          <Panel title="Inventory position" tint={T.inkSoft} subtotal={M(netInv) + " net"}>
            {[
              { l: "Trading goods", v: inv.tradingGoods + inv.tradingSmall, c: T.inkSoft },
              { l: "Delisted SKUs", v: inv.delistedSkus, c: T.sand },
              { l: "Near-expiry provision", v: inv.provisionNearExpiry, c: T.loss },
              { l: "Delisted provision", v: inv.provisionDelisted, c: T.loss },
            ].map((x) => (
              <div key={x.l} style={{ display: "grid", gridTemplateColumns: "170px 1fr 100px", gap: 8, alignItems: "center", marginBottom: 7 }}>
                <span style={{ fontSize: 12.5, color: T.inkSoft }}>{x.l}</span>
                <div style={{ height: 14, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                  <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${(Math.abs(x.v) / grossInv) * 100}%`, background: x.c, borderRadius: 3, opacity: 0.85 }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", color: x.v < 0 ? T.loss : T.ink }}>{fmt(x.v)}</span>
              </div>
            ))}
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.65, margin: "12px 0 0" }}>
              A sixth of the stock is already written down: the near-expiry provision alone is {fmt(-inv.provisionNearExpiry)},
              built up in May–July charges of 42,250 / 321,891 / 248,640. Shelf life is already a live problem in the
              existing book — before any new order arrives.
            </p>
          </Panel>

          <Panel title="The 500,000 question" tint={T.blue} hint="what unit is the order in?">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: T.inkSoft }}>Order of</span>
              <input type="number" value={orderValue} step={50000} onChange={(e) => setOrderValue(+e.target.value || 0)} style={numStyle} />
              {chip(unit === "sar", () => setUnit("sar"), "SAR at cost", "s")}
              {chip(unit === "cartons", () => setUnit("cartons"), "cartons", "c")}
              <span style={{ fontSize: 13, color: T.inkSoft }}>· lifetime</span>
              <input type="number" value={lifeMonths} step={1} onChange={(e) => setLifeMonths(+e.target.value || 1)} style={{ ...numStyle, width: 64 }} />
              <span style={{ fontSize: 13, color: T.inkSoft }}>months</span>
            </div>

            <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              {[
                ["Adds to cover", `${orderMonths.toFixed(2)} months of ${unit === "sar" ? "COGS" : "volume"}`],
                ["Must sell through at", `${fmt(sellPerMonth)} ${unit === "sar" ? "SAR" : "cartons"}/month for ${lifeMonths} months`],
                ["That is", `${(pctOfVelocity * 100).toFixed(1)}% of current monthly ${unit === "sar" ? `cost of sales (${fmt(cogs3)} SAR)` : `carton velocity (${fmt(cartons3)}/mo)`}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                  <span style={{ color: T.inkSoft }}>{l}</span>
                  <b style={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{v}</b>
                </div>
              ))}
            </div>

            <p style={{
              margin: 0, padding: "11px 13px", borderRadius: 9, fontSize: 13, lineHeight: 1.65,
              background: pctOfVelocity > 0.5 ? "rgba(192,68,46,0.08)" : "rgba(29,158,117,0.08)",
              border: `1px solid ${pctOfVelocity > 0.5 ? "rgba(192,68,46,0.35)" : "rgba(29,158,117,0.35)"}`,
            }}>
              {unit === "sar"
                ? `If the order is SAR at cost, it is ${(orderMonths).toFixed(2)} months of cost of sales — absorbable, provided it replaces other purchasing rather than adding to it. The risk is not size; it is that ${(provisions / grossInv * 100).toFixed(0)}% of existing stock is already provided against.`
                : `If the order is cartons, selling it inside ${lifeMonths} months needs ${fmt(sellPerMonth)} cartons a month on top of, or instead of, today's ${fmt(cartons3)}/month — and July managed ${fmt(sm.jul.cartons)}, the second-lowest volume since February. On current velocity this order does not clear before expiry.`}
              {" "}Get the unit and the per-carton cost confirmed before the meeting ends.
            </p>
          </Panel>

          <Panel title="Receivables aging" tint={T.sand} subtotal={M(ag.totalOutstanding)} span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
              <div>
                <div style={{ display: "grid", gap: 6 }}>
                  {buckets.map(([b, v]) => (
                    <div key={b} style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: T.inkSoft }}>{b}</span>
                      <div style={{ height: 12, background: "rgba(26,36,33,0.05)", borderRadius: 3, position: "relative" }}>
                        <div style={{
                          position: "absolute", inset: "0 auto 0 0", width: `${(v / maxBucket) * 100}%`,
                          background: b === "NotDue" ? T.inkSoft : b === ">365" ? T.loss : T.sand,
                          borderRadius: 3, opacity: 0.85,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(v)}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.6, margin: "12px 0 0" }}>
                  Legal cases stand at {fmt(ag.legal)} — fully provided ({fmt(-rec.provisionLegal)}). The general
                  doubtful provision is {fmt(-rec.provisionDoubtful)} against {fmt(ag.overdue)} overdue. Balance
                  sheet receivables ({fmt(bsRecTotal)}) run {fmt(agingGap)} above the aging report — small, but
                  worth a one-line reconciliation from Tayseer.
                </p>
              </div>
              <div>
                <table>
                  <thead>
                    <tr><th style={{ minWidth: 190 }}>Largest debtors</th><th>Outstanding</th><th>Overdue</th></tr>
                  </thead>
                  <tbody>
                    {ag.top.map((c) => (
                      <tr key={c.n} style={{ borderTop: `1px solid ${T.line}` }}>
                        <td style={{ padding: "6px 8px 6px 0", fontSize: 12.5 }}>{c.n}</td>
                        <td style={{ textAlign: "right", fontSize: 12.5, fontVariantNumeric: "tabular-nums", padding: "6px 8px" }}>{fmt(c.out)}</td>
                        <td style={{ textAlign: "right", fontSize: 12.5, fontVariantNumeric: "tabular-nums", padding: "6px 0 6px 8px", color: c.overdue > 0 ? T.loss : T.inkSoft }}>{fmt(c.overdue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
