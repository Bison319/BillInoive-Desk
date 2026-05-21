package com.billcraft.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnore
    private Invoice invoice;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name", length = 100)
    private String productName;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "gst_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal gstPercentage = BigDecimal.ZERO;

    @Column(name = "gst_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal gstAmount = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;
}
