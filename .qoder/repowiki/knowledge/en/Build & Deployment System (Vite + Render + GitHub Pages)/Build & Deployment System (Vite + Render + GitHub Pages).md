---
kind: build_system
name: Build & Deployment System (Vite + Render + GitHub Pages)
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.ts
    - render.yaml
    - .github/workflows/deploy-simple.yml.disabled
    - scripts/deploy.bat
    - scripts/build-and-push.bat
---

## Build System Overview

The Arc AI OS frontend is a Vite + React application with a small Node.js backend. The build and deployment pipeline spans three targets: local development, GitHub Pages (static), and Render (full-stack).

## Toolchain

- **Bundler**: Vite 6 (`vite.config.ts`) with `@vitejs/plugin-react`.
- **CSS pipeline**: Tailwind CSS 3 + Autoprefixer via PostCSS (`postcss.config.js`, `tailwind.config.js`).
- **TypeScript**: TypeScript ~5.8.2, compiled by Vite (no separate tsc step in scripts).
- **Node runtime**: Node 20 for CI and Render.
- **Package manager**: npm (lockfile present; CI uses `npm ci`).
- **Concurrent dev server**: `concurrently` runs Vite and the Node backend together via `npm run dev:all`.

## Key Files

- `package.json` — defines `dev`, `build`, `preview`, `start`, and `dev:all` scripts.
- `vite.config.ts` — central build config: output to `dist/assets`, dev server on port 3000, `/api` proxy to `http://127.0.0.1:5000`, env injection of `VITE_OPENROUTER_API_KEY`, `@` alias resolving to repo root.
- `render.yaml` — declares two Render services: a Node web service (`arc-ai-backend`, `cd server && npm install && node index.js`) and a static site (`arc-ai-frontend`, `npm install && npm run build`, publishing `./dist`).
- `.github/workflows/deploy-simple.yml.disabled` — disabled GitHub Actions workflow that builds on push to `main` and deploys to GitHub Pages using `actions/upload-pages-artifact` / `actions/deploy-pages`.
- `scripts/*.bat` — Windows batch helpers for manual deployment flows (see below).

## Build Conventions

- Production output goes to `dist/` with assets under `dist/assets/` (`vite.config.ts` `build.outDir` / `build.assetsDir`).
- Each build clears the output directory (`build.emptyOutDir: true`).
- Environment variables are loaded from `.env*` files via `loadEnv(mode, '.', '')`; only `VITE_OPENROUTER_API_KEY` is explicitly redefined into `import.meta.env` at build time.
- The `base` URL is set to `/` (root-relative), suitable for both GitHub Pages and Render static hosting.
- The dev server sets permissive CORS headers (`Access-Control-Allow-Origin: *`) and a very broad Content-Security-Policy (allowing `unsafe-inline`, `unsafe-eval`, `blob:`, `data:`) — this is a development convenience, not a hardened policy.
- An `@` path alias maps to the repository root, used for absolute imports inside the app.

## Development Workflow

- `npm run dev` — starts Vite dev server on `0.0.0.0:3000`.
- `npm run dev:server` — starts the Node backend via `node server/index.js`.
- `npm run dev:all` — runs both concurrently with colored prefixes and kills the other on failure.
- `npm run preview` — serves the built `dist/` locally.

## Deployment Targets

### Render

`render.yaml` defines:

1. **Backend** (`arc-ai-backend`): Node environment, `NODE_VERSION=20`, `PORT=10000`, build via `cd server && npm install`, start via `cd server && node index.js`.
2. **Frontend** (`arc-ai-frontend`): Static environment, build via `npm install && npm run build`, publish path `./dist`, rewrite all routes to `/index.html` for SPA routing.

Render is the primary production target for the full stack.

### GitHub Pages

The workflow file `.github/workflows/deploy-simple.yml.disabled` is intentionally disabled (`.disabled` extension). When enabled, it:

- Triggers on push to `main` and `workflow_dispatch`.
- Uses `actions/setup-node@v4` with Node 20 and npm cache.
- Runs `npm ci`, then `npm run build` with `VITE_API_URL=https://leonux-ai-backend.onrender.com/api`.
- Creates `dist/.nojekyll` to disable Jekyll processing.
- Uploads `./dist` as a Pages artifact and deploys via `actions/deploy-pages@v4`.

### Local Batch Scripts

`scripts/deploy.bat` automates a GitHub Pages flow: `npm run build` → validate `dist/index.html` and `dist/assets` exist → `git add .` → commit → `git push origin main` → prints manual steps to enable Pages and configure secrets (`VITE_OPENROUTER_API_KEY`).

Other batch scripts in `scripts/` (`build-and-push.bat`, `deploy-render.bat`, `check-deployment.bat`, etc.) are ad-hoc helpers for specific fixes or deployments; they follow the same pattern of calling `npm run build` followed by git operations.

## Constraints and Rules

- The build script is `npm run build` (Vite); there is no Makefile, Dockerfile, or cross-compilation step in this repository.
- The GitHub Actions workflow is disabled by filename suffix (`.disabled`), so CI does not currently auto-deploy to GitHub Pages.
- The Render configuration pins Node version to 20 for both services.
- The frontend is treated as a static site on Render (`env: static`, `staticPublishPath: ./dist`), while the backend is a separate Node service — they are deployed as two distinct Render services.
- The `dist/` directory structure (`index.html` + `assets/`) is validated by the deploy batch script before committing.
- There is no semantic versioning or changelog automation; `package.json` has `version: "0.0.0"` and is marked `private: true`.