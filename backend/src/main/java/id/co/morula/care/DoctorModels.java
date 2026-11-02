package id.co.morula.care;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Fictional doctor profiles and synthetic reservations; never hospital schedules. */
public final class DoctorModels {
    private DoctorModels() {}
    public record Doctor(String id, String name, String specialty, String gender, int experienceYears,
                         List<String> languages, String branchId, String branchName, String bio, String imageKey) {}
    public record DoctorSlot(String id, String doctorId, String startsAt, String endsAt, String timeZone, boolean available) {}
    public record DoctorBookingRequest(@NotBlank @Size(max=100) String doctorId,
                                       @NotBlank @Size(max=100) String slotId,
                                       @NotBlank @Size(max=500) String reason) {}
    public record DoctorBooking(String id, String doctorId, String doctorName, String specialty,
                                String branchId, String branchName, String startsAt, String endsAt,
                                String timeZone, String status, String reason, String createdAt) {
        DoctorBooking cancelled() {
            return new DoctorBooking(id, doctorId, doctorName, specialty, branchId, branchName,
                startsAt, endsAt, timeZone, "cancelled_demo", reason, createdAt);
        }
    }
}
