# Datewise: project spec

Oct 20, 2026 · Ammar Khan

## Purpose

Datewise is a small delivery-date service for an online gift shop: a customer picks a product, and the app shows only the delivery dates the business can actually meet. Behind that one date picker sit real rules, including order cutoffs, courier capacity per day, bank holidays and stock.

It is a portfolio project: a small but complete, backend-led full stack app in Ruby on Rails and Angular, with real business rules and accessible frontend work.

The finished project has to do three things: run with one command, pass its tests in CI, and be small enough to explain and change any part of it live.

## Scope

Version 1 is one customer journey done properly, plus a small admin view. Anything outside the lists below waits for later.

In v1:

- Browse a short list of products (about 10, seeded from CSV)
- Open a product and pick a delivery date from an accessible calendar that greys out dates you can't have, and says why
- Place an order (name, email, address, date); the backend re-checks the date before saving, so an order can never be booked on a full or closed day
- An order confirmation page
- An admin page showing each day's orders against capacity, with the option to close a day
- A Rake task that imports products and bank holidays from CSV and reports rejected rows
- RSpec tests for every rule, frontend unit tests, automated accessibility checks, and GitHub Actions running all of them

Out of v1:

- Payments, user accounts and login (admin access is a single env-var token)
- Emails, real courier APIs, multiple countries or time zones
- Deployment to a cloud host (Docker Compose locally is enough; a free deploy is a stretch goal)
- Contentful (an optional stretch goal, see Architecture)

## Domain rules

A date is available only if every rule below passes; when one fails, the API returns the first failing reason so the picker can explain it. These rules are written test first and kept small enough to explain line by line.

| # | Rule | Unavailable reason returned |
| --- | --- | --- |
| 1 | No dates in the past or today | `past` |
| 2 | Cutoff: orders for tomorrow close at 14:00 UK time today; after that, the earliest date is the day after tomorrow | `after_cutoff` |
| 3 | No delivery on Sundays or on UK bank holidays (from the imported CSV) | `closed` |
| 4 | An admin can close any single date | `closed` |
| 5 | Each date has a capacity (default 50 orders, overridable per date); a full date is unavailable | `fully_booked` |
| 6 | Each product has a lead time in days (e.g. 0 for bouquets, 2 for personalised gifts); dates sooner than that are unavailable | `lead_time` |
| 7 | A product with zero stock has no available dates | `out_of_stock` |
| 8 | Bookings are offered up to 30 days ahead | `too_far` |

Placing an order re-runs all eight checks inside a database transaction and locks that date's capacity row, so two people can't take the last slot at the same moment. A failed check returns HTTP 422 with the reason. All times are Europe/London, and tests freeze the clock so cutoff behaviour is checked either side of 14:00 and across the clock change in March and October.

## Architecture

Two apps in one repo (`api/` and `web/`), started together with Docker Compose alongside PostgreSQL. Products and bank holidays come in through a CSV import task. The browser never decides whether a date is available; it only shows the API's answer.

Stack: Ruby 3.3, Rails 7 (API mode), PostgreSQL 16, RSpec; Angular 18, TypeScript (strict), SASS, Jest, Playwright, axe-core; Docker Compose, GitHub Actions. Stretch goal: product names and descriptions from a headless CMS such as Contentful.

## Backend

A Rails 7 API-only app (`rails new datewise-api --api -d postgresql`) on Ruby 3.3, with the availability rules in one plain Ruby service object, `AvailabilityCalculator`, so they can be tested without HTTP or the database where possible.

Data model:

| Table | Key columns |
| --- | --- |
| `products` | name, slug, price\_pence, lead\_time\_days, stock, image\_url |
| `delivery_days` | date (unique), capacity, closed (bool), closed\_reason |
| `bank_holidays` | date (unique), name |
| `orders` | product\_id, delivery\_date, customer\_name, email, address, status, created\_at |

Endpoints (JSON):

| Method and path | What it does |
| --- | --- |
| `GET /api/products` | List products |
| `GET /api/products/:slug` | One product |
| `GET /api/products/:slug/availability?from=&to=` | Each date in the range with `available` and, if not, `reason` |
| `POST /api/orders` | Re-check the date, then create the order (201) or return 422 with the reason |
| `GET /api/admin/days?from=&to=` | Orders booked vs capacity per day (admin token) |
| `PATCH /api/admin/days/:date` | Close or reopen a day, or change its capacity (admin token) |

