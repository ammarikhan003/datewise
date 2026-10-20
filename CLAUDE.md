# Datewise
Rails 7 API (api/) + Angular 18 app (web/). Spec: see docs/SPEC.md.

## Rules
- Plan first: write the plan, wait for approval, then change code.
- One small change per step; run the relevant tests before saying it's done.
- Never edit the date picker's keyboard code. Suggest changes as review comments instead.
- Write the failing test first for any new behaviour.
- Semantic HTML before ARIA. Every new component gets an axe check.
- Ruby: Rubocop clean. TypeScript: strict, no `any`.
- Times are Europe/London. Never use Time.now in rules; pass the clock in.
- Explain every non-obvious choice in the PR description in plain words.
