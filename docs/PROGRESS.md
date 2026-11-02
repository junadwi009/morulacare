# Progress — 1 November 2026, WIB

## Asisten dan pemberitahuan — terbaru, 1 November 2026

Asisten memakai pembuka/pilihan singkat, sumber jawaban dan batas layanan yang dapat dibuka; composer tetap terjangkau dan retry mempertahankan draf berbeda tanpa menggandakan bubble. Kotak pemberitahuan berisi filter unread, detail, tandai dibaca dan akses pengaturan Profil. Penanda dibaca/badge hanya untuk sesi, tanpa perubahan notifikasi API atau pengiriman push.

TypeScript, **35 pemeriksaan web, 7 native Android dan 9 artefak APK lulus** pada source/build final. Native mencakup pengiriman di atas keyboard aktual, sumber/draf, clinical handoff, unread/detail/settings dan font 1.3/2.0. Bug awal composer tertutup IME diperbaiki dengan Android KAV height + offset header/safe-area, lalu diuji ulang. API/jadwal tetap utuh dan pengaturan tes dipulihkan. APK 35,602,026 bytes, SHA-256 `1759fbe0c37a17caf19dc5e3a321151080fbb4e9f9c535dfe7bdfb7b80743dc1`; checksum terpasang cocok. Aplikasi ditinggalkan di Asisten dengan font normal, sesi baru, API UP, Expo Go berhenti, Metro offline. Bukti: `assistant-notifications-verification.json`. Tidak ada perubahan backend/dependency atau klaim uji perangkat fisik/iOS/pasien.

Rincian dan reproduksi: [Asisten dan pemberitahuan](ASSISTANT_NOTIFICATIONS_POLISH.md). Bagian berikut adalah riwayat.

## Dokter, profil dan pemilihan jadwal — versi sebelumnya, 1 November 2026

Direktori/profil mengikuti Home; bio menjadi disclosure dan jadwal halaman tersendiri. Tanggal aktif/bulan/tahun lebih jelas, tanggal penuh nonaktif, jam dikelompokkan sesuai zona waktu, dan perubahan tanggal menghapus jam lama. Ubah jadwal/kembali mempertahankan pilihan dan draf; label kembali menyebut tujuan sebenarnya.

TypeScript, **31 pemeriksaan web, 8 native Android dan 9 artefak APK lulus** pada source/build ini. Native mencakup keyboard, booking persisten/cold launch/cancel/release dan alur dokter pada font 1.3/2.0. APK 35,594,822 bytes, SHA-256 `d7b530613ae68f7ccc2b0858b795f7f2d03b9f1d2fe177e1f59558d574cecf7f`; checksum terpasang cocok. Aplikasi ditinggalkan di Dokter, font normal, API UP, Expo Go berhenti dan Metro offline. Bukti: `doctor-flow-verification.json`. Tidak ada perubahan backend/dependency atau klaim reservasi klinik/perangkat fisik/iOS.

Rincian dan reproduksi: [Alur dokter terbaru](DOCTOR_FLOW_POLISH.md). Bagian berikut adalah riwayat versi sebelumnya.

## Perjalanan, Janji dan Profil — versi sebelumnya, 1 November 2026

Tiga halaman kini konsisten dengan Home: judul/kartu/warna yang sama, ringkasan singkat dan detail sesuai kebutuhan. Perjalanan menonjolkan tahap aktif; Janji memisahkan booking dari perawatan dan menempatkan riwayat klinis sebelum disclosure booking dibatalkan; Profil memakai menu berkelompok dan pratinjau/privasi yang dapat dibuka.

TypeScript, **44 pemeriksaan web, 16 native Android dan 9 artefak APK lulus** pada source/build final. Native mencakup font 1.3/2.0 pada keempat halaman, form/keyboard, API preference/restore dan booking/cold launch/cancel/slot release. API/jadwal klinis tetap utuh, nilai tes dipulihkan dan booking sintetis dibatalkan. APK 35,591,138 bytes, SHA-256 `11998ab9b5075b10e4e18fa70179f9a0b5dc9cf515d3a191daa59613ed7a52b9`; checksum terpasang cocok. Aplikasi ditinggalkan di Perjalanan / Program, font normal, API UP, Expo Go berhenti dan Metro offline. Bukti: `page-polish-verification.json`. Tidak ada klaim uji perangkat fisik, iOS atau pasien.

