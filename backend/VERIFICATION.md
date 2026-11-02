# Backend verification — final demo build

## Windows local follow-up — 1 November 2026

The original results below are historical. Fresh Docker verification on the current source passed **37 tests: 31 Surefire application/configuration tests plus 6 real PostgreSQL integration tests; zero failures, errors or skips**. Maven 3.9.11, Java 21.0.9 build image; Java 21.0.13 runtime image. Spring Boot remains 3.5.16; managed Flyway 11.7.2 and PostgreSQL JDBC 42.7.11 were verified against PostgreSQL 17.6.

`docker.exe compose -p morula-care-local --profile tools run --build --rm verify` ran against the project's internal database. The six database cases cover migration/seed rerun with exact receipt reload, eight concurrent equal-key requests yielding one ticket, simultaneous conflicting payloads, patient scope separation, canonical UUID case with exact null/blank payload equality, and transaction rollback without an orphan reservation. Tests create/drop only their own unique schema.

Source tests were authored first; the pre-implementation compile failure is recorded in `../docs/evidence/current-java-red.log`. Green reports are in `target/surefire-reports/`, `target/failsafe-reports/`, and the persistent summary `../docs/evidence/current-java-tests.json`. The build log and PostgreSQL suite output are in `../docs/evidence/current-build.log` and `current-postgres-tests.log`. No original test was disabled or weakened. Actual service restart/HTTP/browser results are recorded at repository level and in `../docs/PROGRESS.md`.

## Executed

- Java compiler/runtime: Eclipse Temurin **21.0.13**.
- Maven **3.9.11**, through generated Apache Maven Wrapper **3.3.4**.
- Spring Boot **3.5.16**.
- `mvnw verify`: **BUILD SUCCESS**.
- **28 tests; 0 failures; 0 errors; 0 skipped.**
- Final build completed **1 November 2026, 00.04 WIB**. The synthetic data snapshot remains 31 October 2026.
- Executable Spring Boot JAR produced: `target/morula-care-api-0.1.0.jar`.

| Suite | Count | Evidence covered |
|---|---:|---|
| `DemoApiTest` | 14 | Authentication; hidden draft/foreign records; no patient-selected identity; source lists; retry idempotency/conflict; schedule immutability; appointment ownership and historical-state protection; 2,000-character care note boundary; reminder scope; partner-consent refusal; chatbot facts and clinical boundaries; chat validation; CORS |
| `DemoAssistantTest` | 1 | Earliest confirmed appointment independent of input order; branch timezone conversion from an offset timestamp to Asia/Makassar |
| `DemoAutomationTest` | 7 | Two configured rules; stable IDs across repeated evaluations; historical/cancelled appointment exclusion; timezone/instant comparison; expiration at appointment start; configurable offsets; changed-start identity; invalid-input rejection |
| `DemoAutomationApiTest` | 2 | Authenticated/scoped preview endpoint; cache prevention; default simulation; invalid timestamp rejection; expired status after appointment start |
| `ModeGuardTest` | 4 | Missing profile rejected; production profile rejected; mixed profiles rejected; explicit demo profile accepted |

Reports are generated in `target/surefire-reports/`. The source ZIP may omit generated build artifacts; rerun `verify` to regenerate them. Test execution uses Mockito's supported subclass mock maker, which does not require JVM self-attachment. No test was disabled to work around environment restrictions.

## Scope of this evidence

The API integration tests run through Spring's MockMvc with the actual application context, security filter chain, controller, repository, and validation. They are not a native-device test, penetration test, clinical validation, or vendor integration test. The parent project verification describes separate real HTTP/UI checks where executed.

The Dockerfile is included but Docker was not available in this execution environment; no Docker build is claimed. `mvnw.cmd` is the standard generated Windows wrapper and was not executed on Windows. No Android/iOS binary is built by this backend project.

Production identity, durable storage, audit storage, hospital/laboratory adapters, Qiscus, LLM services, and external notification delivery remain intentionally unimplemented. The automation endpoint evaluates rules only: it has no background scheduler, queue, persistence, or outbound delivery. The public demo token is not a production credential. Clinical deployment is blocked by the mode guard.
