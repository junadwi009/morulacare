# Morula Care — riset produk, alur pasien, dan keputusan klinis

**Tanggal verifikasi sumber:** 31 Oktober 2026 (Asia/Jakarta).  
**Status dokumen:** rekomendasi desain untuk dibahas dengan Morula; bukan SOP klinis yang telah disahkan.  
**Batas implementasi paket:** prototype memakai identitas dan data sintetis. Belum terhubung ke sistem rumah sakit, laboratorium, Qiscus, layanan notifikasi, ataupun LLM produksi.

## 1. Kesimpulan yang menentukan arah produk

Masalah utama pasien ialah ketidakpastian: apa status terbaru yang benar, apa yang perlu dilakukan berikutnya, dan siapa yang bisa dihubungi. Produk sebaiknya menjadi pendamping perjalanan perawatan dengan bukti sumber dan tindak lanjut yang jelas. Menambahkan banyak kartu statistik, estimasi keberhasilan, atau chatbot yang terlalu percaya diri justru memperbesar risiko salah pengertian.

**Keputusan utama:** status embrio ditampilkan sebagai hasil observasi yang sudah dirilis petugas berwenang. Aplikasi tidak menaikkan tahap embrio secara otomatis berdasarkan kalender dan tidak menyimpulkan keberhasilan dari jumlah, grading, gambar, atau hari kultur.

**[High confidence] Kebutuhan program beragam.** Situs Morula mencantumkan IVF, IUI, pemeriksaan kesuburan, transfer embrio fresh/beku, dan kriopreservasi. Karena itu perjalanan pasien perlu mengikuti program yang ditetapkan tim klinis. Satu timeline IVF yang dipaksakan ke semua pasien akan keliru. [S1]

**[High confidence] Identitas dan penelusuran siklus penting.** Pedoman ASRM membahas identitas unik pasien, identitas unik siklus, serta penelusuran gamet dan embrio. Implikasi desain kami adalah pemisahan patient ID, cycle ID, dan embryo ID, disertai riwayat perubahan; fitur aplikasi tidak menggantikan sistem witnessing laboratorium. [S2]

**[Medium confidence] Integrasi dapat memakai sistem yang telah dibahas pengguna.** TERAmedik dapat menjadi kandidat sumber appointment/kunjungan dan Qiscus kandidat komunikasi. Namun kontrak API, penanggung jawab sumber data embrio, pemetaan cabang, granularitas izin, serta kemampuan tulis/jadwal belum diperiksa langsung. Ini membutuhkan verifikasi sebelum pilot.

## 2. Empat pertanyaan yang harus dijawab Beranda

1. **Saya sedang berada di tahap apa?** Nama program dan tahap terakhir yang dikonfirmasi tim klinis; waktu pembaruan terlihat.
2. **Apa pembaruan terakhir saya?** Satu ringkasan penting dari hasil yang telah dirilis, bukan campuran promosi dan data klinis.
3. **Apa langkah berikutnya?** Janji terdekat atau tugas yang ditetapkan care team, dengan tanggal, zona waktu cabang, dan instruksi sumber.
4. **Siapa yang membantu?** Asisten administratif dengan jalur yang jelas menuju perawat, fertility advisor, atau contact center.

Kartu embrio hanya muncul bila relevan dengan program dan ada data yang boleh ditampilkan. Untuk pasien IUI, kartu tersebut diganti status program atau pemeriksaan. Pasien yang belum memiliki siklus aktif melihat ringkasan kunjungan dan petunjuk menautkan rekam medis. Tidak ada persentase “perjalanan menuju hamil”.

## 3. Struktur informasi yang disarankan

| Tab | Isi utama | Aksi yang tepat |
|---|---|---|
| Beranda | Tahap aktif, pembaruan dirilis, janji terdekat, tugas terdekat, bantuan | Membuka detail atau menuju tugas yang relevan |
| Perjalanan | Pilihan program/siklus, status fertilitas, embrio yang dirilis, riwayat perawatan | Memilih siklus, memfilter riwayat, membaca sumber |
| Janji | Janji mendatang dan riwayat, status dari sistem, lokasi, persiapan | Mengajukan perubahan; konfirmasi hanya dari sistem rumah sakit |
| Asisten | Percakapan, pertanyaan cepat, penjelasan administratif, handoff | Menanyakan data sendiri, membuat permintaan bantuan yang dikonfirmasi |
| Profil | Identitas terkait, cabang, privasi, perangkat/sesi, akses pasangan | Mengelola persetujuan dan bantuan koreksi identitas |

