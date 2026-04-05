package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.dto.LoginRequest;
import com.edutech.eventmanagementsystem.dto.LoginResponse;
import com.edutech.eventmanagementsystem.entity.User;
import com.edutech.eventmanagementsystem.jwt.JwtUtil;
import com.edutech.eventmanagementsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class RegisterAndLoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }
        // Encrypt password and save user (with security questions mapped automatically)
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user.getUsername());
                return ResponseEntity.ok(new LoginResponse(token, user.getRole()));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
    }

    // --- NEW: Forgot Password - Get Security Questions ---
    @PostMapping("/forgot-password/questions")
    public ResponseEntity<?> getSecurityQuestions(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, String> response = new HashMap<>();
            response.put("q1", user.getSecurityQuestion1());
            response.put("q2", user.getSecurityQuestion2());
            response.put("q3", user.getSecurityQuestion3());
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Email not registered in the system."));
    }

    // --- NEW: Forgot Password - Verify Answers & Reset ---
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Verify Answers (Ignoring Case)
            boolean isA1Correct = user.getSecurityAnswer1().equalsIgnoreCase(request.get("a1"));
            boolean isA2Correct = user.getSecurityAnswer2().equalsIgnoreCase(request.get("a2"));
            boolean isA3Correct = user.getSecurityAnswer3().equalsIgnoreCase(request.get("a3"));

            if (isA1Correct && isA2Correct && isA3Correct) {
                // Update Password
                user.setPassword(passwordEncoder.encode(request.get("newPassword")));
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Password successfully updated."));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Security verification failed. Incorrect answers."));
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
    }
}