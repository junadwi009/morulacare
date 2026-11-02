package id.co.morula.care;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;

// Storage is deliberately selected independently of the exact demo-only profile guard.
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, FlywayAutoConfiguration.class})
public class MorulaCareApplication {
    public static void main(String[] args) {
        SpringApplication.run(MorulaCareApplication.class, args);
    }
}
