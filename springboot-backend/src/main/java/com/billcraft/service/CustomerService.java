package com.billcraft.service;

import com.billcraft.domain.entity.Customer;
import com.billcraft.dto.CustomerRequest;
import com.billcraft.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public Customer create(CustomerRequest req) {
        if (customerRepository.existsByMobileNumber(req.getMobileNumber())) {
            throw new IllegalArgumentException("Customer with mobile " + req.getMobileNumber() + " already exists");
        }
        Customer customer = Customer.builder()
                .mobileNumber(req.getMobileNumber())
                .customerName(req.getCustomerName())
                .email(req.getEmail())
                .address(req.getAddress())
                .gstNumber(req.getGstNumber())
                .active(true)
                .build();
        return customerRepository.save(customer);
    }

    public Customer getById(String mobileNumber) {
        return customerRepository.findById(mobileNumber)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + mobileNumber));
    }

    public Page<Customer> search(String name, String mobile, Pageable pageable) {
        return customerRepository.search(name, mobile, pageable);
    }

    public List<Customer> getAll() {
        return customerRepository.findAll().stream().filter(Customer::isActive).toList();
    }

    @Transactional
    public Customer update(String mobileNumber, CustomerRequest req) {
        Customer customer = getById(mobileNumber);
        customer.setCustomerName(req.getCustomerName());
        customer.setEmail(req.getEmail());
        customer.setAddress(req.getAddress());
        customer.setGstNumber(req.getGstNumber());
        return customerRepository.save(customer);
    }

    @Transactional
    public void delete(String mobileNumber) {
        Customer customer = getById(mobileNumber);
        customer.setActive(false);
        customerRepository.save(customer);
    }
}
