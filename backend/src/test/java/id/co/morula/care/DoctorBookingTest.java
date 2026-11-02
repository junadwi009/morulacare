package id.co.morula.care;

import static id.co.morula.care.DoctorModels.*;
import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

class DoctorBookingTest {
    private static final String PATIENT=DemoRepository.PATIENT_ID;
    private final MemoryDemoStateStore state=new MemoryDemoStateStore();
    private final DoctorBookingRepository repo=new DoctorBookingRepository(state,Clock.fixed(Instant.parse("2026-11-01T00:00:00Z"),ZoneOffset.UTC));
    private DoctorBookingRequest request(String doctor) {
        return new DoctorBookingRequest(doctor,repo.slots(PATIENT,doctor).getFirst().id(),"Konsultasi pilihan dokter");
    }
    @Test void catalogHasFourFictionalProfilesAndStableIndependentSchedules() {
        assertThat(repo.doctors(PATIENT)).extracting(Doctor::imageKey).containsExactly("maya","arif","nadia","bima");
        var slots=repo.slots(PATIENT,"doctor-maya");
        assertThat(slots).hasSize(12).allMatch(DoctorSlot::available);
        assertThat(slots).extracting(DoctorSlot::id).doesNotHaveDuplicates();
        assertThat(slots.getFirst().startsAt()).isEqualTo("2026-11-03T09:00+07:00");
        assertThatThrownBy(()->repo.doctors("patient-other")).isInstanceOf(ApiException.class);
    }
    @Test void retryIsIdempotentChangedPayloadConflictsAndCancelReleasesOnlyTheReservation() {
        var request=request("doctor-maya");String key=UUID.randomUUID().toString();
        var first=repo.book(PATIENT,key,request);
        assertThat(repo.book(PATIENT,key.toUpperCase(java.util.Locale.ROOT),request)).isEqualTo(first);
        assertThat(repo.slots(PATIENT,"doctor-maya").getFirst().available()).isFalse();
        assertThatThrownBy(()->repo.book(PATIENT,key,new DoctorBookingRequest(request.doctorId(),request.slotId(),"Different")))
            .isInstanceOf(ApiException.class).satisfies(e->assertThat(((ApiException)e).code).isEqualTo("IDEMPOTENCY_CONFLICT"));
        assertThat(repo.cancel(PATIENT,first.id()).status()).isEqualTo("cancelled_demo");
        assertThat(repo.cancel(PATIENT,first.id()).status()).isEqualTo("cancelled_demo");
        assertThat(repo.book(PATIENT,key,request).status()).isEqualTo("cancelled_demo");
        assertThat(repo.slots(PATIENT,"doctor-maya").getFirst().available()).isTrue();
        assertThat(repo.book(PATIENT,UUID.randomUUID().toString(),request).id()).isNotEqualTo(first.id());
    }
    @Test void invalidKeyDoctorSlotAndReasonNeverReserveAnything() {
        assertThatThrownBy(()->repo.book(PATIENT,"bad",request("doctor-maya"))).isInstanceOf(ApiException.class);
        assertThatThrownBy(()->repo.book(PATIENT,UUID.randomUUID().toString(),new DoctorBookingRequest("unknown","unknown","Reason")))
            .isInstanceOf(ApiException.class).satisfies(e->assertThat(((ApiException)e).code).isEqualTo("DOCTOR_NOT_FOUND"));
        var other=request("doctor-arif");
        assertThatThrownBy(()->repo.book(PATIENT,UUID.randomUUID().toString(),new DoctorBookingRequest("doctor-maya",other.slotId(),"Reason")))
            .isInstanceOf(ApiException.class).satisfies(e->assertThat(((ApiException)e).code).isEqualTo("INVALID_DOCTOR_SLOT"));
        assertThatThrownBy(()->repo.book(PATIENT,UUID.randomUUID().toString(),new DoctorBookingRequest("doctor-maya","missing","Reason"))).isInstanceOf(ApiException.class);
        assertThatThrownBy(()->repo.book(PATIENT,UUID.randomUUID().toString(),new DoctorBookingRequest("doctor-maya",request("doctor-maya").slotId()," "))).isInstanceOf(ApiException.class);
        assertThatThrownBy(()->repo.book(PATIENT,UUID.randomUUID().toString(),new DoctorBookingRequest("doctor-maya",request("doctor-maya").slotId(),"x".repeat(501)))).isInstanceOf(ApiException.class);
        assertThat(state.reservedDoctorSlots()).isEmpty();
    }
    @Test void simultaneousDifferentKeysCanReserveOneSlotOnly() throws Exception {
        var request=request("doctor-bima");var start=new CountDownLatch(1);
        try(var workers=Executors.newFixedThreadPool(6)) {
            var futures=new ArrayList<java.util.concurrent.Future<Object>>();
            for(int i=0;i<6;i++)futures.add(workers.submit(()->{start.await();try{return repo.book(PATIENT,UUID.randomUUID().toString(),request);}catch(ApiException ex){return ex;}}));
            start.countDown();var results=new ArrayList<Object>();
            for(var f:futures)results.add(f.get(10,TimeUnit.SECONDS));
            assertThat(results.stream().filter(DoctorBooking.class::isInstance).count()).isEqualTo(1);
            assertThat(results.stream().filter(ApiException.class::isInstance).map(ApiException.class::cast)).allMatch(e->e.code.equals("SLOT_UNAVAILABLE"));
            assertThat(repo.bookings(PATIENT)).hasSize(1);
        }
    }
    @Test void patientCannotReadOrCancelAnotherScopeAndMissingBookingIsNotFound() {
        var first=repo.book(PATIENT,UUID.randomUUID().toString(),request("doctor-nadia"));
        assertThatThrownBy(()->repo.bookings("patient-other")).isInstanceOf(ApiException.class);
        assertThatThrownBy(()->repo.cancel("patient-other",first.id())).isInstanceOf(ApiException.class);
        assertThatThrownBy(()->repo.cancel(PATIENT,"missing")).isInstanceOf(ApiException.class);
        assertThat(state.doctorBookings("patient-other")).isEmpty();
        assertThat(state.doctorBookings(PATIENT)).containsExactly(first);
    }
    @Test void bookingAndCancellationNeverMutateOfficialAppointments() throws Exception {
        var clinical=new DemoRepository(new ObjectMapper(),Clock.systemUTC(),state);
        var before=clinical.appointments(PATIENT);
        var booking=repo.book(PATIENT,UUID.randomUUID().toString(),request("doctor-maya"));
        repo.cancel(PATIENT,booking.id());
        assertThat(clinical.appointments(PATIENT)).isEqualTo(before);
    }
}
