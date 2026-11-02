# Morula Care API — Java demo

Java 21 + Spring Boot 3.5.16. This executable prototype serves **synthetic** patient data only. It intentionally starts only with exactly the `demo` profile. It is not a production authentication system, medical record, hospital connector, staffed chat, or clinical decision tool.

## Run locally

Prerequisite: a Java 21 JDK. The Maven wrapper downloads Maven 3.9.11 on first run; internet access is required for first dependency resolution.

Windows PowerShell (no `.ps1` file required):

```powershell
.\mvnw.cmd verify
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

macOS/Linux:

```bash
./mvnw verify
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

Or, with Maven installed, replace `./mvnw` with `mvn`. The API listens on port `8080`.

The wrapper is standard Apache Maven source, not an application installer. `verify` runs the tests and produces `target/morula-care-api-0.1.0.jar`.

Run the built JAR:

```bash
java -jar target/morula-care-api-0.1.0.jar --spring.profiles.active=demo
```

Docker, from this directory:

```bash
docker build -t morula-care-api:demo .
docker run --rm -p 127.0.0.1:8080:8080 -e SPRING_PROFILES_ACTIVE=demo morula-care-api:demo
```

The Docker container runs as a non-root user. These tags are convenient development inputs, not a production supply-chain pin. The Java tests are run in the build stage. A private phone on your LAN needs an explicitly permitted LAN binding and API URL; do not publish this demo API to the internet.

## Authentication and mode boundaries

All `/api/v1/*` requests use:

```http
Authorization: Bearer demo-patient-token
```

This is a deliberately public demo identifier for the one synthetic account. It offers no real account security. Non-demo, missing, and mixed profiles fail at startup. Before real use, replace the demo profile with hospital-approved identity proofing, OIDC access-token validation, patient/branch scopes, separate partner consent, durable storage, audit trails, and integration adapters.

`GET /actuator/health` is public and returns only liveness. Browser CORS allows `http://localhost:8081` and `http://localhost:19006`. Native app networking does not use browser CORS. Patient data responses use `Cache-Control: no-store`. Unknown JSON fields are rejected. Patient identity is resolved server-side; callers cannot choose it through a query/body parameter.

