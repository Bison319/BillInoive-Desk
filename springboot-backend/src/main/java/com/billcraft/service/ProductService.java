package com.billcraft.service;

import com.billcraft.domain.entity.Product;
import com.billcraft.dto.ProductRequest;
import com.billcraft.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional
    public Product create(ProductRequest req) {
        Product product = Product.builder()
                .productName(req.getProductName())
                .category(req.getCategory())
                .unitPrice(req.getUnitPrice())
                .gstPercentage(req.getGstPercentage())
                .stockQuantity(req.getStockQuantity() != null ? req.getStockQuantity() : 0)
                .active(true)
                .build();
        return productRepository.save(product);
    }

    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
    }

    public Page<Product> search(String name, String category, Pageable pageable) {
        return productRepository.search(name, category, pageable);
    }

    public List<Product> getAll() {
        return productRepository.findByActiveTrue();
    }

    @Transactional
    public Product update(Long id, ProductRequest req) {
        Product product = getById(id);
        product.setProductName(req.getProductName());
        product.setCategory(req.getCategory());
        product.setUnitPrice(req.getUnitPrice());
        product.setGstPercentage(req.getGstPercentage());
        if (req.getStockQuantity() != null) {
            product.setStockQuantity(req.getStockQuantity());
        }
        return productRepository.save(product);
    }

    @Transactional
    public Product updateStock(Long id, int quantity) {
        Product product = getById(id);
        product.setStockQuantity(product.getStockQuantity() + quantity);
        return productRepository.save(product);
    }

    @Transactional
    public Product updateGst(Long id, BigDecimal gstPercentage) {
        Product product = getById(id);
        product.setGstPercentage(gstPercentage);
        return productRepository.save(product);
    }

    @Transactional
    public void delete(Long id) {
        Product product = getById(id);
        product.setActive(false);
        productRepository.save(product);
    }
}
