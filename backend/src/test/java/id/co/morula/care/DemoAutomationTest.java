package id.co.morula.care;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class DemoAutomationTest {
    private final DemoRepository repository = mock(DemoRepository.class);
    private final DemoAutomation automation = new DemoAutomation(repository, "24,2");

    private Models.Appointment appointment(String id, String status, String startsAt, String timeZone) {
        return new Models.Appointment(id, "Private clinical title", "Private clinician", "Private branch", startsAt, timeZone, status, "Private location", List.of(), "Demo");
    }
    private void seedConfirmed() {
        when(repository.appointments("patient-demo")).thenReturn(List.of(appointment("apt-demo", "confirmed", "2026-11-02T10:00:00+07:00", "Asia/Jakarta")));
    }

    @Test void twoSampleRulesArePlannedWithGenericNotificationContent() {
        seedConfirmed();
        var preview = automation.evaluate("patient-demo", null);
        assertThat(preview.dataMode()).isEqualTo("DEMO");
        assertThat(preview.deliveryEnabled()).isFalse();
        assertThat(preview.evaluatedAt()).isEqualTo(DemoAutomation.DEFAULT_AT);
        assertThat(preview.jobs()).hasSize(2).allSatisfy(job -> {
            assertThat(job.status()).isEqualTo("planned");
            assertThat(job.channel()).isEqualTo("IN_APP_DEMO");
            assertThat(job.body()).isEqualTo("Ada jadwal perawatan yang perlu Anda tinjau.");
            assertThat(job.title()).isEqualTo("Pengingat kunjungan");
        });
        assertThat(preview.jobs()).extracting(DemoAutomation.Job::dueAt).containsExactly("2026-11-01T10:00:00+07:00", "2026-11-02T08:00:00+07:00");
    }

    @Test void duplicateEvaluationHasStableIdsAndOnlyChangesTimeDerivedStatus() {
        seedConfirmed();
        var first = automation.evaluate("patient-demo", null);
        assertThat(automation.evaluate("patient-demo", null)).isEqualTo(first);
        var later = automation.evaluate("patient-demo", "2026-11-02T08:30:00+07:00");
        assertThat(later.jobs()).extracting(DemoAutomation.Job::id).containsExactlyElementsOf(first.jobs().stream().map(DemoAutomation.Job::id).toList());
        assertThat(later.jobs()).extracting(DemoAutomation.Job::status).containsOnly("due");
        assertThat(later.jobs()).extracting(DemoAutomation.Job::id).doesNotHaveDuplicates();
    }

    @Test void cancelledRescheduledCompletedAndNoShowAppointmentsProduceNoJobs() {
        var appointments = Stream.of("cancelled", "rescheduled", "completed", "no_show")
            .map(status -> appointment("apt-" + status, status, "2026-11-02T10:00:00+07:00", "Asia/Jakarta")).toList();
        when(repository.appointments("patient-demo")).thenReturn(appointments);
        assertThat(automation.evaluate("patient-demo", "2026-11-02T09:00:00+07:00").jobs()).isEmpty();
    }

    @Test void branchTimezoneAndInstantComparisonAreIndependentOfInputOffset() {
        when(repository.appointments("patient-demo")).thenReturn(List.of(appointment("apt-wita", "confirmed", "2026-11-02T09:00:00+07:00", "Asia/Makassar")));
        var preview = automation.evaluate("patient-demo", "2026-11-01T02:00:00Z");
        assertThat(preview.jobs().getFirst().dueAt()).isEqualTo("2026-11-01T10:00:00+08:00");
        assertThat(preview.jobs().getFirst().status()).isEqualTo("due");
        assertThat(preview.jobs().get(1).dueAt()).isEqualTo("2026-11-02T08:00:00+08:00");
        assertThat(preview.jobs().get(1).status()).isEqualTo("planned");
    }

    @Test void remindersExpireAtAppointmentStartAndRemainExpiredAfterIt() {
        seedConfirmed();
        for (String at : List.of("2026-11-02T10:00:00+07:00", "2026-11-03T12:00:00+07:00")) {
            assertThat(automation.evaluate("patient-demo", at).jobs()).extracting(DemoAutomation.Job::status).containsOnly("expired");
        }
    }

    @Test void rulesAreConfigurableAndChangingSourceStartChangesJobIdentity() {
        seedConfirmed();
        var original = new DemoAutomation(repository, "48,3,3").evaluate("patient-demo", null);
        assertThat(original.jobs()).hasSize(2);
        assertThat(original.jobs().getFirst().dueAt()).isEqualTo("2026-10-31T10:00:00+07:00");
        when(repository.appointments("patient-demo")).thenReturn(List.of(appointment("apt-demo", "confirmed", "2026-11-03T10:00:00+07:00", "Asia/Jakarta")));
        var moved = new DemoAutomation(repository, "48,3").evaluate("patient-demo", null);
        assertThat(moved.jobs()).extracting(DemoAutomation.Job::id).doesNotContainAnyElementsOf(original.jobs().stream().map(DemoAutomation.Job::id).toList());
    }

    @Test void malformedTimeAndInvalidRuleConfigurationFailClearly() {
        assertThatThrownBy(() -> automation.evaluate("patient-demo", "2026-10-31T09:15:00")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> new DemoAutomation(repository, "0,2")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new DemoAutomation(repository, "24,invalid")).isInstanceOf(IllegalArgumentException.class);
    }
}
