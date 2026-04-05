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
  
  username: string = 'User';
  lastLogin: Date = new Date(); 
  
  totalEvents: number = 0; scheduledEvents: number = 0; ongoingEvents: number = 0; completedEvents: number = 0;
  availableResources: number = 0; totalResources: number = 0; totalAllocations: number = 0;

  showFAQ: boolean = false; activeFaqIndex: number | null = null;
  
  // UPDATED FAQs FOR NEW FEATURES
  faqs = [
    { 
      question: 'How do I secure an entry pass?', 
      answer: 'Click "Open Client Portal" to browse the active event catalog. If an event has available capacity, you can secure your digital pass instantly.' 
    },
    { 
      question: 'How do I download my ticket as a PDF?', 
      answer: 'Inside the portal, navigate to the "My Digital Passes" tab. Click the "Save as PDF" button on any active pass to generate a high-resolution, printable ticket.' 
    },
    { 
      question: 'What happens if an event is sold out?', 
      answer: 'Our live capacity engine automatically locks bookings the moment maximum capacity is reached. You will see a "SOLD OUT" stamp on the event card.' 
    },
    { 
      question: 'What do the different event statuses mean?', 
      answer: '"Scheduled" means the event is upcoming. "Ongoing" means operations are live and you can enter the venue. "Completed" means the event has ended and your pass QR code is expired.' 
    }
  ];

  // Background Sync Tracker
  private pollingInterval: any;

  constructor(private authService: AuthService, private router: Router, private httpService: HttpService) {}

  ngOnInit(): void {
    if (!this.authService.getLoginStatus()) { this.router.navigate(['/login']); return; }
    
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
      
      // Live Dashboard Auto-Refresh
      this.pollingInterval = setInterval(() => {
        this.fetchLiveMetrics();
      }, 5000);
    }
  }

  // Prevents memory leaks when navigating away
  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
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