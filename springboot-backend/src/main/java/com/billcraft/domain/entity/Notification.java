package com.billcraft.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", length = 15)
    private String customerId;

    @Column(name = "invoice_id")
    private Long invoiceId;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 20)
    @Builder.Default
    private String channel = "EMAIL";

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
