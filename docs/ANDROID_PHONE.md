# APK untuk HP Android

APK `MorulaCare-local-api-x86_64.apk` hanya menargetkan emulator x86_64. Gunakan
`artifacts/android/MorulaCare-phone-demo.apk` untuk mencoba UI pada HP ARM64,
termasuk target pengguna Samsung Galaxy A50. Versi Android 16 dilaporkan pengguna;
perangkat fisiknya belum tersambung ke mesin pengujian.

## Memasang

1. Salin **MorulaCare-phone-demo.apk** ke HP melalui USB atau transfer file.
2. Buka file tersebut di pengelola file HP.
3. Jika Android meminta izin instalasi, izinkan pengelola file itu memasang APK ini.
4. Pilih **Install**, lalu buka **Morula Care Demo** dengan ikon bunga.

Paket baru memakai ID `com.example.morulacare.concept.demo`, sehingga bisa
berdampingan dengan aplikasi API sebelumnya. Tidak perlu menghapus data versi API.
Paket berisi ARM64 (`arm64-v8a`) dan x86_64 untuk pengujian emulator. Minimum SDK
24 (Android 7.0), target SDK 36. Ini APK pengujian bertanda tangan lokal, bukan
rilis Google Play atau aplikasi pasien produksi.

## Mode demo lokal

Aplikasi memakai data sintetis bawaan. Home, Perjalanan, Janji, Profil, dokter,
booking simulasi, Asisten dan inbox dapat dicoba tanpa backend komputer maupun
Expo Go. Perubahan dan booking demo disimpan selama sesi aplikasi, lalu kembali
ke data awal setelah proses aplikasi dimulai ulang. Tidak ada reservasi klinik
atau pengiriman pesan/notifikasi sungguhan. Fitur lokasi tetap memerlukan izin
perangkat; membuka layanan petunjuk arah dapat membutuhkan koneksi internet.

Build API sebelumnya tetap memiliki konfigurasi dan artefak tersendiri. Koneksi
API dari HP memerlukan server yang dapat dijangkau HP; alamat `127.0.0.1` pada
HP menunjuk HP itu sendiri.

## Build ulang di Windows

Dari root proyek, memakai Node dan toolchain lokal sesuai routing pengembangan:

```powershell
node.exe scripts/build-android-local.mjs prepare --phone
node.exe scripts/build-android-local.mjs build --phone
python.exe scripts/verify-android-apk.py --phone
```

`--phone` memakai staging milik proyek `C:\morula-phone-apk`, API URL kosong,
autentikasi demo API nonaktif, dan ABI `arm64-v8a,x86_64`. Tidak mengunggah ke
cloud atau mengganti Node/Java/PATH global. Tanpa flag ini, helper tetap membuat
APK API x86_64 yang sudah ada.

Tes konfigurasi: `node.exe --test scripts/android-phone-config.test.mjs`.
Hasil build/artefak tersimpan dalam `docs/evidence/phone-demo-*.json`.
`scripts/verify-phone-demo-android.py` menguji paket yang sama pada emulator
x86_64 dengan Wi-Fi/data dimatikan sementara, lalu memulihkan pengaturannya.
Hasil emulator tidak dianggap bukti pengujian Galaxy A50 fisik.

## Artefak terverifikasi - 3 November 2026

Build lokal berhasil dalam 16m48s setelah melanjutkan kompilasi yang terhenti.
APK berukuran **53.313.074 byte** dengan SHA-256
`227d103cbfbc3cbd66c5f36318c08d0a01b7d43ccf4399a7b7f9618338e30245`.
Sembilan tes konfigurasi/health helper lulus dan **12 pemeriksaan APK lulus**:
checksum, bundle Hermes tertanam tanpa URL API komputer, ABI ARM64/x86_64,
integritas ZIP, alignment ELF/ZIP 16 KB, ikon/splash, identitas paket,
permission, network policy dan tanda tangan. Pemeriksaan alignment bukan
pengganti pengujian runtime pada perangkat dengan page size 16 KB.

Paket yang sama berhasil dipasang pada AVD Google API 35 x86_64. **Lima kelompok
pemeriksaan native offline lulus**: cold launch Home; Perjalanan/Janji/Profil;
pemilihan dokter/jadwal/review/booking; jawaban Asisten; inbox pemberitahuan.
Wi-Fi/data dimatikan selama tes, lalu dikembalikan bersama setting handwriting
keyboard. Booking sintetis dalam memori direset dengan cold launch akhir.
Checksum APK terpasang sama dengan artefak. Tidak ada pengujian HP fisik yang
diklaim. Bukti: `phone-demo-native-results.json`, `phone-demo-verification.json`
dan screenshot `phone-demo-native-*` serta `phone-demo-ready.png`.

Uji native pertama terhalang ANR **Android System UI** yang menutupi Home Morula.
Dialog sistem ditangani, kemudian seluruh rangkaian diulang dan lulus. Bukti awal
tetap tersimpan sebagai `phone-demo-native-initial-system-ui.*`; kegagalan ini
tidak disembunyikan atau dihitung sebagai keberhasilan uji aplikasi.
