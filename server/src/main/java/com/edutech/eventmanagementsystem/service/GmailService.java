package com.edutech.eventmanagementsystem.service;

import org.springframework.stereotype.Service;

@Service
public class GmailService {
    
    // We have completely removed the @Autowired JavaMailSender 
    // because EventMaster Pro now uses the 3-Question Security Verification 
    // instead of Gmail OTPs.
    
    public void sendOtpEmail(String to, String otp) {
        // Deprecated - Email functionality safely bypassed.
        System.out.println("OTP Email bypassed for: " + to);
    }
}