Rincian dan reproduksi: [Pembaruan tiga halaman](SECONDARY_PAGES_POLISH.md). Bagian di bawah adalah riwayat.

## Foto dummy dan booking dokter — versi sebelumnya, 1 November 2026

Lima gambar AI tersimpan di `mobile/assets/demo-images`: empat potret dokter fiktif dan satu banner. Beranda memakai hierarki foto/pencarian → shortcut → dokter → kunjungan → chart persiapan dari checklist aktual. Menu utama: Beranda, Perjalanan, Janji, Dokter, Profil; asisten melalui header/shortcut. Pencarian, filter gender/cabang/bahasa, favorit, profil, jadwal, review, booking dan pembatalan terhubung ke API/PostgreSQL demo. Diagnostik API/GPS, akurasi dan jarak disembunyikan. Tidak ada rating, health score atau peluang IVF acak.

TypeScript lulus; 51 tes Java/PostgreSQL, 9 HTTP, 48 pemeriksaan browser dan 9 pemeriksaan APK lulus. **18 pemeriksaan native pada APK terbaru lulus**: 6 booking (termasuk cold launch/cancel/release), 2 navigasi/font 1.3/2.0, dan 10 API/lokasi dengan GPS sintetis. Respons booking lama tidak dapat menghidupkan booking yang sudah dibatalkan; retry tidak membuat duplikat. Booking sintetis tes dibatalkan, jadwal perawatan lama tetap utuh.

APK x86_64: 35,588,406 bytes; SHA-256 `6cd6be90b61e87f3677c718eab32c736292f3daa8dbcc8c07a3e6c5ab5abf4f0`. Checksum APK terpasang cocok. Aplikasi ditinggalkan di Beranda pada AVD Google API35, API UP, Expo Go berhenti dan Metro offline. Font kembali 1.0 dan pengaturan stylus sementara dipulihkan. Bukti: `photo-native-booking-results.json`, `photo-native-font-results.json`, `photo-native-location-results.json`, `photo-native-ready.json`, `photo-booking-web-results.json`, `doctor-booking-backend.json`. Lokasi fisik, native iOS dan uji pasien belum diverifikasi. Booking hanya demo, bukan reservasi klinik.

Panduan asset, prompt dan reproduksi: [Foto dan booking dokter](PHOTO_AND_DOCTOR_BOOKING.md). Bagian di bawah adalah riwayat versi sebelumnya.

## Care-first UX redesign — sebelumnya

Implemented research-informed care hierarchy and clearer responsibilities across all5tabs. Home now prioritizes current stage/nextStep, the next appointment and preparation;8duplicated shortcuts became4focused tasks. Clinic lookup is a deliberate secondary sheet. Journey selection/historyfilter, appointment selection, and Assistant conversation/pending reply/draft survive tab changes. Native modal/chat motion honors reduced-motion settings; peer tabs remain immediate. See [UX_JOURNEY_REDESIGN](UX_JOURNEY_REDESIGN.md) for source links, rationale and exact behavior.

TypeScript passed;15 browser API regressions,11 facility browser checks and10 new UX checks passed. New standalone release built in2m3s with9artifact checks;10 native patient-flow checks passed including actual API mutations/restoration, keyboard-open submit and font1.3/2.0. APK28,016,578bytes/SHA`1348910e2e7d2bb3b224a2f07ccc16c2285cd89cee03635a5642bd1ebfce9620`. Physical-device, native iOS, TalkBack and patient usability acceptance remain unverified. Backend/runtime versions and brand assets preserved; no production integrations introduced.

## Standalone Android APK / API — initial follow-up

Local release APK built successfully with the supplied flower launcher/adaptive/monochrome icon and native splash resources: `artifacts/android/MorulaCare-local-api-x86_64.apk`,28,009,958bytes, SHA-256 `eec4c22d42190d6858d581d47869116b4eeea91213ded5fa30b44c9703ac3d3c`. Installed on the owned Google APIs35 AVD and launched as `com.example.morulacare.concept/.MainActivity`. Embedded Hermes runs without Expo Go/Metro; local API remains healthy through reverse8080.9 APK checks and10 standalone native API/location checks passed. Launcher flower observed; native splash drawable extracted/inspected and theme mapping verified. First boot System UI ANR/request timeout recovered after cold launch; initial diagnostics retained. The emulator is left open for UI review. Details/reproduction: [ANDROID_STANDALONE](ANDROID_STANDALONE.md). This is an x86_64 local test-signed build; no physical ARM/iOS/store acceptance or cloud upload is claimed.

