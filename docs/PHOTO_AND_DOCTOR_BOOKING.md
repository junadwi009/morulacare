# Foto dummy dan booking dokter

> Panduan fitur foto/booking awal. APK, checksum dan pengujian versi terbaru tercantum di [pembaruan Perjalanan, Janji dan Profil](SECONDARY_PAGES_POLISH.md).

Versi ini menggunakan 5 gambar buatan **built-in image_gen**: 4 potret dokter fiktif dan 1 banner konsultasi. Semua gambar sudah disalin ke proyek, bukan diambil dari situs staf Morula. Nama, profil, pengalaman dan jadwal adalah contoh; tidak ada rating atau peluang keberhasilan yang dibuat-buat.

## Asset yang dapat diganti

| File dalam `mobile/assets/demo-images` | Dipakai pada | Penggantian yang disarankan |
|---|---|---|
| `consultation-hero.png` | Banner Beranda | Foto landscape3:2; subjek di kanan, ruang kosong di kiri untuk judul/tombol |
| `doctor-maya.png` | Kartu dokter, profil, review booking, kartu janji | Potret persegi dengan wajah/shoulder jelas dan headroom |
| `doctor-arif.png` | Kartu/profil/review/janji Arif | Potret persegi; pertahankan framing konsisten |
| `doctor-nadia.png` | Kartu/profil/review/janji Nadia | Potret persegi; pertahankan framing konsisten |
| `doctor-bima.png` | Kartu/profil/review/janji Bima | Potret persegi; pertahankan framing konsisten |

Mapping gambar: `mobile/src/doctor-assets.ts`. Mengganti file dengan nama yang sama akan memperbarui seluruh posisi terkait pada build berikutnya. Mengubah nama file memerlukan perubahan mapping; nama/profil dokter juga harus diubah di katalog backend dan fixture lokal. Foto dokter tidak ditempelkan pada janji klinis lama yang belum mempunyai doctorId yang cocok.

Prompt lengkap: `mobile/assets/demo-images/generation-prompts.json`. Ukuran, hash dan provenance: `manifest.json`. FilePNG asli dipertahankan tanpa manipulasi foto tambahan. Logo bunga, wordmark dan Flaticon yang sebelumnya dipilih pengguna tetap dipertahankan.

Pratinjau UI nyata: `docs/evidence/photo-home.png`, `photo-doctors.png`, `photo-doctor-profile.png`, `photo-booking-review.png`, `photo-booking-receipt.png`, `photo-appointments.png`.

## Alur dan informasi yang tampil

- 5 menu utama: Beranda, Perjalanan, Janji, Dokter, Profil. Asisten tetap tersedia lewat tombol chat header dan shortcut Beranda.
- Beranda: pencarian dokter â†’ banner foto â†’4shortcut â†’ kartu dokter â†’ kunjungan â†’ chart/ringkasan â†’ checklist.
- Dokter dapat dicari menurut nama, cabang atau bahasa; filter gender dan favorit memudahkan preferensi pribadi.
- Profil â†’ tanggal â†’ waktu â†’ keperluan â†’ review â†’ **Booking demo** â†’ receipt â†’ Janji. Status tersimpan sebagai konfirmasi demo, bukan reservasi rumah sakit.
- Janji membedakan booking dokter demo dari jadwal perawatan lama. Pembatalan memerlukan aksi konfirmasi dan benar-benar memperbarui API/melepaskan slot.
- Chart lingkaran menunjukkan jumlah catatan persiapan yang selesai dari checklist aktual. Angka laporan/kunjungan juga berasal dari data API. Tidak ada healthscore, progres keberhasilan IVF atau hasil medis acak.
- Status API, snapshot/sinkronisasi mentah, status deteksi GPS, akurasi dan jarak tidak ditampilkan dalam alur utama. Ranking cabang masih dihitung di perangkat; izin, kegagalan, batal dan hapus tetap dapat dipahami.

## Keandalan booking

