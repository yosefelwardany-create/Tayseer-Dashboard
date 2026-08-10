# Tayseer Trading — P&L

Two views of the same business, one deployment:

| Tab | What it does |
|---|---|
| **July 2026 brief** | The July-against-June statement. Every account figure is editable — click a number, type a new one, and the KPIs, bridge, group charts and the underlying result all recalculate. |
| **P&L control room** | Forward-looking scenario sliders on the June run-rate. |

Both tabs save to the same Neon database. Anyone with the link sees the last saved
version, and "Save changes" overwrites it for everyone.

## Editing figures

- Click any number in **Revenue and cost of sales**, or open a group in the P&L and
  click a line. Edited cells stay tinted blue.
- Negative figures can be typed as `-1000` or `(1000)`.
- **Underlying** strips every ticked one-off / non-cash line from *both* months.
  Untick anything in **Judgement calls** that Tayseer disputes and the whole page re-bridges.
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
data.js         July and June figures, one row per account — edit here to change the baseline
JulyBrief.jsx   The July 2026 statement, editable
ControlRoom.jsx The scenario sliders
App.jsx         Tab shell
server.js       Express API + static hosting
```
