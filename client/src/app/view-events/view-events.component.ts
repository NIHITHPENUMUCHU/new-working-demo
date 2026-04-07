import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-view-events',
  templateUrl: './view-events.component.html',
  styleUrls: ['./view-events.component.scss']
})
export class ViewEventsComponent implements OnInit {
  
  eventList: any[] = [];
  filteredEventList: any[] = []; 
  paginatedEventList: any[] = [];
  
  searchTerm: string = '';
  statusFilter: string = 'ALL';

  itemForm!: FormGroup;
  showError: boolean = false; errorMessage: string = '';
  showMessage: boolean = false; responseMessage: string = '';
  
  username: string = '';
  role: string = '';
  editingEventId: number | null = null;
  
  // Pagination
  currentPage: number = 1; itemsPerPage: number = 10; totalPages: number = 0;

  constructor(
    public router: Router, 
    public httpService: HttpService, 
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    if (!this.authService.getLoginStatus()) {
      this.router.navigate(['/login']);
      return;
    }

    this.username = (localStorage.getItem('username') || '').toLowerCase().trim();
    this.role = (this.authService.getRole() || '').toUpperCase();

    this.itemForm = this.formBuilder.group({
      status: ['', Validators.required],
      title: [''], description: [''], dateTime: [''], location: [''], maxCapacity: ['']
    });
    
    this.getEvents();
  }

  getEvents() {
    if (this.role === 'PLANNER') {
      this.httpService.GetAllevents().subscribe((data: any[]) => this.processData(data));
    } else if (this.role === 'STAFF') {
      this.httpService.getStaffEvents(this.username).subscribe((data: any[]) => this.processData(data));
    }
  }

  processData(data: any[]) {
    if (!data) return;

    if (this.role === 'PLANNER') {
      // PLANNER: Only see events they created themselves
      this.eventList = data.filter(e => e.plannerUsername && e.plannerUsername.toLowerCase().trim() === this.username);
    } else if (this.role === 'STAFF') {
      // STAFF: Only see their assignments OR the public unassigned pool
      this.eventList = data.filter(e => {
        const assignedTo = e.assignedStaffUsername ? e.assignedStaffUsername.toLowerCase().trim() : '';
        return assignedTo === this.username || assignedTo === 'public' || assignedTo === '';
      });
    }

    // Sort newest first
    this.eventList.sort((a, b) => (b.eventID || b.id) - (a.eventID || a.id));
    this.filterEvents();
  }

  // --- FILTER & SEARCH LOGIC ---
  filterEvents() {
    this.filteredEventList = this.eventList.filter(ev => {
      // 1. Status Filter
      const matchesStatus = this.statusFilter === 'ALL' || (ev.status && ev.status.toUpperCase() === this.statusFilter);
      
      // 2. Text Search
      const term = this.searchTerm.toLowerCase().trim();
      const matchesText = !term || 
                          (ev.title && ev.title.toLowerCase().includes(term)) ||
                          (ev.location && ev.location.toLowerCase().includes(term)) ||
                          (ev.status && ev.status.toLowerCase().includes(term)) ||
                          ((ev.eventID || ev.id) && (ev.eventID || ev.id).toString().includes(term));
                          
      return matchesStatus && matchesText;
    });
    this.calculatePagination();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.filterEvents();
  }

  onFilterChange(event: any): void {
    this.statusFilter = event.target.value;
    this.filterEvents();
  }

  // --- PAGINATION LOGIC ---
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

  // --- ACTIONS & EDITS ---
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

  updateEventStatus(eventObj: any, newStatus: string): void {
    // SECURITY: Prevent staff from updating status on unclaimed public missions
    if (this.role === 'STAFF' && newStatus !== 'CLAIM') {
      const assignedTo = eventObj.assignedStaffUsername ? eventObj.assignedStaffUsername.toLowerCase().trim() : '';
      if (assignedTo !== this.username) {
        this.showError = true; this.errorMessage = "You must claim this public mission first.";
        setTimeout(() => this.showError = false, 3000);
        return;
      }
    }

    if (newStatus === 'CLAIM') {
        eventObj.assignedStaffUsername = localStorage.getItem('username');
    } else {
        eventObj.status = newStatus;
    }

    this.httpService.updateEvent(eventObj.eventID || eventObj.id, eventObj).subscribe(() => {
      this.showMessage = true; this.responseMessage = newStatus === 'CLAIM' ? "Mission Claimed Successfully!" : "Status Updated!";
      setTimeout(() => this.showMessage = false, 3000);
      this.getEvents(); 
    }, error => {
      this.showError = true; this.errorMessage = "Failed to process request.";
      setTimeout(() => this.showError = false, 3000);
    });
  }
}