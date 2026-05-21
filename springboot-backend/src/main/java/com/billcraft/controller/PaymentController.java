package com.billcraft.controller;

import com.billcraft.domain.entity.Payment;
import com.billcraft.dto.PaymentRequest;
import com.billcraft.service.AuditService;
import com.billcraft.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final AuditService auditService;

    @PostMapping
    public ResponseEntity<Payment> recordPayment(@Valid @RequestBody PaymentRequest request) {
        Payment payment = paymentService.recordPayment(request);
        auditService.log("PAYMENT", "PAYMENT", payment.getId().toString(),
                "Payment of ₹" + payment.getAmount() + " via " + payment.getPaymentMethod() + " for invoice " + payment.getInvoice().getInvoiceNumber());
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<List<Payment>> getByInvoice(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(paymentService.getByInvoice(invoiceId));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Payment>> getByCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(paymentService.getByCustomer(customerId));
    }

    @GetMapping
    public ResponseEntity<Page<Payment>> getAll(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Pageable pageable) {
        if (startDate != null && endDate != null) {
            LocalDateTime s = LocalDate.parse(startDate).atStartOfDay();
            LocalDateTime e = LocalDate.parse(endDate).plusDays(1).atStartOfDay();
            return ResponseEntity.ok(paymentService.getByDateRangePaged(s, e, pageable));
        }
        return ResponseEntity.ok(paymentService.getAllPaged(pageable));
    }
}