Backend memakai reservasi slot atomik dan idempotency key di memory/PostgreSQL. Retry sesudah respons jaringan hilang tidak membuat booking ganda. Slot yang telah dipilih orang lain ditolak dengan409 dan UI meminta waktu lain. Data booking bertahan sesudah API restart dan browser/native cold launch. Jadwal klinis lama tidak diubah oleh booking/cancel baru. Kontrak/migrasi: [DOCTOR_BOOKING_API](DOCTOR_BOOKING_API.md).

Profil mode lokal disalin dari katalog API yang sama; kegagalan API tidak digantikan dengan fixture secara diam-diam. Favorit dan pilihan layar bersifat sesi; booking mode API persisten. Kalender tanggal3â€“5November2026 adalah skenario demo, bukan ketersediaan klinik sebenarnya.

## Hasil yang sudah diamati

- TypeScript lulus.
- 51 tes Java/PostgreSQL dan9HTTP lulus, termasuk concurrency, idempotency, cancellation, patient-scope dan API restart nyata. Bukti `doctor-booking-backend.json`.
- 15 regresi web API,11tes lokasi dan10tes navigasi/UX lulus setelah penyesuaian menu/layout.
- 12 tes booking visual web lulus: foto/banner dimuat dan pas ke kartu, preferensi/favorit, profile/date/time, lost-response retry, reload persistence, cancel/release, real409, respons lama tidak membatalkan cancellation terbaru, layout360/480/landscape, diagnostik tersembunyi dan tanpa pageerror. Bukti `photo-booking-web-results.json`.
- Temuan review katalog lokal yang berbeda telah diperbaiki melalui fixture `doctor-catalog.json` yang sama dengan respons API. Temuan stale confirmed-response sesudah cancellation diperbaiki dengan cancellation terminal perbookingID dan diuji melalui respons retry yang ditahan. Masalah ukuran intrinsik ImageBackground web diperbaiki agar banner pas pada kartu, lalu diperiksa secara visual.
- APK baru dibangun sukses4m56s dan lulus9pemeriksaan artefak. Ukuran35,588,406bytes, SHA-256 `6cd6be90b61e87f3677c718eab32c736292f3daa8dbcc8c07a3e6c5ab5abf4f0`. 18 pemeriksaan native lulus pada APK ini: 6 booking, 2 navigasi/font dan 10 API/lokasi. Bukti: `photo-native-booking-results.json`, `photo-native-font-results.json`, `photo-native-location-results.json`. Checksum APK terpasang cocok, API UP, Expo Go berhenti dan Metro offline; aplikasi ditinggalkan di Beranda. Font kembali 1.0 dan pengaturan stylus dipulihkan. Lihat `photo-native-ready.json`/`.png`.

Tes membuat lalu membatalkan hanya booking sintetis miliknya sendiri; riwayat pembatalan dipertahankan. Tidak menghubungi dokter, tidak membayar, tidak mengirim pesan, tidak membuat reservasi rumah sakit. Uji pasien, perangkat fisik dan native iOS belum dilakukan.

## Reproduksi tes booking native

Dengan APK terbaru terpasang pada AVD milik proyek dan API lokal aktif:

```powershell
node.exe scripts/android-apk-local.mjs open
python.exe scripts/verify-doctor-booking-android.py
python.exe scripts/android-smoke.py --standalone --font-only
python.exe scripts/verify-facility-android.py --standalone
```

Gunakan runtime Python tooling yang dipetakan di router pengembangan. Tes booking memilih EditText native sebenarnya, mengetik penanda sintetis, menggeser form untuk menutup keyboard (`keyboardDismissMode=on-drag`), lalu menekan Lanjut booking. Batas keyboard diperiksa sebelum gesture; posisi tombol diperiksa setelah viewport berubah.

Gboard pada emulator awalnya membuka tutorial stylus. Tes menonaktifkan mode tulisan tangan hanya selama tes pada AVD yang diperiksa namanya, lalu memulihkan nilai `stylus_handwriting_enabled` semula dalam `finally`. Ini pengaturan metode input sementara, bukan perubahan source aplikasi. Hasil gagal awal dipertahankan sebagai diagnostik.
