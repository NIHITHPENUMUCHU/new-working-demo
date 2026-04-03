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

  constructor(public router: Router, public httpService: HttpService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.itemForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      dateTime: ['', Validators.required],
      location: ['', Validators.required],
      maxCapacity: ['', [Validators.required, Validators.min(1)]], // NEW FIELD
      status: ['', Validators.required]
    });
  }

  searchEvent(): void {
    if (this.formModel.eventID != null) {
      this.httpService.getEventDetails(this.formModel.eventID).subscribe(
        (data: any) => {
          if (data) {
            this.eventObj = data;
            this.isUpdate = true;
            this.showError = false;
            this.itemForm.patchValue({
              title: data.title, 
              description: data.description, 
              dateTime: data.dateTime, 
              location: data.location, 
              maxCapacity: data.maxCapacity, // Populates existing capacity
              status: data.status
            });
          } else {
            this.showError = true; this.errorMessage = "No event found with that ID."; this.isUpdate = false;
          }
        },
        (error: any) => { this.showError = true; this.errorMessage = "Failed to locate event."; this.isUpdate = false; }
      );
    }
  }

  onSubmit(): void {
    if (this.itemForm.valid && this.eventObj) {
      this.httpService.updateEvent(this.eventObj.eventID || this.eventObj.id, this.itemForm.value).subscribe(
        (res: any) => {
          this.showMessage = true; this.responseMessage = "Operations successfully updated!"; this.showError = false;
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