package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Resource;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.entity.User;
import com.edutech.eventmanagementsystem.repository.NotificationRepository;
import com.edutech.eventmanagementsystem.repository.UserRepository;
import com.edutech.eventmanagementsystem.service.EventService;
import com.edutech.eventmanagementsystem.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/planner")
@CrossOrigin(origins = "*")
public class EventPlannerController {

    @Autowired private EventService eventService;
    @Autowired private ResourceService resourceService;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository; 

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

    @GetMapping("/staff-list")
    public ResponseEntity<List<User>> getAllStaff() {
        return ResponseEntity.ok(userRepository.findByRole("STAFF"));
    }

    // --- UPDATED: Targeted Notifications Engine for Planner ---
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getPlannerNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Notification> allNotifs = notificationRepository.findAll();
        
        List<Notification> targetNotifs = allNotifs.stream()
            .filter(n -> "PLANNER".equals(n.getTargetRole()) || ("PLANNER_" + username).equalsIgnoreCase(n.getTargetRole()))
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
            .filter(n -> "PLANNER".equals(n.getTargetRole()) || ("PLANNER_" + username).equalsIgnoreCase(n.getTargetRole()))
            .collect(Collectors.toList());
            
        for (Notification n : targetNotifs) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(targetNotifs);
        return ResponseEntity.ok().build();
    }
}