# Morula Care — implementation contract v0.1

All content and identities are synthetic. This is an executable demo, not a clinical deployment. Demo reference date: 31 October 2026, Asia/Jakarta. Root owns this shared contract; agents own their assigned directories.

## Stack

- Patient app: React Native + Expo, TypeScript, Android/iOS and web for review. Prefer pinned mutually compatible Expo SDK versions verified from official docs/package registry. Demo mode works without API; explicit API mode must never silently fall back to synthetic data.
- Java backend: Spring Boot, Java 21 target; Maven wrapper. Exact demo profile with immutable synthetic clinical fixtures and explicit memory/PostgreSQL mutable-state storage, bearer demo identity. No real PII, no external messaging or payment processing. Non-demo startup remains blocked; PostgreSQL does not enable production identity or clinical adapters.
- Runtime: API port 8080. Browser dev CORS only localhost:8081 and localhost:19006. Phones use LAN address configured explicitly. No production credentials embedded in the app.

## Frontend data contract

`GET /api/v1/overview` (Authorization: Bearer demo-patient-token; allowed only when demo profile explicitly active)

```ts
type Stage = { id: string; label: string; state: 'completed' | 'current' | 'upcoming'; date?: string };
type Embryo = { id: string; label: string; stage: string; status: string; observationDate: string; releasedAt: string; releasedBy: string; summary: string; source: string };
type Activity = { id: string; type: 'consultation' | 'lab' | 'procedure' | 'care'; title: string; occurredAt: string; status: string; clinician: string; branch: string; summary: string; instructions: string[]; source: string };
type Appointment = { id: string; title: string; clinician: string; branch: string; startsAt: string; timeZone: string; status: 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'; location: string; preparation: string[]; source: string };
type Reminder = { id: string; title: string; detail: string; dueAt: string; completed: boolean; source: string };
type NotificationItem = { id: string; title: string; body: string; createdAt: string; read: boolean };
type Overview = {
  dataMode: 'DEMO';
  patient: { id: string; displayName: string; recordNumber: string; branchId: string; branchName: string; timeZone: string };
  sync: { lastSyncedAt: string; status: 'current' | 'delayed' | 'unavailable'; message: string };
  cycle: { id: string; program: string; title: string; status: string; startedAt: string; nextStep: string; stages: Stage[] };
  embryos: Embryo[]; activities: Activity[]; appointments: Appointment[]; reminders: Reminder[]; notifications: NotificationItem[];
  preferences: { serviceNotifications: boolean; discreetNotifications: boolean; partnerSharing: boolean };
};
```

Additional endpoints (same authorization):

- `GET /api/v1/embryos` -> `Embryo[]`, strictly released results only.
- `GET /api/v1/activities` -> `Activity[]`.
- `GET /api/v1/appointments` -> `Appointment[]`.
- `GET /api/v1/automation-preview?at=<ISO_OFFSET_DATE_TIME>` -> `{dataMode:'DEMO',evaluatedAt:string,deliveryEnabled:false,jobs:{id:string,appointmentId:string,dueAt:string,channel:'IN_APP_DEMO',title:string,body:string,status:'planned'|'due'|'expired',reason:string}[]}`. Read-only rule simulator. Default evaluation time is the fixed snapshot; example offsets 24h/2h. Only confirmed appointments generate jobs. Repeated evaluation yields stable IDs; delivery remains disabled. Encode a `+` offset as `%2B` in the query. No worker/queue or clinical timing implied.
- `POST /api/v1/chat` body `{message:string}` -> `{id:string,text:string,intent:string,sourceLabel:string,requiresStaff:boolean,createdAt:string}`. Max 2000 characters. Rule-based demo; no LLM implied. Clinical interpretation/dose requests are handed off. Emergency language yields immediate direction to seek emergency help, not a diagnosis. No real staff submission implied.
- `POST /api/v1/care-requests` body `{type:'APPOINTMENT_CHANGE'|'CONTACT_NURSE',appointmentId?:string,note:string}` (note 1-2000 characters) header `Idempotency-Key` UUID -> `{id:string,status:'received_demo',message:string,createdAt:string}`. Must not mutate source appointments. Memory mode lasts for the running demo process; explicit PostgreSQL mode persists requests and idempotency across restart. Response says not sent to hospital. Idempotency applies per patient+canonical UUID key, same key/different payload yields 409; concurrent equal requests return one receipt.
- `PATCH /api/v1/reminders/{id}` body `{completed:boolean}` -> `Reminder`. Acknowledgement only, not clinical adherence evidence.
- `PATCH /api/v1/preferences` body `{serviceNotifications:boolean,discreetNotifications:boolean,partnerSharing:boolean}` -> preferences. Partner sharing cannot be enabled in this demo; return 422 for true.
- `GET /actuator/health` public health status only, without component details. In PostgreSQL mode database availability contributes to health.

Common error JSON: `{code:string,message:string}` with appropriate 400/401/404/409/422/503. Never accept patientId in the request to select another patient. Scope all records from the server-side identity.

## UI requirements

Five tabs: Beranda, Perjalanan, Janji, Asisten, Profil. Perjalanan includes program, released embryos and care history filters. Separate notification modal/screen. Detail screens/modal for released embryos, past care, appointments. Confirm local/demo requests visibly, do not say booked/sent. Fixed synthetic dates must say 'Snapshot demo · 31 Okt 2026'; no misleading 'today' relative to device clock. Styling: calm ivory/white, orange/coral and dark plum, precise hierarchy, restrained editorial feel, generous whitespace, accessible controls. No invented official logo or externally sourced patient images. Use a simple Morula Care wordmark marked concept. No payment gateway. Offline screen/error states and explicit refresh. Sensitive data remains in memory (do not persist medical fixtures to localStorage/AsyncStorage). No raw medical data in lock-screen notification previews.

## Shared data

Each implementer may create matching synthetic fixtures following these types. Root will reconcile the data before verification. Backend is authoritative in API mode. Demo token is an intentionally public demo identifier and is blocked outside the explicit demo profile.
