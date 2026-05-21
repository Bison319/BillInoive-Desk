package com.billcraft.repository;

import com.billcraft.domain.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, String> {

    boolean existsByMobileNumber(String mobileNumber);

    @Query("SELECT c FROM Customer c WHERE c.active = true AND " +
           "(:name IS NULL OR LOWER(c.customerName) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:mobile IS NULL OR c.mobileNumber LIKE CONCAT('%', :mobile, '%'))")
    Page<Customer> search(@Param("name") String name, @Param("mobile") String mobile, Pageable pageable);
}