Notifikasi mempunyai kotak masuk tersendiri dari ikon Beranda. Jumlah badge berarti pembaruan belum dibaca, bukan masalah klinis yang belum diselesaikan. Edukasi ditempatkan kontekstual sesuai program, bukan tab promosi yang bersaing dengan informasi perawatan.

## 4. Alur masuk dan penautan pasien

### Alur produksi yang diusulkan

1. Pengguna memasukkan nomor kontak yang sudah diverifikasi atau memakai undangan dari klinik.
2. Sistem melakukan verifikasi identitas sesuai proses Morula, kemudian mencocokkan rekam medis di server.
3. Jika ditemukan lebih dari satu kandidat, proses ditahan untuk verifikasi petugas. Jangan memilih kandidat berdasarkan kesamaan nama.
4. Pengguna meninjau identitas dan cabang yang ditautkan, membaca pemberitahuan privasi, lalu mengatur notifikasi.
5. Akses klinis diberikan hanya setelah penautan selesai. Pengguna yang belum tertaut tetap dapat membaca edukasi umum dan meminta bantuan.
6. Biometrik perangkat dapat membuka kembali sesi lokal yang sudah sah; biometrik bukan bukti penautan rekam medis.

Nomor telepon dapat berubah, dipakai bersama, atau berpindah pemilik. Karena itu nomor telepon/Qiscus customer ID/WA ID tidak boleh menjadi patient ID kanonis. Nomor MR pun perlu ruang nama cabang jika tidak unik secara organisasi. Gunakan `patient_id` internal dan tabel penghubung `source_system + branch_id + source_patient_id`.

### Hak pasangan

- Setiap orang memiliki akun sendiri. Hubungan pasangan tidak otomatis memberikan seluruh rekam medis orang lain.
- Berbagi berdasarkan kategori: janji, ringkasan perjalanan, pembaruan tertentu; kategori sensitif mempunyai aturan terpisah.
- Persetujuan mencatat pemberi, penerima, lingkup, waktu berlaku, pencabutan, dan dasar pemrosesan yang disetujui organisasi.
- Pencabutan akses efektif pada request berikutnya; sesi lama tidak menyimpan hak yang sudah dicabut.
- Hasil genetik, analisis semen, catatan konseling, dan detail kesehatan individual tidak ikut terbuka hanya karena akun terhubung.
- Keputusan tentang embrio bersama dapat memiliki persetujuan dan aturan hukum khusus. Tim medis/legal Morula menentukan aturan tersebut; UI tidak menyederhanakannya menjadi toggle.

**Keputusan prototype:** partner sharing tetap nonaktif; toggle tidak menciptakan izin akses yang belum diimplementasikan.

## 5. Model perjalanan yang tidak bergantung pada satu skenario

| Program/kondisi | Tahapan yang dapat dikonfigurasi klinik | Perilaku UI |
|---|---|---|
| Pemeriksaan awal | Konsultasi → pemeriksaan → hasil dirilis → rencana tindak lanjut | Tidak menampilkan embrio atau prediksi peluang hamil |
| IUI | Rencana → pemantauan → tindakan → masa tunggu → evaluasi | Timeline khusus IUI; tanggal dan langkah mengikuti catatan klinis |
| IVF/ICSI | Rencana → stimulasi/pemantauan → pengambilan oosit → fertilisasi/kultur → transfer atau penyimpanan → evaluasi | Tahap klinis tidak bergerak hanya karena pergantian tanggal |
| FET | Pemilihan siklus asal → persiapan → warming/transfer bila dilakukan → evaluasi | Siklus transfer baru mengacu pada embrio/siklus asal; tidak membuat identitas embrio baru |
| Fertility preservation | Konsultasi → proses pengambilan → penyimpanan → tindak lanjut | Fokus pada inventaris yang dirilis dan komunikasi masa penyimpanan |
| Menunggu keputusan | Aktivitas terakhir tetap terlihat; next step menunggu konfirmasi | Tidak menampilkan countdown palsu atau status “terlambat” otomatis |
| Ditunda/dibatalkan | Alasan ringkas yang boleh dirilis, tindak lanjut, kontak | Reminder yang tidak lagi relevan dihentikan; riwayat dipertahankan |
| Hasil tidak sesuai harapan | Komunikasi tim klinis dan pilihan dukungan sesuai kebijakan | Bahasa netral, tanpa konfeti, streak, ranking, atau pesan promosi otomatis |
| Beberapa siklus | Siklus aktif dan arsip terpisah, embrio bisa terkait siklus asal berbeda | Semua angka dan timeline jelas ruang lingkupnya |