## Service-style home, flower app assets, opt-in location

Implemented the latest reference with location/search, a Morula plum/yellow banner, eight working shortcuts, nearby-branch cards and active bottom-nav pills. The supplied yellow flower SVG drives seven app/favicon/adaptive/splash assets plus exact-path BrandSymbol in-app; the standalone Android follow-up above now packages these native assets. Native iOS remains pending.

Foreground location is explicit opt-in, memory-only and locally ranked against11 official Morula branches. Manual search, denied/unavailable/disabled/timeout states, clear and cancellation are implemented. No location is sent to the Morula API or used to change patient branch/appointments. All15 unit checks,11 browser facility checks,15 existing API/browser regressions and8 iOS JS/Hermes export checks passed; iOS native remains untested. The new Google APIs35revision9 AVD now passes7 actual native location checks (exit0/errornull): controlled Jakarta GPS, accuracy, nearest branch, tab-session state, clear and unchanged appointments. First-run permission-budget and network-location issues were found and fixed; original AOSP AVD is preserved. The emulator remains open with synthetic Jakarta location. See [LOCATION_AND_HOME](LOCATION_AND_HOME.md) and the corresponding evidence files for current scope.

## Vector logo and Flaticon icons

The new user-supplied transparent SVG replaces the earlier embedded-PNG logo. Header148×37dp uses original path/color data with only empty vertical margins cropped.27 Flaticon Uicons Regular Rounded icons now replace Feather across the app, bundled locally with original package license, manifest and visible About credit. TypeScript passed, independent review confirmed logo/glyph integrity and all27 byte hashes, and all five native Android API tabs plus the credit were opened/captured. See [BRAND_ASSETS](BRAND_ASSETS.md). No native iOS run or new Java/browser regression run is claimed for this asset-only follow-up.

## VS Code testing / iOS follow-up

Configured `.vscode/tasks.json` with a default basic test, sequential available suite, browser smoke, and iOS bundle validation; `.vscode/launch.json` supports F5 debugging of existing HTTP/browser scripts. Verified Windows runtime paths and tooling Python are workspace scoped. Instructions and dependencies: [VSCODE_TESTING](VSCODE_TESTING.md).

Executed the exact full-suite task commands and dependencies in sequence: 37 Java/PostgreSQL tests, TypeScript, 19 HTTP checks, 15 browser checks with zero page errors, and 8 iOS export checks all passed (every command exit 0). `docs/evidence/vscode-test-run.json` records this command-level verification. VS Code project was reopened; task-picker/debugger UI execution was not automated.

Current iOS production JS/Hermes export passed 8 artifact checks in explicit API demo mode (669 modules; 1,708,469-byte bytecode bundle). Evidence records SHA-256, versions, assets, and native `NOT_RUN`. User confirmed no iPhone/Mac is available; native iOS acceptance remains pending. No cloud simulator/build, Apple account, signing or upload was initiated.

## UI refresh and Android preparation follow-up

The requested medical-app reference has been applied to the existing patient workflow: near-white canvas, softly raised white cards, compact system-sans headings, Morula orange/peach/plum/sage, a shorter program panel, four shortcuts, date-led appointment cards, grouped profile settings and a cleaner chat/composer. Changes cover `mobile/App.tsx` and seven UI/screen files; API adapter, types, fixtures, package and lockfile were verified unchanged against original checksums.

Strict TypeScript passed. Browser API verification now passes **15 checks with zero page errors**, including the original clinical/error/empty-state flows and two actual 44px touch-target checks. Read-only review found undersized section/error controls; the 44×44 fix was applied and rechecked. `scripts/capture-ui.py` captured all five tabs at 360, 390 and 1280 widths: **15 captures, zero horizontal page overflow/page errors**, plus lower-content images. See `docs/UI_REFRESH.md`, `docs/evidence/current-ui-visual.json`, `current-web-smoke.json`, and `ui-before-home.png` / `ui-after-*.png`.

