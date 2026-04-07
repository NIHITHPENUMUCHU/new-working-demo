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
  filteredEvents: any[] = []; // NEW: For search tracking
  searchTerm: string = ''; // NEW: Search input

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
          this.filterEvents(); // Automatically re-filters every time live data arrives
        }
      },
      (error) => console.error("Failed to fetch live tickets", error)
    );
  }

  // --- NEW: Search filter logic ---
  filterEvents(): void {
    if (!this.searchTerm) {
      this.filteredEvents = [...this.allEvents];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredEvents = this.allEvents.filter(e => 
        e.title?.toLowerCase().includes(term) ||
        e.status?.toLowerCase().includes(term)
      );
    }
  }

  getCapacityPercentage(booked: number, max: number): number {
    if (!max || max === 0) return 0;
    return Math.min(Math.round((booked / max) * 100), 100);
  }
}