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
  pollingInterval: any;

  constructor(
    private httpService: HttpService, 
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Security Check: Only Planners can view this page
    const role = this.authService.getRole();
    if (!this.authService.getLoginStatus() || role?.toUpperCase() !== 'PLANNER') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.fetchLiveTickets();

    // Poll the database every 5 seconds for live capacity updates
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
          // Sort so that newer or ongoing events show first, but keep it simple for now
          this.allEvents = data;
        }
      },
      (error) => console.error("Failed to fetch live tickets", error)
    );
  }

  getCapacityPercentage(booked: number, max: number): number {
    if (!max || max === 0) return 0;
    return Math.min(Math.round((booked / max) * 100), 100);
  }
}