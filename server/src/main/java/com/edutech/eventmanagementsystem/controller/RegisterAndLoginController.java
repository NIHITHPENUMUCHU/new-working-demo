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
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.registerUser(user));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) throws Exception {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        final UserDetails userDetails = userService.loadUserByUsername(request.getUsername());
        final String token = jwtUtil.generateToken(userDetails.getUsername());
        User user = userService.findByUsername(request.getUsername());

        return ResponseEntity.ok(new LoginResponse(token, user.getRole()));
    }

    // NEW: OTP Endpoints
    @PostMapping("/generate-otp")
    public ResponseEntity<?> generateOtp(@RequestBody Map<String, String> payload) {
        try {
            userService.generateAndSendOtp(payload.get("email"));
            return ResponseEntity.ok().body("{\"message\": \"OTP sent successfully\"}");
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
            return ResponseEntity.ok().body("{\"message\": \"Password reset successfully\"}");
        } catch (Exception e) {
            return ResponseEntity.status(400).body("{\"message\": \"" + e.getMessage() + "\"}");
        }
    }
}