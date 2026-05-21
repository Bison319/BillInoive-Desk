package com.billcraft.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reminder_config")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReminderConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String name;

    @Column(name = "interval_days", nullable = false)
    @Builder.Default
    private Integer intervalDays = 7;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
