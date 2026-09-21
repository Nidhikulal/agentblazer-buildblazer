# AgentBlazer Build Blazer — Phase 2

Live build phase for **AgentBlazer Club's** Build Blazer event at SJEC.

This repo is the starting point for Phase 2, where third-year teams fork it and build the winning design into a live, deployed website.

## How this works

1. **Fork** this repository into your own GitHub account.
2. Clone your fork locally.
3. Implement the winning Figma design assigned to your team.
4. Commit early and often — the process matters as much as the result.
5. Deploy your build (Vercel, Netlify, GitHub Pages, or similar).
6. Submit your fork link + live deployment link before the deadline.

## Getting started

```bash
git clone https://github.com/<your-username>/agentblazer-buildblazer-p2.git
cd agentblazer-buildblazer-p2
# install dependencies here once the stack is decided
```

## Team

| Role | Name |
|------|------|
| Team Lead | TBD |
| Members | TBD |

## Design reference

Link the Phase 1 Figma file here once assigned.

## Tech stack

To be filled in by each team (e.g. React, Tailwind, Next.js).

## Deployment

Live link: _add once deployed_

## Rules

- Fork, don't clone-and-push directly to this repo.
- Stick to the assigned Figma design as closely as possible.
- Submit via pull request or the link-submission form (whichever the organizers specify).

---
Organized by **AgentBlazer Club**, SJEC, in collaboration with **Cipher (CSE Association)**.


---

## Run locally (AgentBlazer Club website)

1. Copy `backend/.env.example` to `backend/.env` and fill in `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and the `SMTP_*` values.
2. Copy `frontend/.env.example` to `frontend/.env` (defaults work for local use).
3. From this folder run:

```bash
npm run install:all     # installs root, backend and frontend dependencies
npm run create-admin    # one time: creates the admin login
npm run dev             # starts backend (port 5000) and frontend (port 5173) together
```

Open http://localhost:5173 for the site and http://localhost:5173/admin for the admin panel.

Notes:
- Applicants get a confirmation email as soon as they submit the membership form.
- The admin panel always asks for login first (the session is not stored across refreshes).
- Gallery and Contact Messages are no longer in the admin panel.
