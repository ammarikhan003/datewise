# Datewise

A delivery-date booking service for an online gift shop: a Rails 7 API decides which delivery dates an order can take, and an Angular 18 app shows them in an accessible date picker. See [docs/SPEC.md](docs/SPEC.md) for the full spec.

Work in progress. Milestones 1 to 5 are done: repo and CI, data model and CSV import, availability rules, the JSON API, and the Angular shell and design system (see /design-system).

## Run it

Needs Docker only.

```bash
docker compose up
```

- Web app: http://localhost:4200
- API: http://localhost:3000 (health check at `/up`)

The first start creates the database and seeds about 10 sample products and the England and Wales bank holidays for 2026 and 2027.

Optional: copy `.env.example` to `.env` to change the database credentials or admin token.

## Tests

```bash
docker compose run --rm api bash -c "RAILS_ENV=test bin/rails db:prepare && bundle exec rspec"
docker compose run --rm api bundle exec rubocop
docker compose run --rm web npm test
docker compose run --rm web npm run lint
```

End-to-end tests live in `e2e/` and run in CI against the full stack.

## Built with Claude Code

See [docs/ai-log.md](docs/ai-log.md) for where AI was used and why. Every change is reviewed by hand; the order transaction and the date picker's keyboard handling are written by hand.

## Importing data

```bash
docker compose exec api bin/rails "datewise:import[db/seeds/products.csv]"
docker compose exec api bin/rails "datewise:import_holidays[db/seeds/bank_holidays.csv]"
```

Each prints a summary such as `10 imported, 0 duplicates, 2 rejected`, then the line number and reason for every rejected row. Rows whose slug or date already exists are skipped, so re-running is safe. `products.csv` has two deliberately bad rows.

## API

| Method and path | What it does |
| --- | --- |
| `GET /api/products` | List products |
| `GET /api/products/:slug` | One product |
| `GET /api/products/:slug/availability?from=&to=` | Each date with `available` and, if not, `reason` (default: tomorrow to 30 days ahead, at most 62 days) |
| `POST /api/orders` | Re-checks the date under a row lock, then 201, or 422 with `reason` or field `details` |
| `GET /api/admin/days?from=&to=` | Orders booked against capacity per day |
| `PATCH /api/admin/days/:date` | Close or reopen a day, or change its capacity |

Admin requests need `Authorization: Bearer $ADMIN_TOKEN` (`change-me` in local Docker Compose). `POST /api/orders` is limited to 10 requests a minute per IP.
