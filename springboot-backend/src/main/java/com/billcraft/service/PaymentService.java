package com.billcraft.service;

import com.billcraft.domain.entity.*;
import com.billcraft.domain.enums.PaymentMethod;
import com.billcraft.dto.PaymentRequest;
import com.billcraft.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceService invoiceService;

    @Transactional
    public Payment recordPayment(PaymentRequest req) {
        Invoice invoice = invoiceService.getById(req.getInvoiceId());
        if (req.getAmount().compareTo(invoice.getPendingAmount()) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds pending amount of " + invoice.getPendingAmount());
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .customer(invoice.getCustomer())
                .amount(req.getAmount())
                .paymentMethod(PaymentMethod.valueOf(req.getPaymentMethod().toUpperCase()))
                .transactionReference(req.getTransactionReference())
                .notes(req.getNotes())
                .build();
        paymentRepository.save(payment);

        BigDecimal totalPaid = paymentRepository.sumByInvoiceId(invoice.getId());
        invoiceService.updatePaidAmount(invoice.getId(), totalPaid);

        return payment;
    }

    public List<Payment> getByInvoice(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId);
    }

    public List<Payment> getByCustomer(String customerId) {
        return paymentRepository.findByCustomerMobileNumber(customerId);
    }

    public List<Payment> getByDateRange(LocalDateTime start, LocalDateTime end) {
        return paymentRepository.findByCreatedAtBetween(start, end);
    }

    public List<Payment> getAll() {
        return paymentRepository.findAll();
    }

    public Page<Payment> getAllPaged(Pageable pageable) {
        return paymentRepository.findAll(pageable);
    }

    public Page<Payment> getByDateRangePaged(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return paymentRepository.findByCreatedAtBetweenPaged(start, end, pageable);
    }
}
