package com.billcraft.repository;

import com.billcraft.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByCustomerId(String customerId);
    List<Notification> findByInvoiceId(Long invoiceId);
}
