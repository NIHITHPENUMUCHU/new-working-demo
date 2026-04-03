package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Resource;
import com.edutech.eventmanagementsystem.service.EventService;
import com.edutech.eventmanagementsystem.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planner")
@CrossOrigin(origins = "*")
public class EventPlannerController {

    @Autowired
    private EventService eventService;

    @Autowired
    private ResourceService resourceService;

    @PostMapping("/event")
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        return ResponseEntity.ok(eventService.createEvent(event));
    }

    @GetMapping("/events")
    public ResponseEntity<List<Event>> getEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @PostMapping("/resource")
    public ResponseEntity<Resource> addResource(@RequestBody Resource resource) {
        return ResponseEntity.ok(resourceService.addResource(resource));
    }

    @GetMapping("/resources")
    public ResponseEntity<List<Resource>> getResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    // THE FIX: Uses @PathVariable to match Angular's URL perfectly!
    @PostMapping("/allocate-resource/{eventId}/{resourceId}")
    public ResponseEntity<Allocation> allocateResource(
            @PathVariable("eventId") Long eventId,
            @PathVariable("resourceId") Long resourceId,
            @RequestBody Allocation allocation) {
        
        // This now perfectly matches the ResourceService signature!
        return ResponseEntity.ok(resourceService.allocateResource(eventId, resourceId, allocation.getQuantity()));
    }

    @GetMapping("/allocations")
    public ResponseEntity<List<Allocation>> getAllocations() {
        return ResponseEntity.ok(resourceService.getAllAllocations()); 
    }

    // --- NOTIFICATION ENDPOINTS ---
    @Autowired
    private com.edutech.eventmanagementsystem.repository.NotificationRepository notificationRepository;

    @GetMapping("/notifications")
    public org.springframework.http.ResponseEntity<java.util.List<com.edutech.eventmanagementsystem.entity.Notification>> getPlannerNotifications() {
        return org.springframework.http.ResponseEntity
                .ok(notificationRepository.findByTargetRoleOrderByIdDesc("PLANNER"));
    }

    @PutMapping("/notifications/{id}/read")
    public org.springframework.http.ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        com.edutech.eventmanagementsystem.entity.Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        notif.setIsRead(true);
        notificationRepository.save(notif);
        return org.springframework.http.ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/read-all")
    public org.springframework.http.ResponseEntity<?> markAllNotificationsRead() {
        java.util.List<com.edutech.eventmanagementsystem.entity.Notification> notifs = notificationRepository
                .findByTargetRoleOrderByIdDesc("PLANNER");
        for (com.edutech.eventmanagementsystem.entity.Notification n : notifs) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(notifs);
        return org.springframework.http.ResponseEntity.ok().build();
    }
}