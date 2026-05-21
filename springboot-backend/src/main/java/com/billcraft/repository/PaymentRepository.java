package com.billcraft.repository;

import com.billcraft.domain.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByInvoiceId(Long invoiceId);

    List<Payment> findByCustomerMobileNumber(String mobileNumber);

    List<Payment> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.id = :invoiceId")
    BigDecimal sumByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT p FROM Payment p WHERE p.invoice.id IN :invoiceIds")
    List<Payment> findByInvoiceIdIn(@Param("invoiceIds") List<Long> invoiceIds);

    @Query("SELECT p FROM Payment p WHERE " +
           "(:start IS NULL OR p.createdAt >= :start) AND " +
           "(:end IS NULL OR p.createdAt <= :end)")
    Page<Payment> findByCreatedAtBetweenPaged(@Param("start") LocalDateTime start,
                                               @Param("end") LocalDateTime end,
                                               Pageable pageable);
}
