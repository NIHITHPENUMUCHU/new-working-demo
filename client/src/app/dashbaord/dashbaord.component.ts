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
  
  totalEvents: number = 0; scheduledEvents: number = 0; ongoingEvents: number = 0; completedEvents: number = 0;
  availableResources: number = 0; totalResources: number = 0; 
  activeAllocations: number = 0; itemsReturned: number = 0; 
  resourceUtilization: number = 0;
  
  // LIVE MONITOR ARRAY
  activeEvents: any[] = [];
  rawEventData: any[] = []; 

  staffEventCount: number = 0;
  clientPassCount: number = 0;

  showFAQ: boolean = false; 
  activeFaqIndex: number | null = null;
  faqs = [
    { question: 'How do I secure an entry pass?', answer: 'Click "Open Client Portal" to browse the active event catalog. If an event has available capacity, you can secure your digital pass instantly.' },
    { question: 'How do I download my ticket as a PDF?', answer: 'Inside the portal, navigate to the "My Digital Passes" tab. Click the "Save as PDF" button on any active pass to generate a printable ticket.' },
    { question: 'What happens if an event is sold out?', answer: 'Our live capacity engine automatically locks bookings the moment maximum capacity is reached.' },
    { question: 'What do the different event statuses mean?', answer: '"Scheduled" means upcoming. "Ongoing" means operations are live. "Completed" means ended. "Cancelled" means the event was aborted and tickets are invalid.' }
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
      this.username = this.roleName === 'PLANNER' ? 'Event Planner' : (this.roleName === 'STAFF' ? 'Operations Staff' : 'Valued Client');
    }

    const previousLoginKey = 'previousLogin_' + rawUsernameForKeys; 
    const storedPreviousLogin = localStorage.getItem(previousLoginKey);
    this.lastLogin = storedPreviousLogin ? new Date(storedPreviousLogin) : new Date();

    if (this.roleName === 'PLANNER') {
      this.fetchLiveMetrics();
      this.pollingInterval = setInterval(() => { this.fetchLiveMetrics(); }, 5000);
    } 
    else if (this.roleName === 'STAFF') {
      this.httpService.getStaffEvents(rawUsernameForKeys).subscribe((data: any[]) => { if (data) this.staffEventCount = data.length; });
    }
    else if (this.roleName === 'CLIENT') {
      const tickets = localStorage.getItem('myTickets_' + rawUsernameForKeys);
      if (tickets) this.clientPassCount = JSON.parse(tickets).length;
    }
  }

  ngOnDestroy(): void { if (this.pollingInterval) clearInterval(this.pollingInterval); }

  setGreeting(): void {
    const hour = new Date().getHours();
    this.greeting = hour < 12 ? 'Good Morning' : (hour < 18 ? 'Good Afternoon' : 'Good Evening');
  }

  fetchLiveMetrics(): void {
    this.httpService.GetAllevents().subscribe((data: any[]) => { 
        if (data) {
          this.rawEventData = data; 
          this.totalEvents = data.length;
          this.scheduledEvents = data.filter(e => e.status?.toUpperCase() === 'SCHEDULED').length;
          this.ongoingEvents = data.filter(e => e.status?.toUpperCase() === 'ONGOING').length;
          this.completedEvents = data.filter(e => e.status?.toUpperCase() === 'COMPLETED').length;

          // --- FIX: Bulletproof Live Capacity Math ---
          this.activeEvents = data
            .filter(e => e.status?.toUpperCase() === 'SCHEDULED' || e.status?.toUpperCase() === 'ONGOING')
            .map(e => {
              // Strictly cast to numbers to prevent NaN calculation errors
              const booked = Number(e.bookedCount) || 0;
              const max = Number(e.maxCapacity) || 1; // Prevent divide by zero
              
              let fillPercentage = Math.round((booked / max) * 100);
              
              // Cap the percentage between 0 and 100 visually
              if (fillPercentage > 100) fillPercentage = 100;
              if (fillPercentage < 0) fillPercentage = 0;

              // Pass the sanitized numbers to the HTML
              return { ...e, fillPercentage, safeBooked: booked, safeMax: max };
            })
            .sort((a, b) => b.fillPercentage - a.fillPercentage) // Sort highest demand first
            .slice(0, 4); // Display top 4
        }
    });

    this.httpService.GetAllResources().subscribe((data: any[]) => { 
        if (data) {
          this.totalResources = data.length;
          this.availableResources = data.filter(res => res.availability === true).length;
          this.resourceUtilization = this.totalResources > 0 ? Math.round(((this.totalResources - this.availableResources) / this.totalResources) * 100) : 0;
        }
    });

    this.httpService.getAllAllocations().subscribe((data: any[]) => {
        if (data) {
          const seen = new Set();
          let deployed = 0; let returned = 0;
          data.forEach(alloc => {
            const uniqueKey = `${alloc.event?.eventID}-${alloc.resource?.resourceID}`;
            if (!seen.has(uniqueKey)) {
              seen.add(uniqueKey);
              if (alloc.status === 'RETURNED') { returned++; } else { deployed++; }
            }
          });
          this.activeAllocations = deployed;
          this.itemsReturned = returned;
        }
    });
  }

  exportToCSV(): void {
    if (!this.rawEventData || this.rawEventData.length === 0) return;
    let csvContent = "Event ID,Title,Date,Location,Status,Tickets Sold,Max Capacity,Assigned Staff\n";
    this.rawEventData.forEach(ev => {
      const dateStr = ev.dateTime ? new Date(ev.dateTime).toLocaleDateString() : 'TBD';
      csvContent += `${ev.id || ev.eventID},"${ev.title}","${dateStr}","${ev.location}","${ev.status}",${ev.bookedCount || 0},${ev.maxCapacity},"${ev.assignedStaffUsername || 'Public'}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "EventMaster_MasterReport.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  toggleFAQ(): void { this.showFAQ = !this.showFAQ; }
  toggleFaqItem(index: number): void { this.activeFaqIndex = this.activeFaqIndex === index ? null : index; }
}
