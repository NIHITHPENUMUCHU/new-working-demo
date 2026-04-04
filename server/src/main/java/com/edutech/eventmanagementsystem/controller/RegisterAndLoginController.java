package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.dto.LoginRequest;
import com.edutech.eventmanagementsystem.dto.LoginResponse;
import com.edutech.eventmanagementsystem.entity.User;
import com.edutech.eventmanagementsystem.jwt.JwtUtil;
import com.edutech.eventmanagementsystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class RegisterAndLoginController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            // CRITICAL FIX: Safely catches bad logins and informs Angular
            Map<String, String> error = new HashMap<>();
            error.put("message", "Incorrect username or password");
            return ResponseEntity.status(401).body(error);
        }

        final UserDetails userDetails = userService.loadUserByUsername(request.getUsername());
        final String token = jwtUtil.generateToken(userDetails.getUsername());
        User user = userService.findByUsername(request.getUsername());

        return ResponseEntity.ok(new LoginResponse(token, user.getRole()));
    }

    @PostMapping("/generate-otp")
    public ResponseEntity<?> generateOtp(@RequestBody Map<String, String> payload) {
        try {
            userService.generateAndSendOtp(payload.get("email"));
            return ResponseEntity.ok().body("{\"message\": \"OTP sent successfully to your email.\"}");
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/reset-with-otp")
    public ResponseEntity<?> resetWithOtp(@RequestBody Map<String, String> payload) {
        try {
            userService.resetPasswordWithOtp(
                payload.get("email"), 
                payload.get("otp"), 
                payload.get("newPassword")
            );
            return ResponseEntity.ok().body("{\"message\": \"Password reset successfully.\"}");
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }

}
