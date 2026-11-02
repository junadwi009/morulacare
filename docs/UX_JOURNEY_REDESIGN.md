# UX dan perjalanan pasien Morula Care

Perubahan1 November2026 memprioritaskan pasien yang sedang menjalani program, dengan brand plum/oranye/bunga kuning Morula. Tidak ada perubahan kontrak API, identitas pasien, keputusan klinis atau jadwal resmi.

## Dasar riset

| Sumber primer | Prinsip yang digunakan | Keputusan desain (inferensi untuk aplikasi ini) |
|---|---|---|
| [ESHRE psychosocial care](https://www.eshre.eu/Guidelines-and-Legal/Guidelines/Psychosocial-care-guideline) | Kebutuhan dan informasi pendamping berbeda sepanjang terapi. | Beranda dimulai dari posisi perawatan dan langkah berikutnya, bukan katalog cabang. |
| [HFEA emotional support](https://www.hfea.gov.uk/treatments/explore-all-treatments/getting-emotional-support/) | Terapi dapat membebani emosi; tidak ada bukti konklusif stres menentukan hasil terapi. | Bahasa netral, tanpa tuntutan tetap positif, skor ketenangan, streak atau persentase keberhasilan. |
| [NHS writing](https://service-manual.nhs.uk/content/how-we-write) dan [health literacy](https://service-manual.nhs.uk/content/health-literacy) | Informasi faktual, jelas, ringkas; istilah medis dijelaskan. | Judul halaman menyebut tujuan, CTA menyebut tindakan, uraian panjang di detail. |
| [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Pisahkan kebutuhan utama dari opsi khusus yang dibuka saat dibutuhkan. | Direktori/GPS berada di panel sekunder dengan label yang jelas; kebutuhan perawatan tetap di Beranda. |
| [NN/g recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/) | Konteks dan pilihan yang dapat dikenali membantu pengguna mengingat informasi. | Label menu stabil, tahap saat ini terlihat, tiga contoh pertanyaan Asisten, pilihan dan draf sesi tetap tersedia. |
| [Apple tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) dan [Material navigation](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md) | Tujuan utama stabil dengan label yang dapat dikenali. | Pertahankan5tab dengan batas isi yang jelas. |
| [Android content structure](https://developer.android.com/design/ui/mobile/guides/layout-and-content/content-structure) | Alignment, gutter, insets dan pengelompokan konten membantu hierarki. | Satu kartu utama, kelompok section dengan jarak konsisten; kurangi shadow dan grid berulang. |
| [Reduced Motion](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria) | Gerak yang tidak perlu dapat mengganggu sebagian pengguna. | Tab langsung, modal fade native atau tanpa animasi ketika Reduce Motion aktif, autoscroll chat mengikuti preferensi. |

Sumber merupakan panduan internasional; pilihan layout/bahasa ini belum merupakan hasil usability testing pasien Morula Indonesia. Tidak ada klaim bahwa susunan ini pasti terbaik atau meningkatkan hasil klinis.

## Struktur menu dan alur

| Halaman | Tugas utama | Urutan konten |
|---|---|---|
| Beranda | Memahami keadaan sekarang dan tindakan berikutnya | Sapaan → tahap/program + nextStep dari API + CTA janji → kunjungan berikutnya → persiapan pribadi →4akses perawatan → pembaruan catatan → klinik |
| Perjalanan | Meninjau rencana, laporan dan catatan | Program/Embrio/Riwayat; status saat ini dan tahapan Selesai/Saat ini/Direncanakan; hasil yang dirilis dan provenance tetap dapat dibuka |
| Janji | Mengetahui kunjungan dan persiapannya | Janji terdekat mendapat penekanan, persiapan tersedia di detail; jadwal lainnya/riwayat lebih ringkas |
| Asisten | Menemukan informasi yang tersedia | Cakupan →3tugas awal → percakapan; composer tetap di bawah dan intro ikut scroll agar landscape tetap dapat dipakai |
| Profil | Mengelola akun, pemberitahuan dan privasi | Identitas/klinik → preferensi + feedback penyimpanan aktual → batas akses pasangan → koneksi/tentang aplikasi |

Empat akses Beranda: Status embrio, Riwayat perawatan, Tanya asisten, Bantuan tim klinik. Asisten dan bantuan tim memiliki cakupan berbeda: pencarian berbasis aturan versus form simulasi pertanyaan. Tidak ada klaim percakapan langsung dengan petugas.

Direktori cabang kini dibuka secara sengaja lewat **Cari cabang Morula** pada bagian Klinik Morula di Beranda. GPS/search tidak mendahului kebutuhan perawatan. Pencarian manual, deny, clear, cancel, jarak perkiraan dan sumber resmi dipertahankan. Menutup panel selama deteksi membatalkannya dan mengabaikan callback terlambat; lokasi yang sudah diperoleh tetap tersedia selama sesi. Cabang/jadwal pasien tidak berubah otomatis.

Segmen Perjalanan, filter riwayat, dan segmen Janji dipertahankan ketika pindah tab. Asisten dipasang setelah kunjungan pertama dan tetap berada dalam sesi aplikasi ketika disembunyikan; percakapan, respons yang sedang diproses dan draf tidak hilang. Keyboard ditutup ketika pindah tab. Android Back menutup detail melalui Modal, atau kembali dari tab sekunder ke Beranda.

Tidak ada carousel otomatis, persentase hasil IVF, animasi sukses klinis, dependency baru atau upgrade SDK. Bunga/wordmark/Flaticon tetap berasal dari aset yang telah dipilih pengguna. Native controls yang sudah ada dipertahankan untuk kompatibilitas Android/web dan build lokal.

## Verifikasi

- TypeScript lulus;15 regresi browser API lulus tanpa pageerror.
-11 tes direktori/lokasi browser lulus;10 tes UX baru lulus: hierarki, CTA,360/390/480 dan landscape, semua halaman landscape, pilihan/filter persisten, chat/draf/respons pending, reduced motion, pembatalan saat panel ditutup, serta konteks embrio/catatan terpisah.
- Bukti: `docs/evidence/ux-journey-results.json`, `ux-*.png`, `current-web-smoke.json`, `facility-web-results.json`.
- Task VS Code: **Morula: UX journey browser checks** (API dan Expo web harus hidup).
- APK hasil redesign berhasil dibangun (`assembleRelease`,2m3s),9 pemeriksaan artefak lulus, lalu dipasang pada Google APIs35 x86_64. SHA-256 `1348910e2e7d2bb3b224a2f07ccc16c2285cd89cee03635a5642bd1ebfce9620`;28,016,578bytes.
-10 pemeriksaan alur native lulus, exit0/errornull (`ux-native-smoke.json`): semua tab, checklist API/restore, laporan/provenance, riwayat, submit saat keyboard terbuka, receipt/jadwal tetap utuh, Asisten, preferensi, serta Home/Profil pada font1.3 dan2.0. Font dipulihkan ke1.0. Ini uji render/tindakan di emulator, bukan acceptance screen-reader atau studi pasien.
- Bukti native: `ux-native-*.png/.xml`. Pemeriksaan lokasi native pada panel baru dicatat terpisah pada `standalone-native-results.json`.
-10 pemeriksaan lokasi native versi baru juga lulus, exit0/errornull: own package tanpa Expo Go/Metro, API preference roundtrip, panel eksplisit, GPS Jakarta/akurasi/nearest branch, state lintas tab, clear dan jadwal tidak berubah. `standalone-ready.json` mencatat healthAPI, foreground package dan SHA APK terpasang yang sama dengan artefak. Beranda ditinggalkan terbuka, font1.0, API aktif, Metro/Expo Go berhenti.

Perintah dari root dengan Python tooling sesuai DEVELOPMENT_ROUTER:

```text
python.exe scripts/verify-ux-journey.py
python.exe scripts/verify-web.py
python.exe scripts/verify-facility-web.py
node.exe scripts/build-android-local.mjs prepare
node.exe scripts/build-android-local.mjs build
node.exe scripts/android-apk-local.mjs run
python.exe scripts/android-smoke.py --standalone
python.exe scripts/verify-facility-android.py --standalone
```
