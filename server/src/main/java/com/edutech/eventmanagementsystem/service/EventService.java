package com.edutech.eventmanagementsystem.service;

import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.repository.EventRepository;
import com.edutech.eventmanagementsystem.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects; // Added for safe null-checking

@Service
public class EventService {

    @Autowired private EventRepository eventRepository;
    @Autowired private NotificationRepository notificationRepository;

    public Event createEvent(Event event) {
        if(event.getBookedCount() == null) event.setBookedCount(0);
        if(event.getStatus() == null || event.getStatus().isEmpty()) event.setStatus("SCHEDULED");
        
        Event savedEvent = eventRepository.save(event);
        
        try {
            String plannerName = SecurityContextHolder.getContext().getAuthentication().getName();
            Notification notif = new Notification();
            notif.setMessage("Planner '" + plannerName + "' drafted event #" + savedEvent.getId() + ": " + savedEvent.getTitle() + " (Capacity: " + savedEvent.getMaxCapacity() + ")");
            
            // TARGETED NOTIFICATION: Send to specific staff member if assigned, else broadcast to all staff
            if (savedEvent.getAssignedStaffUsername() != null && !savedEvent.getAssignedStaffUsername().isEmpty()) {
                notif.setTargetRole("STAFF_" + savedEvent.getAssignedStaffUsername());
            } else {
                notif.setTargetRole("STAFF");
            }
            notificationRepository.save(notif);
        } catch (Exception e) {}
        
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
        
        // 1. Snapshot the old values before applying the updates
        String oldStatus = event.getStatus();
        Integer oldCapacity = event.getMaxCapacity();
        String oldTitle = event.getTitle();
        String oldDescription = event.getDescription();
        java.util.Date oldDateTime = event.getDateTime();
        String oldLocation = event.getLocation();

        // 2. Apply updates
        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setDateTime(eventDetails.getDateTime());
        event.setLocation(eventDetails.getLocation());
        event.setStatus(eventDetails.getStatus());
        
        if(eventDetails.getMaxCapacity() != null) {
            event.setMaxCapacity(eventDetails.getMaxCapacity());
        }

        Event updatedEvent = eventRepository.save(event);

        // 3. Track changes and trigger targeted notification
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            
            // Safely compare old and new values to detect what exactly was changed
            boolean statusChanged = !Objects.equals(oldStatus, updatedEvent.getStatus());
            boolean capacityChanged = !Objects.equals(oldCapacity, updatedEvent.getMaxCapacity());
            boolean titleChanged = !Objects.equals(oldTitle, updatedEvent.getTitle());
            boolean descChanged = !Objects.equals(oldDescription, updatedEvent.getDescription());
            boolean dateChanged = !Objects.equals(oldDateTime, updatedEvent.getDateTime());
            boolean locationChanged = !Objects.equals(oldLocation, updatedEvent.getLocation());

            // If ANY of the core details changed, build and send the notification
            if (statusChanged || capacityChanged || titleChanged || descChanged || dateChanged || locationChanged) {
                Notification notif = new Notification();
                
                // Build a dynamic message showing exactly what was modified
                StringBuilder msgBuilder = new StringBuilder("Staff '" + username + "' updated Event #" + updatedEvent.getId() + ". Changes made: ");
                
                if (titleChanged) msgBuilder.append("Title, ");
                if (descChanged) msgBuilder.append("Description, ");
                if (dateChanged) msgBuilder.append("Date & Time, ");
                if (locationChanged) msgBuilder.append("Location, ");
                if (statusChanged) msgBuilder.append("Status (").append(updatedEvent.getStatus()).append("), ");
                if (capacityChanged) msgBuilder.append("Capacity (").append(updatedEvent.getMaxCapacity()).append("), ");
                
                // Clean up the trailing comma and space
                String msg = msgBuilder.toString();
                if (msg.endsWith(", ")) {
                    msg = msg.substring(0, msg.length() - 2) + "."; 
                }
                
                notif.setMessage(msg);
                
                // TARGETED NOTIFICATION: Send alert ONLY to the Planner who created this event.
                if (updatedEvent.getPlannerUsername() != null && !updatedEvent.getPlannerUsername().isEmpty()) {
                    notif.setTargetRole("PLANNER_" + updatedEvent.getPlannerUsername());
                } else {
                    notif.setTargetRole("PLANNER");
                }
                notificationRepository.save(notif);
            }
        } catch (Exception e) {}
        
        return updatedEvent;
    }
}