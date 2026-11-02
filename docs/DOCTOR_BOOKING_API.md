# Doctor selection and booking demo API

This additive module offers four fictional doctor profiles, synthetic appointment slots and persisted demo reservations. It does not reserve hospital appointments, charge payments or contact clinicians. Existing `/overview` and `/appointments` retain their original synthetic clinical schedules unchanged.

All endpoints require the existing explicit `Bearer demo-patient-token`; the server derives patient scope from its authenticated identity. A client cannot select a patient through query/JSON. Responses retain `Cache-Control: no-store`.

| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/doctors` | `Doctor[]` |
| GET | `/api/v1/doctors/{id}/slots` | `DoctorSlot[]`, including `available` |
| GET | `/api/v1/doctor-bookings` | Current patient's bookings, newest first |
| GET | `/api/v1/doctor-bookings/{id}` | Current patient's single booking or404 |
| POST | `/api/v1/doctor-bookings` |201 + booking and `Location` header |
| POST | `/api/v1/doctor-bookings/{id}/cancel` |200 + updated booking; repeated cancellation is safe |

`Doctor`: `id, name, specialty, gender, experienceYears, languages[], branchId, branchName, bio, imageKey`.

Four fictional profiles: `doctor-maya` / Maya Pratama / `maya`, `doctor-arif` / Arif Santoso / `arif`, `doctor-nadia` / Nadia Putri / `nadia`, `doctor-bima` / Bima Wijaya / `bima`. Gender uses `female` or `male`. Maya/Arif use `MJKT` / Morula IVF Jakarta; Nadia/Bima use `MBDG` / Morula IVF Melinda Bandung. Clinical credentials, experience and profiles are demonstration fixtures, not claims about real Morula staff. There are no fabricated ratings or success probabilities.

`DoctorSlot`: `id, doctorId, startsAt, endsAt, timeZone, available`. Each doctor has12 slots on2026-11-03/04/05 at09:00,10:30,13:00,15:00 in `Asia/Jakarta`; each slot lasts30minutes. These fixed dates are the demo scenario, not a live clinic calendar. Slot IDs follow `doctor-maya-2026-11-03-0900`.

POST body:

```json
{"doctorId":"doctor-maya","slotId":"doctor-maya-2026-11-03-0900","reason":"Konsultasi rencana perawatan"}
```

`reason` is required, nonblank, maximum500characters. Doctor/slot identifiers are required and maximum100characters. The server validates the slot belongs to the selected catalog doctor, derives all doctor/date/branch metadata itself, and trims outer whitespace on the reason. Unknown JSON fields are rejected by the existing application configuration.

`DoctorBooking`: `id, doctorId, doctorName, specialty, branchId, branchName, startsAt, endsAt, timeZone, status, reason, createdAt`. Status is **`confirmed_demo`** or **`cancelled_demo`**. It intentionally cannot be confused with official clinical appointment confirmation.

POST requires a canonical UUID `Idempotency-Key` (UUID letter case is normalized). Retrying the same key with the same normalized payload returns the same booking. The returned status reflects a subsequent cancellation; an old canceled key never silently books again. Use a new key to make a new reservation after cancellation. A failed occupied-slot attempt rolls back its key and can safely be retried.

Errors follow existing `{code,message}` format:

-400 `INVALID_REQUEST` for missing/invalid fields, `INVALID_IDEMPOTENCY_KEY` for malformed UUID.
-404 `DOCTOR_NOT_FOUND` for unknown profile; current-patient booking read/cancel hides missing/foreign records with `NOT_FOUND`.
-422 `INVALID_DOCTOR_SLOT` for nonexistent or mismatched slot.
-409 `SLOT_UNAVAILABLE` when another booking owns the slot; `IDEMPOTENCY_CONFLICT` when a used key is submitted with a different payload.

## Storage and concurrency

Memory storage uses one synchronized reservation/key operation. PostgreSQL uses additive forward-only Flyway `V2__doctor_booking_demo.sql` with booking records, patient-scoped idempotency keys and a **global unique slot reservation**. Uniqueness is enforced by PostgreSQL across API connections/processes. Reservation/key/booking writes share one short transaction; failed requests leave no orphan key/booking. Cancellation locks the owned booking, updates its status and releases its reservation in the same transaction. Canceled records remain for history and retry semantics.

No existing tables or fixtures are dropped, rewritten or renamed. Rollback of application selection must preserve the database volume; future schema changes require new migrations. The migration has not been validated on production data; this is a local synthetic project.

## Verification

New coverage:6 repository/memory tests,3 authenticated HTTP tests and5 PostgreSQL tests in the existing isolated-schema harness. Cases include concurrency across connections/patients, same-key retries, changed payloads, canceled-key replay, slot release/reuse, rollback after conflict, validation, scoped reads/cancellation and immutable official appointments.

Use the project's existing Java21/Docker verification:

```text
docker.exe compose -p morula-care-local --profile tools run --build --rm verify
docker.exe compose -p morula-care-local up -d --build --wait api
```

Observed execution1 November2026: **51Java checks passed** (40unit/API +11PostgreSQL), failures0/errors0/skipped0, command exit0. This retains the previous37 checks and adds14 booking checks. V2 also applied successfully to the owned local API database; API rebuilt and left healthy.

The additional executable HTTP harness `backend/scripts/verify-doctor-booking-http.py` passed9 checks, including a real API-container restart: booking and occupied slot survived, cancellation released the slot, canceled-key replay stayed canceled, and official appointments stayed unchanged. Its one synthetic test booking was canceled; cancellation history is intentionally retained. Evidence: `backend/target/doctor-booking-verification.json` plus Surefire/Failsafe XML reports. The coordinator may copy the compact report into project-wide evidence.

Run that restart harness only while the local API is available and no UI suite is active:

```text
python.exe backend/scripts/verify-doctor-booking-http.py
```

No physical device, real hospital booking, production identities or payments were tested.
