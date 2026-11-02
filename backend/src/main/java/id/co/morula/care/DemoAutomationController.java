package id.co.morula.care;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/automation-preview")
class DemoAutomationController {
    private final DemoAutomation automation;
    DemoAutomationController(DemoAutomation automation) { this.automation = automation; }

    @GetMapping
    DemoAutomation.Preview preview(@AuthenticationPrincipal Models.PatientIdentity identity, @RequestParam(required = false) String at) {
        return automation.evaluate(identity.patientId(), at);
    }
}
