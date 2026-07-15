# Tayseer Control Room

A P&L scenario dashboard backed by a Neon Postgres database. One shared
scenario — anyone with the link can move the sliders and click "Save changes"
to persist the current numbers for everyone.

## Local setup

```bash
npm install
```

Create a `.env` file (not committed) with:

```
DATABASE_URL=your_neon_pooled_connection_string
```

Run the frontend and backend together for local testing:

```bash
npm run build
npm start
```

Then visit http://localhost:3000

## Deploy to Render

1. Push this folder to a new GitHub repository.
2. In Render, create a **New Web Service**, connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add an environment variable `DATABASE_URL` with your Neon pooled
   connection string (from Neon → Connection Details).
6. Deploy. Render will give you a live URL — that's the link to share.

## Database

One table, already created in Neon:

```sql
CREATE TABLE scenarios (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

The app always reads/writes the single row where `name = 'default'`.
