# AGENTS.md

This file captures practical conventions for humans and coding agents working in this repository.

## Project Snapshot

- Stack: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Radix.
- Test runner: Vitest with jsdom and Testing Library setup.
- Lint/format tool: Biome.
- Import alias: `@/` maps to `src/`.

## Commands

Use scripts from `package.json`:

- `npm run dev` - start local dev server (Vite).
- `npm run build` - production build.
- `npm run preview` - preview production build.
- `npm run typecheck` - TypeScript project build/typecheck.
- `npm run lint` - Biome check with write mode used in this repo.
- `npm run lint:fix` - Biome auto-fix.
- `npm run format` - Biome format.
- `npm run test` - run tests once.
- `npm run test:watch` - watch mode.

If you prefer another package manager, run the same script targets.

## Source Layout

- `src/pages/` route-level pages (`Index.tsx`, `NotFound.tsx`).
- `src/components/` feature components.
- `src/components/ui/` shadcn-style reusable primitives.
- `src/lib/` domain and utility logic (`composer-state`, persistence, theme/settings).
- `src/hooks/` reusable hooks.
- `src/test/` test setup and tests.

Keep domain/state logic in `src/lib` when it can be reused or tested independently.

## Code Style Conventions

Follow existing Biome configuration and current code patterns:

- Use 2-space indentation.
- Use double quotes.
- Use semicolons.
- Prefer named exports for reusable utilities; page components can default export.
- Use explicit TypeScript types for domain models (see `composer-state.ts`).
- Keep comments minimal and high-signal; use them for non-obvious intent or migrations.
- Keep helper functions small and semantic when possible.

### React Conventions

- Prefer function components with hooks.
- Use `useMemo`/`useCallback` when passing derived values/callbacks into child components or when dependency-driven behavior matters.
- Keep route/page orchestration in page files and move focused UI/state helpers to components/lib.
- Avoid unnecessary side effects; isolate browser storage and URL synchronization clearly.

### State and Data Modeling

- Model domain concepts with explicit types/interfaces (`Hand`, `Note`, `Beat`, `Bar`, `ComposerState`).
- Preserve backwards compatibility where user data/URLs are involved (legacy migration logic exists in `decodeState`).
- Ensure first bar invariants are maintained (`breakBefore` true for first bar).

## Styling Conventions

- Use Tailwind utility classes for most styling.
- Use theme variables from `src/index.css` and `tailwind.config.ts` (`--background`, `--primary`, hand colors, etc.).
- Reuse `cn()` from `src/lib/utils.ts` for class composition in reusable UI components.
- Keep typography consistent with configured fonts (`Space Grotesk`, `JetBrains Mono`).

## Routing and Base Path

- App routes are mounted under `/handpan-muse/`.
- Vite `base` is configured for GitHub Pages at `/handpan-muse/`.
- When adding routes, register them in `src/App.tsx` above the catch-all route.

## Testing Expectations

- Put tests under `src/**/*.{test,spec}.{ts,tsx}`.
- Use Vitest + Testing Library patterns.
- Add tests for non-trivial logic in `src/lib` (encoding/decoding, storage, invariants).

## Agent Working Agreement

When making changes:

1. Keep edits minimal and local to the feature.
2. Do not reformat unrelated files.
3. Prefer updating existing patterns over introducing new abstractions.
4. Run at least relevant checks before finishing:
   - `npm run typecheck`
   - `npm run test` (or targeted tests)
   - `npm run lint` (or `npm run format`/`npm run lint:fix` as needed)
5. Call out behavior changes and any migration implications in your summary.

## What To Avoid

- Do not change URL/state encoding format casually.
- Do not break GitHub Pages base-path assumptions.
- Do not introduce broad stylistic churn in generated `ui/` primitives unless needed.
