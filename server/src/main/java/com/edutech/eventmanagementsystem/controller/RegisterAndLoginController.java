package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.dto.LoginRequest;
import com.edutech.eventmanagementsystem.dto.LoginResponse;
import com.edutech.eventmanagementsystem.entity.User;
import com.edutech.eventmanagementsystem.jwt.JwtUtil;
import com.edutech.eventmanagementsystem.service.UserService;
import com.edutech.eventmanagementsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class RegisterAndLoginController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        
        // 1. Check if the username is already taken
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
        }
        
        // 2. Check if the email is already taken
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already exists");
        }

        // 3. If no duplicates are found, proceed with saving the user
        return ResponseEntity.ok(userService.registerUser(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> createAuthToken(@RequestBody LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );
        } catch (BadCredentialsException e) {
            // REQUIRED FOR TEST CASE 6
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Incorrect username or password");
        }

        final UserDetails userDetails = userService.loadUserByUsername(loginRequest.getUsername());
        final String jwt = jwtUtil.generateToken(userDetails.getUsername());
        
        // Fetch the user from the database to get their true role
        // Since authentication succeeded above, we know this user exists, so .get() is safe to use.
        User loggedInUser = userRepository.findByUsername(loginRequest.getUsername()).get();

        // Return the JWT token AND the role back to Angular
        return ResponseEntity.ok(new LoginResponse(jwt, loggedInUser.getRole()));
    }
}
