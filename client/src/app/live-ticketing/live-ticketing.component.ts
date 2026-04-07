import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-live-ticketing',
  templateUrl: './live-ticketing.component.html',
  styleUrls: ['./live-ticketing.component.scss']
})
export class LiveTicketingComponent implements OnInit, OnDestroy {
  allEvents: any[] = [];
  filteredEvents: any[] = []; 
  
  // --- FILTER STATE ---
  searchTerm: string = ''; 
  statusFilter: string = 'ALL';

  // --- PAGINATION STATE ---
  currentPage: number = 1;
  itemsPerPage: number = 9; // Display in 3x3 grid format
  totalPages: number = 0;
  paginatedEvents: any[] = [];

  pollingInterval: any;

  constructor(
    private httpService: HttpService, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const role = this.authService.getRole();
    if (!this.authService.getLoginStatus() || role?.toUpperCase() !== 'PLANNER') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.fetchLiveTickets();

    // Auto-refresh every 5 seconds
    this.pollingInterval = setInterval(() => { 
      this.fetchLiveTickets(); 
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  fetchLiveTickets(): void {
    this.httpService.GetAllevents().subscribe(
      (data: any[]) => { 
        if (data) {
          this.allEvents = data;
          this.applyFilters(); // Re-apply current search/sort/page on new data
        }
      },
      (error) => console.error("Failed to fetch live tickets", error)
    );
  }

  // --- FILTER LOGIC ---
  applyFilters(): void {
    let temp = [...this.allEvents];

    // 1. Text Search Filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      temp = temp.filter(e => 
        e.title?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term)
      );
    }

    // 2. Status Dropdown Filter
    if (this.statusFilter !== 'ALL') {
      temp = temp.filter(e => e.status?.toUpperCase() === this.statusFilter);
    }

    this.filteredEvents = temp;
    this.calculatePagination();
  }

  // --- PAGINATION LOGIC ---
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEvents.length / this.itemsPerPage);
    
    // Prevent out-of-bounds page if filters reduce the total items
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    this.updatePaginatedList();
  }

  updatePaginatedList(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedEvents = this.filteredEvents.slice(start, start + this.itemsPerPage);
  }

  changePage(p: number): void { 
    if (p >= 1 && p <= this.totalPages) { 
      this.currentPage = p; 
      this.updatePaginatedList(); 
    } 
  }
  
  getPagesArray(): number[] { 
    return Array(this.totalPages).fill(0).map((x, i) => i + 1); 
  }

  getCapacityPercentage(booked: number, max: number): number {
    if (!max || max === 0) return 0;
    return Math.min(Math.round((booked / max) * 100), 100);
  }
}