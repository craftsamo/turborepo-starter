## Web App Guidelines

For general rules and code style guidelines, see [AGENTS.md](../../AGENTS.md).

### Testing

Tests are located in `src/tests/**/*.test.tsx` using Vitest + jsdom.

Run tests with:

- `nps test.web` - Run all web app tests
- `nps test.watch` - Watch mode
- `cd apps/web && yarn test -- path/to/test.test.tsx` - Single test file
