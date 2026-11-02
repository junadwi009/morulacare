# Morula Care
## Product blueprint, patient flow, and implementation foundation

**Versi 0.1 | 31 Oktober 2026 | Bahasa Indonesia**

Nama Morula Care dan desain pada paket ini adalah konsep kerja. Semua identitas, hasil embrio, riwayat, dan jadwal contoh merupakan data sintetis. Dokumen ini membedakan rekomendasi produk, fakta publik yang diverifikasi, dan kemampuan prototype. Tidak ada data pasien Morula yang diambil untuk pembuatannya.

## 1. Keputusan utama

Bangun aplikasi pendamping perjalanan fertilitas dengan React Native untuk Android/iOS dan Java Spring Boot sebagai backend. Mulai dari informasi pasien yang sudah diverifikasi: tahap program, pembaruan embrio yang sudah dirilis, perawatan terakhir, jadwal resmi, dan bantuan terarah. Integrasi klinis merupakan pusat produk ini; chatbot mendukung akses dan komunikasi.

Risiko terbesar adalah menampilkan informasi milik pasien yang salah atau hasil laboratorium yang belum layak dipublikasikan. Karena itu, identitas, izin akses, sumber data, dan proses rilis menjadi bagian dari MVP. Tampilan modern saja belum menghasilkan aplikasi rumah sakit yang aman untuk operasional.

Tiga pertanyaan utama pada beranda:

1. **Posisi saya sekarang:** program, episode/siklus yang aktif, dan pembaruan terakhir yang sah.
2. **Apa yang sudah dilakukan:** konsultasi, pemeriksaan, tindakan, serta instruksi yang sudah disahkan.
3. **Apa langkah berikutnya:** jadwal, persiapan yang berasal dari tim klinik, dan cara menghubungi petugas.

**[High confidence]** React Native cocok untuk satu basis kode UI Android/iOS; Java ditempatkan di backend bersama integrasi dan aturan akses. Dokumentasi React Native merekomendasikan penggunaan framework seperti Expo untuk aplikasi baru [S4]. Dukungan platform pada source code tidak sama dengan APK/IPA yang telah ditandatangani atau diuji pada perangkat.

**[Medium confidence]** Susunan flow dan prioritas dalam dokumen ini adalah rekomendasi berdasarkan kebutuhan yang diberikan serta layanan publik Morula, bukan SOP internal yang sudah disetujui. Morula memublikasikan layanan pemeriksaan fertilitas, IUI, IVF, dan transfer embrio; model produk perlu mengakomodasi variasi tersebut [S1][S2].

**[Low confidence]** Kesiapan API internal TERA, sistem embriologi, identitas pasien lintas cabang, dan koneksi Qiscus ke mobile belum dapat ditentukan dari informasi publik. This needs verification. Aplikasi demo tidak mengklaim integrasi tersebut sudah aktif.

## 2. Tujuan, ruang lingkup, dan asumsi

Tujuan produk adalah mengurangi ketidakjelasan informasi selama perawatan, memudahkan akses ke pembaruan yang sah, dan menurunkan pekerjaan administratif berulang tanpa memindahkan keputusan medis kepada sistem otomatis.

Target pengguna utama adalah pasien yang sudah tercatat dalam sistem rumah sakit. Calon pasien dapat memperoleh edukasi umum dan informasi cabang dalam fase berikutnya, tetapi tidak memperoleh akses ke rekam medis hanya karena berhasil memverifikasi nomor telepon.

Asumsi awal untuk pilot:

- Bahasa Indonesia sebagai bahasa utama; struktur konten disiapkan untuk bahasa tambahan.
- Satu cabang sebagai pilot sebelum perluasan lintas cabang. Kode cabang demo bukan master kode TERA.
- Nomor RM hanya salah satu identitas sumber, bukan password dan bukan primary key global.
- Appointment ditampilkan dari sistem yang ditetapkan rumah sakit sebagai sumber otoritatif.
- Tidak ada payment gateway, pembayaran, atau konfirmasi pembayaran di aplikasi ini.
- Tim klinik menetapkan siapa yang boleh merilis hasil, kategori hasil sensitif, jam layanan, dan prosedur eskalasi.
- Pengiriman notifikasi, Qiscus, OIDC, serta integrasi laboratorium adalah pekerjaan integrasi lanjutan; prototype memakai simulasi yang ditandai jelas.

## 3. Peran dan kepemilikan informasi

| Peran | Kebutuhan utama | Batas akses yang direncanakan |
|---|---|---|
| Pasien | Perjalanan, hasil yang dirilis, janji, riwayat, bantuan | Hanya data dengan hak akses pasien tersebut |
| Pasangan | Mendampingi proses dan melihat informasi bersama | Akun sendiri; akses per kategori dan episode sesuai dasar kewenangan/persetujuan yang berlaku |
| Perawat / care coordinator | Menjawab pertanyaan, menindaklanjuti permintaan, memantau antrean | Pasien yang menjadi lingkup tugas; tidak bebas mengubah hasil embriologi |
| Embriolog | Verifikasi dan rilis pembaruan embrio | Kewenangan laboratorium; riwayat revisi harus tetap terlacak |
| Dokter | Keputusan, penjelasan hasil, rencana tindak lanjut | Hak klinis sesuai penugasan dan SOP |
| Front office | Identitas administratif dan appointment | Tidak otomatis memperoleh seluruh hasil reproduksi/genetik |
| IT / integration operator | Menjaga sinkronisasi dan menangani error | Metadata operasional minimum; akses isi medis dibatasi dan diaudit |

Pasangan tidak boleh menggunakan satu akun bersama. Hubungan pasangan, kepemilikan informasi reproduksi bersama, dan hak masing-masing pihak harus dipetakan secara eksplisit. Persetujuan membagikan data bukan pengganti penilaian hak akses yang berlaku pada objek klinis tertentu.