## API

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/api/v1/overview` | Synthetic overview, released embryos, activities, appointments, reminders, preferences |
| GET | `/api/v1/embryos` | Only released records belonging to the authenticated patient |
| GET | `/api/v1/activities` | Released synthetic care history |
| GET | `/api/v1/appointments` | Source schedule, including historical statuses |
| POST | `/api/v1/chat` | Rule-based replies from synthetic data; no external LLM |
| POST | `/api/v1/care-requests` | Simulated request receipt in selected demo storage; does not change an appointment |
| PATCH | `/api/v1/reminders/{id}` | Patient acknowledgement only |
| PATCH | `/api/v1/preferences` | Demo preferences; partner access cannot be enabled |
| GET | `/api/v1/automation-preview?at=<ISO_OFFSET_DATE_TIME>` | Deterministic, read-only preview of appointment reminder rules; no delivery |

The full frontend schema is in `../contracts/README.md`; the shared seed is `src/main/resources/demo-overview.json`.

Chat body: `{ "message": "Kapan janji saya?" }`, maximum 2,000 characters. Clinical interpretation and dosing questions are handed off in the response. Recognized emergency terms produce immediate advice to seek emergency help. Keyword detection is intentionally incomplete; it must never be represented as a validated triage service. Chat replies do not submit messages to the hospital.

Care request body:

```json
{
  "type": "APPOINTMENT_CHANGE",
  "appointmentId": "apt-next",
  "note": "Contoh permintaan perubahan"
}
```

Use a UUID in `Idempotency-Key` for every logical request. Notes are limited to 2,000 characters. Retrying an identical payload with the same key returns the same receipt. Reusing a key with a different payload returns `409`. The key is scoped to the authenticated patient; uppercase/lowercase spellings of one UUID are the same key. Payload equality preserves all submitted fields, including null versus blank appointment ID. A `CONTACT_NURSE` request does not include `appointmentId`. The receipt says `received_demo`, never “booked” or “sent.” Memory storage resets on restart and is capped for demonstration. PostgreSQL storage retains receipts and mutable preferences/checklists across restarts.

Reminder body: `{ "completed": true }`. An acknowledgement is not evidence that a treatment was taken. Preference body requires all three booleans. `partnerSharing: true` returns `422` because consent and delegate identity are not implemented.

## Automation preview

`GET /api/v1/automation-preview` evaluates the authenticated synthetic patient's appointments at `2026-10-31T09:15:00+07:00` by default. To inspect a later moment, pass an ISO date-time with an offset in the `at` query parameter. URL-encode the `+` in an offset as `%2B` when constructing the URL manually. A malformed time or a time without an offset returns `400`.

The default rules are **24 hours and 2 hours before a confirmed appointment**, chosen solely as configurable demonstration examples. They are not clinical reminder intervals. To change the examples, start with `--morula.demo-reminders.hours-before=48,3`. The configuration accepts one to eight distinct whole-hour offsets between 1 and 168. Repeated offsets are deduplicated; invalid configuration fails startup.

Each preview returns `dataMode: "DEMO"`, `deliveryEnabled: false`, `evaluatedAt`, and `jobs`. Job IDs are deterministic for the patient, appointment, source start instant, and rule offset. Repeated evaluation preserves IDs; a changed source start produces different IDs. The due time is derived from the appointment instant and displayed using its branch timezone.

- `planned`: the selected evaluation time is before the reminder's due time.
- `due`: the due time has arrived and the appointment has not yet started.
- `expired`: the appointment start time has arrived or passed. Expired reminders are never reported as due.
- Cancelled, rescheduled, completed, and no-show appointments are **excluded**, so they generate no active jobs.

All jobs use `IN_APP_DEMO`. Their title is “Pengingat kunjungan” and their body is “Ada jadwal perawatan yang perlu Anda tinjau.” The body contains no patient name, procedure, embryo status, clinician, or result.

This endpoint is a runnable rule simulator. It does not enqueue, persist, retry, or deliver jobs, does not mutate appointments, and has no background worker. The stable IDs illustrate deduplication keys; they do not establish durable delivery guarantees. A production scheduler still needs clinician-approved rules, source event versions, consent/channel policy, cancellation reconciliation, an outbox, delivery receipts, retry controls, and audit storage.

## Verification focus

The suite checks authentication, source ownership, hidden draft/foreign records, idempotent retries and conflict handling, immutable official schedules, historical appointment protection, reminder scope, partner access refusal, chatbot boundaries, input limits, CORS, fail-closed profile activation, and automation preview timing/identity/cancellation behavior. These tests validate this prototype, not a clinical safety case or production authorization system.

## Deliberate integration gaps

No TERAmedik, laboratory/LIS, Qiscus, push notification, WhatsApp, OIDC, or external model credentials are present. PostgreSQL stores only mutable synthetic demo state. No patient data is downloaded from Morula. The fixture date is 31 October 2026 in `Asia/Jakarta`; receipt/chat timestamps are actual server timestamps. Production adapters must preserve observation time, release time, author, source version, subject, and branch. Automations must deduplicate source events and deliver only clinician-approved patient communications.

## Explicit demo storage

The profile must still be exactly `demo`. Storage selection does not enable production or relax patient identity/release/partner-access guards.

- `MORULA_DEMO_STORAGE=memory` (default): no database needed. State lives in the API process.
- `MORULA_DEMO_STORAGE=postgres`: requires `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`. Unknown selections, missing connection configuration, unreachable database, or failed migration stop startup; there is no memory fallback.
- Root Compose selects PostgreSQL, uses the project's named volume, and exposes no database port. See `../docs/LOCAL_SETUP.md` for local secret generation and commands.

Flyway owns `src/main/resources/db/migration/V1__mutable_demo_state.sql`. It creates patient-scoped care requests, separate idempotency reservations, preferences, and reminder acknowledgements. Clinical fixtures and official appointments remain read-only JSON. Startup seeds only missing preference/reminder rows with `ON CONFLICT DO NOTHING`; it does not reset existing state.

The database enforces a unique `(patient_id, idempotency_key)` UUID. A READ COMMITTED transaction reserves that key before creating the ticket, with a deferred foreign key checked at commit. Concurrent retries wait for the winner and read its original payload/receipt; different payloads return `409`. Failed inserts roll back the reservation. Timestamps are truncated to PostgreSQL microsecond precision before the first receipt so retries remain byte-equivalent. Runtime database failures return a sanitized `503 DEMO_STORAGE_UNAVAILABLE` response.

Migrations are forward-only; do not edit an applied migration. To temporarily return to memory, explicitly select memory and retain the database volume. No destructive down migration or volume deletion is part of setup/verification. Back up the synthetic volume before future schema changes that remove data.

Real database integration checks are opt-in via `mvn verify -Ppostgres-it`; root Compose's `verify` tools service supplies `MORULA_TEST_DATABASE_URL`, `MORULA_TEST_DATABASE_USERNAME`, and `MORULA_TEST_DATABASE_PASSWORD`. Tests create a randomly named schema, exercise real PostgreSQL concurrency/reseed/rollback, and remove only that owned schema. The normal build runs all memory/API/security tests without a database. New result evidence is recorded separately from the historical `VERIFICATION.md` report.

## Version evidence

- Spring Boot official requirements: https://docs.spring.io/spring-boot/3.5/system-requirements.html (checked 31 October 2026; Boot 3.5.16, Java17–25).
- Maven distribution: https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.11/

This project chooses the verified Boot 3.5 line for a compact prototype. It does not claim to use the newest major release.
