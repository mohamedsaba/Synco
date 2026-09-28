# Hirearchy / Hirearchy Software agent guide

Hirearchy Software is Hirearchy's engineering-evaluation prototype. A candidate does realistic engineering work in a controlled workspace; the system captures observable events and reconstructs them as evidence; a human evaluator decides what that evidence means.

## Read before changing the product

- `docs/product/` defines the thesis, principles, non-goals, and requirements.
- `docs/scenarios/constitution.md` governs scenario design.
- `docs/architecture/` and `docs/decisions/` define technical and product boundaries.
- For substantial work, create `docs/plans/active/<task>.md` and preserve it in `completed/` when done.

## Non-negotiable rules

- Evidence precedes judgment. Keep acceptance criteria, test outcome, task outcome, evaluator decision, and competence distinct.
- AI use is neutral. Record observable AI interactions; never infer hidden mental state or the origin of manually typed code.
- The evaluator owns the verdict. Do not add candidate scores, rankings, automatic competence labels, or pass/reject decisions.
- The evaluator experience is one chronological reconstruction with expandable source evidence, not a generic analytics dashboard.
- Keep the prototype a modular monolith. No premature microservices, speculative infrastructure, or generic SaaS expansion.
- Fix root causes. No exception suppression, authorization bypasses, weakened tests, arbitrary defaults, duplicated shortcuts, or other cheap-tape fixes.

## Engineering workflow

Read the relevant authoritative docs, inspect current behavior, identify requirements, and update a plan before substantial changes. Implement the smallest coherent vertical slice. Run tests, typechecking, linting, formatting, the build, and relevant integration checks. Review the diff for unnecessary complexity and update documentation when behavior changes. Never resolve product ambiguity silently in code; document a proposed decision first when a product rule must change.

## Definition of done

The requested slice is demoable; important behavior and product constraints are tested; `npm run verify` passes; no unjustified abstraction or dependency was added; errors and known assumptions remain visible; and docs and plans reflect the resulting system.

## Repository safety

Prohibit destructive operations against developer work, including:

- `git reset --hard`
- `git clean -fd`
- `git restore` over dirty files
- unapproved `git stash`
- forced checkout overwriting work
- `git worktree remove --force`
- force push
- destructive cleanup of primary checkout

Require:

- inspect `git status` first;
- preserve unrelated dirty work;
- use isolated worktrees for implementation.
