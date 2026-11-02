package id.co.morula.care;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

/** Public demonstration token. Never use it as real authentication. ModeGuard blocks non-demo startup. */
@Configuration
class DemoSecurity {
    @Bean
    UserDetailsService noPasswordAccounts() {
        return username -> { throw new UsernameNotFoundException("Password login is not implemented in this demo."); };
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, ObjectMapper mapper) throws Exception {
        return http
            .csrf(csrf -> csrf.disable()) // No cookies/session, only explicit bearer header.
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().denyAll())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, ex) -> write(mapper, response, 401, "UNAUTHORIZED", "Sesi demo tidak valid."))
                .accessDeniedHandler((request, response, ex) -> write(mapper, response, 403, "FORBIDDEN", "Akses tidak tersedia.")))
            .addFilterBefore(new OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setHeader("Cache-Control", "no-store");
                        if (request.getParameterMap().containsKey("patientId")) {
                            write(mapper, response, 400, "PATIENT_SCOPE_FORBIDDEN", "Identitas pasien ditentukan oleh sesi, bukan parameter permintaan.");
                            return;
                        }
                        if ("Bearer demo-patient-token".equals(request.getHeader("Authorization"))) {
                            var identity = new Models.PatientIdentity(DemoRepository.PATIENT_ID);
                            var auth = new UsernamePasswordAuthenticationToken(identity, null, List.of(new SimpleGrantedAuthority("ROLE_PATIENT")));
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    }
                    chain.doFilter(request, response);
                }
            }, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:8081", "http://localhost:19006"));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        config.setAllowCredentials(false);
        config.setMaxAge(600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    private static void write(ObjectMapper mapper, HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getWriter(), new Models.ApiError(code, message));
    }
}
