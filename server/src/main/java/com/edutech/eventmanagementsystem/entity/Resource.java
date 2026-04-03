package com.edutech.eventmanagementsystem.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.persistence.*;

@Entity
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("resourceID")
    private Long resourceID;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("availability")
    private boolean availability;
    
    @JsonProperty("quantity") // THE FIX: Forces Java to map the quantity from Angular perfectly!
    private int quantity; 

    public Resource() {}

    public Long getResourceID() { return resourceID; }
    public void setResourceID(Long resourceID) { this.resourceID = resourceID; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public boolean isAvailability() { return availability; }
    public void setAvailability(boolean availability) { this.availability = availability; }
    
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}