# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Scope and current structure
- This repo is a hybrid AJW workspace:
  - Main frontend app is primarily `index.html` (large inlined app shell + business logic).
  - API/backend lives in `shopee-chat-backend/` (Express + Shopee integration + AI gateway).
  - Image generation tool assets/UI live in `tools/generate-image/`.
  - Operational scripts and stack config live in `scripts/` and `ajw.stack.config*.json`.
- There is no existing `WARP.md`, prior `AGENTS.md`, or Claude/Cursor/Copilot instruction file in this repo.

## Common development commands
Run commands from the repository root unless noted.

### Backend (Shopee chat backend)
- Install dependencies:
  - `npm --prefix shopee-chat-backend install`
- Start backend in dev watch mode:
  - `npm --prefix shopee-chat-backend run dev`
- Start backend without watcher:
  - `npm --prefix shopee-chat-backend run start`
- Health check once running:
  - `curl http://localhost:3010/health`

### Stack operations (PowerShell)
- Backup AJW workspace artifacts:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\backup-ajw.ps1`
- Deploy selected files to OpenClaw public path (from stack config):
  - `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-openclaw.ps1`
- Optional auto git sync watcher:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\auto-git-sync.ps1`

### Frontend serving
- There is no frontend build script in `package.json`; `vercel.json` routes all non-API traffic to `index.html`.
- For local full-stack behavior that mirrors routes, use your Vercel/local static workflow of choice.

### Linting / tests
- No lint script is currently defined in root or backend `package.json`.
- No automated test runner is currently configured in this repo.
- Single-test command: not available (no test framework configured yet).

## High-level architecture

### 1) Main AJW web app (`index.html`)
- `index.html` is the primary runtime surface: tabbed admin/operations UI (Dashboard, HR, Finance, Tools, AI, Admin, etc.).
- Large portions of behavior are implemented directly in this file, including tab routing and rendering orchestration.
- `shopee_chat_override.js` augments the frontend with Shopee chat functionality that talks to backend APIs.

### 2) Extracted UI module mirrors (`modules/ui/*`)
- `modules/ui/*` contains extracted renderers (`renderDash`, `_renderFinance`, `_renderHR`, `_renderTools`, `_renderAI`, `renderAdmin`, etc.) used as modularized counterparts to core UI logic.
- Treat these as important refactor targets and references when changing tab-specific behavior.

### 3) Shopee backend service (`shopee-chat-backend/`)
- Entry points:
  - `src/server.js` boots Express app.
  - `src/app.js` registers all HTTP routes (Shopee OAuth, live push, chat sync/read APIs, quick replies, AI draft/autonomous flows, media upload/send, xAI video endpoints).
  - `api/index.js` exports app for Vercel serverless.
- Shopee API/signing concerns are isolated in `src/shopee.js`.
- Persistence layer in `src/db.js`:
  - Uses Supabase REST when configured (`SUPABASE_URL` + key).
  - Falls back to local JSON file (`DB_PATH`, default `./data/shopee_chat.json`, or `/tmp/...` on Vercel).

### 4) Backend AI routing subsystem (`shopee-chat-backend/src/ai/*`)
- Flow: controller -> task router -> context builder -> prompt template -> adapter -> cache.
- Key files:
  - `router.js`: task registry (`prompt.enhance`, `agent.run`, `text.generate`, image generation task variants).
  - `contextBuilder.js`: task-scoped context normalization + token discipline.
  - `templates.js`: fixed prompt templates per task type.
  - `adapters.js`: provider execution (currently OpenAI chat/images).
  - `cache.js`: persistent file-backed cache with normalized key hashing.
  - `controller.js`: HTTP endpoints under `/api/ai/*`.
- Design intent is documented in `docs/ai-routing-refactor.md`.

### 5) Generate-image tool (`tools/generate-image/`)
- `embedded-ui.js` mounts the Generate Image UI into AJW pages.
- `app.embedded.js` is the embedded runtime logic used by the mounted UI.
- `app.js` is a fuller standalone script variant with similar prompt/template/state logic.
- Supabase schema for this tool lives in `tools/generate-image/supabase/schema.sql`.

## Data and schema references
- Shopee chat backend SQL schema and policies: `docs/shopee-chat-supabase.sql`.
- AJW stack/project-level config template: `ajw.stack.config.example.json`.

## Practical change guidance
- For API behavior changes, start from `shopee-chat-backend/src/app.js`, then trace into `db.js`, `shopee.js`, and `src/ai/*`.
- For frontend tab behavior, verify whether the effective implementation is in `index.html`, `modules/ui/*`, or both before editing.
- For deployment/routing assumptions, cross-check `vercel.json` at root and in `shopee-chat-backend/`.
