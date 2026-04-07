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

    public List<Event> getEventsForStaff(String username) {
        return eventRepository.findEventsForStaff(username);
    }

    public Event createEvent(Event event) {
        if(event.getBookedCount() == null) event.setBookedCount(0);
        if(event.getStatus() == null || event.getStatus().isEmpty()) event.setStatus("SCHEDULED");
        
        String plannerName = SecurityContextHolder.getContext().getAuthentication().getName();
        event.setPlannerUsername(plannerName);
        
        Event savedEvent = eventRepository.save(event);
        
        try {
            Notification notif = new Notification();
            notif.setMessage("Planner '" + plannerName + "' drafted event #" + savedEvent.getId() + ": " + savedEvent.getTitle());
            String assignee = savedEvent.getAssignedStaffUsername();
            if (assignee != null && !assignee.trim().isEmpty() && !assignee.equalsIgnoreCase("PUBLIC")) {
                notif.setTargetRole("STAFF_" + assignee); 
            } else {
                notif.setTargetRole("STAFF"); 
            }
            notificationRepository.save(notif);
        } catch (Exception e) { e.printStackTrace(); }
        return savedEvent;
    }

    public List<Event> getAllEvents() { return eventRepository.findAll(); }
    public Event getEventById(Long id) { return eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found")); }

    // --- CLIENT BOOKING ENGINE ---
    public void bookEventPass(Long eventId, Integer quantity, String username) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        if (event.getBookedCount() == null) event.setBookedCount(0);
        event.setBookedCount(event.getBookedCount() + quantity);
        eventRepository.save(event);

        // Notify Planner that a ticket was booked!
        try {
            Notification notif = new Notification();
            String plannerName = event.getPlannerUsername();
            notif.setMessage("TICKET SECURED: Client '" + username + "' booked " + quantity + " pass(es) for Event #" + event.getId() + " (" + event.getTitle() + ").");
            
            if (plannerName != null && !plannerName.isEmpty()) {
                notif.setTargetRole("PLANNER_" + plannerName);
            } else {
                notif.setTargetRole("PLANNER");
            }
            notificationRepository.save(notif);
        } catch (Exception e) { e.printStackTrace(); }
    }

    // --- CLIENT CANCELLATION ENGINE ---
    public void cancelEventPass(Long eventId, Integer quantity, String username) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        if (event.getBookedCount() == null) event.setBookedCount(0);
        
        // Safely restore capacity
        event.setBookedCount(Math.max(0, event.getBookedCount() - quantity));
        eventRepository.save(event);

        try {
            Notification notif = new Notification();
            String plannerName = event.getPlannerUsername();
            notif.setMessage("TICKET ALERT: Client '" + username + "' cancelled " + quantity + " pass(es) for Event #" + event.getId() + " (" + event.getTitle() + "). Capacity restored.");
            
            if (plannerName != null && !plannerName.isEmpty()) {
                notif.setTargetRole("PLANNER_" + plannerName);
            } else {
                notif.setTargetRole("PLANNER");
            }
            notificationRepository.save(notif);
        } catch (Exception e) { e.printStackTrace(); }
    }

    public Event updateEvent(Long id, Event eventDetails) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        String oldStatus = event.getStatus();

        if(eventDetails.getTitle() != null) event.setTitle(eventDetails.getTitle());
        if(eventDetails.getDescription() != null) event.setDescription(eventDetails.getDescription());
        if(eventDetails.getDateTime() != null) event.setDateTime(eventDetails.getDateTime());
        if(eventDetails.getLocation() != null) event.setLocation(eventDetails.getLocation());
        if(eventDetails.getStatus() != null) event.setStatus(eventDetails.getStatus());
        if(eventDetails.getMaxCapacity() != null) event.setMaxCapacity(eventDetails.getMaxCapacity());

        Event updatedEvent = eventRepository.save(event);

        boolean justCompleted = (oldStatus == null || !oldStatus.equalsIgnoreCase("COMPLETED")) && "COMPLETED".equalsIgnoreCase(updatedEvent.getStatus());
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

        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            if (!Objects.equals(oldStatus, updatedEvent.getStatus())) {
                Notification notif = new Notification();
                String msg = "Staff '" + username + "' updated Event #" + updatedEvent.getId() + " Status to: " + updatedEvent.getStatus() + ".";
                if (justCompleted && totalReclaimed > 0) { msg += " Reclaimed " + totalReclaimed + " assets."; }
                notif.setMessage(msg);
                
                if (updatedEvent.getPlannerUsername() != null && !updatedEvent.getPlannerUsername().isEmpty()) {
                    notif.setTargetRole("PLANNER_" + updatedEvent.getPlannerUsername());
                } else { notif.setTargetRole("PLANNER"); }
                notificationRepository.save(notif);
            }
        } catch (Exception e) { e.printStackTrace(); }
        return updatedEvent;
    }

    public Event cancelEvent(Long id) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        String oldStatus = event.getStatus();
        event.setStatus("CANCELLED");
        Event updatedEvent = eventRepository.save(event);

        if (!"CANCELLED".equalsIgnoreCase(oldStatus) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
            List<Allocation> eventAllocations = allocationRepository.findByEvent(updatedEvent);
            for (Allocation alloc : eventAllocations) {
                if ("DEPLOYED".equalsIgnoreCase(alloc.getStatus()) || alloc.getStatus() == null) {
                    Resource res = alloc.getResource();
                    res.setQuantity(res.getQuantity() + alloc.getQuantity());
                    res.setAvailability(true);
                    resourceRepository.save(res);
                    alloc.setStatus("RETURNED");
                    allocationRepository.save(alloc);
                }
            }
            try {
                Notification notif = new Notification();
                String plannerName = SecurityContextHolder.getContext().getAuthentication().getName();
                notif.setMessage("URGENT: Planner '" + plannerName + "' CANCELLED Event #" + updatedEvent.getId() + ".");
                
                String assignee = updatedEvent.getAssignedStaffUsername();
                if (assignee != null && !assignee.trim().isEmpty() && !assignee.equalsIgnoreCase("PUBLIC")) {
                    notif.setTargetRole("STAFF_" + assignee);
                } else { notif.setTargetRole("STAFF"); }
                notificationRepository.save(notif);
            } catch (Exception e) { e.printStackTrace(); }
        }
        return updatedEvent;
    }
}