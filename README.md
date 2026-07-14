# Coaching Hub

A private hub for coaching clients. Each client signs in to their own space with:

- Coaching notes (written by Michael or Ben)
- Next session date + Zoom link
- Their biggest wins
- Shared resources
- A message board to talk directly with Michael or Ben

Michael and Ben sign in with an admin account that lists every client and lets them
edit each client's space and reply to messages.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **PostgreSQL** via **Prisma**
- **NextAuth** (credentials login: email + password, sessions via JWT)

This is a real, deployable app — not a mockup. It has no demo/sample data wired into
the UI; everything comes from the database.

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — a Postgres connection string. Easiest options for a small app like
  this: [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both have a free
  tier and give you a connection string in under a minute). Railway or any managed
  Postgres works too.
- `NEXTAUTH_SECRET` — generate one with `openssl rand -base64 32`.
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev.

Then set up the database:

```bash
npx prisma db push      # creates the tables
npm run db:seed         # creates Michael, Ben, and one sample client
npm run dev
```

The seed script creates three accounts, all with password `changeme123`:

- `michael@example.com` (admin)
- `ben@example.com` (admin)
- `client@example.com` (client)

**Change these immediately** — either by hand in the database, or by building a
"change password" flow before you invite real clients (see Next steps below).

## 2. How access works

- There's one login page for everyone at `/`.
- Admins (Michael, Ben) land on `/admin`: a list of every client, with a button to
  add a new client account (name, email, temporary password).
- Clicking into a client shows their full space and lets an admin edit the Zoom
  link, next session time, add notes, log wins, add resources, and message them.
- Clients land on `/dashboard`: their own space only, read-only for notes/wins/
  resources, plus the message board. They cannot see other clients or edit their
  own notes/wins — only Michael or Ben can.
- Route access is enforced server-side in `src/middleware.ts` and in every API
  route (not just hidden in the UI), so a client can't reach another client's data
  by guessing a URL.

## 3. Deploying

The simplest path:

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the three environment variables from `.env` in the Vercel project settings
   (use your real `NEXTAUTH_URL`, e.g. `https://coaching.yourdomain.com`).
4. Deploy. Then run `npx prisma db push` and `npm run db:seed` once, pointed at
   your production `DATABASE_URL` (from your own machine, or a one-off script).

Any host that runs Node works (Railway, Render, Fly.io, your own server) — Vercel
is just the path with the fewest steps for a Next.js app.

## 4. Adding clients going forward

Right now, admins create client accounts from `/admin` with a temporary password
they share with the client directly (e.g. over email or in your first call). There's
no self-signup — that's intentional, so random people can't create accounts.

## Next steps worth considering

This covers everything you asked for. A few things you may want to add once it's
in real use, roughly in order of how soon you'd likely want them:

1. **Password reset / change-password flow** — right now, only an admin editing
   the database can reset a password.
2. **Email notifications** — e.g. notify a client when a new note or message lands,
   notify Michael/Ben when a client messages them.
3. **File uploads for resources** (currently resources are a title + link).
4. **Audit trail** for who edited what, if that matters for your practice.

None of these are required to use the app as-is — they're just the natural next
layer once real clients are on it.
