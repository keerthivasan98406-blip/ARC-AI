---
kind: dependency_management
name: Multi-package npm dependency management with lockfiles and subproject isolation
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - server/package.json
    - server/package-lock.json
    - plant-disease-detector/backend/package.json
    - plant-disease-detector/backend/package-lock.json
    - plant-disease-detector/frontend/package.json
    - plant-disease-detector/frontend/package-lock.json
    - extension/manifest.json
---

## Overview

Arc AI OS is a multi-package JavaScript/TypeScript repository managed with **npm** (no yarn/pnpm). It contains three independent Node.js projects, each with its own `package.json` and `package-lock.json`, plus a Chrome extension that ships as plain JS.

## Package layout

| Location | Project | Manager | Notes |
|---|---|---|---|
| `package.json` + `package-lock.json` | Frontend shell (Vite + React) | npm | Main app; declares runtime deps (`react`, `@google/genai`, `pdfjs-dist`, `katex`, `mammoth`) and dev deps (`vite`, `typescript`, `tailwindcss`, `concurrently`) |
| `server/package.json` + `package-lock.json` | Express backend API | npm | Runtime deps: `express`, `cors`, `dotenv`; dev dep: `nodemon` |
| `plant-disease-detector/backend/package.json` + `package-lock.json` | Plant disease detector backend | npm | Runtime deps: `express`, `multer`, `node-fetch`, `uuid`, `dotenv`, `cors` |
| `plant-disease-detector/frontend/package.json` + `package-lock.json` | Plant disease detector frontend (Vite + React) | npm | Separate Vite/React stack from the main app |
| `extension/manifest.json` | Chrome Extension (MV3) | none | No `package.json`; all logic is hand-written JS (`background.js`, `content.js`, `shield.js`, `sidepanel.js`) |

## Versioning strategy

- Dependencies use **caret ranges** (`^x.y.z`) in `dependencies` and `devDependencies`, allowing patch-level updates automatically. Examples: `react: ^19.2.4`, `vite: ^6.2.0`, `express: ^4.18.2`, `tailwindcss: ^3.4.17`.
- A few packages pin exact versions via tilde or explicit values, e.g. `typescript: ~5.8.2` in the root project.
- Each subproject maintains its own version field independently (e.g. root `0.0.0`, server `3.5.0`, plant-disease-backend `1.0.0`, plant-disease-frontend `1.0.0`, extension `1.0.1`).

## Lockfiles

Every `package.json` has a corresponding `package-lock.json` committed alongside it, ensuring deterministic installs across environments. The root, `server/`, `plant-disease-detector/backend/`, and `plant-disease-detector/frontend/` directories each ship their own lockfile.

## Private registries / vendoring

- No `.npmrc`, no `registry` overrides, no `GOPRIVATE` equivalent — packages are resolved from the public npm registry.
- No `vendor/` directory; dependencies are installed into per-project `node_modules/` at install time.
- The Chrome extension under `extension/` is not npm-managed; its assets (icons, scripts) are checked in directly.

## Scripts as dependency orchestration

The root `package.json` uses `concurrently` to run both the Vite dev server and the Express backend together:
```
"dev:all": "concurrently --kill-others-on-fail --names \"VITE,SERVER\" --prefix-colors \"cyan,yellow\" \"npm run dev\" \"npm run dev:server\""
```
The backend itself uses `nodemon` for hot-reload during development.

## Build toolchain as declared dependencies

- **Frontend**: Vite (`vite`, `@vitejs/plugin-react`), TypeScript (`typescript`), TailwindCSS (`tailwindcss`, `autoprefixer`, `postcss`), FontAwesome (`@fortawesome/fontawesome-free`).
- **Backend**: Express (`express`), CORS (`cors`), environment loading (`dotenv`).
- **Plant-disease modules**: Separate Vite + React stack with `axios`, `lucide-react`, `react-router-dom`.

## Constraints observed

- There is no monorepo manager (no `pnpm workspace`, `yarn workspaces`, `turbo`, `nx`); each subproject is an independent npm package.
- Dependency updates are not automated by any visible CI step in this repo (the only workflow file present is `deploy-simple.yml.disabled`).
- The extension manifest pins host permissions explicitly for the deployed Render URL and localhost backends rather than using a wildcard-only approach.