package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.repository.NotificationRepository;
import com.edutech.eventmanagementsystem.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
public class StaffController {

    @Autowired private EventService eventService;
    @Autowired private NotificationRepository notificationRepository;

    @GetMapping("/events/{username}")
    public ResponseEntity<List<Event>> getStaffEvents(@PathVariable String username) {
        return ResponseEntity.ok(eventService.getEventsForStaff(username));
    }

    @PutMapping("/update-setup/{id}")
    public ResponseEntity<Event> updateEventStatus(@PathVariable Long id, @RequestBody Event event) {
        return ResponseEntity.ok(eventService.updateEvent(id, event));
    }

    // --- FETCH VISIBLE NOTIFICATIONS ONLY ---
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getStaffNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Notification> allNotifs = notificationRepository.findAll();
        
        List<Notification> targetNotifs = allNotifs.stream()
            // Keep notifications that are public to ALL staff, OR private to THIS staff member
            .filter(n -> "STAFF".equalsIgnoreCase(n.getTargetRole()) || ("STAFF_" + username).equalsIgnoreCase(n.getTargetRole()))
            .sorted((n1, n2) -> n2.getId().compareTo(n1.getId()))
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(targetNotifs);
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        Notification notif = notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        notif.setIsRead(true);
        notificationRepository.save(notif);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Notification> allNotifs = notificationRepository.findAll();
        
        List<Notification> targetNotifs = allNotifs.stream()
            .filter(n -> "STAFF".equalsIgnoreCase(n.getTargetRole()) || ("STAFF_" + username).equalsIgnoreCase(n.getTargetRole()))
            .collect(Collectors.toList());
            
        for (Notification n : targetNotifs) n.setIsRead(true);
        notificationRepository.saveAll(targetNotifs);
        return ResponseEntity.ok().build();
    }
}