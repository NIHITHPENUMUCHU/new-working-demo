package com.edutech.eventmanagementsystem.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "events")
public class Event {
    
    // FIX 1: Standardized to "id" so the frontend table and EventService can read it perfectly
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    private String location;
    private String status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateTime; 

    // FIX 2: Added back the Micro-Permission fields required by EventService
    @Column(name = "planner_username")
    private String plannerUsername;

    @Column(name = "assigned_staff_username")
    private String assignedStaffUsername;

    // FIX 3: Using your excellent JsonIgnoreProperties to restore allocations without crashing
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("event")
    private List<Allocation> allocations;

    // --- Capacity Engine Fields ---
    private Integer maxCapacity = 100;
    private Integer bookedCount = 0;

    public Event() {}

    // --- Core Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    // --- Capacity Getters & Setters ---
    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }

    public Integer getBookedCount() { return bookedCount; }
    public void setBookedCount(Integer bookedCount) { this.bookedCount = bookedCount; }

    // --- Micro-Permissions Getters & Setters ---
    public String getPlannerUsername() { return plannerUsername; }
    public void setPlannerUsername(String plannerUsername) { this.plannerUsername = plannerUsername; }

    public String getAssignedStaffUsername() { return assignedStaffUsername; }
    public void setAssignedStaffUsername(String assignedStaffUsername) { this.assignedStaffUsername = assignedStaffUsername; }
}