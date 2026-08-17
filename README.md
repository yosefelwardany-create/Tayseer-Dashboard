# Tayseer Trading — P&L

Six views of the same business, one deployment. Basis: the **17 Aug 2026 Zoho
Books ledger export, January to July 2026** — one source for every month, and it
is Tayseer's own system, so top and bottom line tie to their P&L by construction.

| Tab | What it does |
|---|---|
| **Monthly P&L** | Any month against any other, Jan–Jul 2026. Every account figure is editable: click a number, type a new one, and the KPIs, bridge, group charts and the underlying result all recalculate. Includes the **Statement layout** editor (below). |
| **Restatement** | The 10 Aug export against the 17 Aug export, month by month. July moved from (295,646) to (1,122,756) between the two — the tab shows exactly which accounts were booked in between. |
| **Sales projection** | Tests the "5.3M and +100k profit" claim against July's closed cost structure, seven months of sales history (best month ever: May, 4.48M gross), and carton volume. The deciding assumption — which costs grow with sales — is a control, not a buried constant. |
| **Payroll** | Tests the "it was one-time costs" explanation across seven months. Tick whichever lines are claimed non-recurring; whatever is left is what turns up again next month. |
| **Stock & receivables** | The 17 Aug balance sheet and AR aging: inventory cover and provisions, the 400,000 + 100,000 order calculator (SAR vs cartons — the unit changes the verdict entirely), aging buckets and the largest debtors. |
| **P&L control room** | Forward-looking scenario sliders. Pick any month as the baseline and every lever rebases on that month's actuals, derived account by account — the Actuals preset reproduces the real result to the riyal. |

## Statement layout

Tayseer files under 12 headers. The layout editor on the Monthly P&L moves any
account to any header, renames headers (renaming onto an existing name merges
the two), reorders them, and ships three presets — as filed, a 5-header standard
P&L, and a 7-header split that isolates payroll.

Regrouping is presentation, never arithmetic. Total operating expenses is taken
from the statement section, not from the sum of the headers, and the panel
recomputes it both ways and shows the two figures side by side. They have to
agree, so no regrouping can be argued to have moved the result.

Layout saves with **Save changes**, in the same row as the figures, and is
shared — everyone opening the link sees the same statement. Payloads saved
before the editor existed load unchanged.

The control room derives its levers from the **filed** groups, deliberately:
moving a header on the P&L must not silently redefine what a lever means.

Both tabs save to the same Neon database. Anyone with the link sees the last saved
version, and "Save changes" overwrites it for everyone.

## Comparing months

Pick the two months at the top. **Swap** reverses the direction. **Sort** reorders the
expense groups and the lines inside them by statement order, biggest change, biggest amount,
or name. Add a month (e.g. August, when it closes) by appending a key to `MONTHS` and the
matching field to every row in `data.js` — nothing else needs touching.

### Sources and the restatement

All seven months come from one file: the Zoho ledger export of 17 Aug 2026, leaf accounts
plus parent accounts' own postings (Zoho parents can carry both — dropping them breaks the
tie to the balance sheet). Jan–Jul results sum to (10,004,412); current-year earnings on
the 17 Aug balance sheet are (10,049,454); the (45,043) difference is 1–17 August.

The previous build (10 Aug export, May restated from the audited pack) is preserved
verbatim in `legacy.js` and drives the Restatement tab. Regenerate everything from fresh
Zoho exports with `scratchpad/zoho/build_data.py` (extract scripts alongside it).

## Editing figures

- Click any number in **Revenue and cost of sales**, or open a group in the P&L and
  click a line. Edited cells stay tinted blue.
- Negative figures can be typed as `-1000` or `(1000)`.
- **Underlying** strips every ticked one-off / non-cash line from *both* months.
  Untick anything in **Judgement calls** that Tayseer disputes and the whole page re-bridges.
- While anything is edited, an **Effect of your edits** strip appears under the KPIs showing
  each month's result before and after, and how much the month-on-month change has moved.
- **Reset to actuals** restores the figures as booked. It only clears the current
  browser session — the saved version stays until you press Save changes.

To change the baseline permanently, edit `data.js` and redeploy.

## Local setup

```bash
npm install
```

Create a `.env` file (not committed) with:

```
DATABASE_URL=your_neon_pooled_connection_string
```

Then:

```bash
npm run build
npm start
```

Visit http://localhost:3000

For frontend work with hot reload, run `npm run dev` in one terminal and `npm start`
in another — Vite proxies `/api` to port 3000.

## Deploy to Render

1. Push this folder to a new GitHub repository.
2. In Render, create a **New Web Service** and connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variable `DATABASE_URL` with your Neon pooled connection string.
6. Optionally add `AUTH_USER` and `AUTH_PASS` to put the whole site behind a
   username and password. If either is missing, the site is open to anyone with the link.
7. Deploy. Render returns a live URL — that is the link to share.

Note: this must be a **Web Service**, not a Static Site — the save function needs the
Node server.

## Database

One table:

```sql
CREATE TABLE scenarios (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Rows are keyed by name: `default` for the control room, `ledger2026` for the Monthly P&L
(the old `july2026` row is ignored — it carries the pre-restatement chart of accounts).
Nothing to create by hand — each row is inserted the first time you press Save changes.

## Files

```
data.js           Jan–Jul 2026 figures plus the MONTHS list — generated from the 17 Aug Zoho export
legacy.js         The 10 Aug baseline, verbatim — drives the Restatement tab. Do not edit.
facts.js          Balance sheet, AR aging and sales-by-item facts — generated alongside data.js
layout.js         Which header each account sits under; presets and the totals-agree check
finance.js        Variable/fixed cost split and the payroll scope, shared by the analysis tabs
JulyBrief.jsx     The Monthly P&L: month picker, sorting, editable figures, statement layout
Restatement.jsx   10 Aug export vs 17 Aug export, month by month
SalesTest.jsx     The sales projection test, with seven months of sales history
PayrollBridge.jsx The payroll one-time test
Stock.jsx         Inventory, the new-order calculator, receivables aging
ControlRoom.jsx   The scenario sliders, rebased on any month
App.jsx           Tab shell
server.js         Express API + static hosting
```

Adding a month means two edits: a key in `MONTHS` and the matching field on every row in
`data.js`. Both tabs pick it up automatically.
