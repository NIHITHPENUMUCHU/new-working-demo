package com.edutech.eventmanagementsystem.repository;

import com.edutech.eventmanagementsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    
    // NEW: Fetches the list of staff members for the Planner's dropdown
    List<User> findByRole(String role); 
}