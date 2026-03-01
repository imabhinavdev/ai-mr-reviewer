# AI MR Reviewer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Automated pull request reviews using AI (Gemini). Receives GitHub webhooks, fetches PR diffs, chunks and reviews added lines with Gemini, and posts review comments back to the PR. Uses Redis for job queuing and optional pub/sub.

## Features

- GitHub webhook integration for `pull_request` events
- Fetches and parses PR diff; filters and chunks for token efficiency
- AI-powered code review (Gemini) with structured feedback per chunk
- Posts full PR review with line-level comments via GitHub API
- Redis-backed job queue (BullMQ) for reliable async processing
- Prometheus metrics at `/metrics` for monitoring
- Docker Compose: run app + Redis with a single command

## Quick start

### With Docker (recommended)

1. Clone and copy env:

   ```bash
   git clone https://github.com/imabhinavdev/ai-mr-reviewer.git && cd ai-mr-reviewer
   cp .env.example .env
   ```

2. Edit `.env` with your `GEMINI_API_KEY`, `GITHUB_TOKEN`, and optionally `REDIS_URL` (defaults to `redis://redis:6379` in Compose).

3. Start app and Redis:

   ```bash
   docker compose up
   ```

   The API runs at `http://localhost:3000`. Configure your GitHub repo webhook to `POST /api/v1/webhooks/review-pr` with the pull request payload.

### Without Docker

1. **Requirements**: Node.js >= 20, Redis (e.g. `redis-server` or a cloud Redis).

2. Install and configure:

   ```bash
   pnpm install
   cp .env.example .env
   # Edit .env: GEMINI_API_KEY, GITHUB_TOKEN, REDIS_URL (e.g. redis://localhost:6379)
   ```

3. Start Redis, then the app:

   ```bash
   pnpm start
   ```

## Environment variables

| Variable         | Required | Description                                          |
| ---------------- | -------- | ---------------------------------------------------- |
| `PORT`           | No       | Server port (default: 3000)                          |
| `NODE_ENV`       | No       | `development` \| `production` \| `test`              |
| `GEMINI_API_KEY` | Yes      | Google Gemini API key                                |
| `GEMINI_MODEL`   | No       | Model name (default: gemini-2.0-flash)               |
| `GITHUB_TOKEN`   | Yes      | GitHub PAT with `repo` scope (for posting reviews)   |
| `REDIS_URL`      | Yes      | Redis connection URL (e.g. `redis://localhost:6379`) |
| `LOG_LEVEL`      | No       | Log level (e.g. `info`, `debug`)                     |

## API

- `GET /` – Health check
- `POST /api/v1/webhooks/review-pr` – GitHub webhook; expects `pull_request` event body. Returns 202 and enqueues a review job.
- `GET /metrics` – Prometheus-format metrics (request counts, review job stats, etc.)

## Development

```bash
pnpm install
pnpm run dev    # nodemon
pnpm run lint
pnpm run format
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute.

## License

[MIT](LICENSE)
