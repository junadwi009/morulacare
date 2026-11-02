# Verification - Morula Care 0.1

## Asisten dan pemberitahuan — terbaru, 1 November 2026

Asisten memakai pembuka/pilihan singkat, sumber jawaban dan batas layanan yang dapat dibuka; composer tetap terjangkau dan retry mempertahankan draf berbeda tanpa menggandakan bubble. Kotak pemberitahuan berisi filter unread, detail, tandai dibaca dan akses pengaturan Profil. Penanda dibaca/badge hanya untuk sesi, tanpa perubahan notifikasi API atau pengiriman push.

TypeScript, **35 pemeriksaan web, 7 native Android dan 9 artefak APK lulus** pada source/build final. Native mencakup pengiriman di atas keyboard aktual, sumber/draf, clinical handoff, unread/detail/settings dan font 1.3/2.0. Bug awal composer tertutup IME diperbaiki dengan Android KAV height + offset header/safe-area, lalu diuji ulang. API/jadwal tetap utuh dan pengaturan tes dipulihkan. APK 35,602,026 bytes, SHA-256 `1759fbe0c37a17caf19dc5e3a321151080fbb4e9f9c535dfe7bdfb7b80743dc1`; checksum terpasang cocok. Aplikasi ditinggalkan di Asisten dengan font normal, sesi baru, API UP, Expo Go berhenti, Metro offline. Bukti: `assistant-notifications-verification.json`. Tidak ada perubahan backend/dependency atau klaim uji perangkat fisik/iOS/pasien.

Rincian dan reproduksi: [Asisten dan pemberitahuan](docs/ASSISTANT_NOTIFICATIONS_POLISH.md). Bagian berikut adalah riwayat.

## Dokter, profil dan pemilihan jadwal — versi sebelumnya, 1 November 2026

Direktori/profil mengikuti Home; bio menjadi disclosure dan jadwal halaman tersendiri. Tanggal aktif/bulan/tahun lebih jelas, tanggal penuh nonaktif, jam dikelompokkan sesuai zona waktu, dan perubahan tanggal menghapus jam lama. Ubah jadwal/kembali mempertahankan pilihan dan draf; label kembali menyebut tujuan sebenarnya.

TypeScript, **31 pemeriksaan web, 8 native Android dan 9 artefak APK lulus** pada source/build ini. Native mencakup keyboard, booking persisten/cold launch/cancel/release dan alur dokter pada font 1.3/2.0. APK 35,594,822 bytes, SHA-256 `d7b530613ae68f7ccc2b0858b795f7f2d03b9f1d2fe177e1f59558d574cecf7f`; checksum terpasang cocok. Aplikasi ditinggalkan di Dokter, font normal, API UP, Expo Go berhenti dan Metro offline. Bukti: `doctor-flow-verification.json`. Tidak ada perubahan backend/dependency atau klaim reservasi klinik/perangkat fisik/iOS.

Rincian dan reproduksi: [Alur dokter terbaru](docs/DOCTOR_FLOW_POLISH.md). Bagian berikut adalah riwayat versi sebelumnya.

## Perjalanan, Janji dan Profil — versi sebelumnya, 1 November 2026

Tiga halaman kini konsisten dengan Home: judul/kartu/warna yang sama, ringkasan singkat dan detail sesuai kebutuhan. Perjalanan menonjolkan tahap aktif; Janji memisahkan booking dari perawatan dan menempatkan riwayat klinis sebelum disclosure booking dibatalkan; Profil memakai menu berkelompok dan pratinjau/privasi yang dapat dibuka.

TypeScript, **44 pemeriksaan web, 16 native Android dan 9 artefak APK lulus** pada source/build final. Native mencakup font 1.3/2.0 pada keempat halaman, form/keyboard, API preference/restore dan booking/cold launch/cancel/slot release. API/jadwal klinis tetap utuh, nilai tes dipulihkan dan booking sintetis dibatalkan. APK 35,591,138 bytes, SHA-256 `11998ab9b5075b10e4e18fa70179f9a0b5dc9cf515d3a191daa59613ed7a52b9`; checksum terpasang cocok. Aplikasi ditinggalkan di Perjalanan / Program, font normal, API UP, Expo Go berhenti dan Metro offline. Bukti: `page-polish-verification.json`. Tidak ada klaim uji perangkat fisik, iOS atau pasien.

