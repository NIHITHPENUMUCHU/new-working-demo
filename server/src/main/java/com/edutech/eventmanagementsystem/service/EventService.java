package com.edutech.eventmanagementsystem.service;

import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Notification;
import com.edutech.eventmanagementsystem.entity.Resource;
import com.edutech.eventmanagementsystem.repository.AllocationRepository;
import com.edutech.eventmanagementsystem.repository.EventRepository;
import com.edutech.eventmanagementsystem.repository.NotificationRepository;
import com.edutech.eventmanagementsystem.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class EventService {

    @Autowired private EventRepository eventRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private AllocationRepository allocationRepository;

    public Event createEvent(Event event) {
        if(event.getBookedCount() == null) event.setBookedCount(0);
        if(event.getStatus() == null || event.getStatus().isEmpty()) event.setStatus("SCHEDULED");
        
        // BUG FIX: Actually save the Planner's username so notifications know who to target!
        String plannerName = SecurityContextHolder.getContext().getAuthentication().getName();
        event.setPlannerUsername(plannerName);
        
        Event savedEvent = eventRepository.save(event);
        
        try {
            Notification notif = new Notification();
            notif.setMessage("Planner '" + plannerName + "' drafted event #" + savedEvent.getId() + ": " + savedEvent.getTitle() + " (Capacity: " + savedEvent.getMaxCapacity() + ")");
            
            if (savedEvent.getAssignedStaffUsername() != null && !savedEvent.getAssignedStaffUsername().isEmpty()) {
                notif.setTargetRole("STAFF_" + savedEvent.getAssignedStaffUsername());
            } else {
                notif.setTargetRole("STAFF");
            }
            notificationRepository.save(notif);
        } catch (Exception e) { e.printStackTrace(); }
        
        return savedEvent;
    }

    public List<Event> getAllEvents() { return eventRepository.findAll(); }
    public Event getEventById(Long id) { return eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found")); }

    public Event updateEvent(Long id, Event eventDetails) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        
        String oldStatus = event.getStatus();
        Integer oldCapacity = event.getMaxCapacity();
        String oldTitle = event.getTitle();
        String oldLocation = event.getLocation();

        // Apply Updates
        if(eventDetails.getTitle() != null) event.setTitle(eventDetails.getTitle());
        if(eventDetails.getDescription() != null) event.setDescription(eventDetails.getDescription());
        if(eventDetails.getDateTime() != null) event.setDateTime(eventDetails.getDateTime());
        if(eventDetails.getLocation() != null) event.setLocation(eventDetails.getLocation());
        if(eventDetails.getStatus() != null) event.setStatus(eventDetails.getStatus());
        if(eventDetails.getMaxCapacity() != null) event.setMaxCapacity(eventDetails.getMaxCapacity());

        Event updatedEvent = eventRepository.save(event);

        // --- INTELLIGENT RECLAMATION ENGINE (COMPLETED EVENTS) ---
        boolean justCompleted = (oldStatus == null || !oldStatus.equalsIgnoreCase("COMPLETED")) 
                                && "COMPLETED".equalsIgnoreCase(updatedEvent.getStatus());
        int totalReclaimed = 0;
        if (justCompleted) {
            List<Allocation> eventAllocations = allocationRepository.findByEvent(updatedEvent);
            for (Allocation alloc : eventAllocations) {
                if ("DEPLOYED".equalsIgnoreCase(alloc.getStatus()) || alloc.getStatus() == null) {
                    Resource res = alloc.getResource();
                    res.setQuantity(res.getQuantity() + alloc.getQuantity());
                    res.setAvailability(true);
                    resourceRepository.save(res);
                    alloc.setStatus("RETURNED");
                    allocationRepository.save(alloc);
                    totalReclaimed += alloc.getQuantity();
                }
            }
        }

        // Trigger Update Notifications
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            boolean statusChanged = !Objects.equals(oldStatus, updatedEvent.getStatus());
            boolean capacityChanged = !Objects.equals(oldCapacity, updatedEvent.getMaxCapacity());
            boolean titleChanged = !Objects.equals(oldTitle, updatedEvent.getTitle());
            boolean locationChanged = !Objects.equals(oldLocation, updatedEvent.getLocation());

            if (statusChanged || capacityChanged || titleChanged || locationChanged) {
                Notification notif = new Notification();
                StringBuilder msgBuilder = new StringBuilder("Staff '" + username + "' updated Event #" + updatedEvent.getId() + ". Changes: ");
                if (titleChanged) msgBuilder.append("Title, ");
                if (locationChanged) msgBuilder.append("Location, ");
                if (statusChanged) msgBuilder.append("Status (").append(updatedEvent.getStatus()).append("), ");
                if (capacityChanged) msgBuilder.append("Capacity, ");
                
                String msg = msgBuilder.toString();
                if (msg.endsWith(", ")) { msg = msg.substring(0, msg.length() - 2) + "."; }
                
                if (justCompleted && totalReclaimed > 0) {
                    msg += " SYSTEM ACTION: Successfully reclaimed " + totalReclaimed + " physical assets back into the master inventory.";
                }
                notif.setMessage(msg);
                
                // Route back to the specific planner
                if (updatedEvent.getPlannerUsername() != null && !updatedEvent.getPlannerUsername().isEmpty()) {
                    notif.setTargetRole("PLANNER_" + updatedEvent.getPlannerUsername());
                } else {
                    notif.setTargetRole("PLANNER");
                }
                notificationRepository.save(notif);
            }
        } catch (Exception e) { e.printStackTrace(); }
        return updatedEvent;
    }

    // --- EVENT CANCELLATION ENGINE ---
    public Event cancelEvent(Long id) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        String oldStatus = event.getStatus();
        
        event.setStatus("CANCELLED");
        Event updatedEvent = eventRepository.save(event);

        if (!"CANCELLED".equalsIgnoreCase(oldStatus) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
            List<Allocation> eventAllocations = allocationRepository.findByEvent(updatedEvent);
            int totalReclaimed = 0;
            
            for (Allocation alloc : eventAllocations) {
                if ("DEPLOYED".equalsIgnoreCase(alloc.getStatus()) || alloc.getStatus() == null) {
                    Resource res = alloc.getResource();
                    res.setQuantity(res.getQuantity() + alloc.getQuantity());
                    res.setAvailability(true);
                    resourceRepository.save(res);
                    alloc.setStatus("RETURNED");
                    allocationRepository.save(alloc);
                    totalReclaimed += alloc.getQuantity();
                }
            }
            
            try {
                Notification notif = new Notification();
                String plannerName = SecurityContextHolder.getContext().getAuthentication().getName();
                String msg = "URGENT: Planner '" + plannerName + "' has CANCELLED Event #" + updatedEvent.getId() + " (" + updatedEvent.getTitle() + ").";
                if (totalReclaimed > 0) {
                    msg += " " + totalReclaimed + " physical assets were automatically returned to inventory.";
                }
                notif.setMessage(msg);
                
                if (updatedEvent.getAssignedStaffUsername() != null && !updatedEvent.getAssignedStaffUsername().isEmpty()) {
                    notif.setTargetRole("STAFF_" + updatedEvent.getAssignedStaffUsername());
                } else {
                    notif.setTargetRole("STAFF");
                }
                notificationRepository.save(notif);
            } catch (Exception e) { e.printStackTrace(); }
        }
        return updatedEvent;
    }
}
