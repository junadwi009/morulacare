package id.co.morula.care;

import static id.co.morula.care.Models.*;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/** Deliberately deterministic. This is NOT an LLM, clinical triage engine, or staffed chat. */
@Service
class DemoAssistant {
    private static final Pattern EMERGENCY = Pattern.compile("sesak|sulit bernapas|sulit nafas|sulit napas|nyeri dada|perdarahan hebat|pendarahan hebat|pingsan|tidak sadar|kejang|nyeri hebat|nyeri berat|bunuh diri|darurat|emergency|chest pain|can't breathe|heavy bleeding", Pattern.CASE_INSENSITIVE);
    private static final Pattern CLINICAL = Pattern.compile("dosis|dosage|dose|obat|suntik|progesteron|hcg|diagnos|peluang|berhasil|keberhasilan|apakah.*hamil|bagus|buruk|normal|grade|grading|arti hasil|artinya|interpret|gejala|demam|sakit|nyeri|mual|muntah|perdarahan|pendarahan", Pattern.CASE_INSENSITIVE);
    private final DemoRepository repository;

    DemoAssistant(DemoRepository repository) { this.repository = repository; }

    ChatReply reply(String patientId, String message) {
        String input = message.strip().toLowerCase(Locale.ROOT);
        if (EMERGENCY.matcher(input).find()) {
            return result("Jika Anda mengalami gejala berat atau keadaan gawat, segera hubungi layanan darurat setempat atau pergi ke IGD terdekat. Jangan menunggu balasan chatbot. Saya tidak dapat menilai kegawatan dari chat. Demo ini belum menghubungi klinik atau layanan darurat.", "urgent_support", "Pesan keselamatan demo; bukan penilaian klinis", true);
        }
        if (CLINICAL.matcher(input).find()) {
            return result("Pertanyaan tentang gejala, obat, dosis, interpretasi hasil, atau peluang keberhasilan perlu ditinjau dokter atau perawat Anda. Jangan mengubah pengobatan berdasarkan chatbot. Saya dapat membantu membuat permintaan kontak simulasi; belum ada pesan yang dikirim ke klinik.", "clinical_handoff", "Batas layanan asisten demo", true);
        }
        if (input.contains("ubah") || input.contains("reschedule") || input.contains("ganti jadwal") || input.contains("batal")) {
            return result("Buka tab Janji, pilih janji terkonfirmasi, lalu pilih Ajukan perubahan. Permintaan simulasi tidak mengubah jadwal resmi; konfirmasi tetap berasal dari sistem klinik. Tidak ada pembayaran di aplikasi ini.", "appointment_change", "Alur permintaan demo", false);
        }
        if (input.contains("janji") || input.contains("appointment") || input.contains("jadwal")) {
            var appointment = repository.appointments(patientId).stream().filter(a -> a.status().equals("confirmed"))
                .min(Comparator.comparing(a -> ZonedDateTime.parse(a.startsAt()).toInstant()));
            if (appointment.isEmpty()) return result("Belum ada janji terkonfirmasi di data yang tersedia. Hubungi tim klinik untuk konfirmasi.", "appointment", "Jadwal sistem sintetis", false);
            var a = appointment.get();
            var localTime = ZonedDateTime.parse(a.startsAt()).withZoneSameInstant(ZoneId.of(a.timeZone()));
            String date = localTime.format(DateTimeFormatter.ofPattern("d MMMM uuuu 'pukul' HH.mm", Locale.forLanguageTag("id-ID")));
            String zoneLabel = switch (a.timeZone()) {
                case "Asia/Jakarta" -> "WIB";
                case "Asia/Makassar" -> "WITA";
                case "Asia/Jayapura" -> "WIT";
                default -> a.timeZone();
            };
            return result("Pada snapshot demo, janji Anda: " + a.title() + ", " + date + " " + zoneLabel + " di " + a.branch() + ". Status: terkonfirmasi (data sintetis). Ini bukan reservasi klinik yang nyata.", "appointment", a.source(), false);
        }
        if (input.contains("embrio") || input.contains("embryo")) {
            int total = repository.embryos(patientId).size();
            return result("Ada " + total + " catatan embrio yang telah dirilis pada snapshot demo. Buka Perjalanan → Embrio untuk melihat status, waktu observasi, waktu rilis, dan sumber tiap catatan. Catatan yang belum dirilis tidak ditampilkan. Saya tidak menyimpulkan kualitas atau peluang keberhasilan dari status tersebut.", "released_embryos", "Laporan laboratorium sintetis yang telah dirilis", false);
        }
        if (input.contains("riwayat") || input.contains("perawatan") || input.contains("terakhir")) {
            var a = repository.activities(patientId).getFirst();
            return result("Aktivitas terbaru pada snapshot demo adalah " + a.title() + ". " + a.summary() + " Rincian tersedia di Perjalanan → Riwayat. Informasi hanya berasal dari catatan yang dirilis.", "care_history", a.source(), false);
        }
        if (input.contains("perawat") || input.contains("petugas") || input.contains("manusia") || input.contains("admin") || input.contains("hubungi")) {
            return result("Anda dapat membuat permintaan kontak simulasi melalui tombol Hubungi tim pada aplikasi. Demo ini menyimpan permintaan sementara saja; belum terhubung ke perawat, Qiscus, atau sistem rumah sakit.", "staff_handoff", "Alur handoff demo", true);
        }
        if (input.contains("privasi") || input.contains("pasangan")) {
            return result("Akses pasangan memerlukan akun, verifikasi, dan persetujuan terpisah. Fitur berbagi belum aktif pada demo. Notifikasi dibuat samar; jangan membagikan token atau informasi medis di perangkat bersama.", "privacy", "Rancangan privasi demo", false);
        }
        return result("Saya asisten berbasis aturan untuk demo Morula Care. Saya bisa membantu melihat jadwal, laporan embrio yang dirilis, riwayat perawatan, dan alur permintaan kontak. Saya tidak bisa menafsirkan hasil, memberi diagnosis, atau mengubah terapi. Coba: 'Kapan janji saya?'", "help", "Kemampuan asisten demo", false);
    }

    private ChatReply result(String text, String intent, String source, boolean staff) {
        return new ChatReply("chat-" + UUID.randomUUID(), text, intent, source, staff, Instant.now().toString());
    }
}
