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
        if(event.getBookedCount() == null) event.setBookedCount(0);
        if(event.getStatus() == null || event.getStatus().isEmpty()) event.setStatus("SCHEDULED");
        
        Event savedEvent = eventRepository.save(event);
        
        try {
            String plannerName = SecurityContextHolder.getContext().getAuthentication().getName();
            Notification notif = new Notification();
            notif.setMessage("Planner '" + plannerName + "' drafted event: " + savedEvent.getTitle() + " (Capacity: " + savedEvent.getMaxCapacity() + ")");
            
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
        
        String oldStatus = event.getStatus();
        Integer oldCapacity = event.getMaxCapacity();

        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setDateTime(eventDetails.getDateTime());
        event.setLocation(eventDetails.getLocation());
        event.setStatus(eventDetails.getStatus());
        
        if(eventDetails.getMaxCapacity() != null) {
            event.setMaxCapacity(eventDetails.getMaxCapacity());
        }

        Event updatedEvent = eventRepository.save(event);

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            
            boolean statusChanged = oldStatus != null && !oldStatus.equals(updatedEvent.getStatus());
            boolean capacityChanged = oldCapacity != null && !oldCapacity.equals(updatedEvent.getMaxCapacity());

            if (statusChanged || capacityChanged) {
                Notification notif = new Notification();
                
                // THE FIX: Changed getEventID() to getId()
                String msg = "Staff '" + username + "' updated Event #" + updatedEvent.getId() + ". "; 
                if(statusChanged) msg += "Status: " + updatedEvent.getStatus() + ". ";
                if(capacityChanged) msg += "New Capacity: " + updatedEvent.getMaxCapacity() + " seats.";
                
                notif.setMessage(msg);
                
                // TARGETED NOTIFICATION: Send alert ONLY to the Planner who created this event
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