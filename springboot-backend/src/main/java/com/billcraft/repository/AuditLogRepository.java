package com.billcraft.repository;

import com.billcraft.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:username IS NULL OR a.username = :username) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> search(@Param("action") String action,
                          @Param("entityType") String entityType,
                          @Param("username") String username,
                          Pageable pageable);
}
