package com.edutech.eventmanagementsystem.service;

import com.edutech.eventmanagementsystem.entity.User;
import com.edutech.eventmanagementsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Date;
import java.util.Random;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    public User registerUser(User user) {
        // FIXED: Uses isPresent() for Optional
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        // FIXED: Uses orElse(null) for Optional
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // FIXED: Uses orElseThrow() for Optional
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole()))
        );
    }

    public void generateAndSendOtp(String email) {
        // FIXED: Uses orElse(null)
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            throw new RuntimeException("No account found with that email address.");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        
        user.setResetOtp(otp);
        user.setOtpExpiryTime(new Date(System.currentTimeMillis() + 10 * 60 * 1000));
        userRepository.save(user);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("EventMaster Pro - Password Reset Code");
        message.setText("Your secure password reset code is: " + otp + "\n\nThis code will expire in 10 minutes.");
        mailSender.send(message);
    }

    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        // FIXED: Uses orElse(null)
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) throw new RuntimeException("User not found.");

        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP code.");
        }

        if (user.getOtpExpiryTime().before(new Date())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetOtp(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);
    }
}