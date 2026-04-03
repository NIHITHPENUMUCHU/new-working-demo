package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
public class StaffController {

    @Autowired
    private EventService eventService;

    // Injected for the new Staff Orbital Beacon
    @Autowired
    private com.edutech.eventmanagementsystem.repository.NotificationRepository notificationRepository;

    @GetMapping("/event-details/{eventId}")
    public ResponseEntity<Event> getEventDetails(@PathVariable("eventId") Long eventId) {
        try {
            // THE FIX: Removed .orElse(null) since the Service already unwraps it!
            Event event = eventService.getEventById(eventId);
            return ResponseEntity.ok(event);
        } catch (RuntimeException e) {
            // Safely returns a 404 if the Event ID doesn't exist
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

    // THE NOTIFICATION ENDPOINT: Fetches live alerts for the Staff Header Beacon
    @GetMapping("/notifications")
    public ResponseEntity<java.util.List<com.edutech.eventmanagementsystem.entity.Notification>> getStaffNotifications() {
        return ResponseEntity.ok(notificationRepository.findByTargetRoleOrderByIdDesc("STAFF"));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        com.edutech.eventmanagementsystem.entity.Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        notif.setIsRead(true);
        notificationRepository.save(notif);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead() {
        java.util.List<com.edutech.eventmanagementsystem.entity.Notification> notifs = notificationRepository
                .findByTargetRoleOrderByIdDesc("STAFF");
        for (com.edutech.eventmanagementsystem.entity.Notification n : notifs) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(notifs);
        return ResponseEntity.ok().build();
    }

}
