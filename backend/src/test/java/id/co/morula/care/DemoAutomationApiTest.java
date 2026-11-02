package id.co.morula.care;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class DemoAutomationApiTest {
    @Autowired MockMvc mvc;
    @Test void routeIsAuthenticatedScopedAndReadOnly() throws Exception {
        mvc.perform(get("/api/v1/automation-preview")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/automation-preview").header("Authorization", "Bearer demo-patient-token"))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.deliveryEnabled").value(false)).andExpect(jsonPath("$.jobs.length()").value(2))
            .andExpect(jsonPath("$.jobs[0].appointmentId").value("apt-next"));
        mvc.perform(get("/api/v1/automation-preview").param("patientId", "patient-other").header("Authorization", "Bearer demo-patient-token"))
            .andExpect(status().isBadRequest());
    }
    @Test void evaluationTimeIsValidatedAndAfterStartJobsAreExpired() throws Exception {
        mvc.perform(get("/api/v1/automation-preview").param("at", "bad-date").header("Authorization", "Bearer demo-patient-token"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_EVALUATION_TIME"));
        mvc.perform(get("/api/v1/automation-preview").param("at", "2026-11-02T10:00:00+07:00").header("Authorization", "Bearer demo-patient-token"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.jobs[0].status").value("expired"))
            .andExpect(jsonPath("$.jobs[1].status").value("expired"));
    }
}
