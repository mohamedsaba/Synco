# Evaluator experience

Slice 5.1 presents an evidence-first review rather than an analytics dashboard.

## Default hierarchy

1. Factual session context: assessment, scenario, submitted status, duration, submission time, and session reference.
2. **What this scenario examines:** immutable scenario context and neutral evidence areas.
3. Platform notices, including incomplete activity capture where present.
4. **What happened:** grounded summary milestones with direct supporting activity.
5. **Submitted changes:** the authoritative final diff against the scenario baseline.
6. **Technical record:** complete chronology and separate raw-record inspection.

Telemetry counters, provider metadata, attempt identifiers, tree hashes, raw event IDs, and domain enum names are not default evaluator content. No activity-balance, cadence, AI-use, file-count, or test-count KPI is produced.

## Language rules

- Verification progression is factual and neutral: initial, later, and final recorded verification.
- Failing tests and non-zero commands do not receive candidate-quality styling.
- Reversion is described as “Changes reverted” and as a return to a previously recorded state; purpose is not inferred.
- Incomplete capture is a platform limitation, not candidate misconduct.
- Empty related-evidence areas establish only an empty relation, not global absence; useful activity may remain elsewhere in chronology.
- Truncated terminal streams visibly identify captured previews and omitted output, independently for standard output and standard error.
- Automated verification is not a hiring decision; scenario policy may require engineering review.

## State behavior

While reconstruction is pending, the page says “Preparing the session summary…” and leaves scenario context, linked evidence, and submitted changes available. On failure it says the summary is unavailable, confirms that recorded activity and submitted changes remain available, and offers `Try again`. Provider names, codes, stack traces, and attempt state are never exposed.

## Accessibility and responsive behavior

The evaluator route targets WCAG 2.2 AA. Its structure uses landmarks and ordered headings; controls are native links, buttons, and `details`/`summary` disclosures; live preparation state uses `role=status`; unavailable state uses `role=alert`; focus is visibly tokenized; and native disclosures expose their expanded state and support Enter/Space without custom keyboard code.

Diff meaning is available through text, literal `+`/`-` prefixes, and screen-reader labels, not color alone. Code and diff surfaces scroll horizontally instead of forcing page overflow. Layouts collapse from multi-column to a single reading column at narrow widths. Motion is enabled only when the user has not requested reduced motion.

## Validation status

Scenario-linked process evidence is an experimental decision-support mechanism whose incremental validity has not yet been established.

The mechanism organizes inspectable evidence; it is not a validated competency measure. Product research must separately establish whether it improves evaluator decisions beyond final-state review, and any such claim is outside Slice 5.1.

## Evaluator Briefing Foundation

The [accepted final v2 specification](../product/evaluator-v2-design-specification.md) governs the experience; the [architecture audit](../audits/evaluator-v2-architecture-feasibility.md) governs the new foundation. The [briefing architecture](evaluator-briefing.md) and [decision 0005](../decisions/0005-briefing-semantics-remain-presentation-only.md) add a separately versioned, source-grounded serialized briefing and pure role depth without changing this current visual review. [C/D/F/G review artifacts](../artifacts/evaluator-briefing/README.md) precede authorization for the final UI.

Scenario semantics enrich presentation only. They do not change evidence truth.
Evaluator briefings are decision-support artifacts, not candidate-quality judgments.
