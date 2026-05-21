package com.billcraft.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.*;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Stream;

@Service
@Slf4j
@RequiredArgsConstructor
public class BackupService {

    private final DataSource dataSource;

    @Value("${billcraft.backup.directory:./backups}")
    private String backupDirectory;

    @Value("${billcraft.backup.max-backups:50}")
    private int maxBackups;

    public String createBackup() {
        try {
            Path backupDir = Paths.get(backupDirectory);
            Files.createDirectories(backupDir);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String backupFile = backupDir.resolve("billcraft_backup_" + timestamp + ".sql").toString();

            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("SCRIPT TO '" + backupFile.replace("\\", "/") + "'");
            }

            cleanupOldBackups();
            log.info("Backup created: {}", backupFile);
            return backupFile;
        } catch (Exception e) {
            log.error("Backup failed", e);
            throw new RuntimeException("Backup failed: " + e.getMessage(), e);
        }
    }

    public void restoreBackup(String backupFilePath) {
        try {
            Path path = Paths.get(backupFilePath);
            if (!Files.exists(path)) {
                throw new IllegalArgumentException("Backup file not found: " + backupFilePath);
            }

            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("DROP ALL OBJECTS");
                stmt.execute("RUNSCRIPT FROM '" + backupFilePath.replace("\\", "/") + "'");
            }

            log.info("Restored from backup: {}", backupFilePath);
        } catch (Exception e) {
            log.error("Restore failed", e);
            throw new RuntimeException("Restore failed: " + e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> listBackups() {
        try {
            Path backupDir = Paths.get(backupDirectory);
            if (!Files.exists(backupDir)) return List.of();

            try (Stream<Path> paths = Files.list(backupDir)) {
                return paths
                        .filter(p -> p.toString().endsWith(".sql"))
                        .sorted(Comparator.reverseOrder())
                        .map(p -> {
                            Map<String, Object> info = new LinkedHashMap<>();
                            info.put("fileName", p.getFileName().toString());
                            info.put("filePath", p.toString());
                            try {
                                info.put("size", Files.size(p));
                                info.put("created", Files.getLastModifiedTime(p).toString());
                            } catch (IOException e) {
                                info.put("size", 0);
                            }
                            return info;
                        })
                        .toList();
            }
        } catch (IOException e) {
            log.error("Failed to list backups", e);
            return List.of();
        }
    }

    public void deleteBackup(String fileName) {
        try {
            Path backupFile = Paths.get(backupDirectory, fileName);
            Files.deleteIfExists(backupFile);
            log.info("Deleted backup: {}", fileName);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete backup: " + e.getMessage(), e);
        }
    }

    private void cleanupOldBackups() {
        try {
            Path backupDir = Paths.get(backupDirectory);
            try (Stream<Path> paths = Files.list(backupDir)) {
                List<Path> backups = paths
                        .filter(p -> p.toString().endsWith(".sql"))
                        .sorted(Comparator.comparing(p -> {
                            try { return Files.getLastModifiedTime(p); } catch (IOException e) { return null; }
                        }))
                        .toList();

                if (backups.size() > maxBackups) {
                    for (int i = 0; i < backups.size() - maxBackups; i++) {
                        Files.deleteIfExists(backups.get(i));
                        log.info("Cleaned up old backup: {}", backups.get(i));
                    }
                }
            }
        } catch (IOException e) {
            log.warn("Failed to cleanup old backups", e);
        }
    }

    // Auto backup every 24 hours
    @Scheduled(fixedDelayString = "${billcraft.backup.interval:86400000}", initialDelay = 60000)
    public void scheduledBackup() {
        log.info("Running scheduled backup...");
        try {
            createBackup();
        } catch (Exception e) {
            log.error("Scheduled backup failed", e);
        }
    }
}