Pencabutan akses pasangan menghentikan akses berikutnya, mencabut sesi/tautan yang relevan, dan membatalkan automasi untuk penerima tersebut. Pencabutan tidak menghapus rekam medis sumber atau menjanjikan penarikan salinan yang sudah diterima sebelumnya.

## 4. Peta navigasi pasien

| Menu | Isi utama | Aksi dominan |
|---|---|---|
| Beranda | Tahap program, langkah berikutnya, appointment terdekat, perawatan terbaru, status sinkronisasi | Buka informasi yang perlu ditindaklanjuti |
| Perjalanan | Pemilih episode/siklus, tahapan, pembaruan embrio, riwayat perawatan | Baca detail hasil atau aktivitas |
| Janji | Mendatang, riwayat, pembatalan/perubahan, persiapan | Lihat jadwal resmi; ajukan permintaan perubahan |
| Asisten | Pertanyaan operasional, ringkasan data yang tersedia, edukasi disetujui, eskalasi | Dapatkan jawaban bersumber atau bantuan petugas |
| Profil | Identitas terhubung, cabang, privasi, notifikasi, perangkat/sesi | Kelola preferensi dan akses |

Notifikasi berada pada ikon tersendiri; daftar hasil yang belum dibaca tidak menambah menu bawah. Detail dapat dibuka sebagai layar atau modal dengan konteks kembali yang jelas. Gunakan lima tab agar pasien tidak perlu menelusuri struktur rumah sakit untuk menemukan informasi pribadinya.

## 5. Flow onboarding dan verifikasi pasien

### 5.1 Pasien lama

Pasien membuka aplikasi, menerima penjelasan singkat, dan masuk menggunakan metode autentikasi yang disetujui. Setelah verifikasi nomor telepon atau identitas akun, backend mencocokkan akun dengan identitas pasien yang sudah diverifikasi rumah sakit. Jika pencocokan ambigu, tampilkan status menunggu verifikasi dan tugas untuk petugas. Jangan membuka rekam medis dengan kombinasi nomor telepon, tanggal lahir, atau RM tanpa mekanisme pembuktian yang memadai.

Setelah tautan identitas sah, pasien melihat cabang dan episode yang tersedia. Ia memilih preferensi privasi notifikasi serta kanal komunikasi, lalu masuk ke beranda. Permintaan izin push diberikan saat manfaatnya jelas. Penolakan push tidak menutup akses perawatan di aplikasi.

### 5.2 Pasien baru

Pasien yang belum memiliki identitas terverifikasi dapat mengakses informasi umum dan mengajukan kontak/appointment sesuai proses rumah sakit. Statusnya tetap prospek atau calon pasien. Hasil klinis tidak muncul sebelum registrasi dan tautan identitas selesai.

### 5.3 Nomor telepon berubah atau perangkat hilang

Sediakan pemulihan melalui petugas dan pencabutan sesi perangkat. Verifikasi kepemilikan nomor yang baru tidak otomatis memindahkan rekam medis. Lakukan pemeriksaan tambahan pada perubahan identitas berisiko dan catat siapa yang memutuskan pemindahan tautan.

### 5.4 Data lintas cabang

Gunakan identitas internal aplikasi yang stabil dan tabel pemetaan ke setiap sumber: `source_system + branch_code + external_patient_id`. RM yang sama di dua cabang tidak otomatis berarti orang yang sama. Konflik identitas masuk antrean rekonsiliasi; jangan melakukan fuzzy merge otomatis berdasarkan nama.

## 6. Flow program fertilitas

### 6.1 Satu pasien dapat memiliki lebih dari satu episode

Simpan program dan episode sebagai objek berbeda. Pemeriksaan awal, IUI, stimulasi/OPU, dan transfer embrio beku tidak selalu menjadi satu siklus linear. Transfer dapat menggunakan embrio dari pengambilan sebelumnya. Hubungkan episode transfer dengan embrio asal tanpa mengganti identitas embrio.

Pilihan episode pada aplikasi memperjelas program yang sedang dilihat. Jika ada beberapa episode relevan, beranda menampilkan episode yang dipilih dan jalur untuk beralih; jangan menghitung satu status umum dari semua perawatan sepanjang hidup pasien.

| Jenis perjalanan | Contoh tahap yang dapat digunakan | Aturan UI |
|---|---|---|
| Assessment fertilitas | Konsultasi, pemeriksaan, hasil dirilis, pembahasan rencana | Tidak menampilkan bagian embrio sebagai hasil kosong |
| IUI | Persiapan, pemantauan, tindakan, masa tunggu, tindak lanjut | Tidak meniru tahapan kultur embrio |
| IVF / ICSI | Persiapan, stimulasi, pengambilan, laboratorium, keputusan berikutnya | Kemajuan berdasarkan event terverifikasi |
| Transfer embrio beku | Persiapan, evaluasi, transfer bila dilakukan, tindak lanjut | Terhubung dengan embrio asal dan episode transfer |
| Penyimpanan | Embrio tersimpan, evaluasi/administrasi penyimpanan | Tidak otomatis dianggap program aktif menuju transfer |
| Ditunda / dibatalkan | Alasan yang boleh ditampilkan, tindak lanjut, kontak | Batalkan pengingat yang tidak lagi relevan |
| Hasil belum sesuai harapan | Penjelasan yang sudah dirilis dan opsi dukungan | Hindari ucapan selamat, streak, dan promosi otomatis |

Tahapan di atas adalah rancangan produk, bukan protokol medis. Nama tahap, syarat perpindahan, dan informasi yang dapat ditampilkan ditetapkan tim klinik sebelum pilot.

### 6.2 Bahasa status

