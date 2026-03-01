# Contributing to Nirik

Thank you for considering contributing. Please follow these guidelines.

## Development setup

1. Fork and clone the repo.
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and set at least `GEMINI_API_KEY`, `GITHUB_TOKEN`, and `REDIS_URL` (e.g. `redis://localhost:6379`).
4. Run Redis locally (or use Docker: `docker run -p 6379:6379 redis:7-alpine`).
5. Start the app: `pnpm run dev`

## Making changes

- Create a branch from `main`: `git checkout -b your-feature`
- Make your changes. Keep the code style consistent (run `pnpm run lint` and `pnpm run format`).
- Add or update tests if applicable.
- Ensure `pnpm run lint` and `pnpm run format` pass before opening a PR.

## Submitting a PR

- Use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) when opening a PR.
- Describe what changed and why. Link any related issues.
- Maintainers will review and may request changes.

## Code of conduct

This project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Questions

Open a [GitHub issue](https://github.com/imabhinavdev/nirik/issues) for bugs or feature requests.
