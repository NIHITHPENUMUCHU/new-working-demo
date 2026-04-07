package com.edutech.eventmanagementsystem.controller;

import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/client")
@CrossOrigin(origins = "*")
public class ClientController {

    @Autowired private EventService eventService;

    @GetMapping("/events/active")
    public ResponseEntity<List<Event>> getActiveEvents() {
        // Only return events that are currently active to the clients
        List<Event> activeEvents = eventService.getAllEvents().stream()
            .filter(e -> "SCHEDULED".equalsIgnoreCase(e.getStatus()) || "ONGOING".equalsIgnoreCase(e.getStatus()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(activeEvents);
    }

    @GetMapping("/event/{id}")
    public ResponseEntity<Event> getClientEventDetails(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @PostMapping("/book/{eventId}/{quantity}")
    public ResponseEntity<?> bookEvent(@PathVariable Long eventId, @PathVariable Integer quantity) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        eventService.bookEventPass(eventId, quantity, username);
        return ResponseEntity.ok().build();
    }

    // CLIENT CANCELLATION ENDPOINT ---
    @PostMapping("/cancel-booking/{eventId}/{quantity}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long eventId, @PathVariable Integer quantity) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        eventService.cancelEventPass(eventId, quantity, username);
        return ResponseEntity.ok().build();
    }
}