import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-resource-allocate',
  templateUrl: './resource-allocate.component.html',
  styleUrls: ['./resource-allocate.component.scss']
})
export class ResourceAllocateComponent implements OnInit {
  
  showError: boolean = false; errorMessage: string = ''; 
  showMessage: boolean = false; responseMessage: string = ''; 
  
  resourceList: any[] = []; eventList: any[] = []; allocationList: any[] = [];
  filteredAllocationList: any[] = [];
  
  selectedEventId: number | null = null;
  manifest: any[] = []; 
  resourceSearchTerm: string = '';
  allocationSearchTerm: string = '';

  currentPage: number = 1; itemsPerPage: number = 10; totalPages: number = 0;
  paginatedAllocationList: any[] = [];

  constructor(public httpService: HttpService) { }

  ngOnInit(): void {
    this.getEvent();
    this.getResources();
    this.getAllocations(); 
  }

  getEvent(): void { this.httpService.GetAllevents().subscribe((data: any) => this.eventList = data); }
  getResources(): void { this.httpService.GetAllResources().subscribe((data: any) => this.resourceList = data); }

  getAllocations(): void {
    this.httpService.getAllAllocations().subscribe((data: any[]) => { 
        const seen = new Set();
        this.allocationList = data.filter(alloc => {
          const evId = alloc.event?.eventID || alloc.event?.id || alloc.event?.title;
          const resId = alloc.resource?.resourceID || alloc.resource?.id || alloc.resource?.name;
          const uniqueKey = `${evId}-${resId}`;
          if (seen.has(uniqueKey)) return false; 
          seen.add(uniqueKey); 
          return true; 
        });
        this.filterAllocations(); 
      }
    );
  }

  get filteredResources() {
    if (!this.resourceSearchTerm) return this.resourceList;
    const term = this.resourceSearchTerm.toLowerCase();
    return this.resourceList.filter(r => r.name?.toLowerCase().includes(term) || r.type?.toLowerCase().includes(term));
  }

  filterAllocations() {
    if (!this.allocationSearchTerm) {
      this.filteredAllocationList = [...this.allocationList];
    } else {
      const term = this.allocationSearchTerm.toLowerCase();
      this.filteredAllocationList = this.allocationList.filter(alloc => 
        alloc.resource?.name?.toLowerCase().includes(term) ||
        alloc.event?.title?.toLowerCase().includes(term) ||
        alloc.status?.toLowerCase().includes(term)
      );
    }
    this.calculatePagination();
  }

  addToManifest(resource: any) {
    if (resource.quantity <= 0) return;
    const existing = this.manifest.find(item => item.resource.name === resource.name);

    if (!existing) {
      this.manifest.push({ resource: resource, quantity: 1 });
    } else {
      if (existing.quantity < resource.quantity) {
        existing.quantity += 1;
      } else {
        this.showError = true;
        this.errorMessage = `Maximum available quantity for ${resource.name} reached.`;
        setTimeout(() => this.showError = false, 3000);
      }
    }
  }

  removeFromManifest(index: number) { this.manifest.splice(index, 1); }

  validateQuantity(item: any): void {
    const maxAvailable = item.resource.quantity;
    if (item.quantity > maxAvailable) { item.quantity = maxAvailable; } 
    else if (item.quantity < 1) { item.quantity = 1; }
  }

  deployManifest(): void {
    if (!this.selectedEventId) {
      this.showError = true; this.errorMessage = "Please select a Target Event first.";
      setTimeout(() => this.showError = false, 3000); return;
    }
    if (this.manifest.length === 0) {
      this.showError = true; this.errorMessage = "Manifest is empty. Add resources first.";
      setTimeout(() => this.showError = false, 3000); return;
    }

    for (let item of this.manifest) {
      if (item.quantity > item.resource.quantity) {
        this.showError = true; 
        this.errorMessage = `Cannot allocate more ${item.resource.name} than available.`;
        setTimeout(() => this.showError = false, 4000); return;
      }
    }

    // BULLETPROOF PAYLOAD: Clean, flat map isolating Jackson from Hibernate entities!
    const payload = this.manifest.map(item => {
      const extractedId = item.resource.resourceID || item.resource.resourceId || item.resource.id || item.resource.ID;
      return {
        resourceId: extractedId,
        quantity: item.quantity
      };
    });

    this.httpService.allocateResourcesBulk(this.selectedEventId, payload).subscribe(
      () => {
        this.showMessage = true; this.responseMessage = "Manifest Successfully Deployed!"; this.showError = false;
        this.manifest = []; 
        this.selectedEventId = null;
        this.getResources(); 
        this.getAllocations(); 
        setTimeout(() => this.showMessage = false, 4000);
      },
      (error) => {
        this.showError = true; 
        this.errorMessage = error.error?.message || "Failed to deploy manifest.";
        setTimeout(() => this.showError = false, 4000);
      }
    );
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAllocationList.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    this.updatePaginatedList();
  }
  updatePaginatedList(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedAllocationList = this.filteredAllocationList.slice(start, start + this.itemsPerPage);
  }
  changePage(p: number): void { if (p >= 1 && p <= this.totalPages) { this.currentPage = p; this.updatePaginatedList(); } }
  getPagesArray(): number[] { return Array(this.totalPages).fill(0).map((x, i) => i + 1); }
}