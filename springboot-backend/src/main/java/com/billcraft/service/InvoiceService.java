package com.billcraft.service;

import com.billcraft.domain.entity.*;
import com.billcraft.domain.enums.InvoiceStatus;
import com.billcraft.dto.InvoiceRequest;
import com.billcraft.repository.CustomerRepository;
import com.billcraft.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final AtomicLong invoiceCounter = new AtomicLong(0);

    private long nextInvoiceNum() {
        if (invoiceCounter.get() == 0) {
            long max = invoiceRepository.findAll().stream()
                    .map(Invoice::getInvoiceNumber)
                    .filter(n -> n != null && n.startsWith("INV-"))
                    .mapToLong(n -> {
                        try { return Long.parseLong(n.substring(4)); } catch (Exception e) { return 0; }
                    })
                    .max().orElse(1000);
            invoiceCounter.set(max);
        }
        return invoiceCounter.incrementAndGet();
    }

    @Transactional
    public Invoice create(InvoiceRequest req) {
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + req.getCustomerId()));

        Invoice invoice = Invoice.builder()
                .invoiceNumber("INV-" + nextInvoiceNum())
                .customer(customer)
                .invoiceStatus(InvoiceStatus.DRAFT)
                .paidAmount(BigDecimal.ZERO)
                .dueDate(req.getDueDate())
                .notes(req.getNotes())
                .build();

        BigDecimal totalGst = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (InvoiceRequest.InvoiceItemRequest itemReq : req.getItems()) {
            BigDecimal lineAmount = itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal itemGst = lineAmount.multiply(itemReq.getGstPercentage())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal itemTotal = lineAmount.add(itemGst);

            InvoiceItem item = InvoiceItem.builder()
                    .productId(itemReq.getProductId())
                    .productName(itemReq.getProductName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .gstPercentage(itemReq.getGstPercentage())
                    .gstAmount(itemGst)
                    .totalPrice(itemTotal)
                    .build();
            invoice.addItem(item);

            totalGst = totalGst.add(itemGst);
            totalAmount = totalAmount.add(itemTotal);
        }

        invoice.setGstAmount(totalGst);
        invoice.setTotalAmount(totalAmount);
        invoice.setPendingAmount(totalAmount);

        return invoiceRepository.save(invoice);
    }

    public Invoice getById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
    }

    public Page<Invoice> search(String customerId, InvoiceStatus status,
                                LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return invoiceRepository.search(customerId, status, startDate, endDate, pageable);
    }

    public List<Invoice> getPendingDues() {
        return invoiceRepository.findPendingDues();
    }

    @Transactional
    public Invoice updatePaidAmount(Long invoiceId, BigDecimal totalPaid) {
        Invoice invoice = getById(invoiceId);
        invoice.setPaidAmount(totalPaid);
        invoice.setPendingAmount(invoice.getTotalAmount().subtract(totalPaid));
        if (totalPaid.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setInvoiceStatus(InvoiceStatus.PAID);
            invoice.setPendingAmount(BigDecimal.ZERO);
        } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            invoice.setInvoiceStatus(InvoiceStatus.PARTIALLY_PAID);
        }
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice cancel(Long id) {
        Invoice invoice = getById(id);
        invoice.setInvoiceStatus(InvoiceStatus.CANCELLED);
        return invoiceRepository.save(invoice);
    }
}
