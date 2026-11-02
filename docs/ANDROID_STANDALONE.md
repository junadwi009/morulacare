# APK standalone lokal Morula Care

Profil ini membuat release APK untuk **emulator x86_64**, dengan JavaScript/Hermes tertanam. Ini bukan Expo Go atau development client dan tidak memerlukan Metro. API Spring Boot/PostgreSQL lokal tetap dibutuhkan untuk mode API demo.

APK terbaru mencakup [Asisten dan pemberitahuan](ASSISTANT_NOTIFICATIONS_POLISH.md), di atas pembaruan halaman sebelumnya. Source terbaru lulus TypeScript, 35 pemeriksaan browser dan 9 artefak. Hasil native terkini dirangkum pada panduan tersebut; laporan sebelumnya adalah riwayat. `standalone-ready.json` memverifikasi checksum APK terpasang dan keadaan layanan akhir.

## Build dari root proyek

```powershell
node.exe scripts/build-android-local.mjs prepare
node.exe scripts/build-android-local.mjs build
```

Task VS Code **Morula: APK build standalone** menjalankan prepare terlebih dahulu. Native Android project dibuat di folder staging milik proyek `C:\morula-local-apk\project`; cache Gradle terpisah berada di `C:\morula-local-apk\gradle-home`. Path pendek ini mengurangi masalah path CMake/Ninja Windows. Marker ownership mencegah penggunaan folder staging milik proyek lain. Source tetap berada di `mobile`; tidak ada native source pengguna yang dihapus.

Prepare menyalin source, assets, config/plugin, package/lock dan dependency yang terpasang. File source yang dihapus dipangkas dari mirror secara individual dengan pemeriksaan batas path; cache/native output dipertahankan. Source/hasil staging dicatat dengan SHA-256. Build menolak source/staging yang berubah dan memeriksa ulang sebelum memublikasikan APK; jalankan prepare lagi setelah perubahan source. Pemeriksaan penolakan staging stale sudah dijalankan dengan modifikasi sementara pada salinan staged App.tsx, lalu byte aslinya dikembalikan.

Toolchain yang disiapkan sesuai versi proyek:

- Expo58.0.22 / React Native0.88.1 / Gradle9.4.1 / AGP9.2.1.
- Portable TemurinJDK17.0.20.1+1; Java global Windows tetap tidak berubah.
- Android platform **37.0revision2** (nama paket kanonis baru, API37), build-tools37.0.0, targetSdk36/minSdk24.
- NDK27.1.12297006; CMake3.30.5.
- Gradle heap1536MiB, satu worker, Kotlin in-process, Metro satu worker, dan pool compile/link CMake satu job.

Versi CMake dan batas object path memakai properti bawaan Expo root plugin. Callback native/Metro didaftarkan sebelum root plugin React mengevaluasi app. Percobaan pertama menemukan konfigurasi CMake terlambat; log diagnostik disimpan pada `standalone-gradle-initial-cmake-order.log`.

Gradle ZIP diverifikasi dengan checksum SHA-256 resmi. Instalasi SDK diverifikasi oleh SDK manager; portable JDK17 ZIP diverifikasi SHA-256 resmi Adoptium. Tidak memakai EAS/cloud, login, key produksi, atau upload ke store. Release APK memakai **debug test keystore dari template**; ini build uji lokal, bukan signing untuk distribusi produksi.

## Ikon, splash dan jaringan

App icon/adaptive/monochrome serta splash berasal dari SVG bunga kuning pengguna dan konfigurasi `mobile/app.json`. `expo-system-ui` ditambahkan lewat installer Expo yang cocok SDK untuk menerapkan pilihan light native.

`mobile/app.config.js` hanya mengaktifkan plugin `withLocalAndroidApi.cjs` ketika child build menerima `MORULA_LOCAL_ANDROID_BUILD=1`. Build mengisi API `http://127.0.0.1:8080` dan demo auth eksplisit, tanpa mengubah `.env.local` untuk workflow Expo Go.

Network security XML menolak cleartext secara default dan mengizinkan hanya **127.0.0.1 / localhost**. Tidak ada pengecualian LAN atau trust-all TLS. Native APK memakai adb reverse8080 untuk mencapai API loopback host. Profil lokal juga menghapus permission overlay dan legacy external storage yang tidak dibutuhkan; background location tetap diblokir.

