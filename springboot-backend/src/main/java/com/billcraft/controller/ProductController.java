package com.billcraft.controller;

import com.billcraft.domain.entity.Product;
import com.billcraft.dto.GstUpdateRequest;
import com.billcraft.dto.ProductRequest;
import com.billcraft.service.AuditService;
import com.billcraft.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<Product>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            Pageable pageable) {
        return ResponseEntity.ok(productService.search(name, category, pageable));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Product>> getAll() {
        return ResponseEntity.ok(productService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody ProductRequest request) {
        Product product = productService.create(request);
        auditService.log("CREATE", "PRODUCT", product.getId().toString(), "Created product: " + product.getProductName());
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        Product product = productService.update(id, request);
        auditService.log("UPDATE", "PRODUCT", id.toString(), "Updated product: " + product.getProductName());
        return ResponseEntity.ok(product);
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(@PathVariable Long id, @RequestParam int quantity) {
        Product product = productService.updateStock(id, quantity);
        auditService.log("STOCK_UPDATE", "PRODUCT", id.toString(), "Stock adjusted by " + quantity);
        return ResponseEntity.ok(product);
    }

    @PatchMapping("/{id}/gst")
    public ResponseEntity<Product> updateGst(@PathVariable Long id, @Valid @RequestBody GstUpdateRequest request) {
        Product product = productService.updateGst(id, request.getGstPercentage());
        auditService.log("GST_UPDATE", "PRODUCT", id.toString(), "GST updated to " + request.getGstPercentage());
        return ResponseEntity.ok(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        auditService.log("DELETE", "PRODUCT", id.toString(), "Deleted product");
        return ResponseEntity.noContent().build();
    }
}