Android setup completed with official, checksum-verified downloads in user-scoped locations: platform-tools 37.0.1/adb 1.0.41, command-line tools 23.0, emulator 37.2.13, portable Temurin JDK 21.0.13+9, SDK platform 36, build-tools 36.0.0, and AOSP Android 15/API 35 x86_64 image revision 2. WHPX was verified usable, and the owned Pixel 4a AVD `MorulaCare_API_35` booted as `emulator-5580`. Expo Go 58.0.5 matches the pinned app runtime. The Java temporary-socket path issue was reproduced and resolved with process-only owned temporary directories; no global Java/PATH, Windows feature/security or reboot change was needed. See `ANDROID_SETUP.md` for exact versions, sources, commands and environment details.

**Final uninterrupted native acceptance passed: 10 checks, exit 0, error null**, at 16:49 WIB. Actual Expo Go ExperienceActivity rendered the API-mode patient data and all five tabs. Tests covered real checklist/preferences mutations with API confirmation/restoration, released-embryo provenance, care-history filtering/details, schedule request receipt with immutable official appointments, assistant schedule/medical handoff, privacy boundary, and font scale 1.3. Original font scale 1.0 and mutable values were restored. Filtered ReactNativeJS/AndroidRuntime error log was empty. Evidence: `docs/evidence/android-native-smoke.json/.log`, native PNG/XML captures, and `android-final-doctor.log`. Archived earlier harness-selector attempts are diagnostics, not final pass evidence.

Native testing found and fixed a real request-modal keyboard overlap: `DetailModal.tsx` now constrains the sheet using a full-window keyboard-avoiding container. The final suite submitted while IME remained open: submit bottom y=1215 was above the visible IME top y=1428. Official appointments remained unchanged. See `android-request-keyboard-submit.png` and `android-keyboard-smoke.json`.

The image enforced 2560 MiB guest RAM despite a 1536 MiB request; peak observed QEMU residency was about 2.7 GiB on this constrained host. After acceptance only the owned emulator was stopped; free host RAM rose from 830 to 3221 MiB, QEMU was gone and adb device list empty. API remained UP and Metro returned HTTP 200 (`android-resource-after-stop.json`). `node.exe scripts/android-local.mjs run` reopens it; doctor/run/stop tasks are in VS Code. No standalone Morula APK/AAB was compiled or signed. Physical Android devices and iOS remain untested.

## Completed baseline observations

- Correct root is the current `morulacare` folder; extracted package has no Git metadata. Existing source, locked versions, fixture and historical verification preserved.
- Docker Desktop Linux daemon and Compose available. Backend source Docker build succeeded with 28 Java tests, zero failures/errors/skips. Build used Maven 3.9.11 / Java 21; runtime Java 21.0.13.
- Default Docker address pools were exhausted. Inspected network subnets and host routes, then allocated only this project's `10.253.249.0/28`; no unrelated containers/networks were removed or stopped.
- Real HTTP baseline: 19 checks passed, including public health, anonymous denial, scoped overview/no-store/released-only results, immutable schedules, 8 concurrent same-key requests, conflict, preference/checklist mutations and demo/chat/partner boundaries. See `evidence/current-http.json`.
- VS Code reused existing window at application root. Added relative tasks/settings/recommendations and ignored local configuration setup with random database password.
- Mobile locked `npm.cmd ci` succeeded on installed Node 26.5.1; strict TypeScript passed. Expo web runs on localhost:8081 with one worker and API mode.
- Browser baseline: 13 checks, zero uncaught page errors in Microsoft Edge headless at 390x844. Includes real API interactions, initial failure without fallback, sticky failed-refresh warning, recovery and empty released embryos. See `evidence/current-web-smoke.json` and three screenshots.
- Initial baseline inventory found no Android toolchain; the later Android follow-up above installed and tested it. No local iOS build on Windows.
- npm audit recorded 11 moderate findings, zero high/critical at installation time (`evidence/current-web-npm-audit.json`). Dependencies were not automatically changed; remediation needs a separate compatible dependency evaluation.

## Execution ledger

