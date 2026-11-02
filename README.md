# Morula Care - React Native + Java

> Latest assistant/inbox update: [ASSISTANT_NOTIFICATIONS_POLISH](docs/ASSISTANT_NOTIFICATIONS_POLISH.md) covers concise chat, on-demand sources, safe draft retry, session-only notification read markers and the latest emulator APK verification.

> Latest doctor flow: [DOCTOR_FLOW_POLISH](docs/DOCTOR_FLOW_POLISH.md) documents the concise profile, separate date/time selection, timezone groups, preserved draft/edit flow and latest emulator APK verification.

> Latest page polish: [SECONDARY_PAGES_POLISH](docs/SECONDARY_PAGES_POLISH.md) covers the consistent Journey, Appointments and Profile layout, concise summaries, expandable settings and current APK/native verification.

> Latest visual/booking update: [PHOTO_AND_DOCTOR_BOOKING](docs/PHOTO_AND_DOCTOR_BOOKING.md) maps the five generated, replaceable image assets and documents the cleaner UI, doctor preferences, persisted demo booking/cancellation, preparation chart and hidden GPS/API diagnostics. [Booking API](docs/DOCTOR_BOOKING_API.md) records the additive storage contract and tests.

> Latest UX redesign: [UX_JOURNEY_REDESIGN](docs/UX_JOURNEY_REDESIGN.md) records research, care-first home hierarchy, cleaner page/menu organization, session continuity and reduced-motion behavior. [ANDROID_STANDALONE](docs/ANDROID_STANDALONE.md) documents the local standalone APK workflow.

> Latest home/location update: [LOCATION_AND_HOME](docs/LOCATION_AND_HOME.md) covers the reference-inspired home, yellow flower app assets, opt-in nearest-branch search, directory sources and test evidence.

> VS Code testing/iOS: [VSCODE_TESTING](docs/VSCODE_TESTING.md) explains the default Test Task, sequential suite, F5 test-script debugging, and current iOS bundle validation. Native iOS execution still requires an available iOS device/simulator.

> UI/Android follow-up: see [UI_REFRESH](docs/UI_REFRESH.md) for the reference-inspired Morula interface and visual evidence, and [ANDROID_SETUP](docs/ANDROID_SETUP.md) for the installed local SDK/emulator, Expo Go API-mode workflow and actual native results. Android doctor/run/stop are also available as VS Code tasks.

> Local development update, 1 November 2026: start with [LOCAL_SETUP](docs/LOCAL_SETUP.md) for the Windows/Docker workflow, VS Code tasks and PostgreSQL demo persistence. [PROGRESS](docs/PROGRESS.md) records fresh verification separately from the original package evidence below. `SHA256SUMS.txt` describes the original package, not subsequent local changes.

Prototype aplikasi pendamping pasien fertilitas untuk **Android dan iOS**, dengan React Native / Expo / TypeScript dan backend Java Spring Boot. Semua data adalah sintetis. Nama dan desain merupakan konsep, bukan aplikasi resmi yang sudah dirilis Morula.

## Mulai dari sini

- `docs/BLUEPRINT.md`: deep brainstorming, flow, kebutuhan klinis, fitur, integrasi, dan roadmap.
- `docs/Morula_Care_Blueprint.pdf`: versi PDF jika paket final menyertakannya.
- `mobile/`: aplikasi React Native dengan lima tab dan mode demo lokal / API.
- `backend/`: Java API, data demo, dan pengujian.
- `contracts/README.md`: tipe data dan kontrak endpoint yang sama untuk mobile dan Java.
- `VERIFICATION.md`: bukti pemeriksaan aktual beserta batasnya.
- `preview/`: export web demo lokal jika tersedia dalam paket final; untuk review UI tanpa build native.
- `runtime/morula-care-api-0.1.0.jar`: backend hasil build; cukup Java 21 untuk menjalankan tanpa kompilasi ulang.

## Fitur prototype yang bisa dicoba

1. Beranda: tahap program, langkah berikutnya, appointment terdekat, aktivitas terakhir, dan checklist.
2. Perjalanan: tahapan program, pembaruan embrio yang dirilis, filter riwayat, dan detail aktivitas.
3. Janji: mendatang/riwayat, detail persiapan, dan formulir simulasi permintaan perubahan.
4. Asisten: jawaban dari data demo untuk jadwal, status embrio, serta riwayat; batas pertanyaan medis dan permintaan bantuan terlihat.
5. Profil: identitas demo, preferensi privasi, informasi integrasi, dan refresh.
6. Pemberitahuan serta sumber/waktu rilis hasil.
7. Simulator automasi backend: evaluasi pengingat terhadap waktu dan status janji, dengan ID stabil serta pengiriman nonaktif.