Rincian dan reproduksi: [Pembaruan tiga halaman](docs/SECONDARY_PAGES_POLISH.md). Bagian di bawah adalah riwayat.

## Foto dummy dan booking dokter — versi sebelumnya, 1 November 2026

Lima gambar AI tersimpan di `mobile/assets/demo-images`: empat potret dokter fiktif dan satu banner. Beranda memakai hierarki foto/pencarian → shortcut → dokter → kunjungan → chart persiapan dari checklist aktual. Menu utama: Beranda, Perjalanan, Janji, Dokter, Profil; asisten melalui header/shortcut. Pencarian, filter gender/cabang/bahasa, favorit, profil, jadwal, review, booking dan pembatalan terhubung ke API/PostgreSQL demo. Diagnostik API/GPS, akurasi dan jarak disembunyikan. Tidak ada rating, health score atau peluang IVF acak.

TypeScript lulus; 51 tes Java/PostgreSQL, 9 HTTP, 48 pemeriksaan browser dan 9 pemeriksaan APK lulus. **18 pemeriksaan native pada APK terbaru lulus**: 6 booking (termasuk cold launch/cancel/release), 2 navigasi/font 1.3/2.0, dan 10 API/lokasi dengan GPS sintetis. Respons booking lama tidak dapat menghidupkan booking yang sudah dibatalkan; retry tidak membuat duplikat. Booking sintetis tes dibatalkan, jadwal perawatan lama tetap utuh.

APK x86_64: 35,588,406 bytes; SHA-256 `6cd6be90b61e87f3677c718eab32c736292f3daa8dbcc8c07a3e6c5ab5abf4f0`. Checksum APK terpasang cocok. Aplikasi ditinggalkan di Beranda pada AVD Google API35, API UP, Expo Go berhenti dan Metro offline. Font kembali 1.0 dan pengaturan stylus sementara dipulihkan. Bukti: `photo-native-booking-results.json`, `photo-native-font-results.json`, `photo-native-location-results.json`, `photo-native-ready.json`, `photo-booking-web-results.json`, `doctor-booking-backend.json`. Lokasi fisik, native iOS dan uji pasien belum diverifikasi. Booking hanya demo, bukan reservasi klinik.

Panduan asset, prompt dan reproduksi: [Foto dan booking dokter](docs/PHOTO_AND_DOCTOR_BOOKING.md). Bagian di bawah adalah riwayat versi sebelumnya.

## Care-first UX redesign — sebelumnya

Current source passes TypeScript,15 web API regressions,11 web facility checks and10 new UX checks (landscape on all5pages, persistent view/filter/chat/draft/pending reply, reduced motion, explicit directory and pending-close cancellation, separate care/embryo states). Independent review findings were fixed and confirmed. New release APK built and passed9artifact checks;10 native flow checks passed, including keyboard-open submission, API mutation/restore and Home/Profile at font1.3/2.0. Evidence: `ux-journey-results.json`, `ux-native-smoke.json`, `standalone-apk-verification.json`. Current artifact28,016,578bytes/SHA`1348910e2e7d2bb3b224a2f07ccc16c2285cd89cee03635a5642bd1ebfce9620`; see [UX rationale/reproduction](docs/UX_JOURNEY_REDESIGN.md). Native location has its separate report. No physical-device, TalkBack, patient usability or native iOS acceptance is claimed.

## Standalone Android APK — initial,1 November2026 (historical)

Local `assembleRelease` succeeded. APK28,009,958bytes targets x86_64 and was installed/launched on the owned Google APIs35 emulator.9 APK checks passed (signature, embedded Hermes/API, native resources, release flags, permissions/network policy);10 native checks passed with Expo Go stopped and Metro offline, including real API preference PATCH/restore and synthetic Jakarta GPS/nearest branch/session/clear/unchanged appointments. Launcher flower observed, actual native splash drawable inspected and splash theme reference verified; the brief OS splash itself was not captured. Initial Android System UI ANR/API timeout recovered after cold launch, with diagnostics preserved. SHA-256 `eec4c22d42190d6858d581d47869116b4eeea91213ded5fa30b44c9703ac3d3c`. Details/evidence/reproduction: [docs/ANDROID_STANDALONE.md](docs/ANDROID_STANDALONE.md). This local test-signed APK is for the emulator; physical ARM and native iOS remain unverified.

