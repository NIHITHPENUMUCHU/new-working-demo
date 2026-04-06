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

    // --- UPDATED: Accepts {quantity} in the URL ---
    @PostMapping("/book/{eventId}/{quantity}")
    public ResponseEntity<?> bookEvent(@PathVariable Long eventId, @PathVariable int quantity) {
        String clientName = SecurityContextHolder.getContext().getAuthentication().getName();
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Block booking if requesting more than available capacity
        if (event.getMaxCapacity() != null && (event.getBookedCount() + quantity) > event.getMaxCapacity()) {
            return ResponseEntity.badRequest().body("{\"message\": \"Not enough capacity remaining.\"}");
        }

        // Add the requested quantity to booked count
        event.setBookedCount(event.getBookedCount() + quantity);
        eventRepository.save(event);
        
        // Notify the Event Planner with the specific quantity booked
        Notification notif = new Notification();
        notif.setMessage("Client '" + clientName + "' secured " + quantity + " pass(es) for '" + event.getTitle() + "'. Seats filled: " + event.getBookedCount() + "/" + event.getMaxCapacity());
        
        // Securely target the Planner who created the event
        if (event.getPlannerUsername() != null && !event.getPlannerUsername().isEmpty()) {
            notif.setTargetRole("PLANNER_" + event.getPlannerUsername());
        } else {
            notif.setTargetRole("PLANNER");
        }
        notificationRepository.save(notif);
        
        return ResponseEntity.ok().body("{\"message\": \"Successfully booked " + quantity + " tickets!\"}");
    }
}