Bedakan status klinis dari status kelengkapan data. “Belum dirilis”, “belum tersinkron”, “tidak dilakukan”, dan “tidak berlaku untuk program ini” mempunyai arti berbeda. Nilai yang belum tersedia tidak boleh diganti nol. Tahap mendatang berarti rencana atau kemungkinan yang ditetapkan klinik, bukan janji bahwa tindakan akan dilakukan.

Hindari persentase “program selesai 70%”, skor keberhasilan individual, animasi pertumbuhan embrio yang bergerak otomatis, dan hitungan mundur yang menyiratkan hasil pasti. Beri informasi konkret: pembaruan terakhir, tahap yang tercatat, siapa yang merilis, dan langkah yang sudah ditetapkan.

## 7. Status embrio dan hasil klinis

### 7.1 Kartu pembaruan

Setiap hasil yang ditampilkan harus memiliki kode embrio yang layak dibuka ke pasien, keterkaitan episode, tahap/keadaan terakhir yang dirilis, waktu observasi, waktu rilis, sumber, dan identitas/peran pihak yang merilis. Ringkasan awam mengikuti istilah yang disetujui klinik. Detail internal lokasi penyimpanan dan identitas teknis laboratorium tidak perlu dipublikasikan.

Contoh struktur tampilan: **Embrio E-01 / status yang dirilis / observasi 28 Okt / dirilis tim laboratorium / penjelasan / langkah berikutnya bila sudah ditetapkan**. Angka jumlah, grade, foto, atau video hanya muncul jika tersedia, valid, dan disetujui untuk pasien; gambar generatif tidak boleh dipakai sebagai foto embrio pasien.

### 7.2 Proses rilis

1. Sistem sumber menerima atau mencatat observasi.
2. Identitas pasien, episode, dan objek embrio diperiksa.
3. Tim berwenang memverifikasi isi.
4. Aturan rilis menentukan apakah dapat langsung dibuka, perlu penjelasan petugas, atau ditahan untuk koreksi.
5. Backend membentuk snapshot yang boleh dilihat pasien.
6. Notifikasi netral dibuat setelah transaksi rilis berhasil.
7. Pasien membuka detail melalui autentikasi; akses dan versi tercatat.

Rancangan status internal: `draft -> verified -> released`, dengan `amended` dan `withdrawn` sebagai perubahan terkontrol. Rilis ulang tidak menghapus versi sebelumnya. Antarmuka menandai koreksi dan menampilkan keterangan yang telah disetujui, bukan mengganti angka diam-diam.

**[High confidence untuk prinsip identifikasi, Medium confidence untuk desain rilis]** Pedoman ASRM membahas identifikasi unik dan pelacakan proses laboratorium [S7]. Snapshot rilis serta struktur workflow di atas adalah implikasi desain yang direkomendasikan, bukan kutipan SOP Morula.

### 7.3 Kondisi yang harus dirancang sejak awal

- Hasil tersedia di sistem sumber, tetapi belum dirilis untuk pasien.
- Sumber terlambat atau sedang tidak tersedia.
- Koreksi jumlah atau status setelah publikasi.
- Embrio berpindah keadaan: dikultur, disimpan, dicairkan, ditransfer, atau keadaan lain yang diizinkan SOP.
- Transfer menggunakan embrio dari episode lama.
- Pasien berpindah cabang atau rujukan.
- Tindakan dibatalkan atau program dihentikan.
- Tim membutuhkan komunikasi terlebih dahulu untuk hasil sensitif.

Jangan menahan hasil tanpa batas hanya karena belum ada petugas yang menghubungi. Kebijakan rilis perlu memiliki penanggung jawab, waktu tindak lanjut, dan eskalasi. Ambang waktunya ditetapkan rumah sakit berdasarkan konteks klinis, bukan oleh developer.

## 8. Riwayat aktivitas dan perawatan terakhir

Riwayat disusun sebagai timeline yang dapat difilter berdasarkan konsultasi, pemeriksaan, prosedur, dan perawatan. Setiap aktivitas memuat waktu kejadian, cabang, penanggung jawab, status, ringkasan yang sudah dirilis, dokumen yang boleh dibuka, serta instruksi tindak lanjut.

Beranda menampilkan aktivitas klinis terbaru berdasarkan waktu kejadian yang relevan, bukan sekadar record yang terakhir diedit. Detail menunjukkan waktu pembaruan jika ada koreksi. Kunjungan yang dibatalkan tidak dianggap perawatan selesai.

Catatan pasien seperti “sudah membaca”, checklist mandiri, atau pertanyaan untuk dokter dipisahkan secara visual dari rekam medis. Mencentang pengingat bukan bukti obat sudah diminum atau tindakan sudah dilaksanakan. Koreksi dari pasien menjadi permintaan verifikasi; aplikasi tidak langsung mengubah rekam medis sumber.

Fitur bernilai tinggi untuk fase berikutnya adalah ringkasan kunjungan singkat: apa yang dilakukan, hasil yang sudah boleh dibaca, instruksi dari klinik, dan janji berikutnya. Ringkasan otomatis hanya menjadi draft sampai proses validasi yang disepakati terpenuhi.

## 9. Appointment dari sistem rumah sakit

### 9.1 Tiga kategori yang berbeda

| Kategori | Makna | Siapa yang dapat mengubah |
|---|---|---|
| Appointment resmi | Jadwal yang sudah tercatat dalam sumber otoritatif | Sistem rumah sakit atau petugas berwenang |
| Permintaan pasien | Usulan perubahan / pertanyaan terkait jadwal | Pasien dapat mengirim; petugas menindaklanjuti |
| Pengingat | Pesan turunan dari versi appointment tertentu | Automasi membatalkan/mengganti bila sumber berubah |

Tab Janji memuat jadwal mendatang dan riwayat, termasuk status dikonfirmasi, selesai, dibatalkan, dijadwal ulang, dan tidak hadir jika sumber menyediakan status tersebut. Detail berisi waktu beserta zona waktu cabang, dokter/petugas, lokasi, persiapan resmi, dan waktu sinkronisasi.

