// Shared analysis used by the payroll bridge and the sales test.
// Everything reads BASELINE as booked (accrual, no one-off stripping) — the
// arguments below are about the cost base Tayseer actually reported, so
// normalising it silently would defeat the purpose.
//
// Basis: the Zoho ledger exports of 17 Aug 2026 (Jan–Jul) and 18 Sep 2026
// (Aug), same chart of accounts. Revenue and returns are channel subaccounts
// (41000001-3 gross, 41001001-3 returns).
//
// August is the first profitable month of the year (+26,436), so the levers
// below now cut both ways: `stripReleases` exists because August's result
// leans on roughly 104,000 of provision releases and expense reversals that
// do not recur, and `normaliseAd` matters more than ever because August
// booked 30,530 of advertising against a run rate above 320,000.

import { BASELINE, MONTHS } from "./data.js";

const at = (r, m) => r[m] || 0;
export const total = (m, f) => BASELINE.filter(f).reduce((a, r) => a + at(r, m), 0);

export const isGross = (r) => r.s === "REV" && !r.c.startsWith("41001");
export const isReturn = (r) => r.s === "REV" && r.c.startsWith("41001");

// ------------------------------------------------------------------
// Which costs move when sales move.
//
// This is the whole argument, so it is a setting rather than a constant.
// "cogs" is the assumption that reproduces Tayseer's own 5.3M / +100k claim:
// it says a sales rise brings no extra freight, warehouse labour,
// casual labour, rebates or commissions.
// ------------------------------------------------------------------
export const TREATMENTS = [
  {
    id: "cogs",
    label: "Cost of goods only",
    blurb: "Everything except cost of sales stays flat as sales grow. This is the assumption behind their number.",
    groups: [],
  },
  {
    id: "trade",
    label: "+ trade spend & rebates",
    blurb: "Rebates, commissions, merchandising and freight scale with volume. The defensible middle.",
    groups: ["Variable Selling"],
  },
  {
    id: "full",
    label: "+ warehouse & casual labour",
    blurb: "Handling, outsourced labour and storage scale too — what the last three months actually show.",
    groups: ["Variable Selling", "Outsourcing", "3PL / Warehousing"],
  },
];

export const AD_ACCOUNT = "65100120";      // Advertising & Promotions
export const MGMT_ACCOUNT = "63003000";    // Management Fees
export const DOUBT_ACCOUNT = "65100100";   // Doubtful debts: Jul a -106,000 credit, Aug a +41,541 charge

// Listing / registration fees that are one-time by their own description.
// 65410006 (monthly contractual listing) and 65410005 (platform & portal
// service fees) are deliberately NOT here — both are recurring by name.
export const LISTING_ACCOUNTS = [
  "65410002", // Al-Ameed listing & registration — 273,200 in July, 661 in August
  "65410004", // Key accounts new branch opening ONE TIME fees — 21,505 in August
];
export const LISTING_ACCOUNT = LISTING_ACCOUNTS[0]; // kept for older callers

// Provision releases and expense reversals. A credit on one of these flatters
// the month it lands in and says nothing about the run rate, so `stripReleases`
// adds it back. Only credits are touched — a charge on the same account is a
// real cost and stays.
export const RELEASE_ACCOUNTS = [
  "65900030", // Allowance for near expiry inventory
  "70900000", // Fines and penalties ~ Others
  "65100090", // Ramadan party expenses
  "60000032", // Insurance ~ Marine Cargo Open Cover
  "72020000", // Exchange gain or loss
  "61201000", // Travelling expenses ~ tickets inside country
  "61202000", // Travelling expenses ~ tickets outside country
];

const monthKeys = MONTHS.map((m) => m.key);
export const SPAN = `${MONTHS[0].short}–${MONTHS[MONTHS.length - 1].short}`;

// Advertising runs 31k-1,041k a month; the honest run rate is the year's average.
export const AD_RUN_RATE =
  monthKeys.reduce((a, m) => a + total(m, (r) => r.c === AD_ACCOUNT), 0) / monthKeys.length;

// Management fee: 278k-355k a month until July's 144,339 and August's 157,694 —
// the two together average 151,016, which is the 150,000 they claimed.
export const MGMT_BY_MONTH = Object.fromEntries(
  monthKeys.map((m) => [m, total(m, (r) => r.c === MGMT_ACCOUNT)])
);
export const MGMT_AVG =
  monthKeys.reduce((a, m) => a + MGMT_BY_MONTH[m], 0) / monthKeys.length;

// What the month's result owes to credits that will not come back.
export const releasesIn = (month) =>
  RELEASE_ACCOUNTS.map((c) => ({ c, v: total(month, (r) => r.c === c) }))
    .filter((x) => x.v < -0.005);

