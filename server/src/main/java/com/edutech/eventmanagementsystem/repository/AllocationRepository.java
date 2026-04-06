package com.edutech.eventmanagementsystem.repository;

import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    // Allows us to instantly fetch all resources tied to a completing event!
    List<Allocation> findByEvent(Event event);
}