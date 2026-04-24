# FBR CHAT · Execution Sprints

## Objective

This sprint plan reorganizes the project around the maximum amount of work that can be executed autonomously inside the current workspace before external blockers appear.

Principle:

- Prefer tasks that can be completed with local code, mocks, schemas, tests, docs, and scaffolding
- Push dependency-heavy or credential-dependent tasks to the latest possible moment
- Preserve a strict order so the agent can keep advancing without asking for re-planning every turn

---

## Autonomy Rules

The agent should proceed autonomously whenever the task depends only on:

- local files
- project scaffolding
- UI implementation
- database schema and migrations
- API contracts
- mocks and fixtures
- tests that can run locally
- documentation
- infrastructure files that do not require production credentials

The agent should pause only for blockers such as:

- production secrets
- external service keys
- deployment approval
- irreversible product decisions not represented in the PRD

---

## Sprint 1 · Foundation Bootstrap

### Goal

Create the runnable local project skeleton so all later work has a stable base.

### Autonomous Tasks

1. Finalize workspace structure for `frontend/`, `backend/`, `orchestrator/`, `nginx/`, and root project docs.
2. Install and validate frontend dependencies.
3. Run the frontend locally and fix any bootstrap issues.
4. Add a minimal backend application skeleton.
5. Add a minimal orchestrator skeleton.
6. Add `.env.example` covering local development variables.
7. Add root `README.md` describing project structure and startup order.

### Definition of Done

- Frontend boots locally
- Backend and orchestrator folders exist with executable entry points
- Project structure matches the PRD well enough to receive real implementation

---

## Sprint 2 · Shared Contracts and Data Layer

### Goal

Create the schema, migrations, core types, and shared contracts before feature logic begins.

### Autonomous Tasks

1. Implement PostgreSQL migration files for:
   - users
   - companies
   - agents
   - groups
   - group_members
   - messages
   - pvt_conversations
   - refresh_tokens
   - system_settings
   - openclaw_call_logs
2. Add indexes and canonical PVT uniqueness rules.
3. Add seed data for one admin user and sample agents.
4. Define backend DTOs/types for auth, groups, PVTs, messages, admin settings, and logs.
5. Add schema validation for core request bodies.
6. Add a small fixture dataset to support frontend integration.

### Definition of Done

- Migrations are present and coherent with the PRD
- Shared contracts are explicit and reusable
- Seed/fixture data supports mock-first development

---

## Sprint 3 · Authentication and Admin Core

### Goal

Implement the base protected API surface required for the rest of the product.

### Autonomous Tasks

1. Implement auth routes:
   - login
   - refresh
   - logout
   - me
2. Implement reusable auth middleware.
3. Implement admin CRUD base for users.
4. Implement admin CRUD base for companies and agents.
5. Add validation and soft delete behavior.
6. Add tests for auth, admin access control, and agent filtering by company.

### Definition of Done

- Protected routes exist and follow the PRD
- Admin ownership is enforced by role
- Core auth flow is testable locally

---

## Sprint 4 · Conversation Backbone

### Goal

Implement the product's structural conversation layer before real-time behavior.

### Autonomous Tasks

1. Implement group CRUD and membership management.
2. Implement PVT creation and canonical lookup.
3. Implement paginated history endpoints for groups and PVTs.
4. Implement mock-safe message persistence helpers.
5. Add tests for:
   - visibility isolation
   - pagination
   - PVT idempotency

### Definition of Done

- Groups and PVTs are operational at API level
- Message history can be queried reliably
- Isolation rules are enforced

---

## Sprint 5 · Realtime Messaging and Frontend Wiring

### Goal

Connect the current frontend base to real conversation data and delivery flows.

### Autonomous Tasks

1. Implement WebSocket server shell.
2. Implement `join_room`, `send_message`, `typing_start`, `typing_stop`, `read_messages`, and `message_updated`.
3. Implement `POST /api/messages` fallback using the same internal pipeline.
4. Replace frontend mock thread state with real local mock/service state.
5. Wire chat sidebar, thread, composer, and context panel to contract-shaped data.
6. Add optimistic UI states for:
   - sending
   - failed
   - offline
   - typing

