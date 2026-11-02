package id.co.morula.care;

import static id.co.morula.care.DoctorModels.*;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;

@Repository
class DoctorBookingRepository {
    private static final List<Doctor> DOCTORS = List.of(
        new Doctor("doctor-maya", "dr. Maya Pratama", "Obstetri & Ginekologi", "female", 12,
            List.of("Indonesia", "English"), "MJKT", "Morula IVF Jakarta",
            "Profil dokter fiktif untuk mencoba konsultasi fertilitas dan preferensi jadwal.", "maya"),
        new Doctor("doctor-arif", "dr. Arif Santoso", "Andrologi", "male", 10,
            List.of("Indonesia", "English"), "MJKT", "Morula IVF Jakarta",
            "Profil dokter fiktif untuk mencoba pilihan konsultasi kesehatan reproduksi pria.", "arif"),
        new Doctor("doctor-nadia", "dr. Nadia Putri", "Obstetri & Ginekologi", "female", 9,
            List.of("Indonesia"), "MBDG", "Morula IVF Melinda Bandung",
            "Profil dokter fiktif untuk mencoba pilihan dokter dan kunjungan lanjutan.", "nadia"),
        new Doctor("doctor-bima", "dr. Bima Wijaya", "Obstetri & Ginekologi", "male", 15,
            List.of("Indonesia", "English"), "MBDG", "Morula IVF Melinda Bandung",
            "Profil dokter fiktif untuk mencoba konsultasi rencana perawatan bersama dokter pilihan.", "bima")
    );
    private final DemoStateStore state;
    private final Clock clock;
    @Autowired DoctorBookingRepository(DemoStateStore state) { this(state, Clock.systemUTC()); }
    DoctorBookingRepository(DemoStateStore state, Clock clock) { this.state=state; this.clock=clock; }

    private void authorize(String patientId) {
        if (!DemoRepository.PATIENT_ID.equals(patientId)) throw DemoStateStore.notFound();
    }
    List<Doctor> doctors(String patientId) { authorize(patientId); return DOCTORS; }
    private Doctor doctor(String id) {
        return DOCTORS.stream().filter(d -> d.id().equals(id)).findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,"DOCTOR_NOT_FOUND","Dokter demo tidak ditemukan."));
    }
    static List<DoctorSlot> catalogSlots(String doctorId) {
        var result=new ArrayList<DoctorSlot>();
        for (int day=3; day<=5; day++) for (String time : List.of("09:00","10:30","13:00","15:00")) {
            var date=LocalDate.of(2026,11,day);
            var start=OffsetDateTime.of(date,java.time.LocalTime.parse(time),ZoneOffset.ofHours(7));
            result.add(new DoctorSlot(doctorId+"-"+date+"-"+time.replace(":",""), doctorId,
                start.toString(),start.plusMinutes(30).toString(),"Asia/Jakarta",true));
        }
        return List.copyOf(result);
    }
    List<DoctorSlot> slots(String patientId,String doctorId) {
        authorize(patientId); doctor(doctorId);
        Set<String> reserved=Set.copyOf(state.reservedDoctorSlots());
        return catalogSlots(doctorId).stream().map(s -> new DoctorSlot(s.id(),s.doctorId(),s.startsAt(),
            s.endsAt(),s.timeZone(),!reserved.contains(s.id()))).toList();
    }
    List<DoctorBooking> bookings(String patientId) { authorize(patientId); return state.doctorBookings(patientId); }
    DoctorBooking booking(String patientId,String id) {
        return bookings(patientId).stream().filter(b -> b.id().equals(id)).findFirst().orElseThrow(DemoStateStore::notFound);
    }
    DoctorBooking book(String patientId,String key,DoctorBookingRequest input) {
        authorize(patientId);
        try {
            if (key==null || key.length()!=36 || !UUID.fromString(key).toString().equalsIgnoreCase(key)) throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_IDEMPOTENCY_KEY","Gunakan UUID yang valid sebagai Idempotency-Key.");
        }
        // Validate even for direct repository callers; never trust client profile/slot metadata.
        if (input==null || input.doctorId()==null || input.slotId()==null || input.reason()==null || input.reason().isBlank() || input.reason().length()>500)
            throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_REQUEST","Pilih dokter, jadwal dan alasan konsultasi yang valid.");
        Doctor doctor=doctor(input.doctorId());
        DoctorSlot slot=catalogSlots(doctor.id()).stream().filter(s -> s.id().equals(input.slotId())).findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"INVALID_DOCTOR_SLOT","Jadwal tidak tersedia untuk dokter pilihan."));
        var request=new DoctorBookingRequest(doctor.id(),slot.id(),input.reason().strip());
        return state.bookDoctor(patientId,key,request,() -> new DoctorBooking("booking-"+UUID.randomUUID(),
            doctor.id(),doctor.name(),doctor.specialty(),doctor.branchId(),doctor.branchName(),slot.startsAt(),slot.endsAt(),
            slot.timeZone(),"confirmed_demo",request.reason(),clock.instant().truncatedTo(ChronoUnit.MICROS).toString()));
    }
    DoctorBooking cancel(String patientId,String id) { authorize(patientId); return state.cancelDoctorBooking(patientId,id); }
    static ApiException occupied() {
        return new ApiException(HttpStatus.CONFLICT,"SLOT_UNAVAILABLE","Jadwal ini sudah dipilih. Silakan pilih waktu lain.");
    }
}
