package com.billcraft.controller;

import com.billcraft.domain.entity.Customer;
import com.billcraft.dto.CustomerRequest;
import com.billcraft.service.AuditService;
import com.billcraft.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<Customer>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String mobile,
            Pageable pageable) {
        return ResponseEntity.ok(customerService.search(name, mobile, pageable));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Customer>> getAll() {
        return ResponseEntity.ok(customerService.getAll());
    }

    @GetMapping("/{mobileNumber}")
    public ResponseEntity<Customer> getById(@PathVariable String mobileNumber) {
        return ResponseEntity.ok(customerService.getById(mobileNumber));
    }

    @PostMapping
    public ResponseEntity<Customer> create(@Valid @RequestBody CustomerRequest request) {
        Customer customer = customerService.create(request);
        auditService.log("CREATE", "CUSTOMER", customer.getMobileNumber(), "Created customer: " + customer.getCustomerName());
        return ResponseEntity.status(HttpStatus.CREATED).body(customer);
    }

    @PutMapping("/{mobileNumber}")
    public ResponseEntity<Customer> update(@PathVariable String mobileNumber, @Valid @RequestBody CustomerRequest request) {
        Customer customer = customerService.update(mobileNumber, request);
        auditService.log("UPDATE", "CUSTOMER", mobileNumber, "Updated customer: " + customer.getCustomerName());
        return ResponseEntity.ok(customer);
    }

    @DeleteMapping("/{mobileNumber}")
    public ResponseEntity<Void> delete(@PathVariable String mobileNumber) {
        customerService.delete(mobileNumber);
        auditService.log("DELETE", "CUSTOMER", mobileNumber, "Deleted customer");
        return ResponseEntity.noContent().build();
    }
}
