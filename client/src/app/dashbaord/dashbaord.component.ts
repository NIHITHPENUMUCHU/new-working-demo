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
  
  // LIVE MONITOR & LEDGER ARRAYS
  activeEvents: any[] = [];
  rawEventData: any[] = []; 
  recentEvents: any[] = []; 

  // CAROUSEL LOGIC FOR LIVE MONITOR
  monitorStartIndex: number = 0;
  monitorDisplayCount: number = 3; 

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

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    if (!this.authService.getLoginStatus()) { 
      this.router.navigate(['/login']); 
      return; 
    }
    
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
    this.greeting = hour < 12 ? 'Good Morning' : (hour < 18 ? 'Good Afternoon' : 'Good Evening');
  }

  fetchLiveMetrics(): void {
    this.httpService.GetAllevents().subscribe((data: any[]) => { 
        if (data) {
          this.rawEventData = data; 
          
          const currentUsername = localStorage.getItem('username');
          // STRICT FILTER: Only show events created by the logged-in Planner
          const myEvents = data.filter(e => e.plannerUsername === currentUsername);

          this.totalEvents = myEvents.length;
          this.scheduledEvents = myEvents.filter(e => e.status?.toUpperCase() === 'SCHEDULED').length;
          this.ongoingEvents = myEvents.filter(e => e.status?.toUpperCase() === 'ONGOING').length;
          this.completedEvents = myEvents.filter(e => e.status?.toUpperCase() === 'COMPLETED').length;

          this.activeEvents = myEvents
            .filter(e => e.status?.toUpperCase() === 'SCHEDULED' || e.status?.toUpperCase() === 'ONGOING')
            .map(e => {
              const booked = Number(e.bookedCount) || 0;
              const max = Number(e.maxCapacity) || 1; 
              let fillPercentage = Math.round((booked / max) * 100);
              if (fillPercentage > 100) fillPercentage = 100;
              if (fillPercentage < 0) fillPercentage = 0;
              return { ...e, fillPercentage, safeBooked: booked, safeMax: max };
            })
            .sort((a, b) => b.fillPercentage - a.fillPercentage);

          this.recentEvents = [...myEvents].sort((a, b) => {
            const idA = a.eventID || a.id || 0;
            const idB = b.eventID || b.id || 0;
            return idB - idA; // Sort highest ID (newest) first
          }).slice(0, 5);
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

  // --- CAROUSEL NAVIGATION LOGIC ---
  get visibleMonitorEvents() {
    return this.activeEvents.slice(this.monitorStartIndex, this.monitorStartIndex + this.monitorDisplayCount);
  }

  nextMonitorEvent(): void {
    if (this.monitorStartIndex + this.monitorDisplayCount < this.activeEvents.length) {
      this.monitorStartIndex++;
    }
  }

  prevMonitorEvent(): void {
    if (this.monitorStartIndex > 0) {
      this.monitorStartIndex--;
    }
  }

  // --- PERFECTED CSV EXPORT LOGIC ---
  exportToCSV(): void {
    const currentUsername = localStorage.getItem('username');
    
    // 1. Strictly filter to only the logged-in Planner's events
    const myEvents = this.rawEventData.filter(e => e.plannerUsername === currentUsername);

    if (!myEvents || myEvents.length === 0) {
      alert("No events found to export.");
      return;
    }

    // 2. Safe Escape Function: Wraps data in quotes to prevent commas/newlines from breaking the Excel layout
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const stringVal = String(str);
      return `"${stringVal.replace(/"/g, '""')}"`; 
    };

    // 3. Define the precise requested headers
    let csvContent = "Event Name,Description,Date,Max Attendee,Lead Staff,Location\n";

    // 4. Map the data row by row
    myEvents.forEach(ev => {
      const name = escapeCSV(ev.title);
      const description = escapeCSV(ev.description || 'No description provided');
      
      // FIX: Formatted Date to prevent Excel ##### error
      let dateStr = '"TBD"';
      if (ev.dateTime) {
        const d = new Date(ev.dateTime);
        // Formats as "Apr 08, 2026" which Excel reads beautifully without squishing
        const formattedDate = d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: '2-digit' 
        });
        dateStr = escapeCSV(formattedDate);
      }

      const capacity = escapeCSV(ev.maxCapacity);
      const staff = escapeCSV(ev.assignedStaffUsername ? ev.assignedStaffUsername : 'Public');
      const location = escapeCSV(ev.location);

      csvContent += `${name},${description},${dateStr},${capacity},${staff},${location}\n`;
    });

    // 5. Trigger the secure download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    // Append a timestamp so planners can download multiple reports without overwriting files locally
    const timestamp = new Date().getTime();
    link.setAttribute("download", `My_Events_Export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  toggleFAQ(): void { this.showFAQ = !this.showFAQ; }
  toggleFaqItem(index: number): void { this.activeFaqIndex = this.activeFaqIndex === index ? null : index; }
}