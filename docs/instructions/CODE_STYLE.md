## Code Style

### Typescript

#### Imports

Use aliases (`@workspace/types`, `@workspace/constants`)

#### Formatting

Prettier: 100 char width

- Single quotes, semicolons, LF line endings, final newlines
- `jsxSingleQuote: true`, `bracketSpacing: true`

#### Types

- Use `const` by default; `let` is allowed for reassignment. Never use `var`.
- Avoid `any`, `unknown`, `Object` (uppercase), and `Function` types. Use
  `unknown` only when absolutely necessary for type assertions (e.g.,
  `as unknown as ResponseBody`).

#### Naming

Prefer single-word variables where possible.

- **Types/Interfaces**: PascalCase with `Props`, `State`, `Config` suffix
- **Constants/Enums**: PascalCase (e.g., `ErrorCode`, `MAX_RETRIES`)
- **Functions/Variables**: camelCase
- **Boolean properties**: `is`, `has`, `should` prefix (e.g., `isOpen`,
  `hasError`)
- **File names**: Component files PascalCase, utils camelCase

#### Error Handling

- Avoid `try`/`catch` if possible; use alternative patterns (early return, guard
  clauses).
- Use `try`/`catch` only for async operations and network requests.
- **Conditional logic preference order**: Early returns > Ternary > `switch` >
  `else if` > `else` (avoid).
- Prefer explicit error types and error codes over generic errors.

### TypescriptReact

[Typescript](#typescript) will also be applied simultaneously.

#### Imports

Use aliases (`@workspace/ui`)

#### Naming

- **Components**: PascalCase (e.g., `Header`, `ToggleIcon`)
- **Event handlers**: `on` + PascalCase (e.g., `onClick`, `onSubmit`)

#### Components: Three-tier Component Architecture

##### Core UI Components

Location: `packages/ui/src/components`

- Shadcn-imported base components (e.g., `Button`, `Input`)
- Used across the entire monorepo
- Styling-focused

##### App-wide Components

Location: `apps/**/src/components`

- Reusable components for the web app (e.g., `Providers`)
- Used across multiple pages/sections
- Can include logic

##### Local Components

Location: `apps/**/src/app/components` and `apps/**/src/app/**/components`

- Feature or page-specific components
- Used only within their location or child routes
- Can be tightly coupled to their page/feature context

#### Component Guidelines

- Keep components at the lowest appropriate level (avoid over-generalization).
- Move components up only if reused in 2+ unrelated locations.
- Core components should be styling-focused; app-wide components can include
  logic.
- Local components can be tightly coupled to their page/feature context.
