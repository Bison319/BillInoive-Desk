package com.billcraft.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class InvoiceRequest {
    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotEmpty(message = "At least one item is required")
    private List<InvoiceItemRequest> items;

    private LocalDate dueDate;
    private String notes;

    @Data
    public static class InvoiceItemRequest {
        private Long productId;
        @NotBlank private String productName;
        @NotNull private Integer quantity;
        @NotNull private BigDecimal unitPrice;
        @NotNull private BigDecimal gstPercentage;
    }
}
