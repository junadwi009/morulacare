# Dokter dan pemilihan jadwal

> Panduan pembaruan Dokter sebelumnya. APK/checksum terbaru tercantum di [Asisten dan pemberitahuan](ASSISTANT_NOTIFICATIONS_POLISH.md).

Pembaruan menyamakan daftar, profil dan booking dokter dengan Home: judul ringkas, warna Morula, kartu putih dan foto yang dibatasi proporsional.

## Alur

Dokter → profil → **Pilih jadwal** → tanggal/jam → **Lanjut booking** → tinjau → **Booking demo** → Janji.

- Daftar mempertahankan pencarian nama/cabang/bahasa, filter gender dan favorit.
- Profil berisi foto, nama, spesialisasi, cabang dan pengalaman; bio berada di **Tentang dokter**.
- Jadwal menjadi halaman tersendiri. Bulan/tahun, tanggal aktif dan tanggal lengkap ditampilkan. Hari penuh tidak dapat dipilih; tanggal awal mengikuti hari pertama yang masih tersedia.
- Jam dikelompokkan **Pagi**, **Siang**, **Sore** sesuai zona waktu slot, dengan penanda pilihan dan jam terisi yang nonaktif. Mengganti tanggal menghapus pilihan jam sebelumnya.
- Ringkasan pilihan ditampilkan sebelum lanjut; **Ubah jadwal** mempertahankan tanggal, jam dan draf keperluan. Kembali dari review menuju jadwal, dari jadwal menuju profil, lalu daftar. Label aksesibilitas menyebut tujuan yang sebenarnya.
- API tetap memakai slot atomik, idempotency dan pembatalan terminal. Respons lama dokter sebelumnya diabaikan.409 mengembalikan pengguna ke jadwal dan memuat ulang ketersediaan. Tidak ada harga/rating fiktif atau klaim reservasi rumah sakit.

## Pengujian

Suite baru `scripts/verify-doctor-flow-web.py` menguji pemisahan profil/jadwal, ukuran foto, disclosure, perubahan tanggal, draf dan navigasi, tanggal penuh, semua hari penuh, kegagalan/retry, zona waktu WITA dan respons dokter lama. Suite booking sebelumnya tetap menguji retry respons hilang, penyimpanan, cancel/release dan konflik slot nyata. Pengujian native memakai APK standalone pada AVD milik proyek; hasil dicatat setelah build/install.

Bukti visual: `docs/evidence/doctor-flow-profile.png`, `doctor-flow-schedule.png`, `doctor-flow-review.png`, `doctor-flow-full-date.png` dan `doctor-flow-layout-*.png`. Screenshot diperiksa langsung: potret memiliki ruang kepala dan halaman jadwal/review tidak meluap horizontal.

Semua dokter/foto/jadwal merupakan demo. Tidak ada reservasi klinik, biaya atau pengiriman pesan ke dokter. Pengujian perangkat fisik, iOS, TalkBack dan penggunaan pasien belum dilakukan.

## Hasil final

TypeScript lulus. **31 pemeriksaan browser lulus**: 9 pemilihan jadwal/edge case, 12 booking nyata pada API lokal dan 10 navigasi/UX. **8 pemeriksaan native lulus**: 6 booking/favorit/keyboard/cold launch/cancel/release dan 2 rangkaian direktori/profil/jadwal/review/edit/back pada font 1.3 dan 2.0. Tidak ada page error; booking sintetis milik tes dibatalkan dan jadwal klinis tetap utuh. Font kembali 1.0; pengaturan handwriting dikembalikan.

Review independen menemukan label kembali yang tidak menyebut tujuan sebenarnya; label kini dinamis. Pemotongan potret dan ukuran intrinsik image web juga diperbaiki dengan container proporsional dan dimensi image eksplisit, kemudian diuji ulang dan diperiksa pada browser/APK.

Build final sukses 1m25s (352 task; 11 executed/341 up-to-date), APK **35,594,822 bytes**, SHA-256 `d7b530613ae68f7ccc2b0858b795f7f2d03b9f1d2fe177e1f59558d574cecf7f`. Sembilan pemeriksaan artefak lulus; checksum APK terpasang cocok. Aplikasi ditinggalkan di **Dokter / Cari dokter**, API UP, Expo Go berhenti dan Metro offline.

Bukti: `doctor-flow-verification.json`, `doctor-flow-web-results.json`, `doctor-flow-native-booking-results.json`, `doctor-flow-native-font-results.json`, `doctor-flow-ready.json`. Screenshot native: `doctor-flow-native-directory-ready.png`, `doctor-flow-native-profile-ready.png`, `doctor-flow-native-schedule-ready.png`, dan `doctor-flow-native-font130-*`/`font200-*`.

Untuk mengulang: dengan API lokal dan Expo web API di port8081, jalankan `scripts/verify-doctor-flow-web.py`, `verify-doctor-booking-web.py`, lalu `verify-ux-journey.py` berurutan. Setelah build/install APK dan Metro berhenti, jalankan `scripts/verify-doctor-booking-android.py` lalu `verify-doctor-flow-android.py` memakai Python tooling Windows.
