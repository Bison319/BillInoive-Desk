package com.billcraft.controller;

import com.billcraft.dto.AuthResponse;
import com.billcraft.dto.LoginRequest;
import com.billcraft.dto.RegisterRequest;
import com.billcraft.service.AuditService;
import com.billcraft.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuditService auditService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        auditService.log("LOGIN", "USER", request.getUsername(), "User logged in");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        auditService.log("REGISTER", "USER", request.getUsername(), "User registered");
        return ResponseEntity.ok(response);
    }
}