## Flower assets / service-style home / location — 1 November 2026

- User flower SVG retained exactly; seven raster app assets verified, native app config resolves, localhost favicon returns HTTP200 ICO. New home uses location/search, broad brand banner, eight shortcuts, branch cards and active nav pills.
- TypeScript,15 location/directory unit checks,11 controlled browser location checks and15 existing API/browser regressions passed. Permission denial, no automatic location prompt, manual fallback, timeout, session-only state and late-callback cancellation are covered. Independent review confirmed directory coordinate provenance and cancellation fix.
- Current iOS JS/Hermes export also passed8 artifact checks (770modules; inline SVG means zero separately exported assets is valid). This is not a native iOS run.
- **7 actual native location checks passed**, exit0/errornull, on the new Google APIs35revision9 AVD/GMS24.23.35. Synthetic Jakarta GPS was detected with accuracy ±5m and Jakarta ranked first; tab state, clear and immutable appointments passed. AOSP was preserved. Permission and GPS time budgets were separated60s/20s, and one-shot High GPS supports absent network location. Initial timeout diagnostics are retained separately. No real physical GPS or newly built APK/IPA is claimed.

Details: `docs/LOCATION_AND_HOME.md`. Evidence: `facility-unit-tests.xml`, `facility-web-results.json`, `facility-directory-sources.json`, `facility-native-results.json`, `facility-native-*.png/.xml`, `current-web-smoke.json`, `current-ios-validation.json`, `facility-web-*.png`, `flower-assets.json`.

## Vector logo / Flaticon follow-up — 1 November 2026

Replaced header with the user's transparent SVG, rendered as its four exact native vector paths at148×37dp. Downloaded official Flaticon Uicons3.3.1 and selected27 Regular Rounded glyphs, exported their original outlines as bundled SVG/path data, preserved vendor license, and added visible attribution to About. TypeScript passed; independent source/glyph/hash review passed. Five native Android API-mode tabs were opened and captured; attribution was verified visible. Evidence: `docs/evidence/brand-icons-android-*.png`, credits XML; provenance and reproduction: `docs/BRAND_ASSETS.md`, `mobile/assets/icons/flaticon/manifest.json`. Native iOS remains untested.

## VS Code testing and iOS follow-up — 1 November 2026

VS Code now has a default basic test task, sequential full suite, browser smoke and explicit iOS bundle validation tasks, plus F5 configurations for HTTP/browser test scripts. Commands use verified Windows runtimes; Java tests stay inside Docker. See `docs/VSCODE_TESTING.md`.

The exact full-suite task commands/dependencies were executed sequentially from the project root, all exit 0: **37 Java/PostgreSQL tests**, strict TypeScript, **19 HTTP checks**, **15 browser checks** (zero page errors), and the **8 iOS artifact checks**. Task JSON, unique labels, dependencies and executable paths also validated. VS Code was reopened on the project; UI task-picker/debug-adapter execution was not automated. Per-command evidence: `docs/evidence/vscode-test-run.json`.

The current iOS export in explicit API demo mode passed **8 artifact checks**: platform-specific export, metadata/path confinement, nonempty Hermes bytecode/header, local API URL/authentication path, and asset existence. The 669-module export produced a 1,708,469-byte bundle. Hash/version evidence: `docs/evidence/current-ios-validation.json`. This validates packaging, not native execution. Native iOS remains **NOT_RUN**: Windows host; user confirmed no available iPhone or Mac. No cloud session, signing, or store submission was performed.

## UI and native Android follow-up — 1 November 2026

