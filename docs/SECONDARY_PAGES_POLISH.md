# Perjalanan, Janji dan Profil

> Panduan pembaruan tiga halaman sebelumnya. APK/checksum terbaru tercantum di [alur Dokter](DOCTOR_FLOW_POLISH.md).

Pembaruan ini menyamakan tiga halaman dengan Home: judul 23/30, warna Morula yang sama, kartu putih, ikon ringan dan teks ringkas. Backend, data klinis, aset bunga dan foto dokter dipertahankan.

- **Perjalanan:** tahap aktif dan langkah berikutnya lebih dahulu; timeline lebih ringkas; laporan embrio dan riwayat memakai baris singkat dengan detail saat dibuka. Tidak ada persentase keberhasilan atau prediksi medis.
- **Janji:** pilihan Akan datang/Riwayat, booking dokter dan jadwal perawatan terpisah. Kartu menonjolkan nama, waktu dan cabang. Persiapan tetap lengkap di detail. Pembatalan booking tetap memerlukan konfirmasi. Pada Riwayat, catatan perawatan ditampilkan dahulu; booking dibatalkan dirangkum dan dibuka secara eksplisit. Loading/gagal tidak dianggap daftar kosong.
- **Profil:** kartu identitas singkat, pengaturan notifikasi berkelompok; pratinjau dan informasi akses pasangan dibuka sesuai kebutuhan. Muat ulang dan bantuan berupa menu, tanpa status koneksi teknis.

## Verifikasi web

TypeScript lulus. Sebanyak 44 pemeriksaan browser pada source ini lulus: 15 API/regresi, 10 UX/navigasi/responsif, 12 booking dokter dan 7 disclosure/preferensi/loading/error. Tidak ada page error. Uji gagal penyimpanan mempertahankan nilai awal, retry menyimpan ke API, dan pratinjau mengikuti preferensi privat tersimpan. Preferensi tes dipulihkan; booking sintetis milik tes dibatalkan. Review independen tidak menemukan regresi substantif setelah perbaikan encoding teks loading.

Bukti: `docs/evidence/page-polish-web-results.json`, `current-web-smoke.json`, `ux-journey-results.json`, `photo-booking-web-results.json`. Screenshot: `polish-perjalanan.png`, `polish-janji.png`, `polish-profil.png`, `polish-profile-preview.png`. Hasil APK dan native tercantum di bagian berikut; hasil browser tidak dianggap hasil native.

## Reproduksi

Dengan API lokal aktif, jalankan Expo web API mode di port8081 untuk suite browser. Untuk APK gunakan `scripts/build-android-local.mjs prepare`, lalu `build`; install/open memakai `scripts/android-apk-local.mjs run`. Runtime Windows tetap mengikuti router pengembangan. Hentikan Metro sebelum menguji kemandirian APK standalone.

Tes native memakai AVD Google API35 milik proyek. Font 1.3/2.0 mencakup Home, Perjalanan, Janji/detail dan Profil. Tes sementara menonaktifkan handwriting Gboard untuk input keyboard layar, lalu mengembalikan nilai awal; font/preferensi/pengingat juga dipulihkan. Tidak menguji perangkat fisik, iOS atau penggunaan oleh pasien nyata.

## APK dan Android yang sudah diuji

Build final sukses 1m36s; 352 task (11 executed, 341 up-to-date). APK x86_64 berukuran **35,591,138 bytes**, SHA-256 `11998ab9b5075b10e4e18fa70179f9a0b5dc9cf515d3a191daa59613ed7a52b9`. Sembilan pemeriksaan artefak lulus; checksum APK terpasang cocok dengan file proyek. Tidak memakai Expo Go/Metro atau cloud build.

**16 pemeriksaan native lulus**: 10 alur UI/API, termasuk detail embrio/riwayat, form usulan jadwal dengan keyboard, preferensi/disclosure dan Home/Perjalanan/Janji/Profil pada font 1.3 dan 2.0; ditambah 6 alur booking dokter, cold launch, pembatalan dan slot release. Jadwal klinis tetap utuh. Pengingat/preferensi/font dan pengaturan handwriting dipulihkan; booking sintetis tes dibatalkan.

Uji Android awal menemukan booking dibatalkan yang panjang menutupi riwayat klinis. Riwayat perawatan kini berada dahulu dan booking dibatalkan memakai disclosure eksplisit. Uji web tambahan dan pengulangan native pada APK final lulus. Diagnostik awal: `page-polish-native-initial-history.json`/`.png`.

Bukti final: `page-polish-verification.json`, `page-polish-native-results.json`, `page-polish-booking-native-results.json`, `page-polish-ready.json`. Screenshot default native: `page-polish-journey-ready.png`, `page-polish-appointments-ready.png`, `page-polish-profile-ready.png`; font besar: `ux-native-font130-*` dan `ux-native-font200-*`. Aplikasi ditinggalkan di **Perjalanan / Program**, font 1.0, API UP, Expo Go berhenti, Metro offline.
