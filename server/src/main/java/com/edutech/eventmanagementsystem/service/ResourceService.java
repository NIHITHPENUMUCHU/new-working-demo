package com.edutech.eventmanagementsystem.service;

import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Resource;
import com.edutech.eventmanagementsystem.repository.AllocationRepository;
import com.edutech.eventmanagementsystem.repository.EventRepository;
import com.edutech.eventmanagementsystem.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ResourceService {

    @Autowired private ResourceRepository resourceRepository;
    @Autowired private AllocationRepository allocationRepository;
    @Autowired private EventRepository eventRepository;

    public Resource addResource(Resource resource) {
        resource.setAvailability(resource.getQuantity() > 0);
        return resourceRepository.save(resource);
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public List<Resource> searchResources(String query) {
        if (query == null || query.trim().isEmpty()) {
            return resourceRepository.findAll();
        }
        return resourceRepository.findAll(); 
    }

    public Allocation allocateResource(Long eventId, Long resourceId, Integer quantity) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        
        // --- STRICT BACKEND DEFENSE ---
        if ("COMPLETED".equalsIgnoreCase(event.getStatus()) || "CANCELLED".equalsIgnoreCase(event.getStatus())) {
            throw new RuntimeException("Deployment Blocked: Cannot allocate physical resources to a " + event.getStatus() + " event.");
        }
        
        Resource resource = resourceRepository.findById(resourceId).orElseThrow(() -> new RuntimeException("Resource not found"));
        if (resource.getQuantity() < quantity) throw new RuntimeException("Insufficient quantity");
        
        resource.setQuantity(resource.getQuantity() - quantity);
        resource.setAvailability(resource.getQuantity() > 0);
        resourceRepository.save(resource);
        
        Allocation allocation = new Allocation();
        allocation.setEvent(event);
        allocation.setResource(resource);
        allocation.setQuantity(quantity);
        allocation.setStatus("DEPLOYED");
        return allocationRepository.save(allocation);
    }

    @Transactional
    public List<Allocation> allocateResourcesBulk(Long eventId, List<Map<String, Object>> requests) {
        try {
            Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
            
            // --- STRICT BACKEND DEFENSE ---
            if ("COMPLETED".equalsIgnoreCase(event.getStatus()) || "CANCELLED".equalsIgnoreCase(event.getStatus())) {
                throw new RuntimeException("Deployment Blocked: Cannot allocate physical resources to a " + event.getStatus() + " event.");
            }
            
            List<Allocation> existingAllocations = allocationRepository.findByEvent(event);
            List<Allocation> savedAllocations = new ArrayList<>();

            for (Map<String, Object> req : requests) {
                if (!req.containsKey("resourceId") || req.get("resourceId") == null) throw new RuntimeException("Invalid Payload: Resource ID missing.");
                
                Long resId = Long.valueOf(req.get("resourceId").toString());
                Integer safeQuantity = req.containsKey("quantity") && req.get("quantity") != null ? Integer.valueOf(req.get("quantity").toString()) : 1;

                Resource resource = resourceRepository.findById(resId).orElseThrow(() -> new RuntimeException("Resource not found in DB"));

                if (resource.getQuantity() < safeQuantity) throw new RuntimeException("Insufficient inventory for: " + resource.getName());

                resource.setQuantity(resource.getQuantity() - safeQuantity);
                resource.setAvailability(resource.getQuantity() > 0);
                resourceRepository.save(resource);

                Allocation existingAlloc = null;
                for (Allocation a : existingAllocations) {
                    if (a.getResource() != null && a.getResource().getResourceID().equals(resId) && "DEPLOYED".equalsIgnoreCase(a.getStatus())) {
                        existingAlloc = a;
                        break;
                    }
                }

                if (existingAlloc != null) {
                    existingAlloc.setQuantity(existingAlloc.getQuantity() + safeQuantity);
                    savedAllocations.add(existingAlloc);
                } else {
                    Allocation alloc = new Allocation();
                    alloc.setEvent(event);
                    alloc.setResource(resource);
                    alloc.setQuantity(safeQuantity);
                    alloc.setStatus("DEPLOYED");
                    savedAllocations.add(alloc);
                }
            }
            List<Allocation> results = allocationRepository.saveAll(savedAllocations);
            allocationRepository.flush(); 
            return results;

        } catch (Exception e) {
            Throwable rootCause = e;
            while (rootCause.getCause() != null && rootCause != rootCause.getCause()) { rootCause = rootCause.getCause(); }
            throw new RuntimeException(rootCause.getMessage());
        }
    }

    public List<Allocation> getAllAllocations() { return allocationRepository.findAll(); }

    public List<Allocation> getAllocationsByEventId(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return allocationRepository.findByEvent(event);
    }
}