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
  
  eventList: any[] = [];
  filteredEventList: any[] = []; 
  searchTerm: string = '';

  itemForm!: FormGroup;
  showError: boolean = false; errorMessage: string = '';
  showMessage: boolean = false; responseMessage: string = '';
  
  username: string = '';
  editingEventId: number | null = null;
  
  currentPage: number = 1; itemsPerPage: number = 5; totalPages: number = 0;
  paginatedEventList: any[] = [];

  constructor(public router: Router, public httpService: HttpService, private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || '';
    this.itemForm = this.formBuilder.group({
      status: ['', Validators.required],
      title: [''], description: [''], dateTime: [''], location: [''], maxCapacity: ['']
    });
    this.getEvents();
  }

  getEvents() {
    this.httpService.getStaffEvents(this.username).subscribe((data: any[]) => {
      this.eventList = data;
      this.filterEvents();
    });
  }

  filterEvents() {
    if (!this.searchTerm) {
      this.filteredEventList = [...this.eventList];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredEventList = this.eventList.filter(e => 
        e.title?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term) ||
        e.status?.toLowerCase().includes(term)
      );
    }
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEventList.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    this.updatePaginatedList();
  }

  updatePaginatedList(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedEventList = this.filteredEventList.slice(start, start + this.itemsPerPage);
  }

  changePage(p: number): void { if (p >= 1 && p <= this.totalPages) { this.currentPage = p; this.updatePaginatedList(); } }
  getPagesArray(): number[] { return Array(this.totalPages).fill(0).map((x, i) => i + 1); }

  editEvent(event: any) {
    this.editingEventId = event.eventID || event.id;
    this.itemForm.patchValue({
      status: event.status, title: event.title, description: event.description,
      dateTime: event.dateTime ? new Date(event.dateTime).toISOString().slice(0,10) : '',
      location: event.location, maxCapacity: event.maxCapacity
    });
  }

  cancelEdit() { this.editingEventId = null; this.itemForm.reset(); }

  onSubmit() {
    if (this.itemForm.valid && this.editingEventId) {
      this.httpService.updateEvent(this.editingEventId, this.itemForm.value).subscribe(
        () => {
          this.showMessage = true; this.responseMessage = "Event details updated successfully.";
          this.editingEventId = null; this.getEvents();
          setTimeout(() => this.showMessage = false, 3000);
        },
        () => {
          this.showError = true; this.errorMessage = "Error updating event details.";
          setTimeout(() => this.showError = false, 3000);
        }
      );
    } else { this.itemForm.markAllAsTouched(); }
  }
}