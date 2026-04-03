import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {
  roleName: string | null = null;
  currentDate: Date = new Date();
  
  // User Identity Variables
  username: string = 'User';
  lastLogin: Date = new Date(); 
  
  // System Metrics
  totalEvents: number = 0; scheduledEvents: number = 0; ongoingEvents: number = 0; completedEvents: number = 0;
  availableResources: number = 0; totalResources: number = 0; totalAllocations: number = 0;

  // Client FAQ
  showFAQ: boolean = false; activeFaqIndex: number | null = null;
  faqs = [
    { question: 'How do I use this dashboard?', answer: 'Click "Retrieve Booking" to search for your event.' },
    { question: 'Can I purchase tickets directly here?', answer: 'EventMaster Pro operates as a B2B management system.' },
    { question: 'What does "Ongoing" status mean?', answer: 'Staff has actively set up the venue and operations are live!' }
  ];

  constructor(private authService: AuthService, private router: Router, private httpService: HttpService) {}

  ngOnInit(): void {
    if (!this.authService.getLoginStatus()) { this.router.navigate(['/login']); return; }
    
    const rawRole = this.authService.getRole();
    this.roleName = rawRole ? rawRole.toUpperCase() : null;

    // 1. Fetch exact Username
    const storedName = localStorage.getItem('username');
    let rawUsernameForKeys = 'unknown_user'; 

    if (storedName && storedName.trim() !== '') {
      rawUsernameForKeys = storedName.toLowerCase(); 
      this.username = storedName.charAt(0).toUpperCase() + storedName.slice(1); 
    } else {
      if (this.roleName === 'PLANNER') this.username = 'Event Planner';
      else if (this.roleName === 'STAFF') this.username = 'Operations Staff';
      else if (this.roleName === 'CLIENT') this.username = 'Valued Client';
      else this.username = 'User';
    }

    // 2. THE FIX: Read the PREVIOUS login time that we rotated in the Login Component!
    const previousLoginKey = 'previousLogin_' + rawUsernameForKeys; 
    const storedPreviousLogin = localStorage.getItem(previousLoginKey);

    if (storedPreviousLogin) {
      this.lastLogin = new Date(storedPreviousLogin);
    } else {
      // Emergency fallback just in case memory was cleared
      const currentLogin = localStorage.getItem('lastLogin_' + rawUsernameForKeys);
      this.lastLogin = currentLogin ? new Date(currentLogin) : new Date();
    }

    if (this.roleName === 'PLANNER') {
      this.fetchLiveMetrics();
    }
  }

  fetchLiveMetrics(): void {
    this.httpService.GetAllevents().subscribe((data: any[]) => { 
        if (data) {
          this.totalEvents = data.length;
          this.scheduledEvents = data.filter(e => e.status?.toUpperCase() === 'SCHEDULED').length;
          this.ongoingEvents = data.filter(e => e.status?.toUpperCase() === 'ONGOING').length;
          this.completedEvents = data.filter(e => e.status?.toUpperCase() === 'COMPLETED').length;
        }
    });

    this.httpService.GetAllResources().subscribe((data: any[]) => { 
        if (data) {
          this.totalResources = data.length;
          this.availableResources = data.filter(res => res.availability === true).length;
        }
    });

    this.httpService.getAllAllocations().subscribe((data: any[]) => {
        if (data) {
          const seen = new Set();
          this.totalAllocations = data.filter(alloc => {
            const uniqueKey = `${alloc.event?.eventID}-${alloc.resource?.resourceID}`;
            if (seen.has(uniqueKey)) return false; seen.add(uniqueKey); return true;
          }).length;
        }
    });
  }

  toggleFAQ(): void { this.showFAQ = !this.showFAQ; }
  toggleFaqItem(index: number): void { this.activeFaqIndex = this.activeFaqIndex === index ? null : index; }
}