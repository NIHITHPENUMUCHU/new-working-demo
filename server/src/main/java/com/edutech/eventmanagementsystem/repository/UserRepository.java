package com.edutech.eventmanagementsystem.repository;

import com.edutech.eventmanagementsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Finds a user by their username (Used for Login & Duplicate Checks)
    Optional<User> findByUsername(String username);
    
    // Finds a user by their email (Used for Duplicate Checks)
    Optional<User> findByEmail(String email);
}
