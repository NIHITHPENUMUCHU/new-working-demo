import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent implements OnInit {
  itemForm!: FormGroup;
  showError: boolean = false; errorMessage: string = '';
  showMessage: boolean = false; responseMessage: string = '';
  
  eventList: any[] = [];
  filteredEventList: any[] = []; 
  staffList: any[] = [];
  
  searchTerm: string = ''; 
  currentPage: number = 1; itemsPerPage: number = 10; totalPages: number = 0;
  paginatedEventList: any[] = [];

  showCancelModal: boolean = false;
  eventToCancelId: number | null = null;

  constructor(private formBuilder: FormBuilder, private httpService: HttpService) { }

  ngOnInit(): void {
    this.itemForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      dateTime: ['', Validators.required],
      location: ['', Validators.required],
      assignedStaffUsername: [''],
      maxCapacity: ['', [Validators.required, Validators.min(1)]]
    });
    this.getEvent();
    this.getStaffList();
  }

  getStaffList(): void { this.httpService.getStaffList().subscribe(data => this.staffList = data); }
  
  getEvent(): void {
    this.httpService.GetAllevents().subscribe(data => {
      this.eventList = data;
      this.filterEvents(); 
    });
  }

  // --- SEARCH ENGINE ---
  filterEvents() {
    if (!this.searchTerm) {
      this.filteredEventList = [...this.eventList];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredEventList = this.eventList.filter(e => 
        e.title?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term) ||
        e.status?.toLowerCase().includes(term) ||
        e.assignedStaffUsername?.toLowerCase().includes(term)
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
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedEventList = this.filteredEventList.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number): void { if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.updatePaginatedList(); } }
  getPagesArray(): number[] { return Array(this.totalPages).fill(0).map((x, i) => i + 1); }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.httpService.createEvent(this.itemForm.value).subscribe(
        (res: any) => {
          this.showMessage = true; this.responseMessage = "Event successfully drafted!"; this.showError = false;
          this.itemForm.reset(); this.itemForm.get('assignedStaffUsername')?.setValue(''); this.getEvent();
          setTimeout(() => this.showMessage = false, 3000);
        },
        (error: any) => {
          this.showError = true; this.errorMessage = "Failed to draft the event.";
          setTimeout(() => this.showError = false, 3000);
        }
      );
    } else { this.itemForm.markAllAsTouched(); }
  }

  openCancelModal(eventId: number): void {
    this.eventToCancelId = eventId;
    this.showCancelModal = true;
  }
  closeCancelModal(): void {
    this.showCancelModal = false;
    this.eventToCancelId = null;
  }
  
  confirmCancel(): void {
    if (this.eventToCancelId) {
      this.httpService.cancelEvent(this.eventToCancelId).subscribe(
        () => {
          this.getEvent();
          this.showMessage = true;
          this.responseMessage = "Event successfully cancelled and resources reclaimed.";
          this.closeCancelModal();
          setTimeout(() => this.showMessage = false, 4000);
        }, 
        error => {
          this.showError = true; this.errorMessage = "Failed to cancel the event.";
          this.closeCancelModal();
          setTimeout(() => this.showError = false, 4000);
        }
      );
    }
  }
}