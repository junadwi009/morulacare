package id.co.morula.care;

import java.nio.charset.StandardCharsets;
import java.time.DateTimeException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Read-only, deterministic rule evaluation. No scheduler, queue, persistence, or outbound delivery. */
@Service
class DemoAutomation {
    static final String DEFAULT_AT = "2026-10-31T09:15:00+07:00";
    private final DemoRepository repository;
    private final List<Long> hoursBefore;

    record Job(String id, String appointmentId, String dueAt, String channel, String title, String body, String status, String reason) {}
    record Preview(String dataMode, String evaluatedAt, boolean deliveryEnabled, List<Job> jobs) {}

    DemoAutomation(DemoRepository repository, @Value("${morula.demo-reminders.hours-before:24,2}") String offsets) {
        this.repository = repository;
        try {
            hoursBefore = Arrays.stream(offsets.split(",", -1)).map(String::strip).map(Long::valueOf).distinct().sorted(Comparator.reverseOrder()).toList();
            if (hoursBefore.isEmpty() || hoursBefore.size() > 8 || hoursBefore.stream().anyMatch(h -> h < 1 || h > 168)) throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Demo reminder offsets must be 1–8 distinct whole hours from 1 to 168.");
        }
    }

    Preview evaluate(String patientId, String at) {
        final OffsetDateTime evaluatedAt;
        try {
            evaluatedAt = OffsetDateTime.parse(at == null ? DEFAULT_AT : at, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (DateTimeException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_EVALUATION_TIME", "Gunakan waktu ISO 8601 dengan offset zona waktu, misalnya 2026-10-31T09:15:00+07:00.");
        }
        var jobs = new ArrayList<Job>();
        for (var appointment : repository.appointments(patientId)) {
            // Historical, cancelled and superseded appointments never generate active reminder jobs.
            if (!"confirmed".equals(appointment.status())) continue;
            var startsAt = ZonedDateTime.parse(appointment.startsAt()).withZoneSameInstant(ZoneId.of(appointment.timeZone()));
            for (long hours : hoursBefore) {
                var dueAt = startsAt.minusHours(hours);
                String status;
                String reason;
                if (!evaluatedAt.toInstant().isBefore(startsAt.toInstant())) {
                    status = "expired";
                    reason = "Waktu janji telah dimulai atau lewat; pengingat simulasi tidak dikirim.";
                } else if (!evaluatedAt.toInstant().isBefore(dueAt.toInstant())) {
                    status = "due";
                    reason = "Aturan contoh " + hours + " jam sebelum kunjungan telah jatuh tempo; pengiriman tetap nonaktif.";
                } else {
                    status = "planned";
                    reason = "Aturan contoh " + hours + " jam sebelum kunjungan; bukan interval klinis atau jadwal pengiriman aktif.";
                }
                String identity = patientId + "|" + appointment.id() + "|" + startsAt.toInstant() + "|" + hours;
                String jobId = "demo-job-" + UUID.nameUUIDFromBytes(identity.getBytes(StandardCharsets.UTF_8));
                jobs.add(new Job(jobId, appointment.id(), dueAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME), "IN_APP_DEMO", "Pengingat kunjungan", "Ada jadwal perawatan yang perlu Anda tinjau.", status, reason));
            }
        }
        jobs.sort(Comparator.comparing((Job job) -> OffsetDateTime.parse(job.dueAt()).toInstant()).thenComparing(Job::id));
        return new Preview("DEMO", evaluatedAt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME), false, List.copyOf(jobs));
    }
}