APK ini ditargetkan untuk emulator ini. Ponsel ARM dan API yang di-host di komputer lain membutuhkan build/config jaringan tersendiri.

## Install dan jalankan

Pastikan backend hidup. Jika belum, jalankan task **Morula: backend ready (keep image)**.

```powershell
node.exe scripts/android-apk-local.mjs run
```

Helper memverifikasi checksum APK, menyalakan hanya AVD **MorulaCare_Google_API_35** bila perlu, memasang APK tanpa menghapus data aplikasi, membuat reverse8080, menghentikan Expo Go, lalu membuka package `com.example.morulacare.concept`. Task VS Code: **Morula: APK install and run (API)**.

Untuk membuka APK yang sudah terpasang tanpa install ulang:

```powershell
node.exe scripts/android-apk-local.mjs open
```

API/Metro diperlakukan terpisah. Helper ini tidak menyalakan atau membutuhkan Metro. Bila ingin kembali ke Expo Go, nyalakan Metro dan gunakan helper Android sebelumnya.

## Artefak dan bukti

Build dan instalasi berhasil pada1 November2026:

- `artifacts/android/MorulaCare-local-api-x86_64.apk` beserta checksum `.apk.sha256`.
- `docs/evidence/standalone-build.json`: ukuran, hash, source fingerprint, mode, arsitektur dan signing scope.
- `standalone-prebuild.log` / `standalone-gradle.log`: hasil proses terbaru.
- `standalone-install.json`: install/launch package pada AVD yang dimiliki; pembukaan ulang berikutnya dicatat terpisah di `standalone-open.json`.
- `standalone-apk-verification.json`:9 pemeriksaan lulus, errornull; signature, Hermes tertanam, API, arsitektur, release flag, permissions dan kebijakan jaringan.
- `standalone-native-results.json`: riwayat 10 pemeriksaan lokasi pada versi sebelum pembaruan Asisten; tidak diulang untuk perubahan chat/inbox ini. Pemeriksaan tersebut lulus, exit0/errornull; own activity, Expo Go berhenti, Metro mati, API preference PATCH/restore, foreground GPS sintetis Jakarta, akurasi, nearest branch, tab/clear dan jadwal tetap utuh.
- `standalone-launcher.png`: ikon bunga pada launcher Android. `standalone-splash-resource.png` adalah drawable xhdpi yang diekstrak dari APK aktual; tabel resource menghubungkannya ke `windowSplashScreenAnimatedIcon`. `standalone-loading.png` menunjukkan bunga saat loading aplikasi. Screenshot setelah `am start -W` melewati splash OS singkat; tidak diklaim sebagai tangkapan splash OS.

APK berukuran **35,602,026 bytes** (~34.0MiB), SHA-256:

```text
1759fbe0c37a17caf19dc5e3a321151080fbb4e9f9c535dfe7bdfb7b80743dc1
```

Gradle `assembleRelease` terbaru sukses (352 task, 1m48s; 11 executed/341 up-to-date). Build pertama membutuhkan24m10s; release memakai local test certificate, bukan production upload key. Optimasi AGP memendekkan nama file ZIP resource; verifier membaca tabel resource untuk menemukan ikon/splash/XML aktual.

Pada build awal (riwayat), boot emulator memunculkan ANR **System UI** dan request pertama timeout. Setelah System UI pulih, cold launch ulang memuat data API dan seluruh10 pemeriksaan native lulus. Diagnostik awal dipertahankan pada `standalone-native-initial-boot-results.json`; tidak ada perubahan API adapter untuk menyembunyikan timeout. API tetap loopback8080, emulator tetap hidup, Expo Go dihentikan, Metro tidak berjalan.

Ulangi verifikasi dari root:

```powershell
python.exe scripts/verify-android-apk.py
python.exe scripts/verify-facility-android.py --standalone
```

Gunakan executable Python tooling yang dipetakan pada `docs/VSCODE_TESTING.md`. Tes native memerlukan Home tanpa lokasi tersimpan di sesi baru; buka ulang aplikasi melalui helper `open` sebelum menjalankannya. Tes memakai koordinat emulator sintetis dan memulihkan preferensi API.

Tidak ada build iOS atau pengujian perangkat fisik dalam workflow ini.
