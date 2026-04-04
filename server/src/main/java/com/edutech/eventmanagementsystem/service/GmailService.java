package com.edutech.eventmanagementsystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class GmailService {

    // Injecting the JavaMailSender just like the video
    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String targetEmail, String otp) {
        // Constructing the email message
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("your.app.email@gmail.com"); // Put your sender email here
        message.setTo(targetEmail);
        message.setSubject("EventMaster Pro - OTP Verification");
        message.setText("Your secure OTP for password reset is: " + otp + "\n\nThis code is valid for 10 minutes. Do not share it with anyone.");

        // Sending the email
        mailSender.send(message);
    }
}