- Plan: `superpowers/plans/2026-11-01-local-persistence.md`.
- Ruling: use current extracted checkout directly; there is no Git repository to create a worktree/commit from, and user explicitly requested this workspace.
- Ruling: proceed autonomously without plan approval; user explicitly authorized reversible local work through verified persistence.
- Ruling: retain installed Node 26.5.1 initially and validate pinned dependencies locally; no global Node change.
- Ruling: serialize heavy builds/browser suites because free RAM was about 2 GiB and Docker also runs unrelated projects.

## Completed PostgreSQL milestone

- Compose runs PostgreSQL **17.6**, pinned to image digest `sha256:ef257d85f76e48da1c64832459b59fcaba1a4dac97bf5d7450c77753542eee94`, on an internal network with no published database port. Data lives in `morula-care-local_postgres-data`; generated development credentials remain in ignored `.env`.
- Explicit `MORULA_DEMO_STORAGE=postgres` persists care requests, patient-scoped UUID idempotency records, preferences and reminder acknowledgements. Default memory mode remains available without a database. Unknown storage modes/missing PostgreSQL configuration fail closed; there is no fallback.
- Flyway **11.7.2**, JDBC **42.7.11**, HikariCP **6.3.3** are managed by the unchanged Spring Boot **3.5.16** parent. Migration V1 creates mutable-state tables. Startup inserts only missing preferences/acknowledgements. Clinical fixtures and official appointment schedules remain read-only.
- **37 Java tests passed, zero failures/errors/skips:** original 28 plus 3 storage-configuration tests and 6 real PostgreSQL cases. Database tests cover concurrent identical/different payloads, exact receipt reload after migration/seed rerun, rollback without orphan reservations, patient scopes and UUID case. See `evidence/current-java-tests.json`; detailed reports are regenerated in `backend/target/{surefire,failsafe}-reports/`.
- **26 real HTTP checks passed after actual API and database restart**, 1 November 2026 at 15:36 WIB. Created a synthetic request, changed preferences/checklist, stopped the database, observed explicit `503 DEMO_STORAGE_UNAVAILABLE` and health `DOWN`, then stopped API and started both services using the same volume. The receipt remained exactly identical, changed preferences/checklist survived seed/startup, a changed payload still returned 409, and official appointments stayed identical. See `evidence/current-persistence.json` and `current-restart.log`.
- **Final PostgreSQL browser run: 13 checks passed, zero uncaught page errors** in Edge headless at 390x844. Tests restore the preferences/checklist values they initially read. All normal flows and injected API-error/empty-result cases passed again. See `evidence/current-web-smoke.json` and screenshots.
- SQL inspection after browser verification: migration version 1, 3 request rows and 3 matching idempotency rows, 1 preference row, 2 acknowledgement rows, zero leftover integration-test schemas (`evidence/current-database.json`). No volume was deleted.
- Independent read-only review found no actionable source defect in identity, mode guard, transactions, seed, secret handling or network boundaries. Runtime evidence is reported separately from that source review.
- Final read-only evidence reconciliation found no remaining actionable mismatch. Final strict TypeScript rerun passed; API and database were healthy, Expo returned HTTP 200, and rerunning setup preserved both existing local configuration files byte-for-byte.

## Changed files and purpose

