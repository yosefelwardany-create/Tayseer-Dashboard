// Statement layout — which header each expense account sits under, and in
// what order the headers appear.
//
// Tayseer files under 12 headers. Moving an account between headers is
// presentation, never arithmetic: total operating expenses must come out
// identical whatever the layout. checkInvariant() below is what proves it,
// and the P&L shows the result so the point cannot be argued.
//
// Layout shape:
//   { moves: { [accountCode]: "Header name" }, order: ["Header", ...] }
// An account with no entry in `moves` stays under its filed header.

import { BASELINE } from "./data.js";

export const FILED_ORDER = [...new Set(BASELINE.filter((r) => r.s === "OPEX").map((r) => r.g))];

export const EMPTY = { moves: {}, order: FILED_ORDER };

export const effGroup = (r, layout) => (layout && layout.moves && layout.moves[r.c]) || r.g;

// Headers currently in use, in display order. Only operating expenses take
// part — revenue and cost of sales keep their statement position.
export function groupOrder(rows, layout) {
  const live = [...new Set(rows.filter((r) => r.s === "OPEX").map((r) => effGroup(r, layout)))];
  const order = (layout && layout.order) || [];
  return live.sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 1e6 + live.indexOf(a) : ia) - (ib < 0 ? 1e6 + live.indexOf(b) : ib);
  });
}

// ------------------------------------------------------------------
// Presets
// ------------------------------------------------------------------

// 12 filed headers collapsed to 5. Depreciation stays on its own — it is
// non-cash and the statement carries a result-before-depreciation memo that
// depends on being able to find it.
const STANDARD_MAP = {
  "Advertising & Marketing": "Trade & Selling",
  "Variable Selling": "Trade & Selling",
  "Payroll — G&A": "People",
  "Payroll — Sales & Distribution": "People",
  "Outsourcing": "People",
  "3PL / Warehousing": "Operations & Logistics",
  "Vehicles": "Operations & Logistics",
  "General & Administration": "Overheads & Admin",
  "Professional Fees": "Overheads & Admin",
  "Rent": "Overheads & Admin",
  "Travel": "Overheads & Admin",
  "Depreciation": "Depreciation",
};

const STANDARD_ORDER = ["Trade & Selling", "People", "Operations & Logistics", "Overheads & Admin", "Depreciation"];

// People split out from the rest — for the payroll conversation
const PEOPLE_MAP = {
  ...STANDARD_MAP,
  "Payroll — G&A": "Payroll — office",
  "Payroll — Sales & Distribution": "Payroll — field",
  "Outsourcing": "Outsourced labour",
};

const PEOPLE_ORDER = [
  "Payroll — office", "Payroll — field", "Outsourced labour",
  "Trade & Selling", "Operations & Logistics", "Overheads & Admin", "Depreciation",
];

const fromMap = (map, order) => ({
  moves: Object.fromEntries(
    BASELINE.filter((r) => r.s === "OPEX" && map[r.g]).map((r) => [r.c, map[r.g]])
  ),
  order,
});

export const PRESETS = [
  { id: "filed", label: `As filed (${FILED_ORDER.length} headers)`, layout: EMPTY },
  { id: "standard", label: `Standard P&L (${STANDARD_ORDER.length} headers)`, layout: fromMap(STANDARD_MAP, STANDARD_ORDER) },
  { id: "people", label: `People split (${PEOPLE_ORDER.length} headers)`, layout: fromMap(PEOPLE_MAP, PEOPLE_ORDER) },
];

// ------------------------------------------------------------------
// Edits
// ------------------------------------------------------------------
export const moveAccount = (layout, code, header) => ({
  ...layout,
  moves: { ...layout.moves, [code]: header },
  order: layout.order.includes(header) ? layout.order : [...layout.order, header],
});

// Renaming is moving every account under the old header to a new one, which
// keeps a single representation and means rename and merge are the same edit.
export function renameGroup(layout, rows, from, to) {
  const clean = to.trim();
  if (!clean || clean === from) return layout;
  const moves = { ...layout.moves };
  rows.filter((r) => r.s === "OPEX" && effGroup(r, layout) === from).forEach((r) => (moves[r.c] = clean));
  const order = layout.order.includes(clean)
    ? layout.order.filter((g) => g !== from)                       // merged into an existing header
    : layout.order.map((g) => (g === from ? clean : g));           // straight rename, position kept
  return { ...layout, moves, order };
}

// `list` is the order as currently displayed, so an empty header waiting for
// its first account moves the same way as a populated one.
export function reorder(layout, list, header, delta) {
  const i = list.indexOf(header);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return layout;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return { ...layout, order: next };
}

// ------------------------------------------------------------------
// The guarantee: regrouping never changes the total.
// ------------------------------------------------------------------
export function checkInvariant(rows, layout, month) {
  const filed = rows.filter((r) => r.s === "OPEX").reduce((a, r) => a + (r[month] || 0), 0);
  const byHeader = groupOrder(rows, layout).reduce(
    (a, g) => a + rows.filter((r) => r.s === "OPEX" && effGroup(r, layout) === g).reduce((x, r) => x + (r[month] || 0), 0),
    0
  );
  return { filed, byHeader, ok: Math.abs(filed - byHeader) < 0.01 };
}