// ------------------------------------------------------------------
// The cost structure of one month, split into what moves with revenue
// and what does not, plus any adjustments the user has switched on.
// ------------------------------------------------------------------
export function structure(month, opts = {}) {
  const {
    treatment = "trade",
    mgmtFee = null,          // SAR/month going forward; null = leave as booked
    normaliseAd = false,     // advertising at the whole-period run rate instead of the month's booking
    excludeListing = false,  // treat the one-time listing / registration fees as one-time
    normaliseDoubt = false,  // doubtful debts at nil instead of the month's charge/credit
    stripReleases = false,   // add back provision releases and expense reversals
  } = opts;

  const t = TREATMENTS.find((x) => x.id === treatment) || TREATMENTS[1];
  const isVar = (r) => r.s === "COGS" || (r.s === "OPEX" && t.groups.includes(r.g));

  const gross = total(month, isGross);
  const ret = total(month, isReturn);
  const net = gross + ret;

  let variable = total(month, isVar);
  let fixed =
    total(month, (r) => r.s === "OPEX" && !isVar(r)) +
    total(month, (r) => r.s === "NOE") -
    total(month, (r) => r.s === "NOI");

  const adj = [];
  const shift = (row, amount, label) => {
    // amount > 0 makes the month's cost base heavier
    if (row && isVar(row)) variable += amount;
    else fixed += amount;
    adj.push({ label, amount: -amount }); // sign as effect on the result
  };

  if (excludeListing) {
    const booked = total(month, (r) => LISTING_ACCOUNTS.includes(r.c));
    if (Math.abs(booked) > 0.005)
      shift(BASELINE.find((r) => r.c === LISTING_ACCOUNTS[0]), -booked, "One-time listing & registration fees set aside");
  }
  if (normaliseAd) {
    const booked = total(month, (r) => r.c === AD_ACCOUNT);
    shift(null, AD_RUN_RATE - booked, `Advertising at the ${SPAN} run rate`);
  }
  if (normaliseDoubt) {
    const booked = total(month, (r) => r.c === DOUBT_ACCOUNT);
    if (Math.abs(booked) > 0.005)
      shift(null, -booked, booked < 0 ? "Doubtful-debt credit removed" : "Doubtful-debt charge set aside");
  }
  if (stripReleases) {
    const rel = releasesIn(month);
    const sum = rel.reduce((a, x) => a + x.v, 0);
    if (rel.length) shift(null, -sum, `Provision releases and reversals added back (${rel.length} lines)`);
  }
  if (mgmtFee !== null) {
    const booked = total(month, (r) => r.c === MGMT_ACCOUNT);
    shift(null, mgmtFee - booked, "Management fee going forward");
  }

  const cm = net ? (net - variable) / net : 0;
  return {
    gross, ret, net, variable, fixed, cm, adj,
    returnRate: gross ? -ret / gross : 0,
    result: net * cm - fixed,
    breakeven: cm > 0.0001 ? fixed / cm : Infinity,
    revenueFor: (profit) => (cm > 0.0001 ? (fixed + profit) / cm : Infinity),
    profitAt: (netRev) => netRev * cm - fixed,
  };
}

// The month exactly as filed, for tying back
export function booked(month) {
  return (
    total(month, (r) => r.s === "REV") -
    total(month, (r) => r.s === "COGS") -
    total(month, (r) => r.s === "OPEX") +
    total(month, (r) => r.s === "NOI") -
    total(month, (r) => r.s === "NOE")
  );
}

// ------------------------------------------------------------------
// Payroll — the "it was one-time costs" claim
//
// Scope is the two payroll groups plus outsourced labour, because moving
// work from the payroll to a labour contractor is exactly the substitution
// under question. Whether a line is one-time is a setting, so the claim can
// be tested rather than argued.
// ------------------------------------------------------------------
export const PAYROLL_GROUPS = ["Payroll — G&A", "Payroll — Sales & Distribution", "Outsourcing"];

export const PAYROLL_ROWS = BASELINE.filter((r) => PAYROLL_GROUPS.includes(r.g));

// Ticked by default: genuinely non-recurring on any reading.
export const DEFAULT_ONE_TIME = ["61100040", "61100030"]; // Notice pay, Notice pay - S&D

// Offered for ticking — everything a reasonable person might argue is one-time.
export const ONE_TIME_CANDIDATES = [
  "61100040", // Notice pay
  "61100030", // Notice pay - S&D
  "61100070", // Visas & iqamas
  "62000080", // Visas & iqamas - S&D
  "61400010", // School fees
  "61100100", // Bonus
  "62000000", // Bonus - S&D
  "61100090", // Ramadan bonus
  "62000090", // Ramadan bonus - S&D
  "61100050", // Leave fare
  "62000060", // Leave fare - S&D
  "61401010", // Recruitment fees
  "62000170", // Overtime S&D
  "61100170", // Employee shifting
  "61700009", // Outsourced staff - iqama cost
  "61700010", // Outsourced staff - work permit
  "61700011", // Outsourced staff - sponsorship transfer
  "61700014", // Outsourced staff - return tickets
];

const OUTSOURCED = (r) => r.g === "Outsourcing";
const BASIC = ["61000000", "62000010"]; // basic salaries, the headcount proxy

export function payroll(month, oneTime = DEFAULT_ONE_TIME) {
  const inScope = (r) => PAYROLL_GROUPS.includes(r.g);
  const isOne = (r) => oneTime.includes(r.c);

  const gross = total(month, inScope);
  const oneOff = total(month, (r) => inScope(r) && isOne(r));
  const outsourced = total(month, (r) => OUTSOURCED(r) && !isOne(r));
  const core = gross - oneOff - outsourced;

  return {
    gross,
    oneOff,
    outsourced,
    core,
    underlying: core + outsourced, // what recurs next month
    basic: total(month, (r) => BASIC.includes(r.c)),
  };
}