Permintaan menampilkan `received_demo` dan tidak dikirim ke rumah sakit. Chat menggunakan aturan, belum LLM. Checklist adalah pengakuan pengguna, bukan bukti klinis. Mode lokal/memory mereset state setelah restart; mode API PostgreSQL menyimpan request, idempotency, preferensi dan acknowledgement dalam volume lokal.

## Kebutuhan lokal

- Node.js 24 LTS dan npm untuk mobile; versi runtime validasi tercatat pada VERIFICATION.
- JDK Java 21 untuk backend.
- Internet untuk mengunduh dependensi pada instalasi pertama.
- Android Studio / SDK untuk compile Android lokal, atau Xcode pada macOS untuk compile iOS lokal. Native build cloud memerlukan akun/konfigurasi tersendiri.

Paket menyertakan `package-lock.json` serta Maven wrapper. Gunakan versi yang dikunci sebelum meng-upgrade dependency. Source Android/iOS dihasilkan oleh Expo saat native build; folder native hasil generate tidak disertakan.

## Menjalankan di Windows tanpa file .ps1

Ekstrak ZIP. Buka terminal PowerShell di folder `morula-care`. Perintah `.cmd` berikut menghindari kebutuhan menjalankan skrip PowerShell.

### A. Review aplikasi tanpa backend

```powershell
cd .\mobile
npm.cmd ci
npm.cmd run web
```

Web preview terbuka melalui server Expo. Semua data berasal dari fixture sintetis lokal. Untuk Android/iOS lewat perangkat pengembangan yang kompatibel dengan SDK ini:

```powershell
npm.cmd start
```

Ikuti petunjuk Expo pada terminal; untuk perangkat fisik, gunakan jaringan yang sesuai. Jangan menganggap `localhost` pada telepon menunjuk ke komputer.

### B. Jalankan Java API

Terminal baru dari folder `morula-care`:

```powershell
cd .\backend
.\mvnw.cmd verify
java -jar .\target\morula-care-api-0.1.0.jar --spring.profiles.active=demo
```

Endpoint lokal: `http://localhost:8080/actuator/health`. Aplikasi sengaja menolak startup tanpa profil demo yang eksplisit. Token demo publik bukan mekanisme keamanan akun produksi.

Paket final juga menyertakan JAR yang sudah dibangun. Alternatif cepat dari folder akar `morula-care`, setelah Java 21 terpasang:

```powershell
java -jar .\runtime\morula-care-api-0.1.0.jar --spring.profiles.active=demo --server.address=127.0.0.1
```

JAR bawaan berisi dependency Java dan fixture sintetis. Source serta test suite tetap tersedia untuk review dan rebuild. Checksum ada pada `SHA256SUMS.txt`.

### C. Hubungkan mobile ke API demo

Hentikan server Expo dari langkah A. Pada terminal mobile yang sama:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://localhost:8080'
$env:EXPO_PUBLIC_DEMO_AUTH = 'true'
npm.cmd run web
```

Gunakan origin browser `http://localhost:8081` agar sesuai CORS demo. Untuk telepon fisik, isi alamat IP LAN komputer sebagai API URL, dengan firewall lokal yang dibatasi jaringan pengujian. Variabel `EXPO_PUBLIC_*` masuk ke bundle aplikasi; jangan pernah memasukkan API key produksi di sana.

Jika API tidak tersedia, aplikasi menunjukkan kegagalan. Ia tidak mengganti data API dengan fixture secara diam-diam. Kembali ke mode lokal dengan mengosongkan URL lalu restart server Expo:

```powershell
$env:EXPO_PUBLIC_API_URL = ''
$env:EXPO_PUBLIC_DEMO_AUTH = 'false'
npm.cmd run web
```

## macOS / Linux

```bash
cd backend
./mvnw verify
java -jar target/morula-care-api-0.1.0.jar --spring.profiles.active=demo
```

Terminal mobile:

```bash
cd mobile
npm ci
EXPO_PUBLIC_API_URL=http://localhost:8080 EXPO_PUBLIC_DEMO_AUTH=true npm run web
```

Hilangkan variabel API untuk mode demo lokal. Perintah lengkap, informasi SDK, dan build profile terdapat pada `mobile/README.md`.

## Preview hasil export

Jika folder `preview/` ada, Python dapat menyajikannya tanpa instalasi npm:

```powershell
python -m http.server 8081 --bind 127.0.0.1 --directory .\preview
```

