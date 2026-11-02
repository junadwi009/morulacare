package id.co.morula.care;

import static id.co.morula.care.DoctorModels.*;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class DoctorBookingController {
    private final DoctorBookingRepository repository;
    DoctorBookingController(DoctorBookingRepository repository) { this.repository=repository; }
    @GetMapping("/doctors") List<Doctor> doctors(@AuthenticationPrincipal Models.PatientIdentity identity) { return repository.doctors(identity.patientId()); }
    @GetMapping("/doctors/{id}/slots") List<DoctorSlot> slots(@AuthenticationPrincipal Models.PatientIdentity identity,@PathVariable String id) { return repository.slots(identity.patientId(),id); }
    @GetMapping("/doctor-bookings") List<DoctorBooking> bookings(@AuthenticationPrincipal Models.PatientIdentity identity) { return repository.bookings(identity.patientId()); }
    @GetMapping("/doctor-bookings/{id}") DoctorBooking booking(@AuthenticationPrincipal Models.PatientIdentity identity,@PathVariable String id) { return repository.booking(identity.patientId(),id); }
    @PostMapping("/doctor-bookings") ResponseEntity<DoctorBooking> book(@AuthenticationPrincipal Models.PatientIdentity identity,
            @RequestHeader("Idempotency-Key") String key,@Valid @RequestBody DoctorBookingRequest request) {
        var booking=repository.book(identity.patientId(),key,request);
        return ResponseEntity.created(URI.create("/api/v1/doctor-bookings/"+booking.id())).body(booking);
    }
    @PostMapping("/doctor-bookings/{id}/cancel") DoctorBooking cancel(@AuthenticationPrincipal Models.PatientIdentity identity,@PathVariable String id) { return repository.cancel(identity.patientId(),id); }
}
