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
  eventList: any[] = [];
  showMessage: boolean = false;
  responseMessage: string = '';
  showError: boolean = false;
  errorMessage: string = '';

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  paginatedEventList: any[] = [];

  constructor(private formBuilder: FormBuilder, private httpService: HttpService) {}

  ngOnInit(): void {
    this.itemForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      dateTime: ['', Validators.required], 
      location: ['', Validators.required],
      maxCapacity: [100, [Validators.required, Validators.min(1)]], // NEW CAPACITY FIELD
      status: ['SCHEDULED'] 
    });
    this.getEvents();
  }

  getEvents(): void {
    this.httpService.GetAllevents().subscribe((data) => {
      this.eventList = data;
      this.calculatePagination();
    });
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.eventList.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    this.updatePaginatedList();
  }

  updatePaginatedList(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEventList = this.eventList.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedList();
    }
  }

  getPagesArray(): number[] { return Array(this.totalPages).fill(0).map((x, i) => i + 1); }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.httpService.createEvent(this.itemForm.value).subscribe(
        (res) => {
          this.showMessage = true;
          this.responseMessage = "Event successfully drafted!";
          this.itemForm.reset({ status: 'SCHEDULED', maxCapacity: 100 });
          this.getEvents();
          setTimeout(() => this.showMessage = false, 3000);
        },
        (error) => {
          this.showError = true;
          this.errorMessage = "Failed to create event. Please try again.";
          setTimeout(() => this.showError = false, 3000);
        }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}
