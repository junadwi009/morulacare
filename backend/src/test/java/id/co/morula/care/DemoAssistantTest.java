package id.co.morula.care;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import java.util.List;
import org.junit.jupiter.api.Test;

class DemoAssistantTest {
    @Test void upcomingAppointmentIsChronologicalAndUsesBranchTimeZone() {
        var repository = mock(DemoRepository.class);
        var later = new Models.Appointment("later", "Konsultasi akhir", "Dokter demo", "Cabang demo", "2026-11-04T09:00:00+07:00", "Asia/Jakarta", "confirmed", "Demo", List.of(), "Data sintetis");
        var earlier = new Models.Appointment("earlier", "Konsultasi awal", "Dokter demo", "Cabang demo", "2026-11-02T09:00:00+07:00", "Asia/Makassar", "confirmed", "Demo", List.of(), "Data sintetis");
        var cancelled = new Models.Appointment("cancelled", "Janji batal", "Dokter demo", "Cabang demo", "2026-11-01T09:00:00+07:00", "Asia/Jakarta", "cancelled", "Demo", List.of(), "Data sintetis");
        when(repository.appointments("patient-demo")).thenReturn(List.of(later, cancelled, earlier));
        var reply = new DemoAssistant(repository).reply("patient-demo", "Kapan janji saya?");
        assertThat(reply.text()).contains("Konsultasi awal", "2 November 2026", "10.00 WITA").doesNotContain("Konsultasi akhir", "Janji batal", " WIB ");
    }
}