- `compose.yaml`: named project, pinned database/internal network/volume, health checks, resource limits and isolated verification service.
- `.env.example`, `scripts/setup-local.mjs`: repeatable local configuration with random password, preserving existing files. Actual root `.env` and `mobile/.env.local` stay ignored.
- `.vscode/settings.json`, `extensions.json`, `tasks.json`: project TypeScript SDK, search exclusions, official extension recommendations and start/log/stop/Expo/Java/TypeScript/HTTP/restart tasks. No host Java debug configuration was invented.
- `backend/pom.xml`, `Dockerfile`, `.dockerignore`: managed JDBC/Flyway/driver dependencies, opt-in PostgreSQL test profile and bounded Java build heap; original Java/Boot versions retained.
- `backend/src/main/java/id/co/morula/care/{DemoStateStore,MemoryDemoStateStore,PostgresDemoStateStore,DemoStorageConfiguration}.java`: explicit storage implementations with atomic database uniqueness and transactions.
- `DemoRepository.java`, `MorulaCareApplication.java`, `ApiErrors.java`, `ModeGuard.java`, `application.yml`: delegate mutable state, select storage without adding profiles, sanitize database errors and accurately describe the unchanged exact-demo guard.
- `backend/src/main/resources/db/migration/V1__mutable_demo_state.sql`: forward-only schema, scoped primary keys, uniqueness and deferred request/idempotency foreign key.
- `backend/src/test/java/id/co/morula/care/{DemoStorageConfigurationTest,PostgresDemoStoreIT}.java`: new configuration and PostgreSQL regression coverage; existing tests retained.
- `scripts/verify-local.mjs`, `verify-web.py`: reusable real HTTP/restart and browser checks with persistent evidence.
- `mobile/tsconfig.json`: Expo automatically normalized include globs; strict flags retained and TypeScript rechecked. UI source and lockfile unchanged.
- Root/module READMEs, contract, verification files, `docs/LOCAL_SETUP.md`, this progress report, plan and `docs/evidence/current-*`: current setup/behavior and observed results, preserving historical reports. `runtime/` JAR, `preview/`, PDFs and `SHA256SUMS.txt` remain original package artifacts; use the rebuilt Docker API or `backend/target` JAR for current backend behavior.

## Running services and safe operations

- Web/Metro: `http://localhost:8081`, API demo mode, one worker, hidden Node PID **8220** for this run. Logs: `mobile/expo-local.log` and `expo-local-error.log`. Confirm ownership before stopping that PID; future foreground sessions use Ctrl+C.
- API: `http://localhost:8080`; public health at `/actuator/health`, port bound to **127.0.0.1**. `morula-care-local-api-1` uses exactly the demo profile and PostgreSQL mode.
- Database: `morula-care-local-db-1`, healthy, internal port 5432 only. Port 19006 is unused by this project.
- Start: `docker.exe compose -p morula-care-local up -d --build --wait api`; stop while preserving data: `docker.exe compose -p morula-care-local stop`; logs: `docker.exe compose -p morula-care-local logs -f --tail 100 api db`.
- Java: `docker.exe compose -p morula-care-local --profile tools run --build --rm verify`; TypeScript: `cd mobile; npm.cmd run typecheck`; HTTP/restart: `node.exe scripts/verify-local.mjs --restart` from root. See LOCAL_SETUP for Expo/browser commands and VS Code tasks.

## Limitations and next milestone

### Follow-up: HTTP check after stopping services — 1 November 2026, 15:55 WIB

The supplied terminal log showed all 37 Java tests and TypeScript passing, followed by HTTP `ECONNREFUSED`. Inspection confirmed the API was stopped by the earlier `compose stop`; the Java verification service started only its database dependency. Started API with `docker.exe compose -p morula-care-local up -d --wait api`, then reran the exact failed `node.exe scripts/verify-local.mjs --restart`: all 26 checks passed and services were restored healthy. Expo returned HTTP 200. LOCAL_SETUP now separates operation choices and explicitly starts API before HTTP verification. Application code and data volume were unchanged by the fix; the verification harness created its documented synthetic requests/state changes.

- **Web/API:** verified locally; synthetic only. No blocker remains for this milestone. Docker's exhausted automatic subnet pool was handled with checked project-specific subnets, without global cleanup or touching unrelated services.
- **Android:** 10-check native Expo Go acceptance passed on the owned Android 15/API 35 emulator. Standalone builds and physical-device QA remain separate. `adb reverse` preserved localhost API mode and the loopback-only API binding; no LAN opening was needed.
- **iOS:** not built/tested natively. A Mac with Xcode and a simulator/device is required. Historical JS exports are retained as historical evidence, not native acceptance.
- The npm audit has 11 moderate findings recorded separately; pinned packages were preserved. Evaluate compatible remediation before wider distribution.
- A portable JDK 21 is now installed for Android helpers; default host Java remains unchanged. No cloud build/signing/publication or production identity, hospital/laboratory, Qiscus, push, LLM or payment integration was enabled. Demo persistence is not a production data/consent/audit design.
- Next milestone: standalone debug build and physical Android/iOS device QA, compatible dependency remediation, then a separately scoped production identity/audit/integration design and clinical UAT plan.
