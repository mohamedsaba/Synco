# Scenario: Slice 1 — Trim Customer Names in Greetings

## Scenario identifier

`slice-1-greeting-format`

## Target role

Development and verification test fixture.

## Candidate brief

Customer names copied from an import can contain surrounding whitespace. The greeting formatter currently preserves it, producing visibly uneven messages. Update the formatter so greetings use the customer name without surrounding whitespace.

## Fixture duration & purpose

- **Development fixture duration**: 15 minutes (`durationSeconds = 900`).
- **Calibration note**: This duration is explicitly configured for rapid local testing, automated integration checks, and development workflows. It is **NOT** a calibrated hiring-assessment recommendation.