- Reference-inspired Morula UI refreshed across five tabs and detail sheets; package lock, API adapter, DTOs and fixture unchanged. Strict TypeScript passed after the final keyboard fix.
- Web API acceptance: **15 checks, zero page errors**, including existing clinical/error/empty-state flows and measured 44px touch targets. Final visual capture covers five tabs at 360, 390 and 1280 widths with no horizontal page overflow.
- **Actual native Android acceptance: 10 checks passed, exit 0, error null**, in one uninterrupted final run. Official Expo Go 58.0.5 ran the current app on Android 15/API 35 x86_64 (Pixel 4a AVD, WHPX). API mutations/restoration, released-result provenance, history, request/appointment separation, assistant boundaries, privacy, keyboard-open submit and font scale 1.3 were verified.
- A real modal/IME overlap found on Android was fixed with full-window keyboard avoidance; final submit bounds were above the visible keyboard. Font scale and mutable state were restored. Filtered ReactNativeJS/AndroidRuntime error log was empty.
- SDK/emulator/portable JDK are installed locally. The emulator was stopped after testing because effective guest RAM was 2560 MiB and host RAM was constrained; API/Metro remain active. Post-stop doctor passed. No standalone APK/AAB or physical Android/iOS device acceptance is claimed.

Evidence: `docs/evidence/current-web-smoke.json`, `current-ui-visual.json`, `android-native-smoke.json/.log`, `android-keyboard-smoke.json`, `android-final-doctor.log`, native/browser PNG/XML captures and `android-resource-after-stop.json`. Prior native harness-selector failures were retained as diagnostics; only the final `subset: full`, `error: null` report establishes the 10-check pass. Details and commands: `docs/UI_REFRESH.md`, `docs/ANDROID_SETUP.md`, `docs/LOCAL_SETUP.md`, `docs/PROGRESS.md`.

## Previous backend/persistence Windows follow-up — 1 November 2026

The original report below is preserved as historical evidence. Current source was rebuilt and run locally on Windows using Docker Desktop Linux containers (Java 21) and Expo on host Node 26.5.1.

| Layer | Current observed result |
|---|---|
| Source Docker build | PASS; original baseline 28 tests, updated final build 31 unit/API/configuration tests |
| Full Java/PostgreSQL verification | **37 passed; 0 failures/errors/skips** (31 Surefire + 6 PostgreSQL Failsafe tests) |
| Mobile install / TypeScript | Locked `npm.cmd ci` and strict typecheck PASS; lock unchanged |
| Real HTTP + restart | **26 checks passed**; API and database actually stopped/restarted without deleting volume; preferences, acknowledgement and exact receipt preserved; conflicting replay still 409 |
| Database outage | Explicit structured API 503 and health DOWN; services restored and health UP |
| Browser against PostgreSQL API | **13 checks passed, 0 page errors**; Edge headless 390x844; normal flow, immutable appointments, no API fallback, sticky sync warning/recovery, empty released embryos |
| Migration / seed | Flyway V1 applied and validated again; PostgreSQL 17.6; seed did not reset state; no test schemas left |
| Android / iOS native | Not run; Android toolchain unavailable at checked locations; Windows cannot run Xcode |

Fresh evidence: `docs/evidence/current-java-tests.json`, `current-persistence.json`, `current-web-smoke.json`, `current-database.json`, and corresponding logs/screenshots. Historical baseline for this machine is separately retained in `current-baseline-http.json` and `current-baseline-web.json`. Database integration cases cover concurrent equal/conflicting payloads, rollback, patient scope, UUID case and exact receipt reload after migration/seed rerun. Runtime versions, changed files, limits and safe commands are in `docs/LOCAL_SETUP.md` and `docs/PROGRESS.md`.

Compose/database/browser were verified locally in this follow-up. PostgreSQL persistence now exists for mutable synthetic state; production identity, audit and clinical integrations remain unimplemented. Original JAR/preview/PDF/checksum artifacts and earlier export evidence below have not been regenerated or relabeled as current native builds.

All checks use synthetic data. These results apply to this prototype and do not certify a clinical deployment. Blueprint reference date: 31 October 2026, Asia/Jakarta.

## Observed results

