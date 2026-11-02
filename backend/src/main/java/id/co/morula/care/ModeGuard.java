package id.co.morula.care;

import java.util.Arrays;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
class ModeGuard {
    @Bean
    static BeanFactoryPostProcessor requireExplicitDemoProfile(Environment environment) {
        return factory -> {
            if (!Arrays.equals(environment.getActiveProfiles(), new String[]{"demo"})) {
                throw new IllegalStateException("Only the explicit demo profile is supported. Production identity and hospital adapters are not implemented. Local synthetic persistence does not authorize clinical deployment.");
            }
        };
    }
}