### 9.2 Permintaan ubah jadwal

Pasien membuka appointment, memilih permintaan perubahan, menulis kebutuhan, dan melihat ringkasan sebelum mengirim. Sistem membuat tiket dengan nomor referensi. Status tetap “permintaan diterima” sampai ada perubahan resmi dari rumah sakit. Jika petugas menolak atau menawarkan waktu lain, tampilkan keputusan itu sebagai komunikasi terpisah.

Tidak ada biaya atau payment gateway dalam flow ini. Status administratif pembayaran tidak perlu ditambahkan hanya untuk membuat flow terlihat lengkap.

### 9.3 Waktu dan perubahan

Simpan timestamp dalam UTC dengan zona waktu sumber, kemudian tampilkan zona cabang. Jakarta memakai Asia/Jakarta; cabang dengan zona berbeda harus memakai konfigurasi cabangnya. Jadwal tidak boleh bergeser ketika pasien bepergian. Jika sumber hanya mengirim tanggal/jam lokal tanpa zona, adapter harus memakai kontrak cabang yang telah disepakati, bukan mengandalkan zona perangkat.

Perubahan jadwal membatalkan pekerjaan notifikasi lama dan membuat pekerjaan baru. Sistem memeriksa ulang status appointment sebelum pesan dikirim. Waktu janji yang sudah lewat tidak otomatis berarti pasien hadir atau tidak hadir.

## 10. Chatbot dan bantuan manusia

### 10.1 Empat kelompok kemampuan

| Kelompok | Contoh | Cara menjawab |
|---|---|---|
| Navigasi dan operasional | “Jadwal saya berikutnya kapan?” | Query terotorisasi; jawaban dari record resmi |
| Data pribadi yang telah dirilis | “Perawatan terakhir saya apa?” | Template dengan tanggal, sumber, dan tautan detail |
| Edukasi umum | “Apa arti transfer embrio?” | Knowledge base klinik yang disetujui dan memiliki versi |
| Keputusan klinis / keluhan | “Ubah dosis?”, “Peluang saya berapa?” | Batas jawaban jelas dan jalur ke tim klinis |

Untuk MVP, jawaban appointment, riwayat, dan status cukup memakai query terstruktur serta template. Tidak perlu memakai LLM untuk membaca sebuah tanggal appointment. LLM dapat ditambahkan kemudian untuk memahami pertanyaan dan menjelaskan materi yang disetujui, dengan otorisasi tetap di backend.

### 10.2 Rancangan LLM lanjutan

Alur yang direkomendasikan: autentikasi -> klasifikasi maksud -> pemeriksaan izin -> tool atau retrieval yang diizinkan -> validasi hasil -> jawaban beserta sumber -> eskalasi jika diperlukan. Pilihan tool tidak boleh menerima patientId bebas dari percakapan. Scope pasien diperoleh dari sesi server.

Tool yang direncanakan antara lain `getMyAppointments`, `getReleasedCycleUpdates`, `getMyReleasedCareHistory`, `searchApprovedEducation`, dan `createCareRequest`. Membaca catatan dan mengirim permintaan diperlakukan sebagai tindakan berbeda. Pasien meninjau isi sebelum pesan/permintaan eksternal dibuat.

Dokumen retrieval diperlakukan sebagai data, bukan instruksi yang boleh mengganti aturan aplikasi. Nomor, tanggal, dosis, dan nilai hasil tidak dihasilkan bebas. Jika sumber tidak ada atau sinkronisasi gagal, jawaban mengaku tidak tersedia dan menawarkan jalur bantuan; tidak memakai hasil pencarian publik untuk mengisi informasi pasien.

### 10.3 Eskalasi

Untuk pertanyaan yang perlu petugas, aplikasi merangkum pertanyaan dan konteks minimum yang boleh dibagikan. Pasien dapat meninjau isi. Setelah pengiriman berhasil, tampilkan nomor tiket, kanal, jam layanan, dan status penerimaan yang benar. Jika koneksi gagal, tampilkan kegagalan dan opsi coba lagi. Pesan bot tidak boleh menyatakan petugas sudah menerima ketika hanya tersimpan di perangkat.

Keluhan mendesak memunculkan arahan mencari bantuan medis segera dan kontak darurat yang telah divalidasi oleh klinik. Jangan menyuruh pasien menunggu antrean chatbot. Klasifikasi berbasis kata kunci dalam prototype merupakan demonstrasi batas fitur; bukan sistem triase klinis yang tervalidasi.

### 10.4 Qiscus

Konteks pekerjaan sebelumnya menunjukkan Qiscus sudah menjadi kandidat kanal komunikasi. Namun API baca yang berhasil tidak otomatis membuktikan dukungan semua webhook, SDK mobile, pemetaan identitas, atau paket yang diperlukan. Dokumentasi Qiscus menerangkan integrasi melalui API/webhook dan menyebut persyaratan paket tertentu [S8]. New Session Webhook berkaitan dengan awal percakapan atau pesan baru setelah room diselesaikan [S9].

Sebelum implementasi, verifikasi entitlement aktual, SDK/kanal mobile, mekanisme autentikasi, room/session ID, event assignment/resolution, autentikasi webhook, retry, dan pemetaan pasien ke customer. Jangan menaruh API key Omnichannel dalam aplikasi. Pesan masuk pada nomor WA tidak otomatis dapat dipetakan menjadi pasien hanya dari nomor tersebut.

## 11. Automasi yang dapat diandalkan

