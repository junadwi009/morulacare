# Beranda, simbol bunga, dan cabang terdekat

Perubahan 1 November 2026 menerapkan struktur referensi pengguna: lokasi/pencarian di atas, banner lebar dengan dua aksi, grid delapan layanan, kartu cabang horizontal, lalu informasi perawatan. Warna tetap Morula: plum, oranye, kuning bunga, putih, dan sage. Seluruh menu memiliki tujuan yang berfungsi; tidak ditambahkan harga, rating, klaim klinis, atau tombol pembelian dari referensi.

## Simbol bunga dan app icon

Sumber `Downloads/Morula_Bunga_Kuning_Transparent.svg` disalin utuh ke `mobile/assets/brand/morula-flower.svg`, SHA-256 `8848b57fbef988fad0b5643f6a1b926c061fbb03275bfa31e3a8f9608ddc467f`. `BrandSymbol.tsx` memakai path/warna asli untuk banner dan loading. Wordmark penuh tetap dipakai pada header.

`scripts/generate-brand-assets.mjs` merender sumber tersebut melalui resvg 2.6.2 yang terpasang di tooling cache, menghasilkan tujuh PNG: app icon, adaptive foreground, monochrome, favicon, ikon web 192/512, dan splash. Dimensi/hash tercatat pada `mobile/assets/brand/flower-assets.json`. Adaptive foreground memiliki transparansi dan artwork di dalam safe zone; ikon iOS/app memiliki latar putih opaque.

`mobile/app.json` memasang icon Android/iOS, Android adaptive/monochrome, favicon web, dan plugin splash. Favicon server lokal mengembalikan HTTP200 dengan konten ICO. **Launcher dan splash native baru memerlukan build APK/IPA baru**; Expo Go tetap memakai ikon/launcher miliknya. Header/banner/loading dapat langsung dilihat di Expo Go. Pengujian ini tidak menghasilkan APK/IPA baru.

## Cara menggunakan lokasi

1. Buka Beranda dan pilih **Gunakan lokasi saya**, atau tile **Deteksi lokasi**. Aplikasi tidak meminta izin saat pertama dibuka.
2. Berikan izin foreground lewat dialog sistem. Lokasi perkiraan/coarse dapat digunakan; akurasinya ditampilkan jika tersedia.
3. Bagian **Cabang terdekat** mengurutkan cabang dalam direktori berdasarkan jarak garis lurus. Ini bukan jarak rute, estimasi waktu perjalanan, atau jaminan semua fasilitas kesehatan di sekitar pengguna.
4. **Hapus lokasi** menghapus koordinat dari state aplikasi; **Batalkan** menghentikan proses aplikasi menunggu dan mencegah tahap lookup baru. Jika lookup sistem sudah berjalan, hasil yang terlambat diabaikan; Expo API tidak menyediakan pembatalan lookup OS tersebut. Tidak ada pemantauan terus-menerus.
5. Tanpa izin, tanpa layanan lokasi, saat timeout, atau saat provider gagal, pengguna tetap bisa mencari nama cabang/kota/alamat. **Lihat semua** memperluas daftar tiga kartu awal menjadi seluruh hasil yang dapat digeser horizontal.

Koordinat hanya berada di memori selama sesi, bertahan saat berpindah tab, dan hilang setelah reload/restart. Tidak ada AsyncStorage, background location, reverse geocoding, analytics lokasi, atau pengiriman koordinat ke backend Morula Care. Pengaturan izin Android background diblokir; iOS Always/background/motion/full-accuracy request tidak diaktifkan. Penyedia lokasi tetap merupakan layanan sistem operasi.

**Petunjuk arah** membuka Google Maps dengan koordinat tujuan cabang saja; aplikasi tidak memasukkan origin/koordinat pengguna ke URL. **Informasi resmi** membuka halaman cabang Morula. Fitur ini tidak mengganti cabang pada profil pasien atau memindahkan jadwal perawatan.

## Direktori cabang

Snapshot **11 cabang** berasal dari [direktori resmi Morula](https://www.morulaivf.co.id/lokasi-klinik/). Alamat dan koordinat diambil dari masing-masing halaman cabang, khususnya tujuan pada tautan **Arahkan ke Lokasi**. Tidak dipakai koordinat perkiraan pusat kota. Sumber/koordinat/hash halaman tersedia di `docs/evidence/facility-directory-sources.json`; katalog aplikasi di `mobile/src/facility-data.ts`.

Direktori ini bersifat snapshot publik, bukan integrasi real-time. Pengguna diminta mengonfirmasi alamat/layanan sebelum datang. Data pasien, laporan, dan appointment tetap sintetis; copy footer/About membedakan keduanya.

## Pengujian yang sudah diamati

- **15 unit checks**: koordinat sumber, Haversine, urutan jarak, manual search, input invalid, izin ditolak, provider mati/gagal, hasil stale, timeout, serta dua race pembatalan dan budget waktu izin/GPS yang terpisah (60s/20s). Laporan `docs/evidence/facility-unit-tests.xml`.
- **11 pemeriksaan browser fitur**: tanpa prompt otomatis, manual search/reset, posisi browser terkontrol menghasilkan Jakarta paling dekat beserta akurasi, state antar-tab, clear/reload, layout360/390/480, denied permission dan late callback setelah cancel. Laporan `facility-web-results.json` dan screenshot `facility-web-*.png`.
- **15 regresi browser API** lulus, zero page errors: checklist/preferensi dikembalikan, batas hasil klinis, request tidak mengubah jadwal resmi, empty/error state, dan touch targets dipertahankan. Laporan `current-web-smoke.json`.
- TypeScript lulus. Review independen mencocokkan seluruh11 koordinat dengan sumber resmi dan memverifikasi perbaikan cancellation.
- **7 pemeriksaan native Android lulus**, exit0/errornull, pada AVD baru `MorulaCare_Google_API_35` dengan Google APIs35revision9/GMS24.23.35/ExpoGo58.0.5. Posisi Jakarta diinjeksi lewat emulator; provider native menghasilkan akurasi ±5m, Jakarta menjadi kartu terdekat, state bertahan antar-tab, clear berfungsi, dan appointment resmi tetap sama. Bukti: `facility-native-results.json`, `facility-native-*.png/.xml`.
- AOSP lama tidak memiliki GMS dan tetap dipertahankan. Pengujian native menemukan waktu dialog izin memakan budget GPS; keduanya kini dipisah60s/20s dan dua regresi unit ditambahkan. Saat lokasi jaringan tidak tersedia, lookup sekali pakai kini memakai GPS High (pilihan approximate OS tetap dihormati). Percobaan awal timeout disimpan sebagai diagnostik; hanya laporan akhir7pass/errornull menetapkan native pass.
- Native iOS/perangkat fisik belum diuji. Posisi pada pengujian browser/emulator adalah posisi sintetis terkontrol, bukan GPS pengguna sebenarnya.

Task VS Code baru: `Morula: facility location logic tests` dan `Morula: facility browser smoke`; keduanya masuk rangkaian `test all available (sequential)`. Browser membutuhkan API/Metro aktif. `allowImportingTsExtensions` pada tsconfig mendukung pengujian langsung helper TS dengan Node26 tanpa framework baru.