Nama tahap dalam tabel adalah rancangan umum, bukan instruksi medis. Morula harus mengesahkan nama tahap, transisi yang diperbolehkan, dan siapa yang berwenang mengubahnya.

## 6. Status embrio: struktur data dan cara merilis

### Yang berguna bagi pasien

- Label embrio yang stabil dan mudah dipahami, terkait program/siklus yang benar.
- Status terakhir yang sudah dirilis: misalnya hasil kultur, tersimpan, telah ditransfer, atau status lain sesuai terminologi klinik.
- Tanggal/waktu observasi, tanggal/waktu rilis, sumber unit, dan petugas/role yang merilis.
- Ringkasan bahasa pasien yang disetujui tim klinis, dengan penjelasan istilah yang terpisah dari hasil individual.
- Langkah berikutnya atau kontak untuk penjelasan; tidak selalu ada keputusan yang harus diambil pasien.
- Gambar asli hanya bila tersedia, boleh dirilis, dan identitasnya telah diperiksa. Gambar ilustrasi tidak disamarkan sebagai embrio pasien.

### Data internal yang diperlukan

`patient_id`, `cycle_id`, `embryo_id`, `source_system`, `source_record_id`, `source_version`, `observed_at`, `source_updated_at`, `received_at`, `reviewed_by`, `released_by`, `released_at`, `release_policy`, `status`, `supersedes_version`, `correction_reason`.

Jangan menampilkan lokasi tank/posisi penyimpanan rinci sebagai fitur umum pasien. Jangan menyamakan “tidak ada data” dengan “tidak ada embrio”, atau data yang belum dirilis dengan hasil negatif.

### Alur staff yang direkomendasikan

1. Hasil masuk dari sistem laboratorium, melalui API atau input petugas yang diberi kewenangan.
2. Data melewati pemeriksaan identitas, siklus, format, versi, dan konsistensi jumlah/status.
3. Hasil berstatus draft tidak tersedia untuk aplikasi pasien ataupun chatbot.
4. Petugas berwenang meninjau ringkasan dan menentukan apakah hasil dapat dirilis langsung atau membutuhkan komunikasi klinis terlebih dahulu.
5. Rilis menghasilkan snapshot versi tetap dan audit event. Queue notifikasi menerima event setelah transaksi berhasil.
6. Koreksi membuat versi pengganti dengan alasan; pengguna tidak melihat fakta historis dihapus diam-diam.

Pemisahan draft/reviewed/released/corrected adalah rekomendasi desain. ASRM mendukung prinsip identitas dan traceability, tetapi tidak menetapkan flow portal pasien ini. [S2]

### Hasil sensitif atau tidak sesuai harapan

Tim klinis perlu menetapkan kriteria hasil yang memerlukan komunikasi langsung, waktu tanggapan, petugas pengganti, serta kondisi eskalasi bila belum berhasil menghubungi pasien. Hindari penahanan tanpa batas dan hindari mengirim detail buruk melalui notifikasi umum. Setelah kebijakan rilis terpenuhi, hasil tetap dapat dibaca pasien dengan akses yang sah. Jangan mengklaim bahwa semua hasil negatif harus disembunyikan; itu keputusan klinis dan kebijakan akses yang perlu disahkan.

