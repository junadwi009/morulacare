package id.co.morula.care;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class ModeGuardTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner().withUserConfiguration(ModeGuard.class);
    @Test void noProfileFailsClosed() {
        runner.run(context -> assertThat(context).hasFailed());
    }
    @Test void productionProfileFailsClosed() {
        runner.withInitializer(context -> context.getEnvironment().setActiveProfiles("production"))
            .run(context -> assertThat(context).hasFailed());
    }
    @Test void mixedProfilesFailClosed() {
        runner.withInitializer(context -> context.getEnvironment().setActiveProfiles("demo", "production"))
            .run(context -> assertThat(context).hasFailed());
    }
    @Test void explicitDemoProfileIsAccepted() {
        runner.withInitializer(context -> context.getEnvironment().setActiveProfiles("demo"))
            .run(context -> assertThat(context).hasNotFailed());
    }
}
