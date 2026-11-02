# Logo dan ikon Morula Care

Simbol bunga untuk app icon/adaptive/favicon/splash dan banner versi terbaru dibahas di [LOCATION_AND_HOME](LOCATION_AND_HOME.md). Wordmark pada dokumen ini tetap dipakai di header.

## Logo

Sumber pengguna: `Downloads/Morula_IVF_Indonesia_Transparent.svg`. Salinan asli tersimpan di `mobile/assets/brand/morula-ivf-indonesia-transparent.svg`, SHA-256 `94a83e61afd6ccdee8dabbf21ee27483d3785d515cefd0d3e61655212baa5995`.

`mobile/src/BrandLogo.tsx` menampilkan empat path/warna asli melalui `react-native-svg` **15.16.0**, versi yang dipilih Expo SDK 58. Tidak dirasterisasi atau digambar ulang. Ukuran header **148 × 37 dp**, dengan viewBox `0 6 148 37` yang memangkas ruang transparan vertikal saja. Logo tetap proporsional, seluruh path tetap di dalam viewBox, dan tombol beranda tetap memiliki tinggi minimum 44 dp. Aset logo lama dipertahankan sebagai riwayat tetapi tidak dirender.

## Flaticon Uicons

Dipilih dari keluarga **Regular Rounded** untuk konsistensi garis/bentuk dan kesesuaian dengan antarmuka perawatan. Distribusi resmi memakai paket `@flaticon/flaticon-uicons` **3.3.1**, sesuai versi registry saat pengambilan; nomor versi pada website/CDN dapat berbeda. Tidak ada pembelian atau login yang dilakukan.

- Halaman yang diminta: https://www.flaticon.com/icon-fonts-most-downloaded
- Panduan resmi yang menunjuk paket npm: https://www.flaticon.com/uicons/get-started
- **27 SVG** yang digunakan aplikasi: `mobile/assets/icons/flaticon/`
- Pemetaan nama, sumber, versi, integrity archive, dan hash tiap SVG: `manifest.json` di folder tersebut.
- Lisensi asli paket: `LICENSE.txt` di folder tersebut.
- Kredit terlihat dan dapat dibuka melalui **Tentang aplikasi → Kredit ikon → Uicons by Flaticon**, menuju https://www.flaticon.com/uicons.

| Area | Pilihan ikon |
| --- | --- |
| Navigasi | home-heart, layers, calendar, comment-dots, user |
| Perawatan dan riwayat | clipboard-prescription, heart, pulse, clock, marker |
| Privasi dan informasi | shield-check, lock, database, bell, interrogation, info |
| Status dan kontrol | exclamation, refresh, wifi-slash, check, check-circle, inbox, cross-small, arrow-right/up/up-right, angle-right |

Paket resmi versi ini berisi webfont WOFF2. `scripts/import-flaticon.py` membaca glyph yang dipilih dari font tersebut dan mengekspor outline vektor aslinya ke SVG, dengan sumbu Y dibalik sesuai koordinat font. Aplikasi merender path lokal melalui `ui.tsx`; tidak ada permintaan CDN atau font eksternal saat digunakan, dan seluruh ribuan ikon tidak ikut masuk bundle.

Untuk menghasilkan ulang aset, jalankan `scripts/import-flaticon.py` dengan Python tooling yang memiliki `fonttools[woff]` (versi yang diverifikasi: fontTools 4.68.0, brotli 1.2.1). Skrip memverifikasi SHA-512 archive resmi sebelum membaca member tertentu; tidak mengekstrak path archive secara bebas. Cache unduhan di `tools/asset-cache` diabaikan Git. SVG/generated TS memakai newline LF agar hash identik di Windows.

## Verifikasi perubahan

- TypeScript lulus setelah semua nama ikon termasuk fallback `inbox` terpetakan.
- Review independen memastikan 27 outline berasal dari glyph resmi, semua hash SVG cocok manifest, lisensi dipertahankan, dan path logo identik dengan sumber.
- Lima tab Android native berhasil dibuka dalam mode API; PNG tersedia pada `docs/evidence/brand-icons-android-*.png`. Kredit Flaticon terlihat pada screenshot/XML `brand-icons-android-credits`.
- Perubahan ini tidak mengubah kontrak/data API. Tes Java/HTTP/browser sebelumnya tidak dihitung sebagai tes ulang perubahan aset ini; native iOS belum dijalankan.
