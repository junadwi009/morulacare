# Mobile implementation verification

## Asisten dan pemberitahuan — terbaru, 1 November 2026

Asisten memakai pembuka/pilihan singkat, sumber jawaban dan batas layanan yang dapat dibuka; composer tetap terjangkau dan retry mempertahankan draf berbeda tanpa menggandakan bubble. Kotak pemberitahuan berisi filter unread, detail, tandai dibaca dan akses pengaturan Profil. Penanda dibaca/badge hanya untuk sesi, tanpa perubahan notifikasi API atau pengiriman push.

TypeScript, **35 pemeriksaan web, 7 native Android dan 9 artefak APK lulus** pada source/build final. Native mencakup pengiriman di atas keyboard aktual, sumber/draf, clinical handoff, unread/detail/settings dan font 1.3/2.0. Bug awal composer tertutup IME diperbaiki dengan Android KAV height + offset header/safe-area, lalu diuji ulang. API/jadwal tetap utuh dan pengaturan tes dipulihkan. APK 35,602,026 bytes, SHA-256 `1759fbe0c37a17caf19dc5e3a321151080fbb4e9f9c535dfe7bdfb7b80743dc1`; checksum terpasang cocok. Aplikasi ditinggalkan di Asisten dengan font normal, sesi baru, API UP, Expo Go berhenti, Metro offline. Bukti: `assistant-notifications-verification.json`. Tidak ada perubahan backend/dependency atau klaim uji perangkat fisik/iOS/pasien.

Rincian dan reproduksi: [Asisten dan pemberitahuan](../docs/ASSISTANT_NOTIFICATIONS_POLISH.md). Bagian berikut adalah riwayat.

## Dokter, profil dan pemilihan jadwal — versi sebelumnya, 1 November 2026

Direktori/profil mengikuti Home; bio menjadi disclosure dan jadwal halaman tersendiri. Tanggal aktif/bulan/tahun lebih jelas, tanggal penuh nonaktif, jam dikelompokkan sesuai zona waktu, dan perubahan tanggal menghapus jam lama. Ubah jadwal/kembali mempertahankan pilihan dan draf; label kembali menyebut tujuan sebenarnya.

TypeScript, **31 pemeriksaan web, 8 native Android dan 9 artefak APK lulus** pada source/build ini. Native mencakup keyboard, booking persisten/cold launch/cancel/release dan alur dokter pada font 1.3/2.0. APK 35,594,822 bytes, SHA-256 `d7b530613ae68f7ccc2b0858b795f7f2d03b9f1d2fe177e1f59558d574cecf7f`; checksum terpasang cocok. Aplikasi ditinggalkan di Dokter, font normal, API UP, Expo Go berhenti dan Metro offline. Bukti: `doctor-flow-verification.json`. Tidak ada perubahan backend/dependency atau klaim reservasi klinik/perangkat fisik/iOS.

Rincian dan reproduksi: [Alur dokter terbaru](../docs/DOCTOR_FLOW_POLISH.md). Bagian berikut adalah riwayat versi sebelumnya.

## Perjalanan, Janji dan Profil — versi sebelumnya, 1 November 2026

Tiga halaman kini konsisten dengan Home: judul/kartu/warna yang sama, ringkasan singkat dan detail sesuai kebutuhan. Perjalanan menonjolkan tahap aktif; Janji memisahkan booking dari perawatan dan menempatkan riwayat klinis sebelum disclosure booking dibatalkan; Profil memakai menu berkelompok dan pratinjau/privasi yang dapat dibuka.

TypeScript, **44 pemeriksaan web, 16 native Android dan 9 artefak APK lulus** pada source/build final. Native mencakup font 1.3/2.0 pada keempat halaman, form/keyboard, API preference/restore dan booking/cold launch/cancel/slot release. API/jadwal klinis tetap utuh, nilai tes dipulihkan dan booking sintetis dibatalkan. APK 35,591,138 bytes, SHA-256 `11998ab9b5075b10e4e18fa70179f9a0b5dc9cf515d3a191daa59613ed7a52b9`; checksum terpasang cocok. Aplikasi ditinggalkan di Perjalanan / Program, font normal, API UP, Expo Go berhenti dan Metro offline. Bukti: `page-polish-verification.json`. Tidak ada klaim uji perangkat fisik, iOS atau pasien.

Rincian dan reproduksi: [Pembaruan tiga halaman](../docs/SECONDARY_PAGES_POLISH.md). Bagian di bawah adalah riwayat.

## Foto dummy dan booking dokter — versi sebelumnya, 1 November 2026

Lima gambar AI tersimpan di `mobile/assets/demo-images`: empat potret dokter fiktif dan satu banner. Beranda memakai hierarki foto/pencarian → shortcut → dokter → kunjungan → chart persiapan dari checklist aktual. Menu utama: Beranda, Perjalanan, Janji, Dokter, Profil; asisten melalui header/shortcut. Pencarian, filter gender/cabang/bahasa, favorit, profil, jadwal, review, booking dan pembatalan terhubung ke API/PostgreSQL demo. Diagnostik API/GPS, akurasi dan jarak disembunyikan. Tidak ada rating, health score atau peluang IVF acak.

