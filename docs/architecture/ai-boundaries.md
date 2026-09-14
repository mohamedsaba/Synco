# AI boundaries

AI has two permitted roles in the prototype.

## Candidate AI

AI may act as a normal engineering tool. The system may record the prompt, response, supplied context, timestamps, and explicit insertion actions. Usage is neutral. The system must not infer that manually typed code came from AI or interpret amount of use as competence.

## Reconstruction AI

AI may summarize an event log, compress evidence, and generate factual annotations grounded in specific event IDs. Generated text remains derived and replaceable; raw events remain authoritative.

## Prohibited uses

AI may not:

- rank or score candidates;
- judge or label competence, personality, intent, trust, or understanding;
- automatically pass, reject, or recommend a hiring decision;
- convert task or test outcomes into an evaluator verdict;
- claim manually entered code was copied from AI;
- produce unsupported reconstruction statements.

If a generated statement cannot point to sufficient observable events, it does not belong in the reconstruction.
