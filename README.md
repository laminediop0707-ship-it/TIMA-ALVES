# Estère Adousinda Alves — Birthday Surprise 💗

A private, premium birthday experience: an elegant landing page, a playful name
gate, poems revealed one by one, an immersive photo/video slideshow, a final
love-letter screen and a "Release the love 💗" heart rain.

Everything visible on the site is editable from a **private admin panel** —
no code change required — and the birthday girl only ever sees the published
version.

> **made by lemzo_biker ❤️**

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, React 19, TypeScript) |
| Styling | Tailwind v4 + a hand-written design system in `src/app/globals.css` |
| Database | PostgreSQL via Prisma 5 |
| Auth | Server-side sessions (opaque token, SHA-256 hashed in DB) + argon2id password hashing |
| Media | Files stored outside `/public`, streamed by a controlled API route |
| Tests | Vitest (unit) + a real end-to-end HTTP check |

No secret is ever shipped to the browser: `AUTH_SECRET`,
`ADMIN_BOOTSTRAP_PASSWORD` and `SURPRISE_NAME` are read server-side only and are
never `NEXT_PUBLIC_*`.

---

## Two separate spaces

### `/admin` — private administrator panel

- Login with the bootstrap credentials from `.env` (`ADMIN_USERNAME` /
  `ADMIN_BOOTSTRAP_PASSWORD`).
- **The first login forces a password change.**
- Tabs: **Textes**, **Poèmes**, **Mes souvenirs**, **Publication**, **Compte**.
- Editable content: landing, gate, intro, every poem, transition buttons,
  slideshow labels, final message, heart button label, footer signature and the
  emoji decorations.
- Poems can be **added, edited, duplicated, reordered and deleted** (with a
  confirmation dialog).
- Draft / published separation: save a draft, preview it, then
  **"Confirmer et publier"**. Until then, the live site is unchanged.
- **Historique des publications** with one-click restore into the draft.
- Security: rate-limited login (5 attempts then a 15-minute lock), HttpOnly
  cookies, server-side session revocation, and a password policy.

### `/surprise` — the birthday girl's private space

Flow: **name gate → intro → poems → slideshow → final message → heart rain.**

- The name gate compares the typed full name **server-side only**, forgiving on
  case, extra spaces and accents.
- Wrong answer: *"Oops girl 😭😂 Wrong name ! Try again, birthday queen."*
- This gate is a **playful step, not real authentication**. It only unlocks a
  short surprise session so the published content can be served server-side.
- The slideshow supports images and videos, keyboard arrows, swipe, autoplay
  (images only), thumbnails, progress, captions, a counter, and it pauses any
  playing video when you change slide.

---

## Local development (Windows)

```bash
npm install

# 1. Create your environment file
copy .env.example .env        # then edit AUTH_SECRET etc.

# 2. Start the embedded PostgreSQL, push the schema, create the admin
npm run setup

# 3. Run the app
npm run dev                   # http://localhost:3000
```

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run db:start` / `db:stop` / `db:status` | Local PostgreSQL (persistent, via `pg_ctl`) |
| `npm run db:push` | Apply the Prisma schema |
| `npm run db:seed` | Create the admin account (`-- --reset` to reset the temp password) |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` / `test` | Quality gates |

`npm run setup` = `db:start` + `db:push` + `db:seed`.

### Windows note about PostgreSQL 18

The first `npm run db:start` initialises `.pgdata/`. The local server is started
with a reduced configuration (`shared_buffers=32MB`, `logging_collector=off`) to
avoid the well-known Windows `0xC0000142` / "could not reserve shared memory
region" crash. If it ever fails, stop all `postgres.exe` processes and run
`npm run db:start` again.

---

## Environment variables

See `.env.example`. Key entries:

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session signing/secret material (≥ 32 chars) |
| `SESSION_TTL_HOURS` / `SURPRISE_TTL_HOURS` | Session lifetimes |
| `SESSION_COOKIE_SECURE` | Set `true` in production (HTTPS) |
| `ADMIN_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` | Temporary admin credentials (never committed) |
| `SURPRISE_NAME` | Full name required to unlock the surprise (server-side only) |
| `STORAGE_DIR` | Where uploaded media is written (outside `/public`) |
| `MAX_UPLOAD_SIZE_MB` | Upload size limit |
| `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Local dev database |

---

## Media handling

- Accepted: JPG, JPEG, PNG, WebP, GIF, AVIF images and MP4 / WebM videos.
- Validated **server-side**: size limit, **magic-byte signature** and MIME type.
  A renamed executable is rejected.
- Files are written to `STORAGE_DIR` (outside `/public`) and streamed by
  `/api/media/file/[id]` with an explicit `Content-Type`,
  `X-Content-Type-Options: nosniff`, and HTTP **Range** support so videos can be
  seeked. Uploaded files can never be executed.
- Deletion is soft: the file is kept until the next publish so the live
  slideshow never breaks.

---

## Security model

- Admin passwords are hashed with **argon2id**; plain text is never stored.
- Sessions are opaque random tokens; only their **SHA-256 hash** is stored.
  Cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- Login and surprise attempts are **rate-limited in the database** (survive
  restarts).
- Content, media and publish endpoints all require a valid admin session.
- `/api/content` requires a surprise session (or an admin session for
  `?preview=1`).
- Draft content is unreachable from the public site.
- `.env`, `.pgdata/` and `storage/` are git-ignored.

> ⚠️ The bootstrap credentials (`lemzo` / `lemzo`) are **temporary**. Change the
> password on first login before any public deployment, and rotate `AUTH_SECRET`.

---

## Deployment

The app is a standard Next.js server (`npm run build` then `npm start`), so it
runs well on a small VPS with PM2 + nginx.

**Important:** production needs
1. a **managed PostgreSQL** (`DATABASE_URL`), and
2. a **persistent disk** for `STORAGE_DIR` if you keep local file storage.

`embedded-postgres` is a **development helper only** — do not use it in
production. On a serverless platform (e.g. Vercel) the filesystem is ephemeral,
so either deploy to a VPS with a persistent volume, or swap `src/lib/storage.ts`
for an object-storage driver (S3 / Cloudinary). The storage layer is isolated in
one file to make that change simple.

Production checklist:

```bash
npm ci
npx prisma migrate deploy      # or: npx prisma db push
npm run db:seed                # create the admin once
npm run build
SESSION_COOKIE_SECURE=true npm start
```

---

## Project structure

```
prisma/schema.prisma          # AdminUser, Session, SurpriseSession, SiteContent,
                              # ContentRevision, Media, LoginAttempt
scripts/
  dev-postgres.mjs            # persistent local PostgreSQL (pg_ctl)
  bootstrap-admin.ts          # create/reset the admin account
src/
  app/
    page.tsx                  # landing
    surprise/                 # name gate + experience + slideshow
    admin/                    # login + guarded panel (texts, poems, media, publish)
    api/                      # auth, content, media, surprise, file streaming
  lib/
    env.ts prisma.ts sessions.ts passwords.ts crypto.ts rate-limit.ts
    content.ts media.ts storage.ts validation.ts content-types.ts content-defaults.ts
  components/effects.tsx      # starfield, petals, heart rain
```

---

## Tests

```bash
npm run test          # 25 unit tests: name normalisation, content validation,
                      # media magic-byte detection, URL validation
npm run typecheck     # strict TypeScript
npm run lint          # ESLint
npm run build         # production build
```

A real end-to-end HTTP check (login, auth guards, draft/publish separation,
upload + magic-byte rejection, Range requests, name gate, logout) is described
in the project report; it exercises the running server against the database.
