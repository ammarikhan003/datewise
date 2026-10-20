# AI log

Where Claude Code was used on Datewise, and why. Ammar reviews every diff; the booking rules, the order transaction and the date picker's keyboard handling are written by hand.

| Date | Milestone | What Claude Code did | Why |
| --- | --- | --- | --- |
| 2026-10-20 | 1 | Scaffolded the repo: Rails API and Angular app generators, Dockerfiles, Docker Compose, CI workflow with placeholder tests | Boilerplate with no business logic; faster to generate and review than to type |
| 2026-10-20 | 2 | Migrations, models and validations; CSV importers, Rake tasks and seed data, all spec-first | Spec assigns schema and import scripting to Claude Code. A new seeds spec caught an autoloading bug (`Rejection` defined inside `result.rb`), fixed by moving it to its own file |
| 2026-10-20 | 3 | Wrote `AvailabilityCalculator` and its specs (all eight rules, clock-change cases) | Plan changed: originally Ammar's to write by hand. Ammar approved the design and rule interpretations first (lead time stacks on the earliest normal date; rules run in spec order; 30-day window inclusive). Each rule was checked by deleting it and confirming a spec fails |
