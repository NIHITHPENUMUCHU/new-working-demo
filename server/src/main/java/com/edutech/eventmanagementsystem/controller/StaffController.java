package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.repository.EventRepository;
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

    @Autowired
    private EventService eventService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // --- THE MISSING ENDPOINT: Micro-Permissions Security Filter ---
    @GetMapping("/events/{username}")
    public ResponseEntity<List<Event>> getEventsForSpecificStaff(@PathVariable String username) {
        List<Event> allEvents = eventRepository.findAll();
        
        List<Event> authorizedEvents = allEvents.stream()
            .filter(e -> e.getAssignedStaffUsername() == null 
                      || e.getAssignedStaffUsername().trim().isEmpty() 
                      || e.getAssignedStaffUsername().equalsIgnoreCase(username))
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(authorizedEvents);
    }

    @GetMapping("/event-details/{eventId}")
    public ResponseEntity<Event> getEventDetails(@PathVariable("eventId") Long eventId) {
        try {
            return ResponseEntity.ok(eventService.getEventById(eventId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/update-setup/{eventId}")
    public ResponseEntity<Event> updateSetup(@PathVariable("eventId") Long eventId, @RequestBody Event event) {
        try {
            return ResponseEntity.ok(eventService.updateEvent(eventId, event));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- UPDATED: Targeted Notifications Engine ---
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getStaffNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Notification> allNotifs = notificationRepository.findAll();
        
        // Fetches generic "STAFF" messages AND specific "STAFF_username" messages
        List<Notification> targetNotifs = allNotifs.stream()
            .filter(n -> "STAFF".equals(n.getTargetRole()) || ("STAFF_" + username).equalsIgnoreCase(n.getTargetRole()))
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
            .filter(n -> "STAFF".equals(n.getTargetRole()) || ("STAFF_" + username).equalsIgnoreCase(n.getTargetRole()))
            .collect(Collectors.toList());
            
        for (Notification n : targetNotifs) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(targetNotifs);
        return ResponseEntity.ok().build();
    }
}