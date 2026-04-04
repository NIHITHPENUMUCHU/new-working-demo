package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Resource;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.repository.NotificationRepository;
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

    @Autowired
    private NotificationRepository notificationRepository;

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

    @PostMapping("/allocate-resource/{eventId}/{resourceId}")
    public ResponseEntity<Allocation> allocateResource(
            @PathVariable("eventId") Long eventId,
            @PathVariable("resourceId") Long resourceId,
            @RequestBody Allocation allocation) {
        
        return ResponseEntity.ok(resourceService.allocateResource(eventId, resourceId, allocation.getQuantity()));
    }

    @GetMapping("/allocations")
    public ResponseEntity<List<Allocation>> getAllocations() {
        return ResponseEntity.ok(resourceService.getAllAllocations()); 
    }

    // --- NOTIFICATION ENDPOINTS FOR PLANNER DASHBOARD ---
    
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getPlannerNotifications() {
        return ResponseEntity.ok(notificationRepository.findByTargetRoleOrderByIdDesc("PLANNER"));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        notif.setIsRead(true);
        notificationRepository.save(notif);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsRead() {
        List<Notification> notifs = notificationRepository.findByTargetRoleOrderByIdDesc("PLANNER");
        for (Notification n : notifs) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(notifs);
        return ResponseEntity.ok().build();
    }
}