package com.billcraft.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRequest {
    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String email;
    private String address;
    private String gstNumber;
}
