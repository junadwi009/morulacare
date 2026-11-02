# Local development and synthetic persistence implementation plan

> **For agentic workers:** Use the repository router and subagent-driven development with disjoint ownership; user authorized autonomous local execution.

**Goal:** Run the existing demo on this Windows machine and preserve mutable synthetic state across restarts.

**Architecture:** Keep clinical fixtures immutable. Add explicitly selected PostgreSQL storage behind existing demo repository operations; Flyway owns schema, database constraints and transactions own idempotency. Default memory mode remains usable without a database.

**Tech Stack:** Existing Expo 58, React Native 0.88.1, Spring Boot 3.5.16, Java 21, PostgreSQL, Docker Compose.

**Spec:** User attachment, contracts/README.md and docs/BLUEPRINT.md.

## Global constraints

- Synthetic data only, exact demo profile guard, server-derived patient identity.
- No appointment mutation, partner enablement, outbound messages or deployment.
- Preserve locked dependencies and historical evidence; no volume deletion.
- One heavy local process at a time given limited free RAM.

## Review focus

- Concurrent equal keys return one receipt; conflicting payloads return 409.
- Restart/seed leaves preferences, acknowledgements and receipts intact.
- Invalid storage selection fails closed and memory tests need no PostgreSQL.
- API failure remains visible until successful overview refresh.
- Compose database has no published port; secrets stay in ignored local configuration.

## Task 1: Baseline and editor (main + mobile agent)

- [x] Build unchanged backend with existing Dockerfile; capture Java test results.
- [x] Install mobile lockfile, check TypeScript, run API-mode web flow checks.
- [x] Create relative VS Code tasks, recommendations and setup documentation.

## Task 2: Durable mutable state (backend agent, after baseline)

- [x] Add JDBC/Flyway/PostgreSQL dependencies and explicit memory/postgres selection.
- [x] Add migrations and store for requests/idempotency, preferences, acknowledgements.
- [x] Preserve existing validation, identity checks, clinical fixtures and API DTOs.
- [x] Add real PostgreSQL tests for retry/conflict/concurrency/scoping/seed preservation.

## Task 3: Compose and verification (main)

- [x] Add pinned PostgreSQL image, internal networking, volume, health dependency and local credentials.
- [x] Build/test updated backend; verify real HTTP and state after restart without deleting data.
- [x] Independently review patch, document observed web/native limits and leave services running.

No Git metadata is present in this extracted package; do not create commits or alter unrelated workspace files.