## 7. Riwayat dan aktivitas perawatan

Riwayat harus menjawab “apa yang sudah benar-benar terjadi?”, sedangkan rencana menjawab “apa yang diharapkan berikutnya?”. Keduanya boleh muncul pada timeline yang sama dengan label berbeda, tetapi status appointment `completed` tidak otomatis membuktikan suatu tindakan klinis tertentu sudah dilakukan.

Setiap item mencatat kategori, tanggal tindakan, dokter/unit, cabang, status, ringkasan yang dirilis, instruksi yang masih berlaku, lampiran yang boleh diakses, dan sumber. Gunakan filter konsultasi/laboratorium/tindakan/perawatan, serta pilihan siklus. Ringkasan aktivitas terakhir di Beranda diambil dari event klinis yang benar, bukan record yang terakhir diimpor.

Pasien dapat menandai instruksi telah dibaca atau tugas telah dilakukan. Tanda tersebut adalah laporan pengguna, bukan bukti pemberian obat atau pelaksanaan tindakan. Perubahan instruksi oleh petugas harus membatalkan tugas versi lama dan menjelaskan instruksi yang menggantikannya.

## 8. Appointment: sumber tetap sistem rumah sakit

### MVP

Tampilkan janji mendatang dan riwayat dari sistem, termasuk dikonfirmasi, selesai, dibatalkan, dijadwal ulang, dan tidak hadir. Tampilkan cabang, zona waktu, lokasi, dokter, tujuan, persiapan yang disahkan, dan waktu sinkronisasi. Jangan menebak status “tidak hadir” hanya dari jam yang sudah lewat.

Permintaan ubah jadwal adalah entitas berbeda dari appointment. Statusnya: dibuat → diterima → sedang diproses → disetujui/ditolak/dibatalkan. Appointment lama tetap berlaku sampai ada konfirmasi dari sumber, kecuali kebijakan klinik menyatakan lain. UI harus mengatakan “Permintaan diterima”, bukan “Jadwal berubah”.

### Berikutnya

Booking slot langsung baru layak ketika API sumber mendukung ketersediaan terkini, reservasi/konfirmasi, konflik, dan pembatalan. Kalender UI tanpa kendali kapasitas di backend bukan booking yang dapat diandalkan. Tidak perlu payment gateway untuk alur ini. Informasi biaya, jika nanti ditambahkan, harus berasal dari sumber resmi dan dipisahkan dari status pembayaran yang tidak tersedia.

## 9. Peta sumber data

| Domain | Kandidat pemilik data | Tugas Morula Care | Yang harus diverifikasi |
|---|---|---|---|
| Identitas/MR/cabang | Master patient index/SIMRS/TERAmedik | Penautan identitas dan otorisasi | Keunikan MR lintas cabang, merge/split pasien, perubahan kontak |
| Appointment/kunjungan | Sistem jadwal/SIMRS | Proyeksi baca dan permintaan perubahan | Endpoint, status, nomor versi, cancelled/rescheduled, zona waktu |
| Embrio/kriopreservasi | Sistem laboratorium embriologi | Menampilkan snapshot yang dirilis | ID embrio, siklus, API/input, petugas rilis, koreksi |
| Riwayat/instruksi | RME/care team | Ringkasan yang diizinkan | Hak akses, lampiran, koreksi, pemisahan rencana vs kejadian |
| Percakapan/staff queue | Qiscus atau kanal resmi lain | Handoff, status permintaan | Entitlement, custom channel/SDK, room/session mapping, delivery receipt |
| Edukasi | Tim medis + CMS/knowledge base | Menyajikan konten yang disetujui | Owner, versi, tanggal review, cabang/program terkait |
| Notifikasi | Service aplikasi | Mengirim pesan generik dan deep link | Izin, token perangkat, retry, pembatalan, audit |
| Preferensi/persetujuan | Service identitas/consent | Menegakkan lingkup akses | Dasar pemrosesan, versi persetujuan, pencabutan |

Belum ada bukti bahwa semua data tersebut berada dalam TERAmedik. Jangan membuat query langsung ke database produksi berdasarkan dugaan nama tabel. Rancang adapter yang dapat diganti setelah kontrak sumber disepakati.

