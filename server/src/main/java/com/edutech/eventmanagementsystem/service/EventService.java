package com.edutech.eventmanagementsystem.service;

import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.repository.EventRepository;
import com.edutech.eventmanagementsystem.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {

    @Autowired private EventRepository eventRepository;
    @Autowired private NotificationRepository notificationRepository;

    public Event createEvent(Event event) {
        // Safe check for capacity tracking
        if(event.getBookedCount() == null) event.setBookedCount(0);
        Event savedEvent = eventRepository.save(event);
        
        try {
            String plannerName = SecurityContextHolder.getContext().getAuthentication().getName();
            Notification notif = new Notification();
            notif.setMessage("Planner '" + plannerName + "' drafted event: " + savedEvent.getTitle() + " (Capacity: " + savedEvent.getMaxCapacity() + ")");
            notif.setTargetRole("STAFF");
            notificationRepository.save(notif);
        } catch (Exception e) {
            // Safely ignore if security context is not populated during testing
        }
        
        return savedEvent;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
    }

    public Event updateEvent(Long id, Event eventDetails) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        
        String oldStatus = event.getStatus();
        Integer oldCapacity = event.getMaxCapacity();

        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setDateTime(eventDetails.getDateTime());
        event.setLocation(eventDetails.getLocation());
        event.setStatus(eventDetails.getStatus());
        
        // Staff updates the capacity
        if(eventDetails.getMaxCapacity() != null) {
            event.setMaxCapacity(eventDetails.getMaxCapacity());
        }

        Event updatedEvent = eventRepository.save(event);

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            
            // Trigger Notification to Planner if Staff updates Status OR Capacity
            boolean statusChanged = oldStatus != null && !oldStatus.equals(updatedEvent.getStatus());
            boolean capacityChanged = oldCapacity != null && !oldCapacity.equals(updatedEvent.getMaxCapacity());

            if (statusChanged || capacityChanged) {
                Notification notif = new Notification();
                // THE FIX: Using getEventID() to match the entity perfectly
                String msg = "Staff '" + username + "' updated Event #" + updatedEvent.getEventID() + ". "; 
                if(statusChanged) msg += "Status: " + updatedEvent.getStatus() + ". ";
                if(capacityChanged) msg += "New Capacity: " + updatedEvent.getMaxCapacity() + " seats.";
                
                notif.setMessage(msg);
                notif.setTargetRole("PLANNER");
                notificationRepository.save(notif);
            }
        } catch (Exception e) {
            // Safe fallback
        }
        
        return updatedEvent;
    }
}
