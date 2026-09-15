# Synco / Delimit

Delimit is an early Synco product for observing realistic engineering work. A candidate works in a controlled environment, the system records observable events, and an evaluator reviews a chronological reconstruction and underlying evidence. The product does not score candidates or make hiring decisions.

This repository contains the product and architecture baseline plus the first complete evidence slice: a fixed scenario, one-file candidate workspace, durable submission, and evaluator evidence review.

## Start locally

Prerequisites: Node.js 22+ and npm 10+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set a long local `DELIMIT_EVALUATOR_KEY` in `.env.local`, then open `http://localhost:3000` and create a candidate session. To exercise the Slice 5 reconstruction with synthetic Scenario 001 data, also set `NVIDIA_API_KEY` in `.env`. The key is server-only and is never sent to the browser or candidate sandbox. Runtime sessions are stored in `.data/delimit.sqlite` by default. A diagnostic endpoint is available at `GET /api/health`.

The current reconstruction integration uses NVIDIA NIM hosted inference (`nvidia/nemotron-3.5-lightning-30b-a3b`). This configuration is approved only for synthetic/test Scenario 001 evidence. Do not use real applicant, personal, sensitive, or confidential data. A separate privacy and provider review is required before any production use with real applicants.

## Implemented slices

The Slice 1 fixture follows this flow:

1. Create a session bound to fixture version `1.0.0`.
2. Review the brief and explicitly start the session.
3. Edit and save the one permitted file.
4. Submit to freeze the server-owned file snapshot.
5. Open `/evaluator`, authenticate separately, and review the original file, submitted file, and deterministic unified diff.

Slices 1–4 provide immutable submission, sandboxed commands, realistic Scenario 001, authoritative event capture, and deterministic chronological evidence. Slice 5 adds a derived, evaluator-only NVIDIA NIM reconstruction with strict evidence citations and persistent generation lifecycle. It does not score candidates or make evaluator decisions. Candidate AI and a full interactive PTY remain unimplemented.

## Verify changes

```bash
npm run verify
```

This runs formatting checks, linting, TypeScript checks, unit tests, and a production build.

## Where to begin

- Read [AGENTS.md](AGENTS.md) before making changes.
- Use [ARCHITECTURE.md](ARCHITECTURE.md) as the technical map.
- Product sources of truth live in `docs/product/`.
- Scenario rules and the first validation scenario live in `docs/scenarios/`.
- Substantial work starts with a plan in `docs/plans/active/`.

Completed work is preserved in `docs/plans/completed/001-first-vertical-slice.md`.
