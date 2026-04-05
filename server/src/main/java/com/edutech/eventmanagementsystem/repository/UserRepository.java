package com.edutech.eventmanagementsystem.repository;

import com.edutech.eventmanagementsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    // NEW: Find by email for Forgot Password functionality
    Optional<User> findByEmail(String email);
}