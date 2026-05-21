package com.billcraft.controller;

import com.billcraft.domain.entity.Invoice;
import com.billcraft.domain.entity.Payment;
import com.billcraft.domain.enums.InvoiceStatus;
import com.billcraft.dto.InvoiceRequest;
import com.billcraft.repository.InvoiceRepository;
import com.billcraft.repository.PaymentRepository;
import com.billcraft.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PdfService pdfService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<Invoice>> search(
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            Pageable pageable) {
        return ResponseEntity.ok(invoiceService.search(customerId, status, startDate, endDate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getById(id));
    }

    @GetMapping("/pending-dues")
    public ResponseEntity<List<Invoice>> getPendingDues() {
        return ResponseEntity.ok(invoiceService.getPendingDues());
    }

    @PostMapping
    public ResponseEntity<Invoice> create(@Valid @RequestBody InvoiceRequest request) {
        Invoice invoice = invoiceService.create(request);
        auditService.log("CREATE", "INVOICE", invoice.getInvoiceNumber(),
                "Created invoice for " + invoice.getCustomer().getCustomerName() + " - ₹" + invoice.getTotalAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Invoice> cancel(@PathVariable Long id) {
        Invoice invoice = invoiceService.cancel(id);
        auditService.log("CANCEL", "INVOICE", invoice.getInvoiceNumber(), "Invoice cancelled");
        return ResponseEntity.ok(invoice);
    }

    // PDF Download
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        Invoice invoice = invoiceService.getById(id);
        List<Payment> payments = paymentRepository.findByInvoiceId(id);
        byte[] pdf = pdfService.generateInvoicePdf(invoice, payments);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + invoice.getInvoiceNumber() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // Thermal receipt PDF
    @GetMapping("/{id}/thermal")
    public ResponseEntity<byte[]> thermalReceipt(@PathVariable Long id,
                                                  @RequestParam(defaultValue = "80") int paperWidth) {
        Invoice invoice = invoiceService.getById(id);
        List<Payment> payments = paymentRepository.findByInvoiceId(id);
        byte[] pdf = pdfService.generateThermalReceipt(invoice, payments, paperWidth);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + invoice.getInvoiceNumber() + "_receipt.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // HTML Invoice (for printing from browser)
    @GetMapping(value = "/{id}/download", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> downloadHtml(@PathVariable Long id) {
        Invoice inv = invoiceService.getById(id);
        List<Payment> payments = paymentRepository.findByInvoiceId(id);
        String html = buildInvoiceHtml(inv, payments);
        return ResponseEntity.ok()
                .header("Content-Disposition", "inline; filename=\"" + inv.getInvoiceNumber() + ".html\"")
                .body(html);
    }

    @GetMapping("/customer/{customerId}/filter")
    public ResponseEntity<Map<String, Object>> customerInvoices(
            @PathVariable String customerId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) InvoiceStatus status) {
        LocalDateTime s = startDate != null ? LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime e = endDate != null ? LocalDate.parse(endDate).plusDays(1).atStartOfDay() : null;
        List<Invoice> invoices = invoiceRepository.findByCustomerFiltered(customerId, s, e, minAmount, maxAmount, status);

        List<Long> invIds = invoices.stream().map(Invoice::getId).toList();
        List<Payment> allPayments = invIds.isEmpty() ? List.of() : paymentRepository.findByInvoiceIdIn(invIds);

        Map<String, BigDecimal> paymentSplit = allPayments.stream()
                .collect(Collectors.groupingBy(p -> p.getPaymentMethod().name(),
                        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)));

        BigDecimal totalAmount = invoices.stream().map(Invoice::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = invoices.stream().map(Invoice::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPending = invoices.stream().map(Invoice::getPendingAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("invoices", invoices);
        result.put("totalInvoices", invoices.size());
        result.put("totalAmount", totalAmount);
        result.put("totalPaid", totalPaid);
        result.put("totalPending", totalPending);
        result.put("paymentSplit", paymentSplit);
        result.put("totalPayments", allPayments.size());
        return ResponseEntity.ok(result);
    }

    private String buildInvoiceHtml(Invoice inv, List<Payment> payments) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>").append(inv.getInvoiceNumber()).append("</title>");
        sb.append("<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;color:#333;max-width:800px;margin:0 auto}");
        sb.append(".header{text-align:center;border-bottom:3px solid #2d5016;padding-bottom:20px;margin-bottom:20px}");
        sb.append(".header h1{color:#2d5016;font-size:28px}.header h2{color:#666;font-size:16px;margin-top:5px}");
        sb.append("table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#2d5016;color:#fff;padding:10px;text-align:left;font-size:13px}");
        sb.append("td{padding:8px 10px;border-bottom:1px solid #ddd;font-size:13px}.right{text-align:right}");
        sb.append(".totals{margin-top:20px;text-align:right}.totals p{margin:4px 0;font-size:14px}.totals .grand{font-size:18px;font-weight:bold;color:#2d5016}");
        sb.append("@media print{body{padding:15px}.no-print{display:none}}</style></head><body>");
        sb.append("<button class='no-print' onclick='window.print()' style='float:right;padding:8px 16px;background:#2d5016;color:#fff;border:none;border-radius:4px;cursor:pointer'>Print</button>");
        sb.append("<div class='header'><h1>BillCraft</h1><h2>TAX INVOICE</h2></div>");
        sb.append("<p><strong>").append(esc(inv.getCustomer().getCustomerName())).append("</strong> | ");
        sb.append(esc(inv.getCustomer().getMobileNumber()));
        if (inv.getCustomer().getGstNumber() != null) sb.append(" | GST: ").append(esc(inv.getCustomer().getGstNumber()));
        sb.append("</p><p>Invoice: <strong>").append(inv.getInvoiceNumber()).append("</strong> | Status: ").append(inv.getInvoiceStatus()).append("</p>");

        sb.append("<table><thead><tr><th>#</th><th>Product</th><th class='right'>Qty</th><th class='right'>Unit Price</th><th class='right'>GST%</th><th class='right'>GST</th><th class='right'>Total</th></tr></thead><tbody>");
        int i = 1;
        for (var item : inv.getItems()) {
            sb.append("<tr><td>").append(i++).append("</td><td>").append(esc(item.getProductName()))
                    .append("</td><td class='right'>").append(item.getQuantity())
                    .append("</td><td class='right'>₹").append(fmt(item.getUnitPrice()))
                    .append("</td><td class='right'>").append(item.getGstPercentage()).append("%")
                    .append("</td><td class='right'>₹").append(fmt(item.getGstAmount()))
                    .append("</td><td class='right'>₹").append(fmt(item.getTotalPrice())).append("</td></tr>");
        }
        sb.append("</tbody></table>");
        sb.append("<div class='totals'><p>Subtotal: ₹").append(fmt(inv.getTotalAmount().subtract(inv.getGstAmount())))
                .append("</p><p>GST: ₹").append(fmt(inv.getGstAmount()))
                .append("</p><p class='grand'>Total: ₹").append(fmt(inv.getTotalAmount()))
                .append("</p><p>Paid: ₹").append(fmt(inv.getPaidAmount()))
                .append("</p><p>Balance: ₹").append(fmt(inv.getPendingAmount())).append("</p></div>");
        sb.append("<div style='margin-top:30px;text-align:center;font-size:12px;color:#999;border-top:1px solid #ddd;padding-top:15px'>Generated by BillCraft</div></body></html>");
        return sb.toString();
    }

    private String esc(String s) { return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"); }
    private String fmt(BigDecimal n) { return n == null ? "0" : String.format("%,.2f", n); }
}
