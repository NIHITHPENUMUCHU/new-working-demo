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
  
  printingTicketId: any = null;
  isPrinting: boolean = false;
  ticketQuantities: any = {}; 

  catalogSearchTerm: string = '';
  ticketSearchTerm: string = '';

  activeBookingEventId: number | null = null;
  showCancelModal: boolean = false;
  ticketToCancel: any = null;

  private pollingInterval: any; 

  constructor(public router: Router, public httpService: HttpService) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'client';
    this.fetchActiveEvents();
    this.loadMyTickets();

    this.pollingInterval = setInterval(() => {
      if (this.activeTab === 'CATALOG') { this.fetchActiveEvents(); } 
      else { this.syncTicketsWithDatabase(); }
    }, 5000); 
  }

  ngOnDestroy(): void { if (this.pollingInterval) clearInterval(this.pollingInterval); }

  get filteredCatalog() {
    if (!this.catalogSearchTerm) return this.availableEvents;
    const term = this.catalogSearchTerm.toLowerCase();
    return this.availableEvents.filter(e => e.title?.toLowerCase().includes(term) || e.location?.toLowerCase().includes(term));
  }

  get filteredTickets() {
    if (!this.ticketSearchTerm) return this.myTickets;
    const term = this.ticketSearchTerm.toLowerCase();
    return this.myTickets.filter(t => t.title?.toLowerCase().includes(term) || (t.eventID || t.id || t.uniqueTicketId)?.toString().includes(term));
  }

  fetchActiveEvents(): void { this.httpService.getActiveEvents().subscribe(data => this.availableEvents = data); }

  loadMyTickets(): void {
    const stored = localStorage.getItem('myTickets_' + this.username);
    if (stored) { this.myTickets = JSON.parse(stored); this.syncTicketsWithDatabase(); }
  }

  syncTicketsWithDatabase(): void {
    if (!this.myTickets || this.myTickets.length === 0) return;
    let updated = false; let checksCompleted = 0;
    
    this.myTickets.forEach((ticket, index) => {
      // FIX 1: If the user manually cancelled this pass, NEVER overwrite it with the live event status!
      if (ticket.status === 'CANCELLED' && ticket.userCancelled === true) {
        checksCompleted++;
        if (checksCompleted === this.myTickets.length && updated) {
          this.myTickets = [...this.myTickets]; 
          localStorage.setItem('myTickets_' + this.username, JSON.stringify(this.myTickets));
        }
        return; // Skip server sync for this specific ticket
      }

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
        }, error => { checksCompleted++; }
      );
    });
  }

  initiateBooking(eventId: any): void { this.activeBookingEventId = eventId; }
  cancelBookingMode(): void { this.activeBookingEventId = null; }

  getQuantity(eventId: any): number { return this.ticketQuantities[eventId] || 1; }
  increment(eventId: any, maxLeft: number): void { let current = this.getQuantity(eventId); if (current < maxLeft && current < 10) { this.ticketQuantities[eventId] = current + 1; } }
  decrement(eventId: any): void { let current = this.getQuantity(eventId); if (current > 1) { this.ticketQuantities[eventId] = current - 1; } }

  bookTicket(event: any): void {
    const eventId = event.eventID || event.id;
    const qty = this.getQuantity(eventId);
    const newTicket = { ...event, uniqueTicketId: Date.now() + Math.floor(Math.random() * 1000), quantity: qty, userCancelled: false };

    this.httpService.bookEventPass(eventId, qty).subscribe(() => {
      this.myTickets.unshift(newTicket);
      localStorage.setItem('myTickets_' + this.username, JSON.stringify(this.myTickets));
      this.activeBookingEventId = null; 
      this.activeTab = 'MY_TICKETS'; 
      this.syncTicketsWithDatabase();
      this.ticketQuantities[eventId] = 1;
    });
  }

  openCancelModal(ticket: any): void {
    this.ticketToCancel = ticket;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.ticketToCancel = null;
  }

  confirmCancelTicket(): void {
    if (!this.ticketToCancel) return;
    const eventId = this.ticketToCancel.eventID || this.ticketToCancel.id;
    const qty = this.ticketToCancel.quantity || 1;

    this.httpService.cancelEventPass(eventId, qty).subscribe(() => {
      const index = this.myTickets.findIndex(t => t.uniqueTicketId === this.ticketToCancel.uniqueTicketId);
      if (index !== -1) {
        // FIX 1: Lock the ticket into 'CANCELLED' state permanently using the userCancelled flag
        this.myTickets[index].status = 'CANCELLED';
        this.myTickets[index].userCancelled = true; 
        localStorage.setItem('myTickets_' + this.username, JSON.stringify(this.myTickets));
      }
      this.fetchActiveEvents(); 
      this.closeCancelModal();
    }, error => {
      console.error("Failed to cancel ticket", error);
      this.closeCancelModal();
    });
  }

  switchTab(tab: string): void { 
    this.activeTab = tab; 
    this.activeBookingEventId = null; 
    if (tab === 'MY_TICKETS') this.syncTicketsWithDatabase();
    else if (tab === 'CATALOG') this.fetchActiveEvents();
  }

  printTicket(ticket: any): void {
    this.isPrinting = true;
    this.printingTicketId = ticket.eventID || ticket.id || ticket.uniqueTicketId;
    setTimeout(() => { window.print(); this.printingTicketId = null; this.isPrinting = false; }, 1200); 
  }
}