## 10. Chatbot: empat tingkat kemampuan

| Tingkat | Kemampuan | Sumber | Tindakan jika tidak cukup |
|---|---|---|---|
| Informasi umum | Jam layanan, lokasi, istilah program, cara memakai aplikasi | Knowledge base yang disahkan dan memiliki versi | Mengaku belum tahu dan menawarkan staf |
| Data personal | Membacakan janji, aktivitas terakhir, hasil yang telah dirilis | Tool API yang diberi scope identitas pengguna | Menyebut data belum tersedia/delayed; tidak mengarang |
| Administratif | Membuat permintaan ubah jadwal/hubungi perawat | Command API dengan validasi dan idempotency | Meminta konfirmasi tindakan serta menampilkan status sebenarnya |
| Medis individual | Pertanyaan diagnosis, prognosis, perubahan dosis, interpretasi hasil | Tim klinis yang berwenang | Handoff; tidak menjadikan LLM penentu tindakan |

Chatbot harus menampilkan asal informasi dan waktu pembaruan saat memakai data pasien. Pertanyaan “berapa embrio saya?” dijawab dari hasil dirilis pada siklus yang jelas. Pertanyaan “embrio saya bagus atau jelek?” tidak dijawab dengan skor buatan. Bila pasien menyebut kondisi yang bisa gawat, jawaban memprioritaskan bantuan darurat dan tidak meminta menunggu balasan bot.

### Rancangan backend chatbot produksi

Autentikasi → pemeriksaan lingkup akses → klasifikasi permintaan → pemanggilan tool/KB terbatas → validasi hasil → jawaban dengan sumber → audit minimum. Authorization berada di server, bukan di prompt. Tool mengambil patient ID dari identitas autentikasi, bukan dari teks pengguna atau keluaran model. Tool tulis memerlukan schema ketat dan konfirmasi pengguna.

Prompt injection pada chat, dokumen KB, atau catatan sumber tidak boleh mengubah scope akses. Log tidak menyimpan seluruh isi medis tanpa kebutuhan dan kebijakan retensi. Jika memakai provider LLM, cek perjanjian pemrosesan, lokasi pengolahan, retensi, penggunaan data untuk training, dan batas metadata yang dikirim. Alternatif self-hosted tidak otomatis aman; akses dan operasional tetap harus dikendalikan.

**Keputusan prototype:** chatbot berbasis aturan dan data sintetis. Ini berguna untuk menguji percakapan serta handoff tanpa biaya/integrasi LLM, tetapi bukan bukti kualitas chatbot medis produksi.

## 11. Automasi yang benar-benar berguna

| Pemicu | Automasi | Pengaman wajib |
|---|---|---|
| Appointment dikonfirmasi | Reminder pada waktu yang disepakati klinik | Ambil versi terbaru sebelum kirim; timezone cabang; batalkan versi jadwal lama |
| Hasil embrio dirilis | Kotak masuk dan push generik “Ada pembaruan perawatan” | Hanya event released; tidak memasukkan hasil ke payload push |
| Instruksi perawatan berubah | Perbarui tugas dan beri tahu pengguna | Versi lama dinonaktifkan; sumber/perubahan terlihat |
| Permintaan bantuan diterima | Routing ke tim/cabang yang tepat | Tidak mengaku petugas telah membaca; waktu layanan dan eskalasi terlihat |
| Tugas belum ditandai | Pengingat ringan jika sesuai kebijakan | Bukan diagnosis ketidakpatuhan; ada opsi jeda/pengaturan |
| Sinkronisasi sumber terlambat | Alert operasional ke petugas | Pasien melihat freshness; aplikasi tidak menyajikan data lama sebagai real-time |
| Siklus ditunda/dihentikan | Hentikan reminder yang tidak relevan | Jangan otomatis mengirim promosi program baru |
| Jangka penyimpanan perlu ditinjau | Pengingat administratif sesuai kebijakan | Tidak menyimpulkan hak disposisi; tidak mengeksekusi pemusnahan/perpanjangan otomatis |

