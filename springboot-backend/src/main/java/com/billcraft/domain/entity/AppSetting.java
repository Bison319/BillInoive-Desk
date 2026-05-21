package com.billcraft.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppSetting {
    @Id
    @Column(name = "setting_key", length = 100)
    private String settingKey;

    @Column(name = "setting_value", length = 1000)
    private String settingValue;

    @Column(length = 255)
    private String description;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
