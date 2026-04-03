package com.edutech.eventmanagementsystem.repository;

import com.edutech.eventmanagementsystem.entity.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {
}
