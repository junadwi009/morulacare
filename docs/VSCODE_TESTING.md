# Testing Morula Care di Visual Studio Code

Konfigurasi ini memakai versi proyek yang sudah terpasang: Expo 58.0.22, React Native 0.88.1, dan TypeScript 6.0.3. Java 21 serta PostgreSQL dijalankan melalui Docker. Tidak perlu mengganti Java bawaan Windows, execution policy, atau PATH global.

## Menjalankan tes

Buka folder `morulacare` sebagai workspace. Tekan **Ctrl+Shift+P**, pilih **Tasks: Run Test Task**, lalu pilih task berikut. Task default adalah `Morula: verify basic`.

| Task | Yang dijalankan |
| --- | --- |
| `Morula: verify basic` | Menyalakan API/PostgreSQL, menunggu health, lalu TypeScript dan tes kontrak HTTP |
| `Morula: Java tests (Docker Java 21)` | Unit/configuration tests dan integration tests PostgreSQL; database tes memakai schema terpisah |
| `Morula: browser API smoke` | 15 pemeriksaan UI web dengan API asli, termasuk error tanpa fallback; membutuhkan Expo web aktif pada port 8081 |
| `Morula: UX journey browser checks` | 10 pemeriksaan hierarki, semua halaman landscape, state/draf/percakapan persisten, reduced motion, dan pembatalan deteksi lokasi saat panel ditutup; membutuhkan API dan Expo web aktif |
| `Morula: doctor booking browser checks` | 12 pemeriksaan foto, preferensi/favorit, slot, booking/cancel API, retry tanpa duplikasi, respons terlambat dan layout; membutuhkan API dan Expo web aktif |
| `Morula: iOS bundle validation (not simulator)` | TypeScript, ekspor iOS/Hermes dalam mode API, dan 8 pemeriksaan artefak |
| `Morula: test all available (sequential)` | Java → basic → browser → iOS bundle, berurutan agar tidak menumpuk build berat |
| `Morula: verify persistence (restart project)` | Pengujian persistensi yang sengaja me-restart layanan proyek; jangan jalankan bersamaan dengan tes UI |

Untuk tes browser atau rangkaian lengkap, jalankan **Tasks: Run Task → Morula: Expo web API mode** terlebih dahulu **hanya bila port 8081 belum digunakan oleh Expo proyek ini**. Biarkan terminal Expo berjalan. Task tes tidak otomatis mematikan API setelah selesai. Task `backend ready (keep image)` memakai image lokal yang sudah dibangun; setelah perubahan backend gunakan `Morula: backend start` untuk rebuild.

Jangan jalankan task tes yang berbeda secara bersamaan: sebagian mengubah sementara checklist/preferensi sintetis. Data dikembalikan oleh tes yang relevan, tetapi receipt permintaan sintetis dapat tetap tersimpan. Emulator Android tidak termasuk rangkaian lengkap agar penggunaan RAM tetap terkendali.

Hasil terlihat di terminal task. TypeScript juga memasukkan error ke panel **Problems**. Ini integrasi **Tasks**, bukan penemuan otomatis tes melalui sidebar Testing. Tidak ada framework tes baru atau extension tambahan yang diperlukan untuk menjalankan task tersebut.

## Debug dengan F5

### Jika task APK berhenti dengan `UV_HANDLE_CLOSING`

Pesan `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` dan exit code
`-1073740791` berasal dari runtime Node.js Windows. Ada laporan upstream tentang
assertion ini pada shutdown setelah `fetch` ([Node.js #56645](https://github.com/nodejs/node/issues/56645)).
Crash yang dilaporkan pengguna belum berhasil direproduksi pada pemeriksaan lokal;
keterkaitan dengan `fetch` merupakan dugaan berdasarkan gejala dan jalur skrip.

Helper APK kini memakai `node:http` tanpa connection pooling untuk health check,
memiliki batas waktu, dan menampilkan pesan API tidak tersedia secara terkendali.
Node global dan APK tidak perlu diganti untuk memakai perubahan helper ini.
Jalankan ulang **Tasks: Run Task → Morula: APK open installed (API)**.
Task tersebut menunggu backend siap dan membuka aplikasi standalone tanpa Metro.

Tes helper: `node.exe --test scripts/local-api-health.test.mjs`.
Bukti peluncuran berulang: `docs/evidence/android-launcher-regression.json`.

### Pilihan debugger

Pilih konfigurasi dari **Run and Debug**:

- `Morula: debug HTTP verification`: breakpoint pada `scripts/verify-local.mjs`, memakai debugger JavaScript bawaan VS Code.
- `Morula: debug browser smoke (API)`: breakpoint pada `scripts/verify-web.py`, memakai extension Python/debugpy yang sudah terpasang dan interpreter tooling dengan Playwright. Expo web harus aktif.

Keduanya menunggu backend siap. Konfigurasi ini men-debug skrip pengujian; debugger aplikasi native iOS memerlukan perangkat/simulator iOS.

## Bukti dan batas pengujian iOS

`docs/evidence/vscode-test-run.json` mencatat exit code per perintah task yang diverifikasi dari root proyek. `current-web-smoke.json` mencatat pemeriksaan browser. Laporan Java berada di `backend/target/surefire-reports` dan `backend/target/failsafe-reports`.

Task iOS menulis `docs/evidence/current-ios-validation.json` dan `current-ios-export.log`, serta artefak yang diabaikan Git pada `mobile/dist-ios-test`. Laporan mencatat hash SHA-256, ukuran bundle, aset, versi dependency, dan status native `NOT_RUN`. Variabel API hanya ditetapkan untuk proses ekspor: `http://localhost:8080` dan autentikasi demo eksplisit. File environment lokal tidak diubah.

Ekspor memeriksa resolusi modul/transformasi platform iOS, bytecode Hermes, serta aset; ia tidak menguji UIKit, keyboard iOS, safe area, permission, ATS, gesture, maupun network dari iPhone. Bundle ini bukan IPA atau `.app` simulator.

Mesin saat ini Windows dan pengguna belum memiliki iPhone/Mac yang tersedia. Simulator Apple hanya berjalan pada macOS ([dokumentasi Expo](https://docs.expo.dev/workflow/ios-simulator/)). Alternatif remote EAS memerlukan akun/akses dan dapat dikenai biaya; sesi cloud tidak dibuat.

Langkah untuk melanjutkan tes native ketika perangkat tersedia: buka proyek pada **Mac dengan Xcode/iOS Simulator**, jalankan backend API pada Mac tersebut, pasang dependency dari lockfile, lalu dari `mobile` jalankan `npm run ios`. `localhost:8080` harus menunjuk API pada host Mac; jika API tetap di Windows, konfigurasi konektivitas API perlu disiapkan terlebih dahulu. Ulangi alur lima tab, checklist, detail embrio, formulir dengan keyboard, receipt tanpa perubahan jadwal resmi, assistant, dan preferensi. Jalur iPhone fisik memerlukan alamat API yang dapat dijangkau perangkat; konfigurasi localhost Windows saat ini belum sesuai untuk itu.
