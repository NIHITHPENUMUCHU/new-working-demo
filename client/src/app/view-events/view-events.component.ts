import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-view-events',
  templateUrl: './view-events.component.html',
  styleUrls: ['./view-events.component.scss']
})
export class ViewEventsComponent implements OnInit {

  itemForm!: FormGroup;
  formModel: any = { eventID: null };
  
  showError: boolean = false; errorMessage: string = '';
  showMessage: boolean = false; responseMessage: string = '';
  
  isUpdate: boolean = false;
  eventObj: any = null;
  username: string = '';

  constructor(public router: Router, public httpService: HttpService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'unknown';
    
    this.itemForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      dateTime: ['', Validators.required],
      location: ['', Validators.required],
      maxCapacity: ['', [Validators.required, Validators.min(1)]], 
      status: ['', Validators.required]
    });
  }

  // NEW SECURE SEARCH ENGINE
  searchEvent(): void {
    if (this.formModel.eventID != null) {
      
      // 1. Fetch the list of events this specific staff member is allowed to see
      this.httpService.getStaffEvents(this.username).subscribe(
        (authorizedEvents: any[]) => {
          
          // 2. Check if the ID they searched for is in their authorized list
          const foundEvent = authorizedEvents.find(e => 
            e.eventID == this.formModel.eventID || e.id == this.formModel.eventID
          );

          if (foundEvent) {
            // Authorized! Load the form.
            this.eventObj = foundEvent;
            this.isUpdate = true;
            this.showError = false;
            this.itemForm.patchValue({
              title: foundEvent.title, 
              description: foundEvent.description, 
              dateTime: foundEvent.dateTime, 
              location: foundEvent.location, 
              maxCapacity: foundEvent.maxCapacity, 
              status: foundEvent.status
            });
          } else {
            // Denied! The event exists but belongs to a different staff member (or doesn't exist at all).
            this.showError = true; 
            this.errorMessage = "Access Denied: Event not found or assigned to another staff member."; 
            this.isUpdate = false;
          }
        },
        (error: any) => { 
          this.showError = true; 
          this.errorMessage = "Failed to communicate with authorization server."; 
          this.isUpdate = false; 
        }
      );
    }
  }

  onSubmit(): void {
    if (this.itemForm.valid && this.eventObj) {
      this.httpService.updateEvent(this.eventObj.eventID || this.eventObj.id, this.itemForm.value).subscribe(
        (res: any) => {
          this.showMessage = true; this.responseMessage = "Operations successfully updated!"; this.showError = false;
          
          // Re-fetch to ensure the view stays perfectly in sync
          this.searchEvent();
          
          setTimeout(() => { this.showMessage = false; }, 3000);
        },
        (error: any) => { this.showError = true; this.errorMessage = "Failed to update operations."; }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}