Buka `http://localhost:8081`. Buka melalui HTTP; klik langsung `index.html` dari file manager tidak menjamin asset Expo dapat dimuat. Preview web memakai data demo lokal. Android/iOS tetap memakai source React Native yang sama.

## Build native dan batas yang perlu dipahami

Perintah berikut memerlukan toolchain platform dan belum dijalankan sebagai native build pada paket ini:

```bash
# Android - Android Studio / Android SDK siap
npx expo run:android

# iOS - macOS / Xcode siap
npx expo run:ios
```

`mobile/eas.json` menyediakan contoh profile preview/internal. Identitas bundle masih `com.example.morulacare.concept`; ganti dengan identitas aplikasi yang benar sebelum distribusi produksi. APK standalone lokal x86_64 kini tersedia di `artifacts/android/MorulaCare-local-api-x86_64.apk`, memakai ikon bunga/splash dan local test key. Sudah dipasang dan diuji dalam mode API tanpa Expo Go/Metro pada emulator;9 pemeriksaan APK dan10 native lulus. Build/install ulang melalui task VS Code **Morula: APK build standalone** / **Morula: APK install and run (API)**; petunjuk lengkap: [Android standalone](docs/ANDROID_STANDALONE.md). AAB, IPA, TestFlight, perangkat fisik dan publikasi store belum diuji. Hermes/JavaScript export iOS bukan bukti native iOS.

## Docker backend opsional

```bash
node scripts/setup-local.mjs
docker compose -p morula-care-local up -d --build --wait api
```

Compose menjalankan backend demo di loopback port8080 dan PostgreSQL sintetis pada jaringan internal tanpa port database host. Mobile dijalankan terpisah. Perintah stop yang mempertahankan data: `docker compose -p morula-care-local stop`. Hasil pengujian container terbaru ada pada `docs/PROGRESS.md`; bukti historis tetap dipertahankan. Tidak ada database produksi atau adapter klinis yang diaktifkan.

## API ringkas

Semua endpoint `/api/v1/*` memakai `Authorization: Bearer demo-patient-token` saat backend berada dalam profil demo. Identitas demo sengaja publik dan hanya menunjuk data sintetis.

| Metode | Path | Kegunaan |
|---|---|---|
| GET | `/api/v1/overview` | Overview pasien demo |
| GET | `/api/v1/embryos` | Hasil embrio yang sudah dirilis |
| GET | `/api/v1/activities` | Riwayat perawatan |
| GET | `/api/v1/appointments` | Jadwal resmi sintetis |
| GET | `/api/v1/doctors` | Katalog dokter fiktif |
| GET | `/api/v1/doctors/{id}/slots` | Slot konsultasi demo dan ketersediaan |
| GET / POST | `/api/v1/doctor-bookings` | Daftar/booking dokter demo; POST memakai Idempotency-Key |
| POST | `/api/v1/doctor-bookings/{id}/cancel` | Batalkan booking demo dan lepaskan slot |
| GET | `/api/v1/automation-preview` | Simulasi aturan pengingat berdasarkan waktu; tidak mengirim pesan |
| POST | `/api/v1/chat` | Asisten berbasis aturan |
| POST | `/api/v1/care-requests` | Simulasi permintaan, memakai Idempotency-Key |
| PATCH | `/api/v1/reminders/{id}` | Checklist pengingat |
| PATCH | `/api/v1/preferences` | Preferensi demo |

Contoh simulator automasi dari PowerShell, ketika Java sudah berjalan:

```powershell
$demoHeaders = @{ Authorization = 'Bearer demo-patient-token' }
Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/automation-preview?at=2026-11-01T03:00:00Z' -Headers $demoHeaders | ConvertTo-Json -Depth 8
```

Interval 24 jam dan 2 jam adalah aturan contoh yang dapat dikonfigurasi. Hasil menunjukkan `planned`, `due`, atau `expired`; pengulangan tidak mengubah ID job. Tidak ada scheduler, antrean durable, push, WhatsApp, atau pengiriman ke pasien. Detail berada di backend/README.

## Menuju pilot rumah sakit

Tentukan terlebih dahulu sumber dan workflow rilis embriologi, kontrak TERA, master cabang, pemetaan identitas, kewenangan pasangan, dan entitlement Qiscus. Tambahkan OIDC/identity proofing, penyimpanan persisten, audit, adapter terverifikasi, notifikasi, worker durable, portal staf yang diperlukan, lalu lakukan UAT klinis dan native device QA.

Fitur-fitur tersebut dirinci sebagai rencana dalam blueprint. Source ini adalah fondasi executable untuk review flow dan engineering, belum boleh dipakai memproses rekam medis nyata.
