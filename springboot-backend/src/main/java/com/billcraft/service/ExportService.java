package com.billcraft.service;

import com.billcraft.domain.entity.Invoice;
import com.billcraft.domain.entity.Payment;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public byte[] exportInvoicesToExcel(List<Invoice> invoices) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Invoices");

            // Header row
            Row header = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {"Invoice #", "Customer", "Mobile", "Total Amount", "GST Amount",
                    "Paid Amount", "Pending Amount", "Status", "Due Date", "Created Date"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Invoice inv : invoices) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(inv.getInvoiceNumber());
                row.createCell(1).setCellValue(inv.getCustomer().getCustomerName());
                row.createCell(2).setCellValue(inv.getCustomer().getMobileNumber());
                row.createCell(3).setCellValue(inv.getTotalAmount().doubleValue());
                row.createCell(4).setCellValue(inv.getGstAmount().doubleValue());
                row.createCell(5).setCellValue(inv.getPaidAmount().doubleValue());
                row.createCell(6).setCellValue(inv.getPendingAmount().doubleValue());
                row.createCell(7).setCellValue(inv.getInvoiceStatus().name());
                row.createCell(8).setCellValue(inv.getDueDate() != null ? inv.getDueDate().format(DATE_FMT) : "");
                row.createCell(9).setCellValue(inv.getCreatedAt() != null ? inv.getCreatedAt().format(DATE_FMT) : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Excel export failed: " + e.getMessage(), e);
        }
    }

    public byte[] exportPaymentsToExcel(List<Payment> payments) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payments");

            Row header = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {"Invoice #", "Customer", "Amount", "Method", "Reference", "Date"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Payment p : payments) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getInvoice().getInvoiceNumber());
                row.createCell(1).setCellValue(p.getCustomer().getCustomerName());
                row.createCell(2).setCellValue(p.getAmount().doubleValue());
                row.createCell(3).setCellValue(p.getPaymentMethod().name());
                row.createCell(4).setCellValue(p.getTransactionReference() != null ? p.getTransactionReference() : "");
                row.createCell(5).setCellValue(p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FMT) : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Excel export failed: " + e.getMessage(), e);
        }
    }

    public String exportInvoicesToCsv(List<Invoice> invoices) {
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            writer.writeNext(new String[]{"Invoice #", "Customer", "Mobile", "Total", "GST",
                    "Paid", "Pending", "Status", "Due Date", "Created"});
            for (Invoice inv : invoices) {
                writer.writeNext(new String[]{
                        inv.getInvoiceNumber(),
                        inv.getCustomer().getCustomerName(),
                        inv.getCustomer().getMobileNumber(),
                        fmt(inv.getTotalAmount()),
                        fmt(inv.getGstAmount()),
                        fmt(inv.getPaidAmount()),
                        fmt(inv.getPendingAmount()),
                        inv.getInvoiceStatus().name(),
                        inv.getDueDate() != null ? inv.getDueDate().format(DATE_FMT) : "",
                        inv.getCreatedAt() != null ? inv.getCreatedAt().format(DATE_FMT) : ""
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("CSV export failed: " + e.getMessage(), e);
        }
        return sw.toString();
    }

    public String exportPaymentsToCsv(List<Payment> payments) {
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            writer.writeNext(new String[]{"Invoice #", "Customer", "Amount", "Method", "Reference", "Date"});
            for (Payment p : payments) {
                writer.writeNext(new String[]{
                        p.getInvoice().getInvoiceNumber(),
                        p.getCustomer().getCustomerName(),
                        fmt(p.getAmount()),
                        p.getPaymentMethod().name(),
                        p.getTransactionReference() != null ? p.getTransactionReference() : "",
                        p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FMT) : ""
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("CSV export failed: " + e.getMessage(), e);
        }
        return sw.toString();
    }

    private String fmt(BigDecimal n) {
        return n == null ? "0.00" : n.toPlainString();
    }
}
