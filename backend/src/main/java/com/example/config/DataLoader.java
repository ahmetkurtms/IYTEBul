package com.example.config;

import com.example.models.Role;
import com.example.models.User;
import com.example.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if admin user already exists
        User existingAdmin = userRepository.findUserByUniMail("admin@std.iyte.edu.tr");
        
        if (existingAdmin == null) {
            // Create admin user
            User admin = new User();
            admin.setName("System");
            admin.setSurname("Administrator");
            admin.setNickname("admin");
            admin.setUniMail("admin@std.iyte.edu.tr");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setCreated_at(LocalDateTime.now());
            admin.setBanned_status(false);
            admin.setRole(Role.ADMIN);
            admin.setIsVerified(true);
            admin.setDepartment("System Administration");
            
            userRepository.save(admin);
            System.out.println("Admin user created successfully:");
            System.out.println("Email: admin@std.iyte.edu.tr");
            System.out.println("Password: admin123");
            System.out.println("Role: ADMIN");
        } else {
            System.out.println("Admin user already exists");
        }
    }
} 