### Mekanisme andal

- Gunakan event ID sumber dan idempotency key yang memiliki scope pasien/jenis aksi/versi untuk mencegah duplikasi.
- Simpan outbox pada transaksi yang sama dengan perubahan; worker memproses retry dengan batas dan dead-letter queue.
- Terapkan status queued/sent/delivered/failed/suppressed terpisah. `sent` tidak sama dengan dibaca atau ditindaklanjuti.
- Event tidak berurutan dibandingkan menggunakan source version, bukan hanya urutan kedatangan webhook.
- Sebelum mengirim reminder, validasi appointment masih aktif, waktu masih relevan, persetujuan berlaku, dan versi belum diganti.
- Simpan timestamp UTC; tampilkan sesuai IANA timezone cabang, seperti Asia/Jakarta atau Asia/Makassar. Jangan menganggap seluruh Indonesia WIB.
- Token push adalah identitas perangkat yang dapat kedaluwarsa, bukan identitas pasien.
- Push hanya wake-up hint; ketika dibuka aplikasi meminta data terbaru melalui API berotorisasi.
- Gunakan rekonsiliasi terjadwal selain webhook agar event hilang tidak menyebabkan data diam-diam tertinggal.

### Catatan Qiscus

**[High confidence]** Qiscus mendokumentasikan integrasi CRM melalui API/webhook dan layanan perantara. Halaman bantuan yang diperiksa menyebut persyaratan entitlement Enterprise untuk webhook/API tertentu; perlu konfirmasi kemampuan yang benar-benar aktif pada akun Morula, terutama custom channel, SDK, dan flow bot/staff. Keberhasilan GET pada sesi sebelumnya tidak membuktikan semua fitur tersedia. [S3]

**[High confidence]** New Session webhook dijelaskan sebagai kejadian saat pesan pertama pelanggan atau pesan baru setelah room sebelumnya resolved. Itu bukan event untuk setiap pesan dan bukan bukti semua sesi lama lengkap. Pisahkan room ID, session ID, message ID, dan customer ID, serta verifikasi perilaku `is_sessional` dan mark-as-resolved pada konfigurasi akun. [S4]

## 12. Perlindungan data yang berdampak langsung pada desain

**[High confidence]** UU 27/2022 menggolongkan data/informasi kesehatan dan data genetika sebagai data pribadi spesifik. PMK 24/2022 mengatur prinsip kerahasiaan, integritas, ketersediaan RME, serta hak akses yang ditetapkan sesuai kebijakan fasilitas. Ini mendukung kebutuhan desain akses terbatas dan audit; pilihan implementasi berikut adalah rekomendasi teknik, bukan pernyataan telah memenuhi seluruh kewajiban hukum. [S5][S6]

Rekomendasi produksi:

- Login menggunakan layanan identitas yang sesuai; token pendek, refresh terkontrol, pencabutan sesi dan perangkat.
- Enkripsi transport dan data tersimpan; secret berada di backend, tidak dalam bundle mobile.
- Scope pasien, cabang, peran petugas, dan kategori data ditegakkan pada setiap request.
- Audit akses, rilis, koreksi, perubahan consent, dan tindakan administratif tanpa mengumbar isi sensitif pada log umum.
- Notifikasi layar terkunci generik; tidak menyebut embrio, diagnosis, hasil, nama dokter, atau jadwal sensitif bila mode privasi aktif.
- Analytics produk tidak merekam isi chat/hasil kesehatan, nomor MR, atau layar melalui session replay pihak ketiga.
- Retensi ditentukan per jenis data. Hapus akun aplikasi tidak boleh diam-diam menghapus rekam medis yang tunduk kewajiban retensi.
- Informasi layanan dan persetujuan marketing dipisahkan. Data hasil klinis tidak dikirim sebagai parameter audience iklan.
- Data offline produksi perlu rancangan enkripsi, retensi, logout purge, dan kebijakan screenshot/background view. Prototype memilih data dalam memori tanpa penyimpanan lokal permanen.
- Keputusan vendor/cloud lintas negara, kewajiban PSE/SATUSEHAT, permintaan akses/koreksi, dan SOP insiden harus ditinjau bersama tim legal, rekam medis, keamanan, dan klinis sebelum pasien nyata masuk.

