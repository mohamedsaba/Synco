# Synco / Delimit

Delimit is an early Synco product for observing realistic engineering work. A candidate works in a controlled environment, the system records observable events, and an evaluator reviews a chronological reconstruction and underlying evidence. The product does not score candidates or make hiring decisions.

This repository currently contains the product and architecture baseline plus a deliberately small Next.js shell. No assessment workflow has been implemented yet.

## Start locally

Prerequisites: Node.js 22+ and npm 10+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. A diagnostic endpoint is available at `GET /api/health`.

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

The next intended task is documented in `docs/plans/active/001-first-vertical-slice.md`.
