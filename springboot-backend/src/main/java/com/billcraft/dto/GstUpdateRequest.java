package com.billcraft.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class GstUpdateRequest {
    @NotNull(message = "GST percentage is required")
    private BigDecimal gstPercentage;
}
