package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.dto.LoginRequest;
import com.edutech.eventmanagementsystem.dto.LoginResponse;
import com.edutech.eventmanagementsystem.entity.User;
import com.edutech.eventmanagementsystem.jwt.JwtUtil;
import com.edutech.eventmanagementsystem.repository.UserRepository;
import com.edutech.eventmanagementsystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class RegisterAndLoginController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            userService.registerUser(user); 
            return ResponseEntity.ok(Map.of("message", "User registered successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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

    @PostMapping("/forgot-password/questions")
    public ResponseEntity<?> getSecurityQuestions(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, String> response = new HashMap<>();
            
            // Ensure we don't send nulls to the frontend
            response.put("q1", user.getSecurityQuestion1() != null ? user.getSecurityQuestion1() : "Question 1 not set");
            response.put("q2", user.getSecurityQuestion2() != null ? user.getSecurityQuestion2() : "Question 2 not set");
            response.put("q3", user.getSecurityQuestion3() != null ? user.getSecurityQuestion3() : "Question 3 not set");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Email not registered in the system."));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // 1. Safe extraction (Protects against NullPointerExceptions from old accounts)
            String dbA1 = user.getSecurityAnswer1() == null ? "" : user.getSecurityAnswer1().trim();
            String dbA2 = user.getSecurityAnswer2() == null ? "" : user.getSecurityAnswer2().trim();
            String dbA3 = user.getSecurityAnswer3() == null ? "" : user.getSecurityAnswer3().trim();
            
            String reqA1 = request.get("a1") == null ? "" : request.get("a1").trim();
            String reqA2 = request.get("a2") == null ? "" : request.get("a2").trim();
            String reqA3 = request.get("a3") == null ? "" : request.get("a3").trim();

            // 2. Strict Checking: Database value must not be empty, and must match the request
            boolean isA1Correct = !dbA1.isEmpty() && dbA1.equalsIgnoreCase(reqA1);
            boolean isA2Correct = !dbA2.isEmpty() && dbA2.equalsIgnoreCase(reqA2);
            boolean isA3Correct = !dbA3.isEmpty() && dbA3.equalsIgnoreCase(reqA3);

            if (isA1Correct && isA2Correct && isA3Correct) {
                
                String newPassword = request.get("newPassword");
                
                // 3. THE FIX: Check if new password is the SAME as the old password
                if (passwordEncoder.matches(newPassword, user.getPassword())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Your new password cannot be the exact same as your current password."));
                }

                // 4. Save the new password securely
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Password successfully updated."));
                
            } else {
                // If answers are wrong, actively throw a Bad Request (400)
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Security verification failed. One or more answers are incorrect."));
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
    }
}