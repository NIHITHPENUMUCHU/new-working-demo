import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit, OnDestroy {
  roleName: string | null = null;
  currentDate: Date = new Date();
  greeting: string = '';
  
  username: string = 'User';
  lastLogin: Date = new Date(); 
  
  // Planner Metrics
  totalEvents: number = 0; scheduledEvents: number = 0; ongoingEvents: number = 0; completedEvents: number = 0;
  availableResources: number = 0; totalResources: number = 0; totalAllocations: number = 0;
  resourceUtilization: number = 0;

  // --- NEW: Live Monitor Array ---
  activeEvents: any[] = [];

  // Staff/Client Dynamics
  staffEventCount: number = 0;
  clientPassCount: number = 0;

  showFAQ: boolean = false; activeFaqIndex: number | null = null;
  
  faqs = [
    { question: 'How do I secure an entry pass?', answer: 'Click "Open Client Portal" to browse the active event catalog. If an event has available capacity, you can secure your digital pass instantly.' },
    { question: 'How do I download my ticket as a PDF?', answer: 'Inside the portal, navigate to the "My Digital Passes" tab. Click the "Save as PDF" button on any active pass to generate a high-resolution, printable ticket.' },
    { question: 'What happens if an event is sold out?', answer: 'Our live capacity engine automatically locks bookings the moment maximum capacity is reached. You will see a "SOLD OUT" stamp on the event card.' },
    { question: 'What do the different event statuses mean?', answer: '"Scheduled" means the event is upcoming. "Ongoing" means operations are live and you can enter the venue. "Completed" means the event has ended and your pass QR code is expired.' }
  ];

  private pollingInterval: any;

  constructor(private authService: AuthService, private router: Router, private httpService: HttpService) {}

  ngOnInit(): void {
    if (!this.authService.getLoginStatus()) { this.router.navigate(['/login']); return; }
    
    this.setGreeting();

    const rawRole = this.authService.getRole();
    this.roleName = rawRole ? rawRole.toUpperCase() : null;

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

    const previousLoginKey = 'previousLogin_' + rawUsernameForKeys; 
    const storedPreviousLogin = localStorage.getItem(previousLoginKey);
    if (storedPreviousLogin) {
      this.lastLogin = new Date(storedPreviousLogin);
    } else {
      const currentLogin = localStorage.getItem('lastLogin_' + rawUsernameForKeys);
      this.lastLogin = currentLogin ? new Date(currentLogin) : new Date();
    }

    if (this.roleName === 'PLANNER') {
      this.fetchLiveMetrics();
      this.pollingInterval = setInterval(() => { this.fetchLiveMetrics(); }, 5000);
    } 
    else if (this.roleName === 'STAFF') {
      this.httpService.getStaffEvents(rawUsernameForKeys).subscribe((data: any[]) => {
         if (data) this.staffEventCount = data.length;
      });
    }
    else if (this.roleName === 'CLIENT') {
      const tickets = localStorage.getItem('myTickets_' + rawUsernameForKeys);
      if (tickets) this.clientPassCount = JSON.parse(tickets).length;
    }
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good Morning';
    else if (hour < 18) this.greeting = 'Good Afternoon';
    else this.greeting = 'Good Evening';
  }

  fetchLiveMetrics(): void {
    this.httpService.GetAllevents().subscribe((data: any[]) => { 
        if (data) {
          this.totalEvents = data.length;
          this.scheduledEvents = data.filter(e => e.status?.toUpperCase() === 'SCHEDULED').length;
          this.ongoingEvents = data.filter(e => e.status?.toUpperCase() === 'ONGOING').length;
          this.completedEvents = data.filter(e => e.status?.toUpperCase() === 'COMPLETED').length;

          // --- NEW: Live Capacity Monitor Logic ---
          this.activeEvents = data
            .filter(e => e.status?.toUpperCase() === 'SCHEDULED' || e.status?.toUpperCase() === 'ONGOING')
            .map(e => {
              const booked = e.bookedCount || 0;
              const max = e.maxCapacity || 1;
              const fillPercentage = Math.min(Math.round((booked / max) * 100), 100);
              return { ...e, fillPercentage };
            })
            .sort((a, b) => b.fillPercentage - a.fillPercentage) // Sort by highest demand
            .slice(0, 4); // Display top 4 events
        }
    });

    this.httpService.GetAllResources().subscribe((data: any[]) => { 
        if (data) {
          this.totalResources = data.length;
          this.availableResources = data.filter(res => res.availability === true).length;
          if (this.totalResources > 0) {
            this.resourceUtilization = Math.round(((this.totalResources - this.availableResources) / this.totalResources) * 100);
          } else {
            this.resourceUtilization = 0;
          }
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