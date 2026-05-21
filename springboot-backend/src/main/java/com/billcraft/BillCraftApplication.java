package com.billcraft;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BillCraftApplication {

    public static void main(String[] args) {
        // Set default DB path to user's app data directory if not specified
        if (System.getProperty("BILLCRAFT_DB_PATH") == null && System.getenv("BILLCRAFT_DB_PATH") == null) {
            String userHome = System.getProperty("user.home");
            String dbPath = userHome + "/.billcraft/data/billcraftdb";
            System.setProperty("BILLCRAFT_DB_PATH", dbPath);
        }
        if (System.getProperty("BILLCRAFT_LOG_PATH") == null && System.getenv("BILLCRAFT_LOG_PATH") == null) {
            String userHome = System.getProperty("user.home");
            System.setProperty("BILLCRAFT_LOG_PATH", userHome + "/.billcraft/logs/billcraft.log");
        }
        if (System.getProperty("BILLCRAFT_BACKUP_PATH") == null && System.getenv("BILLCRAFT_BACKUP_PATH") == null) {
            String userHome = System.getProperty("user.home");
            System.setProperty("BILLCRAFT_BACKUP_PATH", userHome + "/.billcraft/backups");
        }

        SpringApplication.run(BillCraftApplication.class, args);
    }
}
