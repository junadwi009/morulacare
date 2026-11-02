package id.co.morula.care;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class DemoApiTest {
    private static final String TOKEN = "Bearer demo-patient-token";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired DemoRepository repository;

    @Test void healthIsPublicButPatientDataRequiresAuthentication() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        mvc.perform(get("/api/v1/overview")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        mvc.perform(get("/api/v1/overview").header("Authorization", "Bearer invalid"))
            .andExpect(status().isUnauthorized());
    }

    @Test void releasedRecordsOnlyAreVisibleAndResponsesCannotBeCached() throws Exception {
        String json = mvc.perform(get("/api/v1/overview").header("Authorization", TOKEN))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.patient.id").value("patient-demo"))
            .andExpect(jsonPath("$.dataMode").value("DEMO"))
            .andExpect(jsonPath("$.embryos.length()").value(3))
            .andReturn().getResponse().getContentAsString();
        assertThat(json).doesNotContain("draft-private", "foreign-private", "UNRELEASED_PRIVATE_NOTE", "OTHER_PATIENT_PRIVATE_NOTE");
        mvc.perform(get("/api/v1/embryos").header("Authorization", TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3));
    }

    @Test void patientScopeCannotBeSelectedByQueryOrJson() throws Exception {
        mvc.perform(get("/api/v1/overview?patientId=patient-other").header("Authorization", TOKEN))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PATIENT_SCOPE_FORBIDDEN"));
        mvc.perform(post("/api/v1/chat").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON)
            .content("{\"message\":\"jadwal\",\"patientId\":\"patient-other\"}"))
            .andExpect(status().isBadRequest());
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> repository.overview("patient-other"))
            .isInstanceOf(ApiException.class).hasMessage("Data tidak tersedia untuk sesi ini.");
    }

    @Test void appointmentsAndActivitiesMatchSyntheticSources() throws Exception {
        mvc.perform(get("/api/v1/appointments").header("Authorization", TOKEN)).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("apt-next")).andExpect(jsonPath("$[0].timeZone").value("Asia/Jakarta"));
        mvc.perform(get("/api/v1/activities").header("Authorization", TOKEN)).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].type").value("lab"));
    }

    @Test void careRequestRetriesAreIdempotentAndNeverModifySourceSchedule() throws Exception {
        String key = UUID.randomUUID().toString();
        String body = mapper.writeValueAsString(Map.of("type", "APPOINTMENT_CHANGE", "appointmentId", "apt-next", "note", "Simulasi permintaan perubahan"));
        String before = mvc.perform(get("/api/v1/appointments").header("Authorization", TOKEN)).andReturn().getResponse().getContentAsString();
        String first = mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN).header("Idempotency-Key", key)
            .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("received_demo"))
            .andReturn().getResponse().getContentAsString();
        String retry = mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN).header("Idempotency-Key", key)
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(retry).isEqualTo(first);
        String after = mvc.perform(get("/api/v1/appointments").header("Authorization", TOKEN)).andReturn().getResponse().getContentAsString();
        assertThat(after).isEqualTo(before);
        String changed = body.replace("Simulasi permintaan perubahan", "Payload berbeda");
        mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN).header("Idempotency-Key", key)
            .contentType(MediaType.APPLICATION_JSON).content(changed))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("IDEMPOTENCY_CONFLICT"));
    }

    @Test void foreignAppointmentAndInvalidIdempotencyKeyAreRejected() throws Exception {
        String body = "{\"type\":\"APPOINTMENT_CHANGE\",\"appointmentId\":\"foreign-appointment\",\"note\":\"Demo\"}";
        mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN).header("Idempotency-Key", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN).header("Idempotency-Key", "bad-key")
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN)
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
    }

    @Test void historicalAppointmentsCannotBeChanged() throws Exception {
        mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN).header("Idempotency-Key", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"APPOINTMENT_CHANGE\",\"appointmentId\":\"apt-procedure\",\"note\":\"Demo\"}"))
            .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code").value("APPOINTMENT_NOT_CHANGEABLE"));
    }

    @Test void careRequestNoteSupportsTwoThousandCharactersButRejectsLongerInput() throws Exception {
        for (int length : new int[]{2000, 2001}) {
            var response = mvc.perform(post("/api/v1/care-requests").header("Authorization", TOKEN).header("Idempotency-Key", UUID.randomUUID().toString())
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("type", "CONTACT_NURSE", "note", "a".repeat(length)))));
            response.andExpect(length == 2000 ? status().isOk() : status().isBadRequest());
        }
    }

    @Test void acknowledgementsOnlyChangeSelectedReminderAndUnknownIdsFail() throws Exception {
        mvc.perform(patch("/api/v1/reminders/rem-questions").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"completed\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.completed").value(true));
        mvc.perform(patch("/api/v1/reminders/foreign-reminder").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"completed\":true}"))
            .andExpect(status().isNotFound());
        mvc.perform(patch("/api/v1/reminders/rem-questions").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
        // Restore so other tests are independent of ordering.
        mvc.perform(patch("/api/v1/reminders/rem-questions").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"completed\":false}"))
            .andExpect(status().isOk());
    }

    @Test void partnerAccessCannotBeEnabledWithoutConsentWorkflow() throws Exception {
        mvc.perform(patch("/api/v1/preferences").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON)
            .content("{\"serviceNotifications\":true,\"discreetNotifications\":true,\"partnerSharing\":true}"))
            .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code").value("CONSENT_NOT_IMPLEMENTED"));
        mvc.perform(get("/api/v1/overview").header("Authorization", TOKEN)).andExpect(jsonPath("$.preferences.partnerSharing").value(false));
    }

    @Test void chatbotReturnsOnlySeededAppointmentFacts() throws Exception {
        mvc.perform(post("/api/v1/chat").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Kapan janji saya?\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.intent").value("appointment"))
            .andExpect(jsonPath("$.text").value(org.hamcrest.Matchers.containsString("2 November 2026")))
            .andExpect(jsonPath("$.sourceLabel").value("Jadwal sistem sintetis"));
    }

    @Test void clinicalQuestionsAndEmergenciesDoNotGenerateTreatmentAdvice() throws Exception {
        mvc.perform(post("/api/v1/chat").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Berapa dosis obat saya?\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.intent").value("clinical_handoff"))
            .andExpect(jsonPath("$.requiresStaff").value(true));
        mvc.perform(post("/api/v1/chat").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Saya sesak saat mau pergi ke janji konsultasi\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.intent").value("urgent_support"))
            .andExpect(jsonPath("$.text").value(org.hamcrest.Matchers.containsString("IGD")));
        mvc.perform(post("/api/v1/chat").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Apakah embrio saya bagus?\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.intent").value("clinical_handoff"));
    }

    @Test void emptyOrExcessiveChatInputIsRejected() throws Exception {
        mvc.perform(post("/api/v1/chat").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"  \"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/chat").header("Authorization", TOKEN).contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("message", "a".repeat(2001)))))
            .andExpect(status().isBadRequest());
    }

    @Test void corsIsLimitedToKnownDevelopmentOrigins() throws Exception {
        mvc.perform(options("/api/v1/overview").header("Origin", "http://localhost:8081").header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:8081"));
        mvc.perform(options("/api/v1/overview").header("Origin", "https://untrusted.example").header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden());
    }
}
