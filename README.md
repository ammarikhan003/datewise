# Datewise

A delivery-date booking service for an online gift shop: a Rails 7 API decides which delivery dates an order can take, and an Angular 18 app shows them in an accessible date picker. See [docs/SPEC.md](docs/SPEC.md) for the full spec.

Work in progress. Milestone 1 (repo, Docker Compose, CI skeleton) is done.

## Run it

Needs Docker only.

```bash
docker compose up
```

- Web app: http://localhost:4200
- API: http://localhost:3000 (health check at `/up`)

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

See [docs/ai-log.md](docs/ai-log.md) for where AI was used and why. The booking rules, the order transaction and the date picker's keyboard handling are written by hand.
