# Asisten dan pemberitahuan

Asisten dan kotak pemberitahuan memakai warna Morula, judul 23/30, kartu putih, ikon ringan dan teks ringkas yang konsisten dengan Home. Tidak ada perubahan backend, dependency atau layanan push.

## Asisten

- Pembuka singkat dengan tiga pilihan: jadwal, laporan embrio dan riwayat perawatan.
- **Tentang asisten** menjelaskan batas asisten demo berbasis aturan. Sumber setiap jawaban tersedia melalui disclosure, tanpa strip teknis berulang.
- Composer tetap berada di bawah percakapan; pesan/draf/jawaban tertunda tetap ada saat pindah halaman. Gerak scroll mengikuti preferensi reduced motion.
- Pengiriman ganda dicegah. **Coba lagi** memakai bubble gagal yang sama. Draf berbeda yang sedang diketik dipertahankan saat retry berhasil maupun gagal; mengirim draf gagal yang diedit mengganti bubble yang belum terkirim.
- Pertanyaan klinis tetap mengarah ke form bantuan demo. Catatan darurat singkat tetap terlihat; tidak ada janji bahwa petugas memantau percakapan atau menerima pesan.

## Pemberitahuan

Daftar → filter Semua/Belum dibaca → detail → kembali, atau **Pengaturan notifikasi** menuju Profil. Judul dan waktu muncul dalam daftar; isi lengkap dibuka sesuai kebutuhan. Ada empty state dan aksi tandai semua dibaca.

Penanda dibaca dan badge mengikuti **sesi aplikasi**. Membuka detail menandai pesan dibaca; detail tetap terbuka walaupun berasal dari filter belum dibaca. Menutup/membuka kotak, berpindah halaman dan refresh mempertahankan penanda sesi. Cold launch/reload kembali memakai status API semula. API saat ini tidak memiliki endpoint penyimpanan read marker; tidak ada keberhasilan penyimpanan server yang diklaim. Data notifikasi API tidak diubah. Ini bukan pengiriman push atau perubahan preferensi notifikasi; preferensi tetap dikelola di Profil.

## Pengujian web

TypeScript dan **35 pemeriksaan browser lulus**: 10 Asisten/notifikasi, 15 regresi API dan 10 navigasi/UX. Cakupan baru termasuk disclosure sumber, retry gagal/berhasil dengan draf baru, satu request dari rapid send, pending reply lintas halaman, clinical handoff, composer responsif, detail unread yang stabil, read-all, pengaturan, refresh/cold reload dan empty inbox. Tidak ada page error. Jadwal klinis/notifikasi API tetap utuh; preferensi/pengingat regresi dipulihkan.

Review independen menemukan risiko hilangnya draf baru ketika retry pesan lama; perbaikan diverifikasi melalui retry gagal dan sukses. Screenshot diperiksa langsung: `assistant-notifications-welcome.png`, `assistant-notifications-retry.png`, `notifications-inbox.png`, `notifications-detail.png`, `notifications-read.png`, `notifications-empty.png` dan `assistant-layout-*.png` dalam `docs/evidence`.

## Reproduksi

Dengan API lokal dan Expo web API di port8081, jalankan `scripts/verify-assistant-notifications-web.py`, `verify-web.py` dan `verify-ux-journey.py` secara berurutan memakai Python tooling Windows. Untuk native, setelah build/install standalone dan Metro berhenti, jalankan `scripts/verify-assistant-notifications-android.py`. Tes font/keyboard hanya berjalan pada AVD Google API35 yang namanya diverifikasi, lalu mengembalikan font dan pengaturan handwriting semula. Hasil APK/native tercantum di bawah.

Tidak ada uji perangkat fisik, iOS, TalkBack atau penggunaan pasien nyata yang diklaim.

## APK dan hasil native final

**7 pemeriksaan native lulus** pada APK final: composer mengirim ke API di atas keyboard yang terbuka; sumber jawaban dan draf lintas halaman; bantuan klinik membuka form demo; unread/detail/read/settings; dua rangkaian font 1.3/2.0; jadwal dan notifikasi API tetap utuh. Font dipulihkan ke 1.0 dan setting handwriting semula dikembalikan.

Uji Android awal menemukan composer tertutup IME. Android KeyboardAvoidingView kini memakai height dan offset dari tinggi header + safe-area top. Perhitungan diperiksa pada implementasi RN yang terpasang, lalu pengiriman diuji ulang dengan batas tombol di atas inset keyboard sebenarnya. Bukti awal dipertahankan di `assistant-notifications-native-initial-keyboard.json`/`.png`; bukti berhasil `assistant-notifications-native-keyboard-send.png`/`.xml`.

Build final sukses **1m48s**, 352 task (11 executed/341 up-to-date). APK **35,602,026 bytes**, SHA-256 `1759fbe0c37a17caf19dc5e3a321151080fbb4e9f9c535dfe7bdfb7b80743dc1`. Sembilan pemeriksaan artefak lulus; checksum APK terpasang cocok. Aplikasi ditinggalkan di Asisten, sesi baru dengan inbox belum dibaca, API UP, Expo Go berhenti dan Metro offline.

Bukti final: `assistant-notifications-verification.json`, `assistant-notifications-native-results.json`, `assistant-notifications-ready.json`. Screenshot default: `assistant-notifications-native-assistant-ready.png`, `assistant-notifications-native-inbox-ready.png`; font besar: `assistant-notifications-native-font130-*` dan `font200-*`.