TypeScript lulus; 51 tes Java/PostgreSQL, 9 HTTP, 48 pemeriksaan browser dan 9 pemeriksaan APK lulus. **18 pemeriksaan native pada APK terbaru lulus**: 6 booking (termasuk cold launch/cancel/release), 2 navigasi/font 1.3/2.0, dan 10 API/lokasi dengan GPS sintetis. Respons booking lama tidak dapat menghidupkan booking yang sudah dibatalkan; retry tidak membuat duplikat. Booking sintetis tes dibatalkan, jadwal perawatan lama tetap utuh.

APK x86_64: 35,588,406 bytes; SHA-256 `6cd6be90b61e87f3677c718eab32c736292f3daa8dbcc8c07a3e6c5ab5abf4f0`. Checksum APK terpasang cocok. Aplikasi ditinggalkan di Beranda pada AVD Google API35, API UP, Expo Go berhenti dan Metro offline. Font kembali 1.0 dan pengaturan stylus sementara dipulihkan. Bukti: `photo-native-booking-results.json`, `photo-native-font-results.json`, `photo-native-location-results.json`, `photo-native-ready.json`, `photo-booking-web-results.json`, `doctor-booking-backend.json`. Lokasi fisik, native iOS dan uji pasien belum diverifikasi. Booking hanya demo, bukan reservasi klinik.

Panduan asset, prompt dan reproduksi: [Foto dan booking dokter](../docs/PHOTO_AND_DOCTOR_BOOKING.md). Bagian di bawah adalah riwayat versi sebelumnya.

## Care-first UX — sebelumnya

All5pages reorganized around patient care, with four focused Home tasks and explicit branch-directory disclosure. View/filter/chat/draft state persists across tabs; native fade/chat scrolling respects reduced motion. TypeScript,15 browser API regressions,11 location browser checks and10 new UX checks passed. Rebuilt standalone APK passed9artifact checks and10 native flow checks (API/restore, keyboard-open request, font1.3/2.0). Exact scope/evidence/research: [UX_JOURNEY_REDESIGN](../docs/UX_JOURNEY_REDESIGN.md). Native location is reported separately. No physical-device, screen-reader, patient-study or native iOS acceptance is claimed.

## Standalone Android APK — versi sebelumnya, 1 November 2026

Release APK now builds locally with the flower launcher/native splash assets and embedded Hermes. Installed and launched as `com.example.morulacare.concept` on the owned Google APIs35 x86_64 emulator.9 artifact checks and10 standalone native API/location checks passed with Expo Go stopped and Metro offline. Real API preference PATCH/restore and synthetic Jakarta GPS/nearest branch were verified. Initial System UI ANR/request timeout recovered after cold launch; initial diagnostics retained. Launcher icon observed; native splash drawable and theme mapping inspected, while the short OS splash was not captured. See [ANDROID_STANDALONE](../docs/ANDROID_STANDALONE.md) for artifact, checksum, reproduction and exact scope. This supersedes earlier statements that no APK was built; physical ARM, AAB/IPA, store distribution and native iOS remain pending.

## UI and native Android follow-up — 1 November 2026

The refreshed five-tab interface and modal keyboard fix passed strict TypeScript, **15 API-mode browser checks (zero page errors)**, and a final uninterrupted **10-check native Expo Go run (exit 0, error null)** on Android 15/API 35 x86_64 with WHPX. Native checks include actual server-confirmed mutations/restoration, released-result provenance, history, unchanged official appointments after request, assistant/partner boundaries, keyboard-open submission and font scale 1.3. Native UI screenshots/XML and filtered empty app-error log are separate from browser screenshots.

Evidence is in `../docs/evidence/android-native-smoke.json`, `android-native-smoke.log`, `android-request-keyboard-submit.png`, `android-font130-home-sections.png`, `current-web-smoke.json` and `current-ui-visual.json`. `../docs/ANDROID_SETUP.md` documents the installed SDK/JDK/AVD, helper and process-only Java temp workaround. The owned emulator was stopped for RAM after tests; API/Metro remain available. No standalone Morula APK/AAB, signing, physical-device QA or iOS native build was performed. Earlier reports below remain historical.

## PostgreSQL API follow-up — 1 November 2026

After actual API/database restart verification, the reusable Edge browser suite passed again against PostgreSQL-backed API mode: **13 checks, zero uncaught page errors**, 390x844 viewport. Evidence: `../docs/evidence/current-web-smoke.json` (actual browser version and UTC timestamp), three `current-web-*.png` screenshots, and `current-web.log`. This confirms the API adapter/flows and explicit error/empty states continue working with durable server state. Mobile UI source and dependency lock were unchanged; no browser/localStorage persistence was added. Strict TypeScript was rerun successfully at handoff (`current-typescript.log`). Android/iOS native testing remains unperformed.