| Trigger | Aksi yang direncanakan | Pengaman | Prioritas |
|---|---|---|---|
| Appointment resmi dikonfirmasi | Buat pengingat pada interval yang disetujui | Cek consent, zona waktu, versi, dan status terakhir | P0 |
| Appointment berubah / dibatalkan | Batalkan pesan lama; buat informasi perubahan | Satu event tidak mengirim pesan berulang | P0 |
| Hasil embrio dirilis | Buat notifikasi netral dan tautan detail | Hanya snapshot yang berhak dilihat pasien | P0 |
| Kunjungan selesai dan ringkasan dirilis | Tampilkan ringkasan / persiapan berikutnya | Tidak mengarang instruksi klinis | P0 |
| Sinkronisasi tertunda | Tampilkan status keterlambatan; buat alert operasional | Jangan mengubah status klinis menjadi “normal” | P0 |
| Permintaan pasien diterima | Masukkan antrean sesuai cabang dan tipe | Nomor referensi; retry idempoten | P0 |
| Resep/jadwal obat diperbarui | Susun ulang pengingat sesuai instruksi sumber | Hapus jadwal usang; jangan menghitung dosis baru | P1 |
| Penyimpanan mendekati tanggal administratif | Informasi tindak lanjut ke pasien/petugas | Tanggal dari sumber kontrak; tanpa pembayaran di app | P1 |
| Program ditunda / hasil sensitif | Hentikan pesan yang tidak sesuai konteks | Event klinis terverifikasi dan kebijakan komunikasi | P0 |

### 11.1 Mekanisme teknis yang direncanakan

Gunakan transactional outbox untuk mencatat event dalam transaksi yang sama dengan perubahan state. Worker memproses event dengan kunci idempotensi yang mencakup sumber, ID event, versi objek, penerima, kanal, dan tujuan. Pengiriman dapat diulang oleh provider; efek bisnis harus tetap idempoten. Jangan menjanjikan pengiriman tepat satu kali hanya karena memakai antrean.

Status pekerjaan: `planned`, `ready`, `sending`, `accepted_by_provider`, `delivered` jika ada bukti provider, `failed`, `cancelled`, atau `expired`. Notifikasi yang diterima provider tidak sama dengan dibaca pasien. Jika provider tidak memberi delivery receipt, tampilkan status yang memang diketahui.

Sebelum mengirim, worker mengecek versi, izin penerima, perubahan appointment, status program, batas waktu, dan preferensi kanal. Retry memakai jeda meningkat dan batas percobaan; kegagalan akhir masuk antrean penanganan. Jangan mengirim pengingat lama setelah sistem pulih jika waktunya sudah lewat.

Notifikasi layar terkunci secara default berbunyi netral, misalnya “Ada pembaruan dari tim perawatan Anda.” Hasil, jumlah embrio, diagnosis, dan isi percakapan dibaca setelah login. Jam tenang dapat berlaku pada pesan administratif; pengecualian yang berkaitan dengan waktu perawatan harus ditetapkan secara klinis.

## 12. Arsitektur aplikasi

### 12.1 Pilihan stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Mobile | React Native + Expo + TypeScript | Basis UI bersama Android/iOS; tooling pengembangan dan native build [S4][S5] |
| Backend | Java 21 + Spring Boot | Aturan bisnis, autentikasi, integrasi, validasi, dan transaksi terpusat [S6] |
| Data operasional produksi | PostgreSQL | Model relasional, revisi, indeks, dan transaksi; belum diaktifkan pada demo |
| Dokumen produksi | Object storage privat | Tautan berumur pendek; pemeriksaan izin sebelum akses |
| Identitas produksi | OIDC + PKCE dan layanan identitas rumah sakit | Identitas akun dipisahkan dari pemetaan pasien |
| Automasi produksi | Outbox + worker terjadwal | Retry, pembatalan, rekonsiliasi, dan pelacakan |
| LLM opsional | Adapter provider / self-hosted | Kunci server-side; dapat diganti tanpa mengubah mobile |
| Care team | Integrasi Qiscus atau kanal yang disepakati | Bergantung pada entitlement dan kontrak aktual |

Mulai dengan modular monolith Java. Pisahkan modul identitas, journey, hasil, appointment, care requests, notifikasi, dan adapter sumber di dalam aplikasi yang sama. Microservices menambah kebutuhan deployment dan konsistensi sebelum skala atau batas tim membuktikan manfaatnya.

React Native bertanggung jawab pada presentasi dan interaksi. Java menjalankan backend untuk kedua platform; tidak diperlukan UI iOS berbasis Java. Native module dapat ditambahkan bila ada kebutuhan perangkat yang nyata. Build iOS lokal menggunakan toolchain Apple; Expo juga menyediakan jalur build cloud [S5].

### 12.2 Hubungan komponen

Aplikasi mobile berbicara hanya dengan API aplikasi. API memverifikasi identitas, menyusun tampilan data yang boleh diakses, dan menerima permintaan pasien. Adapter terpisah menghubungkan sumber rumah sakit, laboratorium, dan kanal komunikasi. Mobile tidak langsung mengakses database TERA, token Qiscus, atau provider LLM.

Portal internal menjadi kebutuhan operasional untuk identitas ambigu, hasil yang perlu dirilis, permintaan pasien, dan error sinkronisasi. Jika sistem sumber sudah menyediakan proses yang memadai, manfaatkan proses itu; jangan membuat dua antrean rilis paralel tanpa kepemilikan yang jelas. Portal internal belum dibangun dalam prototype mobile ini.

## 13. Model data dan aturan integrasi

### 13.1 Entitas inti

