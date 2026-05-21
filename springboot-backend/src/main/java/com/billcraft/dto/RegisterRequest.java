package com.billcraft.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String username;
    @NotBlank private String password;
    private String fullName;
    private String email;
    private String role;
}
