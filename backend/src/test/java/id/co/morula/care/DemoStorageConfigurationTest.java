package id.co.morula.care;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class DemoStorageConfigurationTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withUserConfiguration(DemoStorageConfiguration.class);

    @Test void memoryIsExplicitlyUsableWithoutDatabaseConfiguration() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getBean(DemoStateStore.class)).isInstanceOf(MemoryDemoStateStore.class);
            assertThat(context).doesNotHaveBean(javax.sql.DataSource.class);
        });
    }

    @Test void unknownStorageFailsClosed() {
        runner.withPropertyValues("morula.demo-storage=typo")
            .run(context -> assertThat(context).hasFailed());
    }

    @Test void postgresDoesNotFallBackWhenConnectionConfigurationIsMissing() {
        runner.withPropertyValues("morula.demo-storage=postgres")
            .run(context -> assertThat(context).hasFailed());
    }
}
