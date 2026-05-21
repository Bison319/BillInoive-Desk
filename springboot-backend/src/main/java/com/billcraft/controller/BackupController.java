package com.billcraft.controller;

import com.billcraft.service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/backup")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService backupService;

    @PostMapping
    public ResponseEntity<Map<String, String>> createBackup() {
        String path = backupService.createBackup();
        return ResponseEntity.ok(Map.of("message", "Backup created successfully", "path", path));
    }

    @PostMapping("/restore")
    public ResponseEntity<Map<String, String>> restore(@RequestBody Map<String, String> request) {
        backupService.restoreBackup(request.get("filePath"));
        return ResponseEntity.ok(Map.of("message", "Restore completed successfully"));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listBackups() {
        return ResponseEntity.ok(backupService.listBackups());
    }

    @DeleteMapping("/{fileName}")
    public ResponseEntity<Void> deleteBackup(@PathVariable String fileName) {
        backupService.deleteBackup(fileName);
        return ResponseEntity.noContent().build();
    }
}
