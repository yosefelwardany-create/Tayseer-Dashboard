# Tayseer Trading — P&L

Six views of the same business, one deployment. Basis: three Zoho Books ledger
exports on the same accrual basis — **17 Aug 2026** (Jan–Jul), **18 Sep 2026**
(Aug) and **15 Oct 2026** (Sep). It is Tayseer's own system, so top and bottom
line tie to their P&L by construction.

## September 2026, in short

September is the **second profit in a row and the biggest month on record: +141,189
on gross sales of 5,704,835.** Back in August they promised 5.3M of sales and
+100,000 of profit. September cleared both. The September cash flow statement
carries Net Income of 141,189.22 — the same figure the P&L produces — and the
15 Oct balance sheet balances to nil.

Give them the point, then ask these:

- **Management fees are NIL in September.** Jan–Aug booked between 144,339 and
  354,856; August alone was 157,694. The missing charge is larger than the whole
  profit, and July looked exactly like this in the 10 Aug export before the fee
  landed. Until it is booked or waived in writing, the profit is provisional.
- **Two more credits hold the month up**: another 102,306 of near-expiry provision
  released (135,529 across August and September) and a 65,716 Nongshim BTL refund.
  Charge the fee at August's level and add those back and September is **(184,527)**.
- **The margin paid for the volume.** Gross margin fell 35.1% → 28.3% of net
  revenue. Al-Ameed revenue rose to 3,950,057 while its promotional discount nearly
  doubled (268,469 → 571,931) and its cost of sales went 1,240,442 → 2,341,215.
- **Operating expenses look flat and are not.** Total opex moved 1,363,709 →
  1,355,512 on a 34% rise in net revenue. Strip the absent management fee from both
  months and opex rose 149,497.
- **Mid-month numbers move, and here it is measured.** Current-year earnings on the
  18 Sep balance sheet implied September was running at (602,341) with twelve days
  left. The closed month is +141,189 — a swing of +743,530 in the final fortnight.
- **Record sales, no cash.** Operating cash flow (3,101,183), the largest line being
  3,455,089 of advance payments to trade payables. Receivables absorbed 1,707,732 —
  roughly 30% of the month's gross sales — and now stand at 9,196,147. Cash finished
  flat at 1,701,492 only because the shareholders put in another 2,000,000.
  Across August and September they contributed 4,340,484 and the bank balance has
  not moved; cumulative contributions are 17,329,802 against 5,000,000 of capital.
- **Breakeven moved the right way**, though: 4,666,711 of net revenue needed against
  5,359,338 made — 692,627 of headroom, 12.9% of a month's sales, against August's
  102,040 and 2.6%.

Two accounts were re-cut in September, both presentation rather than activity:
sales returns moved from one domestic channel (41001001/2/3) to two, B and G
(41001101/103 and 41001201/202/203); and Advertising & Promotions (65100120)
stopped carrying its own postings, with the spend moving to KA/EC sell-out
subaccounts net of a BTL refund. Every total ties, but brand-level return rates
cannot be compared across August and September until Tayseer supply the mapping.
Thirteen other accounts post for the first time.

**The AR aging report in the pack is still the one from 17 August — two months
stale.** It has not been refreshed with either pack, so a 9.2M debtor book cannot
be aged. That is now the largest gap, and the Stock tab says so rather than
implying the buckets are current.

### August 2026, for reference

August was the first profitable month: **+26,436** on 4,179,656 of gross sales —
they missed the sales target by 1.12M and made a profit anyway, because operating
expenses fell 763,849 and gross margin went 26.8% → 35.1%. About 104,000 of it was
provision releases and reversals; add those back and August is (77,201). Its
breakeven headroom was only 102,040.

| Tab | What it does |
|---|---|
| **Monthly P&L** | Any month against any other, Jan–Sep 2026. Opens on Sep against Aug. Every account figure is editable: click a number, type a new one, and the KPIs, bridge, group charts and the underlying result all recalculate. Includes the **Statement layout** editor (below). |
| **Restatement** | The 10 Aug export against the 17 Aug export, month by month. July moved from (295,646) to (1,122,756) between the two — the tab shows exactly which accounts were booked in between. |
| **Sales projection** | Scores the "5.3M and +100k profit" claim against both months that answered it — August missed the sales and made +26,436; September cleared both with 5.70M and +141,189 — then re-runs the same projection off any base month, with nine months of sales history (best month ever: September, 5.71M gross) and carton volume. The deciding assumption — which costs grow with sales — is a control, not a buried constant. |
| **Payroll** | Tests the "it was one-time costs" explanation across nine months. Tick whichever lines are claimed non-recurring; whatever is left is what turns up again next month. |
| **Stock & receivables** | The 15 Oct balance sheet and the September cash flow: inventory cover and the twice-released expiry provision, where September's cash actually went, the 400,000 + 100,000 order calculator (SAR vs cartons — the unit changes the verdict entirely), aging buckets and the largest debtors. The aging report is still the 17 Aug one, two months stale, and the tab says so. |
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
or name. Add a month (e.g. October, when it closes) by appending a key to `MONTHS` and the
matching field to every row in `data.js` — nothing else needs touching.

### Sources and the restatement

Jan–Jul come from the Zoho ledger export of 17 Aug 2026, August from the 18 Sep 2026 export
and September from the 15 Oct 2026 one — all accrual, leaf accounts plus parent accounts' own
postings (Zoho parents can carry both — dropping them breaks the tie to the balance sheet).
Jan–Sep results sum to (9,836,786); current-year earnings on the 15 Oct balance sheet are
(9,868,534); the (31,748) difference is 1–15 October.

The 18 Sep balance sheet carried current-year earnings of (10,580,317), which implied
(602,341) for 1–18 September against a closed month of +141,189. Mid-period cuts of these
books move by hundreds of thousands; that is the whole reason the Restatement tab exists.

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
data.js           Jan–Sep 2026 figures plus the MONTHS list — 17 Aug, 18 Sep and 15 Oct exports
legacy.js         The 10 Aug baseline, verbatim — drives the Restatement tab. Do not edit.
facts.js          Balance sheet, September cash flow, AR aging and sales-report facts
layout.js         Which header each account sits under; presets and the totals-agree check
finance.js        Variable/fixed cost split and the payroll scope, shared by the analysis tabs
JulyBrief.jsx     The Monthly P&L: month picker, sorting, editable figures, statement layout
Restatement.jsx   10 Aug export vs 17 Aug export, month by month
SalesTest.jsx     The claim scorecard and the sales projection, with nine months of sales history
PayrollBridge.jsx The payroll one-time test
Stock.jsx         Inventory, the new-order calculator, receivables aging
ControlRoom.jsx   The scenario sliders, rebased on any month
App.jsx           Tab shell
server.js         Express API + static hosting
```

Adding a month means two edits: a key in `MONTHS` and the matching field on every row in
`data.js`. Both tabs pick it up automatically.
