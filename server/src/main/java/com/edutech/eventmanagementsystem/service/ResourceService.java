package com.edutech.eventmanagementsystem.service;

import com.edutech.eventmanagementsystem.entity.Allocation;
import com.edutech.eventmanagementsystem.entity.Event;
import com.edutech.eventmanagementsystem.entity.Resource;
import com.edutech.eventmanagementsystem.repository.AllocationRepository;
import com.edutech.eventmanagementsystem.repository.EventRepository;
import com.edutech.eventmanagementsystem.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private AllocationRepository allocationRepository;

    public Resource addResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public List<Allocation> getAllAllocations() {
        return allocationRepository.findAll();
    }

    // THE SIGNATURE: It explicitly requires an 'int quantity'
    public Allocation allocateResource(Long eventId, Long resourceId, int quantity) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        Resource resource = resourceRepository.findById(resourceId).orElseThrow(() -> new RuntimeException("Resource not found"));

        Allocation allocation = new Allocation();
        allocation.setEvent(event);
        allocation.setResource(resource);
        allocation.setQuantity(quantity);

        // Deduct the allocated amount from the inventory
        int remainingQuantity = Math.max(0, resource.getQuantity() - quantity);
        resource.setQuantity(remainingQuantity);

        // Only mark as unavailable if we completely run out of stock 
        if (remainingQuantity <= 0) {
            resource.setAvailability(false);
        }
        resourceRepository.save(resource);

        if (event.getAllocations() == null) {
            event.setAllocations(new ArrayList<>());
        }
        event.getAllocations().add(allocation);
        eventRepository.save(event);

        return allocationRepository.save(allocation);
    }
}