| Entitas | Fungsi dan aturan penting |
|---|---|
| AppAccount | Identitas login; tidak sama dengan patient record |
| PatientIdentityLink | Pemetaan akun/pasien ke source + cabang + external ID; menyimpan status verifikasi |
| CareRelationship | Hubungan pasien-pasangan/pemberi dukungan; scope, dasar akses, waktu berlaku |
| TreatmentEpisode | Program, cabang, status, versi, dokter/tim, hubungan episode sebelumnya |
| Embryo | Identitas stabil dan episode asal; tidak memakai nomor urut yang berubah setiap sinkronisasi |
| EmbryoObservation | Event/observasi berversi; waktu klinis dan provenance |
| ReleasedSnapshot | Isi dan versi yang telah diizinkan untuk pasien; koreksi terlacak |
| Encounter / CareActivity | Konsultasi, pemeriksaan, tindakan, ringkasan, dokumen terkait |
| Appointment | Jadwal resmi, source version, timezone, status; histori perubahan tersimpan |
| CareRequest | Permintaan pasien, idempotency key, status kerja, kaitan appointment bila ada |
| Reminder / NotificationJob | Tugas turunan dari objek+versi sumber, penerima, kanal, waktu, pembatalan |
| Consent / AccessGrant | Scope, versi kebijakan, penerima, masa berlaku, pencabutan |
| AuditEvent / SyncCursor | Pelacakan akses/perubahan dan checkpoint sinkronisasi |

### 13.2 Sumber otoritatif

| Domain | Kandidat sumber | Yang harus dipastikan sebelum integrasi |
|---|---|---|
| Identitas, RM, encounter | TERA/RME yang ditetapkan Morula | Namespace ID, master cabang, duplikasi, pemetaan pasien |
| Appointment | Sistem penjadwalan yang berlaku | Definisi status, versi, perubahan, zona waktu, akses baca/tulis |
| Hasil embrio | Sistem embriologi / workflow laboratorium | ID embrio, episode asal, status verifikasi/rilis, koreksi |
| Ringkasan dan instruksi | RME dan approval klinis | Konten yang boleh dilihat pasien, lampiran, revisi |
| Komunikasi | Qiscus bila terkonfirmasi cocok | Customer/room/session mapping, entitlement, webhook, kanal |
| Preferensi aplikasi | Database aplikasi | Retensi, audit, sinkronisasi antar perangkat |

Konteks sebelumnya menyebut 13 kode TERA; nilai aktual dan hubungan kode tersebut dengan cabang belum diberikan di sini. Jangan hard-code angka atau nama cabang publik menjadi master operasional.

### 13.3 Kontrak minimal setiap event sumber

Minta `source_system`, `branch_code`, `source_record_id`, `source_version` atau indikator revisi, identitas pasien sumber, identitas episode, `occurred_at`, `updated_at`, zona waktu, status, serta indikator penghapusan/koreksi. Untuk hasil tambahkan waktu observasi, verifikasi, rilis, pihak yang merilis, dan peruntukan akses.

Webhook yang didukung vendor menjadi jalur utama bila sesuai, dengan job rekonsiliasi berkala untuk mendeteksi event yang hilang. Jika hanya polling, gunakan cursor gabungan waktu update dan ID yang stabil, overlap terkontrol, deduplikasi, dan aturan tombstone. Jangan hanya mengandalkan “tanggal lebih besar dari waktu terakhir” karena beberapa record dapat berbagi timestamp.

Urutan event yang datang tidak selalu sama dengan urutan perubahan klinis. Event lama tidak boleh menimpa versi terbaru. Simpan waktu kejadian klinis, waktu rilis, waktu diterima, dan waktu sinkronisasi sebagai field berbeda. Kesalahan pemetaan identitas, cabang, atau format tanggal masuk karantina integrasi.

Jika API belum tersedia, opsi sementara adalah impor terkontrol dari ekspor resmi yang disetujui: validasi schema, checksum, identitas, staging, review, dan audit. Aplikasi tidak melakukan scraping area privat rumah sakit untuk mengisi data klinis.

## 14. Privasi dan keamanan yang menjadi bagian produk

**[High confidence]** UU 27/2022 menyebut informasi kesehatan sebagai data pribadi spesifik [S10]. PMK 24/2022 memuat prinsip keamanan/kerahasiaan dan pengaturan hak akses rekam medis [S11]. Penerapan pada organisasi, dasar pemrosesan, transfer data, retensi, dan kewajiban lain harus ditinjau bersama penanggung jawab rekam medis, legal, serta keamanan; dokumen ini bukan sertifikasi kepatuhan.

Kebutuhan desain yang direkomendasikan:

- Autentikasi kuat, sesi berumur terbatas, pencabutan perangkat, dan otorisasi per objek pada server.
- Token native disimpan pada penyimpanan aman OS; biometrik membuka sesi sesuai kebijakan, bukan mengganti pembuktian identitas pasien.
- Enkripsi transport, penyimpanan server, backup, serta pengelolaan kunci terpisah.
- Lampiran privat menggunakan akses terotorisasi dan tautan singkat; bukan URL publik permanen.
- Audit siapa membaca, merilis, mengoreksi, mengekspor, dan mengubah akses tanpa mencatat isi medis secara berlebihan di log teknis.
- Push, crash report, telemetry, dan analytics tidak memuat hasil klinis atau teks percakapan pasien.
- Cache medis lokal diminimalkan. Jika offline data diterapkan kelak, tentukan enkripsi, masa berlaku, pencabutan, indikator stale, dan data yang boleh tersimpan.
- Dasar akses pasangan, akses petugas, retensi rekam medis, serta penghapusan akun aplikasi dipisahkan; menghapus akun tidak otomatis menghapus rekam medis yang wajib disimpan.
- Data yang diberikan ke LLM dibatasi; kontrak provider, retensi, lokasi pemrosesan, serta penggunaan data diperiksa sebelum produksi.

Kode demo tidak mengimplementasikan seluruh kontrol produksi di atas. Penanda demo, data sintetis, identitas demo, penolakan mode non-demo, dan isolasi data pada endpoint mencegah prototype terlihat lebih siap daripada kenyataannya.

## 15. Prinsip desain visual dan komunikasi

Gunakan dasar putih/ivory, aksen oranye-coral, dan teks gelap. Ini adalah arah visual konsep, bukan klaim mengikuti seluruh brand guideline resmi. Hindari foto bayi sebagai latar permanen di area perawatan; tidak semua pasien berada dalam keadaan emosional yang sama.

