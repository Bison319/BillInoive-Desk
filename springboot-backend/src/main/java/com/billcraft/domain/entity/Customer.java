package com.billcraft.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer {
    @Id
    @Column(name = "mobile_number", length = 15)
    private String mobileNumber;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(length = 100)
    private String email;

    @Column(length = 500)
    private String address;

    @Column(name = "gst_number", length = 20)
    private String gstNumber;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }
}
