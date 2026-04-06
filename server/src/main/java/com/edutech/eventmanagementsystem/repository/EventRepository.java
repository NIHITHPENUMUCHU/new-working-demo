package com.edutech.eventmanagementsystem.repository;

import com.edutech.eventmanagementsystem.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    // --- STAFF VISIBILITY ENGINE ---
    // Fetches events explicitly assigned to the staff member, OR assigned to Public (null, empty, or 'PUBLIC')
    @Query("SELECT e FROM Event e WHERE e.assignedStaffUsername = :username OR e.assignedStaffUsername IS NULL OR e.assignedStaffUsername = '' OR e.assignedStaffUsername = 'PUBLIC'")
    List<Event> findEventsForStaff(@Param("username") String username);
}