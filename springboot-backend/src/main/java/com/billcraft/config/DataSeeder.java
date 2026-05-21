package com.billcraft.config;

import com.billcraft.domain.entity.User;
import com.billcraft.domain.enums.Role;
import com.billcraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create default admin if no users exist (first launch after Flyway migration)
        // The Flyway V2 seed inserts a user with a pre-computed BCrypt hash.
        // This seeder ensures the password actually works by re-encoding if needed.
        if (userRepository.count() == 1) {
            User admin = userRepository.findByUsername("admin").orElse(null);
            if (admin != null && !passwordEncoder.matches("admin123", admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(admin);
                log.info("Updated admin password encoding");
            }
        } else if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .email("admin@billcraft.com")
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Created default admin user");
        }
    }
}