Date: 31 October 2026 (Asia/Jakarta). All checks use synthetic data.

| Check | Observed result |
| --- | --- |
| `npm run typecheck` | PASS, TypeScript strict mode; no compiler diagnostics |
| `npx expo export --platform web --output-dir dist` | PASS; final web bundle `index-ec937fa263e6a991737ca39b41b8461e.js` |
| API-mode web export to `dist-api` | PASS; built with `EXPO_PUBLIC_API_URL=http://localhost:8080` and explicit `EXPO_PUBLIC_DEMO_AUTH=true`; bundle `index-94db7e040cfdb30db1dd49c1b66a3178.js` |
| `npx expo export --platform all --output-dir dist-all` | PASS for Android, iOS and web; Android/iOS Hermes bundles produced |
| Package compatibility | React 19.3.0, React Native 0.88.1 and native dependencies match Expo 58.0.22's installed `bundledNativeModules.json` recommendations |
| Expo dependency check | Offline check reported up to date, with Expo's warning that offline validation is unreliable; this is not a full online doctor check |
| Shared fixture consistency | Mobile and Java backend `demo-overview.json` byte-identical at verification time; SHA-256 `08fd55b9e3211719641f5eaac48bca632b312b210f4f8446ec415f5d10d4647d` |
| React implementation review | No conditional hooks, no clinical localStorage/AsyncStorage persistence, explicit API failure path, accessible button/tab/control labels, sync and action errors separated |

The final all-platform export includes timestamp-based chronological sorting across timezone offsets and accurate empty states for no released embryo reports. It also includes the direct home navigation fixes: **Status embrio → Embrio**, **Riwayat → Riwayat**. Sync-error banners persist through successful preference/reminder actions and clear only when a new overview load succeeds. The shared decorative Icon helper now hides glyph text from accessibility using native accessibility flags and aria-hidden, preserving readable button names. Existing accessibilityState controls also set explicit web aria-checked, aria-selected, aria-pressed or aria-disabled as appropriate while retaining native accessibilityState. Segment groups expose tablist semantics.

A direct probe of the installed React Native Web createDOMProps confirmed preservation of aria-checked=false/true, aria-selected=false/true, aria-disabled=true, and aria-pressed=true. Browser interaction validation is recorded at repository level.

## Not established by these checks

- No APK, AAB or IPA was built, signed, installed or uploaded to an app store.
- No physical Android/iOS device, native accessibility reader, keyboard layout or background/push lifecycle was tested.
- No live hospital source, real authentication, external chatbot provider or real messaging channel was exercised.
- The rule-based demo chatbot is not clinically validated.
- Browser UI and Java API end-to-end verification is owned by the repository-level verification report.

The shipped export is a reviewable demonstration. Native build pipelines, device acceptance, clinical workflow validation and production identity/integration work remain separate gates.

## Windows local baseline — 1 November 2026, 15:18 WIB

The historical results above are preserved. New checks on Windows 11 used Node 26.5.1 and npm 11.17.0 with the unchanged package lock:

- `npm.cmd ci`: PASS, 487 packages installed. `npm.cmd run typecheck`: PASS.
- Expo 58.0.22 started with `--web --localhost --port 8081 --max-workers 1`, using ignored `.env.local` with `EXPO_PUBLIC_API_URL=http://localhost:8080` and `EXPO_PUBLIC_DEMO_AUTH=true`. Metro generated the web bundle in 11.6 seconds. Expo normalized the TypeScript include globs automatically; no product UI code changed.
- `scripts/verify-web.py`, executed from the project root with the existing tooling Python/Playwright environment: **13 checks passed, zero uncaught page errors**, Microsoft Edge headless, 390×844 viewport. Real API mutations covered reminder acknowledgements, preferences, a simulated appointment change and unchanged official schedules. The script restores toggled preferences/reminders to their starting values.
- Browser route interception separately verified first-load HTTP 503 without fallback, failed refresh warning persisting through a successful preference mutation, clearing only after successful refresh, and an empty released-embryo result showing the waiting state. These injected responses test client behavior; they do not modify clinical fixtures on the server.
- Evidence: `../docs/evidence/current-web-smoke.json`, `current-web-profile.png`, `current-web-api-error.png`, and `current-web-empty-embryos.png`. The empty-results screenshot was visually inspected.
- `npm audit --json`: 11 moderate advisories, zero high/critical. Full output is `../docs/evidence/current-web-npm-audit.json`. Findings include Expo tooling's glob/minimatch dependency chain; automatic recommendations include changing Expo's major version. No dependency changes or forced audit fixes were applied.
- Android: no `adb`/`emulator` executable, Android SDK environment variables, standard SDK directory or Android Studio installation was found at the checked locations. No Android build/device test was run. iOS compilation/device testing was not run on Windows. No cloud build or signing was started.

The browser script can be repeated against PostgreSQL mode after the backend switch; backend restart persistence is verified separately in the root verification report.
