import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.scss']
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
  
  activeTab: string = 'CATALOG'; 
  availableEvents: any[] = [];
  myTickets: any[] = [];
  username: string = '';
  
  // Tracks which specific ticket to isolate for the PDF
  printingTicketId: any = null;
  isPrinting: boolean = false;
  
  // NEW: Tracks selected quantity for each event card
  ticketQuantities: any = {}; 

  private pollingInterval: any; 

  constructor(public router: Router, public httpService: HttpService) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'client';
    this.fetchActiveEvents();
    this.loadMyTickets();

    this.pollingInterval = setInterval(() => {
      if (this.activeTab === 'CATALOG') {
        this.fetchActiveEvents();
      } else {
        this.syncTicketsWithDatabase();
      }
    }, 5000); 
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  fetchActiveEvents(): void {
    this.httpService.getActiveEvents().subscribe(
      (data: any[]) => { this.availableEvents = data; },
      (error) => console.error(error)
    );
  }

  loadMyTickets(): void {
    const stored = localStorage.getItem('myTickets_' + this.username);
    if (stored) { 
      this.myTickets = JSON.parse(stored); 
      this.syncTicketsWithDatabase(); 
    }
  }

  syncTicketsWithDatabase(): void {
    if (!this.myTickets || this.myTickets.length === 0) return;

    let updated = false;
    let checksCompleted = 0;

    this.myTickets.forEach((ticket, index) => {
      const eventId = ticket.eventID || ticket.id;
      
      this.httpService.getClientEventDetails(eventId).subscribe(
        (liveEvent: any) => {
          if (liveEvent && liveEvent.status?.toUpperCase() !== ticket.status?.toUpperCase()) {
            this.myTickets[index].status = liveEvent.status?.toUpperCase();
            this.myTickets[index].title = liveEvent.title; 
            updated = true;
          }
          checksCompleted++;
          if (checksCompleted === this.myTickets.length && updated) {
            this.myTickets = [...this.myTickets]; 
            localStorage.setItem('myTickets_' + this.username, JSON.stringify(this.myTickets));
          }
        },
        (error) => { checksCompleted++; }
      );
    });
  }

  // --- NEW: Stepper Logic ---
  getQuantity(eventId: any): number {
    return this.ticketQuantities[eventId] || 1;
  }

  increment(eventId: any, maxLeft: number): void {
    let current = this.getQuantity(eventId);
    if (current < maxLeft && current < 10) { 
      this.ticketQuantities[eventId] = current + 1;
    }
  }

  decrement(eventId: any): void {
    let current = this.getQuantity(eventId);
    if (current > 1) {
      this.ticketQuantities[eventId] = current - 1;
    }
  }

  // --- UPDATED: Booking Logic ---
  bookTicket(event: any): void {
    const eventId = event.eventID || event.id;
    const qty = this.getQuantity(eventId);
    
    const newTicket = { 
      ...event, 
      uniqueTicketId: Date.now() + Math.floor(Math.random() * 1000),
      quantity: qty 
    };

    this.httpService.bookEventPass(eventId, qty).subscribe(() => {
      this.myTickets.unshift(newTicket);
      localStorage.setItem('myTickets_' + this.username, JSON.stringify(this.myTickets));
      this.activeTab = 'MY_TICKETS'; 
      this.syncTicketsWithDatabase();
      this.ticketQuantities[eventId] = 1; // Reset stepper
    });
  }

  switchTab(tab: string): void { 
    this.activeTab = tab; 
    if (tab === 'MY_TICKETS') this.syncTicketsWithDatabase();
    else if (tab === 'CATALOG') this.fetchActiveEvents();
  }

  printTicket(ticket: any): void {
    this.isPrinting = true;
    this.printingTicketId = ticket.uniqueTicketId || ticket.eventID || ticket.id;
    
    setTimeout(() => {
      window.print();
      this.printingTicketId = null;
      this.isPrinting = false; 
    }, 1200); 
  }
}