### Definition of Done

- Chat route works against a real local message flow
- Fallback HTTP and WebSocket contracts are aligned
- Frontend is no longer only static mock structure

---

## Sprint 6 · Admin Panel Realization

### Goal

Turn the admin mock into a route-based operational surface.

### Autonomous Tasks

1. Split admin into route-level pages:
   - dashboard
   - users
   - agents
   - groups
   - logs
   - settings
2. Connect dashboard widgets to local mock/service layers.
3. Implement settings forms bound to `system_settings`.
4. Implement logs table bound to `openclaw_call_logs`.
5. Implement user and agent edit views, including filter-by-company controls for agent cards/lists.
6. Add empty, loading, and error states.

### Definition of Done

- Admin is navigable and structurally aligned with the PRD
- The surface behaves like a product workspace instead of a static mock

---

## Sprint 7 · Agent Integration Layer

### Goal

Prepare the application for external provider integration while keeping local fallback behavior.

### Autonomous Tasks

1. Implement `callOpenClaw()` contract layer.
2. Implement `resolveSecret(api_key_ref)` contract.
3. Implement local mock provider for agent responses.
4. Implement sequential multi-agent routing rules.
5. Implement persistence of `openclaw_call_logs`.
6. Implement graceful timeout and error message behavior.

### Definition of Done

- Agent pipeline works with local mocks
- External-provider boundary is isolated behind a service layer
- Switching to real credentials later is incremental

---

## Sprint 8 · Memory and Context Orchestrator

### Goal

Build the file-based memory workflow described in the PRD.

### Autonomous Tasks

1. Implement MEMORY.md file generation.
2. Implement HISTORY.md file generation.
3. Implement orchestrator worker shell.
4. Implement local summarization/memory mock workflow.
5. Implement ContextRouter token budgeting and file filtering rules.
6. Add tests for:
   - no cross-user leakage
   - no group/PVT context leakage
   - missing file fallback

### Definition of Done

- Context machinery exists locally and matches the PRD structure
- File generation and context assembly are testable without external APIs

---

## Sprint 9 · Voice and Media Completion

### Goal

Finish the media path with upload, STT/TTS contracts, and frontend audio UI.

### Autonomous Tasks

1. Implement upload endpoint shell and storage abstraction.
2. Implement local file validation logic.
3. Implement STT service contract plus local mock transcription.
4. Implement TTS service contract plus local mock generation flow.
5. Wire `message_updated` into frontend audio/transcription updates.
6. Implement recorder and player UX states.

### Definition of Done

- Media flow is ready for real providers
- Frontend audio/transcription UX is structurally complete

---

## Sprint 10 · Quality, Hardening, and Production Readiness

### Goal

Stabilize the codebase so the remaining work is mostly credentials, deployment, and load validation.

### Autonomous Tasks

1. Add security middleware and config placeholders.
2. Add structured logging format.
3. Add test coverage for main critical flows.
4. Add OpenAPI starter documentation.
5. Add operational docs and implementation notes.
6. Refine UX polish and responsive behavior.

### Definition of Done

- Codebase is internally coherent
- Remaining blockers are mostly external environment and secrets

---

## Final External Blockers

These items likely require explicit user input, credentials, or deployment access:

1. Real OpenClaw credentials and endpoint validation
2. Real STT/TTS provider credentials
3. Docker/runtime validation in the target environment
4. Production deploy execution
5. Load tests against the real stack

---

## Execution Order

Proceed strictly in this sequence:

1. Sprint 1
2. Sprint 2
3. Sprint 3
4. Sprint 4
5. Sprint 5
6. Sprint 6
7. Sprint 7
8. Sprint 8
9. Sprint 9
10. Sprint 10

When a sprint is completed:

- update local docs if needed
- move immediately to the next sprint
- stop only on true external blockers
