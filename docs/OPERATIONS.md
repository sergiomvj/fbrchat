# FBR CHAT · Local Operations Notes

## Current State

- Backend exposes auth, admin, groups, PVTs, uploads, bootstrap, and HTTP message fallback.
- Socket.IO is attached in `backend/src/server.js`.
- Frontend chat and admin routes now consume the live local backend instead of static mocks.
- Memory artifacts are materialized under `backend/runtime/memory/users/<user_id>/`.

## Local Validation

- Backend tests: `cd backend && npm test`
- Frontend build: `cd frontend && npm run build`
- Frontend dev server: `cd frontend && npm run dev`
- Backend dev server: `cd backend && npm run dev`

## Seeded Credentials

- Admin: `admin@fbr.local` / `admin123`
- User: `joao@fbr.local` / `user123`

## Mocked Integrations

- `callOpenClaw()` resolves `api_key_ref` locally and returns deterministic mock responses.
- STT returns local transcription text based on the uploaded filename.
- TTS returns synthetic local URLs under `/mock-tts/`.
- Uploads return validated local descriptors under `/mock-uploads/`.

## Remaining External Blockers

- Real OpenClaw credentials and endpoint switching
- Real binary object storage
- Real STT/TTS provider credentials
- Production deploy and load validation
