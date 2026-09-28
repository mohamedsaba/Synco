# Hirearchy / Hirearchy Software

Hirearchy Software is an early Hirearchy product for observing realistic engineering work. A candidate works in a controlled environment, the system records observable events, and an evaluator reviews a chronological reconstruction and underlying evidence. The product does not score candidates or make hiring decisions.

This repository contains the product and architecture baseline plus five completed vertical slices spanning candidate work, authoritative evidence capture, and deterministic evaluator reconstruction.

## Start locally

Prerequisites: Node.js 22+ and npm 10+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set a long local `HIREARCHY_EVALUATOR_KEY` in `.env.local`, then open `http://localhost:3000` and create a candidate session. Slice 5 Candidate Work is deterministic and needs no AI provider key. Runtime sessions are stored in `.data/hirearchy.sqlite` by default. A diagnostic endpoint is available at `GET /api/health`.

The repository retains server-only NVIDIA NIM and OpenRouter adapters for explicit synthetic model experiments. Set `NVIDIA_API_KEY` or `OPENROUTER_KEY` only when intentionally running those credential-gated experiments. They are not connected to the application reconstruction runtime, and neither key is sent to the browser or candidate sandbox. Do not use real applicant, personal, sensitive, or confidential data with experimental providers without a separate privacy/provider review.

## Implemented slices

The Slice 1 fixture follows this flow:

1. Create a session bound to fixture version `1.0.0`.
2. Review the brief and explicitly start the session.
3. Edit and save the one permitted file.
4. Submit to freeze the server-owned file snapshot.
5. Open `/evaluator`, authenticate separately, and review the original file, submitted file, and deterministic unified diff.

Slices 1–4 provide immutable submission, sandboxed commands, realistic Scenario 001, authoritative event capture, and deterministic chronological evidence. Slice 5 adds evaluator-only Candidate Work built from typed facts, phase-bounded workspace aggregation, conservative pytest summaries, closed templates, exact citations, and versioned immutable persistence. Its primary surface presents short evidence milestones such as Test run, Code change, Workspace reversion, and Submitted; exact commands and raw output remain one click away and in Technical Chronology. Earlier artifacts retain audit provenance while deterministic v3 is current. Providers are not part of the runtime path. Reconstruction does not score candidates or make evaluator decisions. Candidate AI and a full interactive PTY remain unimplemented.

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
