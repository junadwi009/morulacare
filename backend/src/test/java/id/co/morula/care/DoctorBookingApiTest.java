package id.co.morula.care;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("demo")
class DoctorBookingApiTest {
    private static final String TOKEN="Bearer demo-patient-token";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired DoctorBookingRepository repository;
    private Map<String,String> payload(String doctor) {
        return Map.of("doctorId",doctor,"slotId",repository.slots(DemoRepository.PATIENT_ID,doctor).stream().filter(DoctorModels.DoctorSlot::available).findFirst().orElseThrow().id(),"reason","Pertanyaan konsultasi sintetis");
    }
    @Test void everyBookingResourceRequiresAuthAndRejectsClientPatientScope() throws Exception {
        for(String path:new String[]{"/doctors","/doctors/doctor-maya/slots","/doctor-bookings"})
            mvc.perform(get("/api/v1"+path)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/doctors?patientId=patient-other").header("Authorization",TOKEN)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/doctor-bookings").contentType(MediaType.APPLICATION_JSON).content("{}" )).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/doctor-bookings/anything/cancel")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/doctors").header("Authorization",TOKEN)).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(4)).andExpect(jsonPath("$[0].imageKey").value("maya"))
            .andExpect(header().string("Cache-Control","no-store"));
    }
    @Test void creationConflictRetryReadCancelAndAvailabilityUseRealState() throws Exception {
        var request=payload("doctor-maya");String key=UUID.randomUUID().toString();
        var before=mvc.perform(get("/api/v1/appointments").header("Authorization",TOKEN)).andReturn().getResponse().getContentAsString();
        var response=mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).header("Idempotency-Key",key)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("confirmed_demo")).andReturn().getResponse();
        JsonNode booking=mapper.readTree(response.getContentAsString());String id=booking.get("id").asText();
        try {
            mvc.perform(get(response.getHeader("Location")).header("Authorization",TOKEN)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
            mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).header("Idempotency-Key",key)
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(id));
            mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).header("Idempotency-Key",UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("SLOT_UNAVAILABLE"));
            var changed=new java.util.HashMap<>(request);changed.put("reason","Changed payload");
            mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).header("Idempotency-Key",key)
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(changed)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("IDEMPOTENCY_CONFLICT"));
        } finally {
            mvc.perform(post("/api/v1/doctor-bookings/"+id+"/cancel").header("Authorization",TOKEN)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("cancelled_demo"));
        }
        assertThat(mvc.perform(get("/api/v1/appointments").header("Authorization",TOKEN)).andReturn().getResponse().getContentAsString()).isEqualTo(before);
    }
    @Test void validationRejectsUnknownFieldsMissingKeyBadSlotsAndLongReason() throws Exception {
        var request=new java.util.HashMap<>(payload("doctor-arif"));
        mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest());
        request.put("patientId","patient-other");
        mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).header("Idempotency-Key",UUID.randomUUID().toString()).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest());
        request.remove("patientId");request.put("reason","x".repeat(501));
        mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).header("Idempotency-Key",UUID.randomUUID().toString()).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))).andExpect(status().isBadRequest());
        request.put("reason","Reason");request.put("slotId","unknown");
        mvc.perform(post("/api/v1/doctor-bookings").header("Authorization",TOKEN).header("Idempotency-Key",UUID.randomUUID().toString()).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
            .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code").value("INVALID_DOCTOR_SLOT"));
        mvc.perform(get("/api/v1/doctors/unknown/slots").header("Authorization",TOKEN)).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/doctor-bookings/unknown/cancel").header("Authorization",TOKEN)).andExpect(status().isNotFound());
    }
}
