import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-resource-allocate',
  templateUrl: './resource-allocate.component.html',
  styleUrls: ['./resource-allocate.component.scss']
})
export class ResourceAllocateComponent implements OnInit {
  
  itemForm!: FormGroup;  
  showError: boolean = false; 
  errorMessage: string = ''; 
  showMessage: boolean = false; 
  responseMessage: string = ''; 
  
  resourceList: any[] = []; 
  eventList: any[] = [];
  allocationList: any[] = []; 
  selectedResourceMax: number = 0;

  // --- Pagination Variables ---
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  paginatedAllocationList: any[] = [];

  constructor(
    private formBuilder: FormBuilder, 
    public httpService: HttpService
  ) { }

  ngOnInit(): void {
    this.itemForm = this.formBuilder.group({
      eventId: ['', Validators.required],
      resourceId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]] 
    });

    this.itemForm.get('resourceId')?.valueChanges.subscribe(resId => {
      if (!resId) return;
      const selectedRes = this.resourceList.find(r => (r.resourceID || r.id) == resId);
      if (selectedRes) {
        this.selectedResourceMax = selectedRes.quantity || 0;
        this.itemForm.get('quantity')?.setValidators([Validators.required, Validators.min(1), Validators.max(this.selectedResourceMax)]);
        this.itemForm.get('quantity')?.updateValueAndValidity();
      }
    });

    this.getEvent();
    this.getResources();
    this.getAllocations(); 
  }

  getEvent(): void {
    this.httpService.GetAllevents().subscribe((data: any) => { this.eventList = data; });
  }

  getResources(): void {
    this.httpService.GetAllResources().subscribe((data: any) => { this.resourceList = data; });
  }

  getAllocations(): void {
    this.httpService.getAllAllocations().subscribe(
      (data: any[]) => { 
        const seen = new Set();
        this.allocationList = data.filter(alloc => {
          const eventId = alloc.event?.eventID || alloc.event?.id;
          const resourceId = alloc.resource?.resourceID || alloc.resource?.id;
          const uniqueKey = `${eventId}-${resourceId}`;
          if (seen.has(uniqueKey)) return false; 
          seen.add(uniqueKey);
          return true; 
        });
        this.calculatePagination();
      }
    );
  }

  // --- Pagination Logic ---
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.allocationList.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    this.updatePaginatedList();
  }

  updatePaginatedList(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedAllocationList = this.allocationList.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedList();
    }
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      const formValues = this.itemForm.value;
      this.httpService.allocateResources(formValues.eventId, formValues.resourceId, formValues).subscribe(
        (res: any) => {
          this.showMessage = true;
          this.responseMessage = "Resource successfully allocated to the event!";
          this.showError = false;
          
          this.itemForm.reset();
          this.getResources(); 
          this.getAllocations(); // Automatically updates pagination
          
          setTimeout(() => this.showMessage = false, 3000);
        },
        (error: any) => {
          this.showError = true;
          this.errorMessage = "Failed to allocate resource. Please check availability and try again.";
          setTimeout(() => this.showError = false, 3000);
        }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}
