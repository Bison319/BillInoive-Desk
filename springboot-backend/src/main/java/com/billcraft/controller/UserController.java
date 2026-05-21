package com.billcraft.controller;

import com.billcraft.domain.entity.User;
import com.billcraft.repository.UserRepository;
import com.billcraft.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<List<User>> getAll() {
        List<User> users = userRepository.findAll();
        // Don't expose password hashes
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestAttribute(name = "username", required = false) String username,
                                                @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Extract username from JWT token via security context
        String user = username;
        if (user == null) {
            user = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
        }
        User found = userRepository.findByUsername(user).orElse(null);
        if (found != null) found.setPassword(null);
        return ResponseEntity.ok(found);
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<User> toggleActive(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(!user.isActive());
        userRepository.save(user);
        user.setPassword(null);
        auditService.log("UPDATE", "USER", user.getUsername(), "User " + (user.isActive() ? "activated" : "deactivated"));
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Map<String, String>> changePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 4) {
            throw new IllegalArgumentException("Password must be at least 4 characters");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditService.log("UPDATE", "USER", user.getUsername(), "Password changed");
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
        if (body.containsKey("email")) user.setEmail(body.get("email"));
        userRepository.save(user);
        user.setPassword(null);
        auditService.log("UPDATE", "USER", user.getUsername(), "User profile updated");
        return ResponseEntity.ok(user);
    }
}