## 13. Prioritas implementasi

### Wajib untuk pilot pasien nyata

1. Penautan identitas dan authorization yang diuji lintas pasien/cabang.
2. Sumber appointment dan riwayat yang dapat direkonsiliasi, termasuk cancel/reschedule.
3. Hasil embrio hanya dari proses rilis yang disahkan, dengan versi dan audit.
4. Staff workflow untuk review hasil, permintaan pasien, dan kegagalan integrasi.
5. Notifikasi generik, preferensi, dan pembatalan reminder.
6. Chatbot administratif/KB yang memiliki jalur handoff terukur.
7. Pemulihan data, pemantauan integrasi, runbook insiden, dan uji akses perangkat nyata.

### Setelah fondasi berjalan

Pembagian akses pasangan per kategori, pengingat obat dari instruksi terverifikasi, unggah dokumen administratif, queue status yang benar-benar tersedia, booking slot langsung, ringkasan pascakunjungan yang ditinjau klinis, serta pengalaman multi-bahasa.

### Hindari pada fase awal

Prediksi kehamilan individual, rating embrio oleh AI, live video embrio tanpa infrastruktur/izin, chatbot pemberi dosis, unggah seluruh RME ke provider AI secara default, gamifikasi keberhasilan, dan marketplace/promosi yang menyusup ke pesan hasil perawatan.

## 14. Penerimaan yang harus diuji sebelum pilot

| Skenario | Hasil yang wajib |
|---|---|
| Pengguna A mencoba ID appointment/embrio milik B | Ditolak tanpa membocorkan apakah objek B ada |
| Akun belum selesai ditautkan | Tidak mendapatkan data klinis |
| Nomor telepon sama pada dua record | Tidak memilih pasien otomatis |
| Hasil embryo draft masuk | Tidak tersedia pada API pasien, overview, chatbot, push, atau export |
| Hasil dikoreksi | Versi baru terlihat, histori rilis tetap dapat diaudit, hitungan konsisten |
| Permintaan ubah jadwal dikirim ulang | Satu permintaan; key sama dengan payload berbeda ditolak |
| Appointment rescheduled setelah reminder queued | Reminder versi lama suppressed; versi baru memakai waktu yang benar |
| Source tidak tersedia | Status delayed/unavailable terlihat; tidak mengganti data dengan demo |
| Event sumber dikirim dua kali/terbalik | Tidak menggandakan data dan tidak menimpa versi baru dengan lama |
| IUI tanpa embrio | Menampilkan status IUI, bukan “0 embrio” sebagai hasil klinis |
| Siklus dibatalkan | Riwayat dipertahankan; tugas tidak relevan dinonaktifkan |
| Pasangan kehilangan izin | Akses berikutnya ditolak, cache sensitif dibersihkan sesuai kebijakan |
| Pertanyaan chatbot tentang dosis/prognosis | Tidak memberi keputusan medis; menawarkan kanal klinis |
| Kalimat darurat | Prioritas bantuan segera, tidak menjanjikan petugas segera membalas |
| Notifikasi muncul di layar terkunci | Isi generik; data diambil kembali setelah autentikasi |
| Permintaan bantuan dibuat | Status nyata terlihat; tidak mengaku sudah terkirim ke Qiscus jika adapter gagal |
| Janji cabang berbeda zona waktu | Tampilan waktu benar dan tidak berubah hanya karena timezone perangkat |
| Pengguna logout/perangkat hilang | Token dicabut sesuai rancangan dan data lokal dibersihkan |

## 15. Ukuran keberhasilan pilot

Ukur apakah pasien berhasil menemukan pembaruan terakhir, memahami langkah berikutnya, serta memperoleh respons yang tepat. Metrik operasional yang disarankan: keterlambatan sinkronisasi per sumber, durasi review-ke-rilis, proporsi permintaan yang mendapat respons sesuai target lokal, kegagalan/duplikasi reminder, error penautan identitas, dan pertanyaan chatbot yang perlu staf. Angka target ditetapkan sesudah baseline nyata tersedia; dokumen ini tidak mengarang persentase peningkatan.

