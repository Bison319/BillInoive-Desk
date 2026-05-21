package com.billcraft.controller;

import com.billcraft.domain.entity.ReminderConfig;
import com.billcraft.repository.ReminderConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final ReminderConfigRepository reminderConfigRepository;

    @GetMapping("/reminders")
    public ResponseEntity<List<ReminderConfig>> getReminders() {
        return ResponseEntity.ok(reminderConfigRepository.findAll());
    }

    @PutMapping("/reminders/{id}")
    public ResponseEntity<ReminderConfig> updateReminder(@PathVariable Long id, @RequestBody ReminderConfig config) {
        ReminderConfig existing = reminderConfigRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found: " + id));
        existing.setName(config.getName());
        existing.setIntervalDays(config.getIntervalDays());
        existing.setEnabled(config.isEnabled());
        return ResponseEntity.ok(reminderConfigRepository.save(existing));
    }

    @PostMapping("/reminders")
    public ResponseEntity<ReminderConfig> createReminder(@RequestBody ReminderConfig config) {
        return ResponseEntity.ok(reminderConfigRepository.save(config));
    }
}
