package com.HangX.HangX_backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration.
 *
 * Spring Security 7.1 (Spring Boot 4.x) requires HttpMethod enum values instead
 * of plain strings in requestMatchers() — the string overload treats every
 * argument as a path pattern and throws "pattern must start with a /".
 *
 * Rules:
 * - Stateless (JWT-only auth, no server session)
 * - CSRF disabled (SPA + Bearer token pattern)
 * - CORS configured for the Vite dev server
 * - Public: POST /api/v1/rooms (create), POST /api/v1/rooms/{roomId}/join, /chat/**
 * - Everything else requires a valid JWT via JwtAuthFilter
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Admin login — no token yet
                .requestMatchers(HttpMethod.POST,    "/api/v1/admin/login").permitAll()
                // Create room — no token yet, open to anyone
                .requestMatchers(HttpMethod.POST,    "/api/v1/rooms").permitAll()
                // Join room — password in body, token issued by this call
                .requestMatchers(HttpMethod.POST,    "/api/v1/rooms/*/join").permitAll()
                // SockJS handshake + STOMP polling — WS-level auth via interceptor
                .requestMatchers(                    "/chat/**").permitAll()
                // CORS pre-flight requests must always be allowed
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Everything else requires a valid JWT (checked in JwtAuthFilter)
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
