# Tayseer Trading — P&L

Two views of the same business, one deployment:

| Tab | What it does |
|---|---|
| **Monthly P&L** | Any month against any other — May, June or July 2026, in either direction. Every account figure is editable: click a number, type a new one, and the KPIs, bridge, group charts and the underlying result all recalculate. |
| **P&L control room** | Forward-looking scenario sliders. Pick May, June or July as the baseline and every lever rebases on that month's actuals, derived account by account — the Actuals preset reproduces the real result to the riyal. |

Both tabs save to the same Neon database. Anyone with the link sees the last saved
version, and "Save changes" overwrites it for everyone.

## Comparing months

Pick the two months at the top. **Swap** reverses the direction. **Sort** reorders the
expense groups and the lines inside them by statement order, biggest change, biggest amount,
or name. Add a fourth month by
appending a key to `MONTHS` in `JulyBrief.jsx` and the matching field to every row in
`data.js` — nothing else needs touching.

### A warning about sources

May 2026 comes from the audited analysis pack. June and July come from the later ledger
export. **They disagree on June**: 16 accounts differ, and the ledger shows June a total of
SAR 189,706 worse than the audited pack.

- **June to July** is clean — one source on both sides.
- **May to June** and **May to July** carry that basis difference. The app flags this in
  amber whenever May is one of the two months.

Reconcile the two Junes before either month goes to a lender, an auditor or the board.

Four accounts (codes `AUD-01` to `AUD-04`) have May activity in the audited pack, carry no
account code there, and are absent from the June/July export. They show nil in those months.

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

Rows are keyed by name: `default` for the control room, `july2026` for the July brief.
Nothing to create by hand — each row is inserted the first time you press Save changes.

## Files

```
data.js         May, June and July figures plus the MONTHS list — edit here to change the baseline
JulyBrief.jsx   The Monthly P&L: month picker, sorting, editable figures
ControlRoom.jsx The scenario sliders, rebased on any month
App.jsx         Tab shell
server.js       Express API + static hosting
```

Adding a month means two edits: a key in `MONTHS` and the matching field on every row in
`data.js`. Both tabs pick it up automatically.
