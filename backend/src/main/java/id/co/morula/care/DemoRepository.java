package id.co.morula.care;

import static id.co.morula.care.Models.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
class DemoRepository {
    static final String PATIENT_ID = "patient-demo";
    private final Overview seed;
    private final List<OwnedEmbryo> laboratory = new ArrayList<>();
    private final DemoStateStore state;
    private final Clock clock;

    record OwnedEmbryo(String patientId, boolean released, Embryo record) {}
    @Autowired
    DemoRepository(ObjectMapper mapper, DemoStateStore state) throws IOException {
        this(mapper, Clock.systemUTC(), state);
    }

    DemoRepository(ObjectMapper mapper, Clock clock) throws IOException {
        this(mapper, clock, new MemoryDemoStateStore());
    }

    DemoRepository(ObjectMapper mapper, Clock clock, DemoStateStore state) throws IOException {
        this.clock = clock;
        this.state = state;
        try (var stream = DemoRepository.class.getResourceAsStream("/demo-overview.json")) {
            if (stream == null) throw new IOException("Missing synthetic fixture");
            seed = mapper.readValue(stream, Overview.class);
        }
        seed.embryos().forEach(embryo -> laboratory.add(new OwnedEmbryo(PATIENT_ID, true, embryo)));
        // Defensive fixtures: draft and foreign-patient records MUST NEVER enter patient DTOs.
        laboratory.add(new OwnedEmbryo(PATIENT_ID, false, new Embryo("draft-private", "DRAFT HIDDEN", "Draft stage", "Not released", "2026-10-30T08:00:00+07:00", null, null, "UNRELEASED_PRIVATE_NOTE", "Internal demo laboratory")));
        laboratory.add(new OwnedEmbryo("patient-other", true, new Embryo("foreign-private", "OTHER PATIENT HIDDEN", "Other", "Stored", "2026-10-30T08:00:00+07:00", "2026-10-30T10:00:00+07:00", "Other clinician", "OTHER_PATIENT_PRIVATE_NOTE", "Internal demo laboratory")));
        state.initialize(PATIENT_ID, seed.preferences(), seed.reminders());
    }

    private void authorize(String patientId) {
        if (!PATIENT_ID.equals(patientId)) throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Data tidak tersedia untuk sesi ini.");
    }

    List<Embryo> embryos(String patientId) {
        authorize(patientId);
        return laboratory.stream().filter(row -> row.patientId().equals(patientId) && row.released() && row.record().releasedAt() != null).map(OwnedEmbryo::record).toList();
    }

    Overview overview(String patientId) {
        authorize(patientId);
        var patientReminders = seed.reminders().stream().map(r -> withCompleted(r, state.completed(patientId, r.id()))).toList();
        return new Overview("DEMO", seed.patient(), seed.sync(), seed.cycle(), embryos(patientId), seed.activities(), seed.appointments(), patientReminders, seed.notifications(), state.preferences(patientId));
    }

    List<Activity> activities(String patientId) { authorize(patientId); return seed.activities(); }
    List<Appointment> appointments(String patientId) { authorize(patientId); return seed.appointments(); }

    Reminder acknowledge(String patientId, String reminderId, boolean completed) {
        authorize(patientId);
        var reminder = seed.reminders().stream().filter(r -> r.id().equals(reminderId)).findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Pengingat tidak ditemukan."));
        state.acknowledge(patientId, reminderId, completed);
        return withCompleted(reminder, completed);
    }

    private Reminder withCompleted(Reminder reminder, boolean completed) {
        return new Reminder(reminder.id(), reminder.title(), reminder.detail(), reminder.dueAt(), completed, reminder.source());
    }

    Preferences preferences(String patientId, PreferencesPatch patch) {
        authorize(patientId);
        if (patch.partnerSharing()) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "CONSENT_NOT_IMPLEMENTED", "Akses pasangan membutuhkan verifikasi identitas dan persetujuan terpisah. Fitur ini belum aktif dalam demo.");
        return state.preferences(patientId, new Preferences(patch.serviceNotifications(), patch.discreetNotifications(), false));
    }

    CareReceipt request(String patientId, String idempotencyKey, CareRequest request) {
        authorize(patientId);
        try {
            if (idempotencyKey.length() != 36 || !UUID.fromString(idempotencyKey).toString().equalsIgnoreCase(idempotencyKey)) throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_IDEMPOTENCY_KEY", "Gunakan UUID yang valid sebagai Idempotency-Key.");
        }
        if (request.type() == CareRequestType.APPOINTMENT_CHANGE) {
            var appointment = seed.appointments().stream().filter(a -> a.id().equals(request.appointmentId())).findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Janji tidak ditemukan untuk sesi ini."));
            if (!"confirmed".equals(appointment.status())) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "APPOINTMENT_NOT_CHANGEABLE", "Permintaan perubahan hanya tersedia untuk janji yang terkonfirmasi.");
        } else if (request.appointmentId() != null && !request.appointmentId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Permintaan kontak perawat tidak memerlukan ID janji.");
        }
        String message = state.durable()
            ? "Permintaan simulasi tersimpan di database demo lokal. Belum dikirim ke rumah sakit dan tidak mengubah jadwal resmi."
            : "Permintaan simulasi tersimpan selama server demo berjalan. Belum dikirim ke rumah sakit dan tidak mengubah jadwal resmi.";
        return state.request(patientId, UUID.fromString(idempotencyKey).toString(), request,
            () -> new CareReceipt("req-" + UUID.randomUUID(), "received_demo", message,
                Instant.now(clock).truncatedTo(ChronoUnit.MICROS).toString()));
    }
}
