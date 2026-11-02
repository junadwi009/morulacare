package id.co.morula.care;

import static id.co.morula.care.Models.*;
import java.util.List;
import java.util.function.Supplier;
import org.springframework.http.HttpStatus;

/** Only mutable synthetic state belongs here; clinical fixtures remain in DemoRepository. */
interface DemoStateStore {
    void initialize(String patientId, Preferences defaults, List<Reminder> reminders);
    boolean completed(String patientId, String reminderId);
    void acknowledge(String patientId, String reminderId, boolean completed);
    Preferences preferences(String patientId);
    Preferences preferences(String patientId, Preferences preferences);
    CareReceipt request(String patientId, String key, CareRequest request, Supplier<CareReceipt> createReceipt);
    boolean durable();
    List<DoctorModels.DoctorBooking> doctorBookings(String patientId);
    List<String> reservedDoctorSlots();
    DoctorModels.DoctorBooking bookDoctor(String patientId, String key, DoctorModels.DoctorBookingRequest request, Supplier<DoctorModels.DoctorBooking> createBooking);
    DoctorModels.DoctorBooking cancelDoctorBooking(String patientId, String id);

    static ApiException conflict() {
        return new ApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT", "Kunci yang sama sudah digunakan untuk permintaan berbeda.");
    }
    static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Data tidak tersedia untuk sesi ini.");
    }
}
