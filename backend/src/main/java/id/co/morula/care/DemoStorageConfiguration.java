package id.co.morula.care;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods = false)
class DemoStorageConfiguration {
    @Bean static BeanFactoryPostProcessor requireKnownDemoStorage(Environment environment) {
        return factory -> {
            String storage = environment.getProperty("morula.demo-storage", "memory");
            if (!"memory".equals(storage) && !"postgres".equals(storage)) {
                throw new IllegalStateException("morula.demo-storage must be memory or postgres; no fallback is permitted.");
            }
        };
    }

    @Bean
    @ConditionalOnProperty(name = "morula.demo-storage", havingValue = "memory", matchIfMissing = true)
    DemoStateStore memoryDemoStateStore() { return new MemoryDemoStateStore(); }

    @Configuration(proxyBeanMethods = false)
    @ConditionalOnProperty(name = "morula.demo-storage", havingValue = "postgres")
    static class PostgresStorage {
        @Bean(destroyMethod = "close")
        HikariDataSource demoDataSource(Environment environment) {
            var config = new HikariConfig();
            config.setJdbcUrl(environment.getRequiredProperty("spring.datasource.url"));
            config.setUsername(environment.getRequiredProperty("spring.datasource.username"));
            config.setPassword(environment.getRequiredProperty("spring.datasource.password"));
            config.setMaximumPoolSize(4);
            config.setMinimumIdle(1);
            config.setConnectionTimeout(5000);
            config.setInitializationFailTimeout(10000);
            config.setPoolName("morula-demo");
            return new HikariDataSource(config);
        }

        @Bean(initMethod = "migrate")
        Flyway demoFlyway(DataSource dataSource) {
            return Flyway.configure().dataSource(dataSource).cleanDisabled(true)
                .locations("classpath:db/migration").load();
        }

        @Bean
        DemoStateStore postgresDemoStateStore(DataSource dataSource, Flyway demoFlyway) {
            // The Flyway dependency ensures initialization completes before any seed/query.
            return new PostgresDemoStateStore(dataSource);
        }
    }
}
