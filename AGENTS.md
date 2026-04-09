# Agent Guidelines

## Project context

isolet packages any component into a self-contained widget with configurable isolation (shadow DOM, scoped div, or none). Framework-agnostic core with optional adapters for React, vanilla, etc.

## Packages

- `packages/isolet`: core runtime (createIsolet, mountContainer, adapters)
- `packages/cli`: CLI tool (`isolet init`, `isolet build`)

## Code style

- TypeScript strict mode, ESM-first
- Use `node:` prefix for Node.js built-in imports
- Prefer explicit types over inference for public API
- No default exports, use named exports
- Use `.js` extensions in relative imports (ESM resolution)

## Build system

- vite-plus with `pack` config (tsdown under the hood)
- css-text plugin converts CSS to JS strings for shadow DOM injection
- IIFE output exposes `globalThis.__ISOLET__`
- ESM/CJS outputs with `.d.ts` generation
- CLI builds as ESM-only for Node.js

## Testing

- Use vitest (via vite-plus-test override)
- Test shadow DOM mounting in jsdom/happy-dom

## When adding new features

- Keep the core framework-agnostic. Framework-specific code goes in adapters.
- All styles must work inside shadow DOM (no `rem` units, convert to `px`)
- Respect CSP nonces when injecting styles
- Support all three isolation modes: shadow-dom, scoped, none
- Support both script-tag (IIFE) and npm (ESM/CJS) consumption
