package id.co.morula.care;

import static id.co.morula.care.Models.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
class PatientController {
    private final DemoRepository repository;
    private final DemoAssistant assistant;
    PatientController(DemoRepository repository, DemoAssistant assistant) {
        this.repository = repository;
        this.assistant = assistant;
    }
    @GetMapping("/overview") Overview overview(@AuthenticationPrincipal PatientIdentity identity) { return repository.overview(identity.patientId()); }
    @GetMapping("/embryos") List<Embryo> embryos(@AuthenticationPrincipal PatientIdentity identity) { return repository.embryos(identity.patientId()); }
    @GetMapping("/activities") List<Activity> activities(@AuthenticationPrincipal PatientIdentity identity) { return repository.activities(identity.patientId()); }
    @GetMapping("/appointments") List<Appointment> appointments(@AuthenticationPrincipal PatientIdentity identity) { return repository.appointments(identity.patientId()); }
    @PostMapping("/chat") ChatReply chat(@AuthenticationPrincipal PatientIdentity identity, @Valid @RequestBody ChatRequest request) { return assistant.reply(identity.patientId(), request.message()); }
    @PostMapping("/care-requests") CareReceipt careRequest(@AuthenticationPrincipal PatientIdentity identity, @RequestHeader("Idempotency-Key") String key, @Valid @RequestBody CareRequest request) { return repository.request(identity.patientId(), key, request); }
    @PatchMapping("/reminders/{id}") Reminder reminder(@AuthenticationPrincipal PatientIdentity identity, @PathVariable String id, @Valid @RequestBody ReminderPatch patch) { return repository.acknowledge(identity.patientId(), id, patch.completed()); }
    @PatchMapping("/preferences") Preferences preferences(@AuthenticationPrincipal PatientIdentity identity, @Valid @RequestBody PreferencesPatch patch) { return repository.preferences(identity.patientId(), patch); }
}
