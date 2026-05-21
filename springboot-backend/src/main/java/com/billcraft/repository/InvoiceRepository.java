package com.billcraft.repository;

import com.billcraft.domain.entity.Invoice;
import com.billcraft.domain.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Invoice> findByCustomerMobileNumber(String mobileNumber);

    List<Invoice> findByInvoiceStatus(InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE " +
           "(:customerId IS NULL OR i.customer.mobileNumber = :customerId) AND " +
           "(:status IS NULL OR i.invoiceStatus = :status) AND " +
           "(:startDate IS NULL OR i.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR i.createdAt <= :endDate)")
    Page<Invoice> search(@Param("customerId") String customerId,
                         @Param("status") InvoiceStatus status,
                         @Param("startDate") LocalDateTime startDate,
                         @Param("endDate") LocalDateTime endDate,
                         Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.pendingAmount > 0 AND i.invoiceStatus <> 'CANCELLED' ORDER BY i.dueDate ASC")
    List<Invoice> findPendingDues();

    @Query("SELECT i FROM Invoice i WHERE i.customer.mobileNumber = :customerId AND " +
           "(:startDate IS NULL OR i.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR i.createdAt <= :endDate) AND " +
           "(:minAmount IS NULL OR i.totalAmount >= :minAmount) AND " +
           "(:maxAmount IS NULL OR i.totalAmount <= :maxAmount) AND " +
           "(:status IS NULL OR i.invoiceStatus = :status)")
    List<Invoice> findByCustomerFiltered(@Param("customerId") String customerId,
                                         @Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate,
                                         @Param("minAmount") BigDecimal minAmount,
                                         @Param("maxAmount") BigDecimal maxAmount,
                                         @Param("status") InvoiceStatus status);
}
