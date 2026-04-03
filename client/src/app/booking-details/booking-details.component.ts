import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.scss']
})
export class BookingDetailsComponent implements OnInit {
  
  activeTab: string = 'CATALOG'; 
  availableEvents: any[] = [];
  myTickets: any[] = [];
  username: string = '';

  // NEW: Tracks which ticket is being exported to PDF
  printingTicketId: any = null;

  constructor(public router: Router, public httpService: HttpService) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'client';
    this.fetchActiveEvents();
    this.loadMyTickets();
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
        (error) => {
          console.error("Background sync failed for ticket ID:", eventId, error);
          checksCompleted++;
        }
      );
    });
  }

  bookTicket(event: any): void {
    const newTicket = { 
      ...event, 
      uniqueTicketId: Date.now() + Math.floor(Math.random() * 1000) 
    };

    this.httpService.bookEventPass(event.eventID || event.id).subscribe(() => {
      this.myTickets.unshift(newTicket);
      localStorage.setItem('myTickets_' + this.username, JSON.stringify(this.myTickets));
      this.activeTab = 'MY_TICKETS'; 
      this.syncTicketsWithDatabase();
    });
  }

  switchTab(tab: string): void { 
    this.activeTab = tab; 
    if (tab === 'MY_TICKETS') this.syncTicketsWithDatabase();
    else if (tab === 'CATALOG') this.fetchActiveEvents();
  }

  // NEW FEATURE: High-Res PDF Generator (No Libraries Needed!)
  printTicket(ticket: any): void {
    // Isolate the specific ticket by ID
    this.printingTicketId = ticket.uniqueTicketId || ticket.eventID || ticket.id;
    
    // Give Angular a split-second to apply the CSS isolation classes, then trigger print
    setTimeout(() => {
      window.print();
      // Restore the screen as soon as the print/PDF dialog closes
      this.printingTicketId = null;
    }, 150);
  }
}