package com.edutech.eventmanagementsystem.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import javax.persistence.*;

@Entity
public class Allocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("allocationID")
    private Long allocationID;

    @ManyToOne
    @JoinColumn(name = "event_id")
    @JsonIgnoreProperties("allocations") // THE FIX: Sends event details, but blocks the infinite loop!
    private Event event;

    @ManyToOne
    @JoinColumn(name = "resource_id")
    @JsonIgnoreProperties("allocations") 
    private Resource resource;

    @JsonProperty("quantity")
    private int quantity;

    public Allocation() {}

    public Long getAllocationID() { return allocationID; }
    public void setAllocationID(Long allocationID) { this.allocationID = allocationID; }

    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }

    public Resource getResource() { return resource; }
    public void setResource(Resource resource) { this.resource = resource; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}