Prioritaskan judul yang jelas, tanggal, sumber, dan satu aksi utama per kartu. Jangan memakai warna sebagai satu-satunya pembeda status. Siapkan label screen reader, fokus yang benar pada modal, dukungan ukuran teks perangkat, target sentuh yang mudah, dan keadaan loading/error yang dapat dipahami.

Copy yang disarankan: “Belum ada pembaruan yang dirilis”, “Data terakhir tersinkron pada ...”, “Permintaan sedang ditinjau”, atau “Tim perawatan dapat membantu menjelaskan hasil ini.” Hindari “semua normal”, “pasti berhasil”, “embrio terbaik”, atau “dokter sudah menerima” tanpa dasar dan bukti proses.

Pada demo, label “Snapshot demo - 31 Okt 2026” selalu jelas. Tanggal tetap tidak disebut “hari ini” mengikuti jam perangkat. Sumber fiktif ditandai sebagai demo, sehingga screenshot tidak mudah disalahartikan menjadi hasil pasien nyata.

## 16. Prioritas delivery

### P0 - Pilot pertama

Identitas dan tautan pasien; episode/program; status dan hasil yang sudah dirilis; perawatan terakhir serta riwayat; appointment resmi; permintaan perubahan melalui antrean; notifikasi netral; asisten operasional; audit dan status sinkronisasi. Jika rilis hasil belum ada di sistem sumber, workflow internalnya menjadi dependency P0.

### P1 - Setelah pilot terbukti

Pengingat obat dari instruksi tervalidasi, akses pasangan dengan hak yang jelas, Qiscus handoff penuh, lampiran terotorisasi, edukasi sesuai tahap, pertanyaan sebelum konsultasi, dukungan psikologis/koordinator bila disediakan klinik, pengingat administratif penyimpanan, dan bahasa tambahan.

### P2 - Setelah kebutuhan dan data terbukti

Check-in digital, estimasi antrean bila sumber mendukung, ringkasan draft berbantuan LLM, integrasi lintas cabang lanjutan, dan perbaikan operasional berbasis analytics yang minim data. Jangan memulai dari prediksi keberhasilan individual, penilaian embrio oleh AI, atau perubahan terapi otomatis.

## 17. Roadmap dan kebutuhan tim

Estimasi di bawah adalah perkiraan perencanaan, bukan penawaran harga atau komitmen delivery. **[Low confidence]** Durasi sangat bergantung pada akses API, data, review klinis, dan proses keamanan. Prototype interaktif dapat dibuat cepat; pilot dengan data nyata membutuhkan pekerjaan lain yang tidak dapat digantikan oleh demo.

| Fase | Hasil yang harus selesai | Perkiraan awal |
|---|---|---|
| Discovery dan kontrak data | SOP rilis, data mapping, identitas, flow prioritas, contoh payload tersanitasi | 1-2 minggu |
| Core platform | OIDC, patient linking, read model, integrasi satu cabang, UI inti | 3-5 minggu |
| Workflow layanan | Antrean petugas, notifikasi, permintaan jadwal, rekonsiliasi | 2-3 minggu |
| UAT dan pilot | Uji klinis/operasional, keamanan, perangkat, pemulihan, training | 2-4 minggu |

Sebagian fase dapat tumpang tindih; tidak berarti semuanya dapat dikerjakan satu orang sekaligus. Rentang sekitar 8-14 minggu dapat dipakai untuk percakapan awal jika integrasi tersedia, kemudian diestimasi ulang setelah discovery. Untuk engineer tunggal dengan pekerjaan operasional lain, gunakan jadwal yang lebih longgar dan kurangi scope pilot.

Peran minimal yang dibutuhkan: owner produk/operasional, perwakilan dokter dan embriologi, pemilik RME/TERA, engineering mobile/backend, QA, serta dukungan keamanan dan legal. Tim care coordinator harus menyepakati siapa menangani tiket di luar jam layanan.

## 18. Kriteria penerimaan dan metrik

### 18.1 Gerbang pilot

| Skenario | Hasil yang wajib |
|---|---|
| Akun A mencoba objek milik B | Tidak ada isi data yang terbuka |
| Hasil draft/verified belum dirilis | Tidak ada di daftar, detail, notifikasi, pencarian, atau jawaban bot |
| Hasil dikoreksi | Versi terbaru jelas; jejak perubahan terlacak |
| Appointment dijadwal ulang | Jadwal lama tidak memicu pengingat aktif |
| Permintaan dikirim ulang setelah timeout | Tidak membuat tiket ganda; payload berbeda dengan key sama ditolak |
| Event sumber datang terlambat | Tidak menimpa versi yang lebih baru |
| Nomor RM sama di cabang berbeda | Tidak digabung otomatis |
| Akses pasangan dicabut | Akses berikutnya ditolak, job penerima dibatalkan |
| Sumber offline | Status tidak tersedia/stale terlihat; tidak muncul data sintetis |
| Pertanyaan perubahan dosis | Bot tidak menetapkan terapi; menyediakan jalur ke petugas |
| Keluhan mendesak | Tidak diarahkan menunggu balasan bot |
| Zona waktu perangkat berubah | Waktu appointment cabang tetap benar |
| Notifikasi pada layar terkunci | Tidak mengungkap hasil sensitif |
| Logout atau pindah akun | Data akun lama dibersihkan dari tampilan/cache yang relevan |

Uji native Android/iOS, aksesibilitas, kondisi jaringan, secure storage, push, deep link, background/resume, dan signing merupakan bagian validasi sebelum rilis. Lulus export JavaScript atau preview browser tidak membuktikan semua perilaku native tersebut.

### 18.2 Metrik keberhasilan

