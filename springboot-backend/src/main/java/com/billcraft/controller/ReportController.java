package com.billcraft.controller;

import com.billcraft.domain.entity.Invoice;
import com.billcraft.domain.entity.Payment;
import com.billcraft.domain.enums.InvoiceStatus;
import com.billcraft.repository.InvoiceRepository;
import com.billcraft.repository.PaymentRepository;
import com.billcraft.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ExportService exportService;

    @GetMapping("/sales/daily")
    public ResponseEntity<Map<String, Object>> dailySales(@RequestParam(required = false) String date) {
        LocalDate reportDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        LocalDateTime start = reportDate.atStartOfDay();
        LocalDateTime end = reportDate.plusDays(1).atStartOfDay();

        List<Payment> payments = paymentRepository.findByCreatedAtBetween(start, end);
        BigDecimal total = payments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, BigDecimal> byMode = payments.stream()
                .collect(Collectors.groupingBy(p -> p.getPaymentMethod().name(),
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)));

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("date", reportDate.toString());
        report.put("totalSales", total);
        report.put("totalTransactions", payments.size());
        report.put("paymentModeBreakdown", byMode);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/sales/monthly")
    public ResponseEntity<Map<String, Object>> monthlySales(@RequestParam int year, @RequestParam int month) {
        LocalDateTime start = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime end = start.plusMonths(1);
        List<Payment> payments = paymentRepository.findByCreatedAtBetween(start, end);
        BigDecimal paymentTotal = payments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Also get invoice totals for this month (more reliable for revenue tracking)
        List<Invoice> invoices = invoiceRepository.findByCreatedAtBetween(start, end);
        BigDecimal invoiceTotal = invoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("year", year);
        report.put("month", month);
        report.put("totalSales", invoiceTotal.compareTo(BigDecimal.ZERO) > 0 ? invoiceTotal : paymentTotal);
        report.put("totalTransactions", Math.max(invoices.size(), payments.size()));
        report.put("invoiceTotal", invoiceTotal);
        report.put("paymentTotal", paymentTotal);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/outstanding-dues")
    public ResponseEntity<List<Map<String, Object>>> outstandingDues() {
        List<Invoice> pending = invoiceRepository.findPendingDues();
        List<Map<String, Object>> result = pending.stream().map(inv -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("invoiceId", inv.getId());
            m.put("invoiceNumber", inv.getInvoiceNumber());
            m.put("customerName", inv.getCustomer().getCustomerName());
            m.put("customerMobile", inv.getCustomer().getMobileNumber());
            m.put("totalAmount", inv.getTotalAmount());
            m.put("paidAmount", inv.getPaidAmount());
            m.put("pendingAmount", inv.getPendingAmount());
            m.put("dueDate", inv.getDueDate());
            m.put("status", inv.getInvoiceStatus().name());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/gst")
    public ResponseEntity<List<Map<String, Object>>> gstReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Invoice> invoices = invoiceRepository.findAll();
        if (startDate != null && endDate != null) {
            LocalDateTime s = LocalDate.parse(startDate).atStartOfDay();
            LocalDateTime e = LocalDate.parse(endDate).plusDays(1).atStartOfDay();
            invoices = invoices.stream()
                    .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isAfter(s) && i.getCreatedAt().isBefore(e))
                    .toList();
        }
        List<Map<String, Object>> result = invoices.stream().map(inv -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("invoiceId", inv.getId());
            m.put("invoiceNumber", inv.getInvoiceNumber());
            m.put("invoiceDate", inv.getCreatedAt());
            m.put("totalAmount", inv.getTotalAmount());
            m.put("gstAmount", inv.getGstAmount());
            m.put("customerName", inv.getCustomer().getCustomerName());
            m.put("gstNumber", inv.getCustomer().getGstNumber());
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/payment-analytics")
    public ResponseEntity<Map<String, Object>> paymentAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Payment> payments;
        if (startDate != null && endDate != null) {
            LocalDateTime s = LocalDate.parse(startDate).atStartOfDay();
            LocalDateTime e = LocalDate.parse(endDate).plusDays(1).atStartOfDay();
            payments = paymentRepository.findByCreatedAtBetween(s, e);
        } else {
            payments = paymentRepository.findAll();
        }
        Map<String, Long> countByMode = payments.stream()
                .collect(Collectors.groupingBy(p -> p.getPaymentMethod().name(), Collectors.counting()));
        Map<String, BigDecimal> amountByMode = payments.stream()
                .collect(Collectors.groupingBy(p -> p.getPaymentMethod().name(),
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)));

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalPayments", payments.size());
        report.put("countByMode", countByMode);
        report.put("amountByMode", amountByMode);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        List<Invoice> all = invoiceRepository.findAll();
        List<Payment> allPayments = paymentRepository.findAll();
        BigDecimal totalSales = all.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPending = all.stream().map(Invoice::getPendingAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalGst = all.stream().map(Invoice::getGstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalSales", totalSales);
        report.put("pendingPayments", totalPending);
        report.put("gstCollected", totalGst);
        report.put("totalInvoices", all.size());
        report.put("totalPayments", allPayments.size());
        return ResponseEntity.ok(report);
    }

    // Export endpoints
    @GetMapping("/export/invoices/excel")
    public ResponseEntity<byte[]> exportInvoicesExcel() {
        List<Invoice> invoices = invoiceRepository.findAll();
        byte[] excel = exportService.exportInvoicesToExcel(invoices);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoices.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/export/invoices/csv")
    public ResponseEntity<String> exportInvoicesCsv() {
        List<Invoice> invoices = invoiceRepository.findAll();
        String csv = exportService.exportInvoicesToCsv(invoices);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoices.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/export/payments/excel")
    public ResponseEntity<byte[]> exportPaymentsExcel() {
        List<Payment> payments = paymentRepository.findAll();
        byte[] excel = exportService.exportPaymentsToExcel(payments);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payments.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/export/payments/csv")
    public ResponseEntity<String> exportPaymentsCsv() {
        List<Payment> payments = paymentRepository.findAll();
        String csv = exportService.exportPaymentsToCsv(payments);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payments.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
