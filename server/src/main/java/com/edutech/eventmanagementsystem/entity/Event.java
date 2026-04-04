package com.edutech.eventmanagementsystem.entity;

import com.fasterxml.jackson.annotation.JsonFormat; // NEW
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // NEW
import com.fasterxml.jackson.annotation.JsonProperty;
import javax.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "events")
public class Event {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("eventID")
    private Long eventID;
    
    private String title;
    private String description;
    private String location;
    private String status;
    
    // CRITICAL FIX 1: Accepts "YYYY-MM-DD" exactly as Angular sends it
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateTime; 

    // CRITICAL FIX 2: Prevents 500 StackOverflowError loop
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("event")
    private List<Allocation> allocations;

    // --- Capacity Engine Fields ---
    private Integer maxCapacity = 100;
    private Integer bookedCount = 0;

    public Event() {}

    // Core Getters & Setters
    public Long getEventID() { return eventID; }
    public void setEventID(Long eventID) { this.eventID = eventID; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Date getDateTime() { return dateTime; }
    public void setDateTime(Date dateTime) { this.dateTime = dateTime; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<Allocation> getAllocations() { return allocations; }
    public void setAllocations(List<Allocation> allocations) { this.allocations = allocations; }

    // Capacity Getters & Setters
    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }

    public Integer getBookedCount() { return bookedCount; }
    public void setBookedCount(Integer bookedCount) { this.bookedCount = bookedCount; }
}