Pantau keberhasilan identity linking tanpa manual repair, usia data saat ditampilkan, waktu dari rilis sumber ke tersedia di aplikasi, jumlah pengingat usang/duplikat, waktu respons care request, proporsi pertanyaan operasional yang terselesaikan tanpa eskalasi, serta umpan balik kejelasan informasi. Tetapkan baseline dan target setelah pilot; jangan mengarang benchmark.

Guardrail yang lebih penting daripada engagement: insiden salah pasien, kebocoran hasil yang belum dirilis, konfirmasi appointment palsu, jawaban klinis yang melampaui sumber, dan notifikasi yang mengungkap data. Jumlah sesi chat dan durasi penggunaan bukan ukuran utama nilai aplikasi.

## 19. Keputusan yang perlu dikonfirmasi bersama Morula

1. Sistem dan penanggung jawab otoritatif untuk status embrio; apakah ada field verifikasi dan rilis terpisah?
2. Kontrak API/export TERA untuk pasien, appointment, encounter, instruksi, serta perubahan/penghapusan.
3. Master kode cabang, zona waktu, dan strategi identitas pasien lintas cabang.
4. Metode verifikasi akun pasien dan prosedur perubahan nomor/pemulihan akun.
5. Kebijakan hasil sensitif, hak akses pasangan, dan SLA rilis/penjelasan.
6. Paket Qiscus, dukungan mobile, webhook yang tersedia, dan alur handoff ke agent.
7. Pemilik antrean care request, jam layanan, kontak darurat yang sah, serta eskalasi.
8. Lingkungan hosting, persyaratan data, monitoring, retensi, backup, dan penanggung jawab insiden.

Delapan hal ini dapat diputuskan dari workshop singkat berbasis contoh payload dan flow yang sudah dibuat. Tidak perlu menunggu semuanya untuk meninjau desain dan menjalankan prototype sintetis; semuanya perlu jelas sebelum melibatkan data pasien nyata.

## 20. Batas implementasi pada paket ini

Paket menyertakan source React Native dan backend Java untuk demonstrasi flow. Mode lokal memakai fixture sintetis; mode API memakai backend demo yang dinyalakan secara eksplisit. Request simulasi tidak dikirim ke rumah sakit. Chatbot berbasis aturan untuk memperlihatkan perilaku dan batas jawaban; belum terhubung ke LLM atau Qiscus. Preferensi tertentu hanya berlaku selama proses demo berjalan.

Identitas OIDC/OTP, database produksi, adapter TERA/laboratorium, portal staff, pipeline rilis nyata, APNs/FCM, automasi durable, LLM/RAG, build native bertanda tangan, dan publikasi store adalah tahap lanjutan. Lihat README dan VERIFICATION untuk hasil pemeriksaan implementasi aktual; rancangan pada dokumen ini tidak boleh dibaca sebagai daftar fitur produksi yang sudah selesai.

Backend juga menyertakan simulator aturan automasi yang dapat dijalankan melalui API. Evaluasi menghasilkan pengingat contoh 24 jam dan 2 jam sebelum appointment yang terkonfirmasi, mempertahankan ID job pada evaluasi berulang, dan membedakan planned/due/expired. Appointment yang dibatalkan atau historis tidak menghasilkan job aktif. Ini adalah evaluator read-only dengan `deliveryEnabled: false`, bukan scheduler berjalan atau pengiriman pesan nyata; interval contoh bukan anjuran klinis.

## 21. Sumber dan tingkat kepastian

Sumber publik diperiksa pada 31 Oktober 2026. Klaim tentang sistem internal hanya menggunakan kebutuhan yang disebutkan pengguna; tidak ada dokumentasi API internal yang diasumsikan telah diterima. Rekomendasi arsitektur, UX, prioritas, dan estimasi adalah analisis desain dalam dokumen ini.

- **[S1] Morula IVF, halaman utama:** https://www.morulaivf.co.id/ - layanan utama dan jalur kunjungan pertama.
- **[S2] Morula IVF, Produk & Layanan:** https://www.morulaivf.co.id/layanan/ - variasi layanan fertilitas.
- **[S3] Morula IVF, IVF - Bayi Tabung:** https://www.morulaivf.co.id/layanan/ivf-bayi-tabung/ - gambaran flow layanan publik; bukan kontrak sistem internal.
- **[S4] React Native, Get Started:** https://reactnative.dev/docs/environment-setup - framework React Native dan dukungan platform.
- **[S5] Expo, Introduction to development builds:** https://docs.expo.dev/develop/development-builds/introduction/ - native development builds dan jalur build.
- **[S6] Spring Boot 3.5, System Requirements:** https://docs.spring.io/spring-boot/3.5/system-requirements.html - kompatibilitas Java dan build tool.
- **[S7] ASRM, Witnessing and protocol deviations in the IVF and andrology laboratory (2026):** https://www.asrm.org/practice-guidance/practice-committee-documents/witnessing-and-protocol-deviations-in-the-in-vitro-fertilization-and-andrology-laboratory-a-committee-opinion/ - identifikasi dan traceability laboratorium.
- **[S8] Qiscus Help Center, CRM Integration:** https://support.qiscus.com/hc/en-us/articles/1732590970508-CRM-Integration - API/webhook dan persyaratan produk yang perlu dikonfirmasi.
- **[S9] Qiscus Help Center, New Session Webhook:** https://support.qiscus.com/hc/en-us/articles/13810175913113-New-Session-Webhook-to-Trigger-External-Services-at-Conversation-Started - kondisi event new session.
- **[S10] JDIH Kemkomdigi, UU 27 Tahun 2022 tentang Pelindungan Data Pribadi:** https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/ - kerangka perlindungan data.
- **[S11] JDIH Kemenkes, Permenkes 24 Tahun 2022 tentang Rekam Medis:** https://jdih.kemkes.go.id/storage/documents/pdfs/2022permenkes024.pdf - rekam medis, keamanan, kerahasiaan, dan akses.
