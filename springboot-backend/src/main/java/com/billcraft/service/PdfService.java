package com.billcraft.service;

import com.billcraft.domain.entity.Invoice;
import com.billcraft.domain.entity.InvoiceItem;
import com.billcraft.domain.entity.Payment;
import com.billcraft.repository.AppSettingRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final AppSettingRepository settingRepository;

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(45, 80, 22));
    private static final Font SUBTITLE_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(100, 100, 100));
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
    private static final Font BODY_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.BLACK);
    private static final Font BOLD_FONT = new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK);
    private static final Font TOTAL_FONT = new Font(Font.HELVETICA, 14, Font.BOLD, new Color(45, 80, 22));
    private static final Color HEADER_BG = new Color(45, 80, 22);
    private static final Color ALT_ROW = new Color(245, 245, 245);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    public byte[] generateInvoicePdf(Invoice invoice, List<Payment> payments) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            String companyName = getSetting("company.name", "BillCraft");

            // Header
            Paragraph title = new Paragraph(companyName, TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            doc.add(title);

            Paragraph subtitle = new Paragraph("TAX INVOICE", SUBTITLE_FONT);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(15);
            doc.add(subtitle);

            // Invoice Info + Customer Info table
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(15);

            // Bill To
            PdfPCell billTo = new PdfPCell();
            billTo.setBorder(0);
            billTo.addElement(new Paragraph("Bill To:", BOLD_FONT));
            billTo.addElement(new Paragraph(invoice.getCustomer().getCustomerName(), BOLD_FONT));
            billTo.addElement(new Paragraph("Mobile: " + invoice.getCustomer().getMobileNumber(), BODY_FONT));
            if (invoice.getCustomer().getAddress() != null) {
                billTo.addElement(new Paragraph(invoice.getCustomer().getAddress(), BODY_FONT));
            }
            if (invoice.getCustomer().getGstNumber() != null) {
                billTo.addElement(new Paragraph("GST: " + invoice.getCustomer().getGstNumber(), BODY_FONT));
            }
            infoTable.addCell(billTo);

            // Invoice Details
            PdfPCell invDetails = new PdfPCell();
            invDetails.setBorder(0);
            invDetails.setHorizontalAlignment(Element.ALIGN_RIGHT);
            invDetails.addElement(rightAlign("Invoice #: " + invoice.getInvoiceNumber(), BOLD_FONT));
            if (invoice.getCreatedAt() != null) {
                invDetails.addElement(rightAlign("Date: " + invoice.getCreatedAt().format(DATE_FMT), BODY_FONT));
            }
            if (invoice.getDueDate() != null) {
                invDetails.addElement(rightAlign("Due: " + invoice.getDueDate().format(DATE_FMT), BODY_FONT));
            }
            invDetails.addElement(rightAlign("Status: " + invoice.getInvoiceStatus().name(), BODY_FONT));
            infoTable.addCell(invDetails);
            doc.add(infoTable);

            // Items Table
            PdfPTable itemsTable = new PdfPTable(new float[]{5, 30, 8, 15, 8, 15, 19});
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingAfter(10);

            addHeaderCell(itemsTable, "#");
            addHeaderCell(itemsTable, "Product");
            addHeaderCell(itemsTable, "Qty");
            addHeaderCell(itemsTable, "Unit Price");
            addHeaderCell(itemsTable, "GST%");
            addHeaderCell(itemsTable, "GST Amt");
            addHeaderCell(itemsTable, "Total");

            int row = 1;
            for (InvoiceItem item : invoice.getItems()) {
                Color bg = (row % 2 == 0) ? ALT_ROW : Color.WHITE;
                addBodyCell(itemsTable, String.valueOf(row), bg, Element.ALIGN_CENTER);
                addBodyCell(itemsTable, item.getProductName(), bg, Element.ALIGN_LEFT);
                addBodyCell(itemsTable, String.valueOf(item.getQuantity()), bg, Element.ALIGN_CENTER);
                addBodyCell(itemsTable, "₹" + fmt(item.getUnitPrice()), bg, Element.ALIGN_RIGHT);
                addBodyCell(itemsTable, item.getGstPercentage() + "%", bg, Element.ALIGN_CENTER);
                addBodyCell(itemsTable, "₹" + fmt(item.getGstAmount()), bg, Element.ALIGN_RIGHT);
                addBodyCell(itemsTable, "₹" + fmt(item.getTotalPrice()), bg, Element.ALIGN_RIGHT);
                row++;
            }
            doc.add(itemsTable);

            // Totals
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(50);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalsTable.setSpacingAfter(15);

            addTotalRow(totalsTable, "Subtotal:", "₹" + fmt(invoice.getTotalAmount().subtract(invoice.getGstAmount())));
            addTotalRow(totalsTable, "GST:", "₹" + fmt(invoice.getGstAmount()));
            addTotalRow(totalsTable, "Grand Total:", "₹" + fmt(invoice.getTotalAmount()));
            addTotalRow(totalsTable, "Paid:", "₹" + fmt(invoice.getPaidAmount()));
            addTotalRow(totalsTable, "Balance:", "₹" + fmt(invoice.getPendingAmount()));
            doc.add(totalsTable);

            // Payment History
            if (payments != null && !payments.isEmpty()) {
                doc.add(new Paragraph("Payment History", BOLD_FONT));
                doc.add(Chunk.NEWLINE);

                PdfPTable payTable = new PdfPTable(new float[]{25, 20, 25, 30});
                payTable.setWidthPercentage(100);
                addHeaderCell(payTable, "Date");
                addHeaderCell(payTable, "Method");
                addHeaderCell(payTable, "Amount");
                addHeaderCell(payTable, "Reference");

                for (Payment p : payments) {
                    addBodyCell(payTable, p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FMT) : "-", Color.WHITE, Element.ALIGN_LEFT);
                    addBodyCell(payTable, p.getPaymentMethod().name(), Color.WHITE, Element.ALIGN_LEFT);
                    addBodyCell(payTable, "₹" + fmt(p.getAmount()), Color.WHITE, Element.ALIGN_RIGHT);
                    addBodyCell(payTable, p.getTransactionReference() != null ? p.getTransactionReference() : "-", Color.WHITE, Element.ALIGN_LEFT);
                }
                doc.add(payTable);
            }

            // Footer
            doc.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph("Thank you for your business! | Generated by " + companyName,
                    new Font(Font.HELVETICA, 9, Font.ITALIC, Color.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    public byte[] generateThermalReceipt(Invoice invoice, List<Payment> payments, int paperWidthMm) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            float widthPt = paperWidthMm * 2.83f; // mm to points
            Document doc = new Document(new com.lowagie.text.Rectangle(widthPt, 2000), 5, 5, 5, 5);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font smallBold = new Font(Font.COURIER, 8, Font.BOLD);
            Font small = new Font(Font.COURIER, 7, Font.NORMAL);
            Font tinyFont = new Font(Font.COURIER, 6, Font.NORMAL);

            String companyName = getSetting("company.name", "BillCraft");

            // Header
            Paragraph header = new Paragraph(companyName, smallBold);
            header.setAlignment(Element.ALIGN_CENTER);
            doc.add(header);

            doc.add(new Paragraph("--------------------------------", tinyFont));
            doc.add(new Paragraph("Invoice: " + invoice.getInvoiceNumber(), small));
            if (invoice.getCreatedAt() != null) {
                doc.add(new Paragraph("Date: " + invoice.getCreatedAt().format(DATE_FMT), small));
            }
            doc.add(new Paragraph("Customer: " + invoice.getCustomer().getCustomerName(), small));
            doc.add(new Paragraph("Mobile: " + invoice.getCustomer().getMobileNumber(), small));
            doc.add(new Paragraph("--------------------------------", tinyFont));

            // Items
            for (InvoiceItem item : invoice.getItems()) {
                doc.add(new Paragraph(item.getProductName(), small));
                doc.add(new Paragraph(
                        "  " + item.getQuantity() + " x ₹" + fmt(item.getUnitPrice()) +
                        " = ₹" + fmt(item.getTotalPrice()), tinyFont));
            }

            doc.add(new Paragraph("--------------------------------", tinyFont));
            doc.add(new Paragraph("Subtotal: ₹" + fmt(invoice.getTotalAmount().subtract(invoice.getGstAmount())), small));
            doc.add(new Paragraph("GST:      ₹" + fmt(invoice.getGstAmount()), small));
            doc.add(new Paragraph("TOTAL:    ₹" + fmt(invoice.getTotalAmount()), smallBold));
            doc.add(new Paragraph("Paid:     ₹" + fmt(invoice.getPaidAmount()), small));
            doc.add(new Paragraph("Balance:  ₹" + fmt(invoice.getPendingAmount()), small));
            doc.add(new Paragraph("--------------------------------", tinyFont));

            Paragraph thanks = new Paragraph("Thank you!", smallBold);
            thanks.setAlignment(Element.ALIGN_CENTER);
            doc.add(thanks);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Thermal receipt generation failed: " + e.getMessage(), e);
        }
    }

    private String getSetting(String key, String defaultValue) {
        return settingRepository.findById(key)
                .map(s -> s.getSettingValue() != null ? s.getSettingValue() : defaultValue)
                .orElse(defaultValue);
    }

    private Paragraph rightAlign(String text, Font font) {
        Paragraph p = new Paragraph(text, font);
        p.setAlignment(Element.ALIGN_RIGHT);
        return p;
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, HEADER_FONT));
        cell.setBackgroundColor(HEADER_BG);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, BODY_FONT));
        cell.setBackgroundColor(bg);
        cell.setPadding(4);
        cell.setHorizontalAlignment(align);
        table.addCell(cell);
    }

    private void addTotalRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, BOLD_FONT));
        labelCell.setBorder(0);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(3);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, BOLD_FONT));
        valueCell.setBorder(0);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(3);
        table.addCell(valueCell);
    }

    private String fmt(BigDecimal n) {
        return n == null ? "0.00" : String.format("%,.2f", n);
    }
}
