package com.billcraft.repository;

import com.billcraft.domain.entity.ReminderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReminderConfigRepository extends JpaRepository<ReminderConfig, Long> {
    List<ReminderConfig> findByEnabledTrue();
}