Jangan memakai tingkat kehamilan sebagai KPI performa aplikasi. Keberhasilan klinis memiliki faktor dan definisi yang jauh melampaui penggunaan aplikasi. Jumlah sesi/chat juga bukan tujuan jika pasien masih bingung.

## 16. Pertanyaan keputusan untuk workshop Morula

1. Sistem mana yang saat ini memiliki data embrio final, dan siapa pemilik proses rilis ke pasien?
2. Apakah patient ID/MR unik lintas cabang? Apa daftar branch code kanonis yang benar?
3. Endpoint mana untuk appointment, riwayat, cancel/reschedule, incremental update, dan attachment?
4. Bisakah klinik menyediakan sandbox anonim serta contoh perubahan/koreksi, bukan hanya data sukses?
5. Hasil apa yang membutuhkan komunikasi sebelum rilis, dan siapa backup petugasnya?
6. Siapa yang menangani chat per cabang, pada jam apa, dan bagaimana eskalasi di luar jam kerja?
7. Fitur Qiscus mana yang diaktifkan dalam kontrak akun, termasuk SDK/custom channel dan webhook?
8. Lingkup akses pasangan, consent, retensi, vendor AI, dan cloud apa yang disetujui organisasi?
9. Apakah fase pertama hanya menampilkan appointment, atau termasuk permintaan ubah jadwal?
10. Cabang dan kelompok pasien mana yang cocok untuk pilot terbatas setelah semua pengaman utama lolos?

## Sumber yang benar-benar diperiksa

- **[S1] Morula IVF, Produk & Layanan.** https://www.morulaivf.co.id/layanan/ — jenis layanan. Halaman prosedur IVF juga dibaca: https://www.morulaivf.co.id/id/layanan/ivf-bayi-tabung/. Tidak dipakai sebagai sumber klaim tingkat keberhasilan.
- **[S2] ASRM, Witnessing and protocol deviations in the in vitro fertilization and andrology laboratory: a committee opinion (2026).** https://www.asrm.org/practice-guidance/practice-committee-documents/witnessing-and-protocol-deviations-in-the-in-vitro-fertilization-and-andrology-laboratory-a-committee-opinion/ — identitas, cycle identifier, traceability, dokumentasi. Pedoman ini berasal dari organisasi profesi luar Indonesia, bukan hukum Indonesia atau SOP Morula.
- **[S3] Qiscus Help Center, CRM Integration, diperbarui 30 September 2025.** https://support.qiscus.com/hc/en-us/articles/1732590970508-CRM-Integration — integrasi melalui layanan perantara serta catatan entitlement API/webhook. Ketentuan akun Morula tetap harus dikonfirmasi.
- **[S4] Qiscus Help Center, New Session Webhook to Trigger External Services at Conversation Started, 26 November 2024.** https://support.qiscus.com/hc/en-us/articles/13810175913113-New-Session-Webhook-to-Trigger-External-Services-at-Conversation-Started — definisi pemicu sesi baru.
- **[S5] JDIH Kemkomdigi, UU Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.** https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/ — kategori data pribadi spesifik; sumber resmi teks hukum. Metadata pendamping: https://peraturan.bpk.go.id/Details/229798/uu-no-27-.
- **[S6] JDIH Kementerian Kesehatan, Permenkes Nomor 24 Tahun 2022 tentang Rekam Medis.** https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-24-tahun-2022 ; teks PDF https://jdih.kemkes.go.id/storage/documents/pdfs/2022permenkes024.pdf — khususnya Pasal 29–32. Halaman JDIH menandai status Berlaku saat diperiksa.
- **Sumber tambahan:** ESHRE, The Revised guidelines for good practice in IVF laboratories (2026), https://www.eshre.eu/Guidelines-and-Legal/Guidelines/Revised-guidelines-for-good-practice-in-IVF-laboratories — cakupan identitas dan traceability; tidak digunakan untuk menetapkan jadwal klinis individual.

Tautan adalah sumber publik. Dokumen ini tidak memuat atau mengambil rekam medis pasien nyata.
