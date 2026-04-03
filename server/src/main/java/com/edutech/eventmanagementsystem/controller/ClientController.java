package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.repository.EventRepository;
import com.edutech.eventmanagementsystem.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/client")
public class ClientController {

    @Autowired private EventRepository eventRepository;
    @Autowired private NotificationRepository notificationRepository;

    @GetMapping("/event/{id}")
    public ResponseEntity<Event> getEventDetails(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found")));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/events/active")
    public ResponseEntity<List<Event>> getActiveEvents() {
        List<Event> all = eventRepository.findAll();
        List<Event> active = all.stream()
            .filter(e -> "SCHEDULED".equalsIgnoreCase(e.getStatus()) || "ONGOING".equalsIgnoreCase(e.getStatus()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(active);
    }

    @PostMapping("/book/{eventId}")
    public ResponseEntity<?> bookEvent(@PathVariable Long eventId) {
        String clientName = SecurityContextHolder.getContext().getAuthentication().getName();
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Block booking if SOLD OUT
        if (event.getMaxCapacity() != null && event.getBookedCount() >= event.getMaxCapacity()) {
            return ResponseEntity.badRequest().body("{\"message\": \"SOLD OUT\"}");
        }

        // Add to booked count
        event.setBookedCount(event.getBookedCount() + 1);
        eventRepository.save(event);
        
        // Notify the Event Planner
        Notification notif = new Notification();
        notif.setMessage("Client '" + clientName + "' secured a pass for '" + event.getTitle() + "'. Seats filled: " + event.getBookedCount() + "/" + event.getMaxCapacity());
        notif.setTargetRole("PLANNER");
        notificationRepository.save(notif);
        
        return ResponseEntity.ok().body("{\"message\": \"Successfully booked!\"}");
    }
}