Ruby scripting: `bin/rails datewise:import[products.csv]` and `datewise:import_holidays[holidays.csv]` validate each row (required fields, numeric price and stock, real dates), insert the good rows, skip duplicates, and print a summary such as "48 imported, 2 rejected" with the line number and reason for each rejected row. Sample CSVs live in `db/seeds/`, and one of them deliberately includes bad rows.

Also: strong params, model validations, CORS limited to the Angular dev origin, rack-attack rate limiting on `POST /api/orders`, and Rubocop.

## Frontend

An Angular 18 app in strict TypeScript, using standalone components, typed reactive forms and SASS. Every screen is built from a small shared component set, so it works like a mini design system.

Pages: product list, product detail with the date picker, checkout form, order confirmation, admin days view.

Design system (`src/app/ui/`), with SASS tokens for colour, spacing and type in `_tokens.scss`:

- `ui-button` (primary, secondary, disabled and loading states)
- `ui-card` (product tile)
- `ui-field` (label, input, hint and error message wired together)
- `ui-alert` (info, success, error, announced politely to screen readers)
- `ui-date-picker` (the centrepiece)

Accessibility requirements, each one checked in a test or by hand before release:

- Semantic HTML first: real `button`, `label`, `fieldset`, `legend` and headings in order; ARIA only where HTML has no equivalent
- The date picker follows the WAI-ARIA date picker dialog pattern: arrow keys move by day, Page Up and Page Down by month, Home and End to the week's ends, Enter selects, Escape closes, focus returns to the trigger
- Unavailable dates are `aria-disabled` and their reason is read out ("14 November, fully booked"), not just shown in grey
- Visible focus styles, colour contrast of at least 4.5:1, and nothing that relies on colour alone
- Form errors are linked to their fields with `aria-describedby` and summarised at the top on submit
- Works at 320 px wide and at 200% zoom

Every data view has four states: loading (skeleton), empty, error with a retry button, and loaded.

## Testing and CI

Nothing merges to `main` unless GitHub Actions is green. One workflow runs three jobs in parallel on every push and pull request.

| Job | What runs |
| --- | --- |
| `api` | Rubocop, then RSpec against a PostgreSQL service container: unit specs for every rule in `AvailabilityCalculator` (frozen clock), request specs for each endpoint, a concurrency spec for the last slot, and specs for the import task's good and bad rows |
| `web` | ESLint, then Angular unit tests (Jest) for the design-system components and the date picker's keyboard behaviour |
| `e2e` | Starts both apps with Docker Compose, runs Playwright through the order journey, and runs axe-core on every page; any serious or critical accessibility violation fails the build |

Target: at least 90% line coverage on the API, reported by SimpleCov in the job summary.

## Working with Claude Code

The project is built with Claude Code, and the README says so openly. Claude Code works to the rules in `CLAUDE.md` at the repo root: plan first and wait for approval, write the failing test first, one small change at a time with tests run before it's called done, semantic HTML before ARIA, and times in Europe/London with the clock passed in.

The booking rules, the order transaction and the date picker's keyboard handling were first meant to be written by hand. During the build all three were handed to Claude Code too; every change was reviewed, and each piece was kept small enough to explain and change.

`docs/ai-log.md` records where AI was used and why, milestone by milestone.

## Milestones

About a week of focused work, in this order. Each step ends with green tests and a commit.

1. Repo, Docker Compose (Postgres, API, web), CI skeleton running an empty test in each job
2. Data model, migrations and the CSV import task with its specs
3. `AvailabilityCalculator` written test-first, all eight rules
4. Endpoints, the order transaction and the concurrency spec
5. Angular shell, SASS tokens and the design-system components
6. Product pages and the accessible date picker, with keyboard tests
7. Checkout, confirmation and the admin days view
8. Playwright journey and axe checks in CI
9. README with screenshots, setup steps, the rules table and the AI log; repo made public

Done means:

- [x] `docker compose up` gives a working app on a fresh machine
- [ ] CI is green on `main`, with coverage at 90% or more on the API
- [x] Zero serious axe violations, and the whole order journey works with only a keyboard
- [ ] Any rule can be explained and changed, with its tests, live in under ten minutes
- [ ] Repo is public with a clear README
