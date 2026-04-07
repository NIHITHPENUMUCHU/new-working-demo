import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-add-resource',
  templateUrl: './add-resource.component.html',
  styleUrls: ['./add-resource.component.scss']
})
export class AddResourceComponent implements OnInit {
  itemForm!: FormGroup;
  resourceList: any[] = [];
  filteredResourceList: any[] = []; // NEW: Added for search filtering
  searchTerm: string = ''; // NEW: Search input binding

  showMessage: boolean = false;
  responseMessage: string = '';
  showError: boolean = false;
  errorMessage: string = '';

  // --- Pagination Variables ---
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  paginatedResourceList: any[] = [];

  constructor(private formBuilder: FormBuilder, private httpService: HttpService) {}

  ngOnInit(): void {
    this.itemForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]], 
      availability: [true, Validators.required] 
    });
    
    this.getResources();
  }

  getResources(): void {
    this.httpService.GetAllResources().subscribe((data: any) => {
      this.resourceList = data;
      this.filterResources(); // Re-run filter which will also update pagination
    });
  }

  // --- NEW: Search Logic ---
  filterResources(): void {
    if (!this.searchTerm) {
      this.filteredResourceList = [...this.resourceList];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredResourceList = this.resourceList.filter(res => 
        res.name?.toLowerCase().includes(term) || 
        res.type?.toLowerCase().includes(term)
      );
    }
    this.calculatePagination(); // Recalculate pages after filtering
  }

  // --- Pagination Logic ---
  calculatePagination(): void {
    // Changed to use filteredResourceList instead of raw resourceList
    this.totalPages = Math.ceil(this.filteredResourceList.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    this.updatePaginatedList();
  }

  updatePaginatedList(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    // Changed to slice from filteredResourceList
    this.paginatedResourceList = this.filteredResourceList.slice(startIndex, endIndex);
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
      this.httpService.addResource(this.itemForm.value).subscribe(
        (res: any) => {
          this.showMessage = true;
          this.responseMessage = "Resource added to global inventory!";
          this.itemForm.reset({ availability: true });
          this.getResources(); // Automatically updates list & pagination!
          setTimeout(() => this.showMessage = false, 3000);
        },
        (error: any) => {
          this.showError = true;
          this.errorMessage = "Failed to add resource.";
          setTimeout(() => this.showError = false, 3000);
        }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}