| Layer | Result | Actual scope |
|---|---|---|
| Java build | PASS | Maven wrapper; JDK 21.0.13; executable Spring Boot JAR built |
| Java tests | 28 passed; 0 failed/error/skipped | Full Spring MockMvc context plus source/identity/profile, assistant, and automation rule tests |
| TypeScript | PASS | Strict `tsc --noEmit` on final mobile source |
| Web export | PASS | Local synthetic mode and explicit API demo mode |
| Android/iOS JS export | PASS | Metro/Hermes bundles generated for both platforms |
| HTTP smoke | 10 checks passed | Real loopback HTTP: health, authentication, overview serialization/no-store, scope rejection, long request note, idempotency/conflict, schedule preservation, chat source, partner refusal |
| Automation HTTP | 6 assertions passed | Real loopback HTTP: two rules, stable IDs, planned, due, expired, only confirmed source appointments; delivery disabled |
| Browser interactions | 26 checks passed; 0 page errors | Chromium 153, 390x844 viewport, local and API modes; normal browser web security enabled |
| PDF review | PASS | 20 A4 pages rendered and visually inspected; all 21 content sections present; no empty pages |

## Browser checks

Each of these eleven checks passed in both local and API mode:

- Home, synthetic snapshot label, and five-tab UI render.
- Reminder acknowledgement updates its accessible checked state.
- Home shortcut opens embryo list.
- Embryo detail includes observation/release time and source.
- Care-history filtering and detail work.
- Appointment history shows historical records.
- Change-request simulation produces an explicit not-sent receipt and preserves the source schedule.
- Assistant answers a schedule question from demo data.
- Clinical/dosing question yields a human-care boundary.
- Privacy preference interaction and partner-access disclosure work.
- Notification view says push is not enabled.

Four additional API-mode checks passed:

- First-load 503 shows unavailable state, without substituting the local patient fixture.
- Failed refresh retains the warning even after a successful preference change.
- Successful refresh clears the synchronization warning.
- An empty released-embryo array shows a waiting state, without claiming a released result or a negative clinical outcome.

Screenshots are captured from the running React Native Web implementation using synthetic data. They are not Android/iOS device screenshots.

## Fixes verified during review

- Notes consistently accept up to 2,000 characters in mobile and backend.
- Appointment sorting uses instants instead of lexical timestamp order; Java chat uses the appointment timezone. A Java test covers Asia/Makassar conversion to WITA.
- Synchronization errors and action errors are tracked separately.
- Empty results do not leave a misleading released-result badge.
- Decorative icon glyphs are hidden from assistive technology.
- Checkbox/tab/filter/button state is exposed via explicit ARIA attributes for React Native Web while native accessibility state remains present.

## Build evidence

Runtime used: Node 24.22.1, npm 11.9.0, Java 21.0.13, Maven 3.9.11. Direct mobile dependencies are pinned with a package lock; Expo 58.0.22, React Native 0.88.1, React 19.3.0. Backend uses Spring Boot 3.5.16.

Final executable JAR SHA-256:

```text
c4345c5d4abb75d83d3701fe656ff6e57f6e39b3669008e26a3dc5a9efb41c78
```

Per-file checksums are supplied in SHA256SUMS.txt. More module-specific detail is in mobile/VERIFICATION.md and backend/VERIFICATION.md. Compact result records are in docs/evidence/.

## Not yet verified or implemented

- Local standalone Android APK compilation/test signing/emulator installation are now verified above. AAB/IPA and App Store/TestFlight/Play Store publication remain unverified.
- No physical Android/native iOS QA, large-text/screen-reader device acceptance, secure storage, push/deep-link/background behavior testing.
- No actual OIDC/OTP, patient identity proofing, partner consent, durable database, production audit storage, or hospital/laboratory adapters.
- No Qiscus messages, outbound notification delivery, LLM/RAG, background automation worker, or production medical-data processing.
- Only the IVF example journey is implemented; other program journeys are specified in the blueprint.
- Docker/Compose and the Windows Maven wrapper have not been executed on their target environments.
- The public demo bearer token intentionally provides no real patient-account security. Startup outside the explicit demo profile is blocked.
- Browser checks validate review UI and API interaction; they do not substitute for clinical UAT or native device testing.
