import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpService } from '../services/http.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  showLogoutModal: boolean = false;
  
  // Notification Variables
  notifications: any[] = [];
  showNotifications: boolean = false;
  unreadCount: number = 0;
  pollingInterval: any;

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private httpService: HttpService, 
    private eRef: ElementRef
  ) {}

  // Closes the notification dropdown if you click anywhere else on the screen
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (this.showNotifications) {
      const beaconWrapper = this.eRef.nativeElement.querySelector('.beacon-wrapper');
      if (beaconWrapper && !beaconWrapper.contains(event.target)) {
        this.showNotifications = false;
      }
    }
  }

  ngOnInit() {
    this.fetchNotifications();
    this.pollingInterval = setInterval(() => { this.fetchNotifications(); }, 5000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  fetchNotifications() {
    if (this.IsLoggin && (this.roleName === 'PLANNER' || this.roleName === 'STAFF')) {
      const rolePath = this.roleName.toLowerCase();
      this.httpService.getNotifications(rolePath).subscribe(data => {
         this.notifications = data;
         this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      });
    }
  }

  markAsRead(notif: any, event: Event) {
    event.stopPropagation(); 
    if (notif.isRead) return; 
    
    const rolePath = this.roleName!.toLowerCase();
    this.httpService.markNotificationRead(rolePath, notif.id).subscribe(() => {
      notif.isRead = true; 
      this.unreadCount = this.notifications.filter(n => !n.isRead).length; 
    });
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    const rolePath = this.roleName!.toLowerCase();
    this.httpService.markAllNotificationsRead(rolePath).subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    });
  }

  get IsLoggin(): boolean { return this.authService.getLoginStatus(); }
  get roleName(): string | null { const r = this.authService.getRole(); return r ? r.toUpperCase() : null; }

  toggleNotifications(): void { this.showNotifications = !this.showNotifications; }
  triggerLogout(): void { this.showLogoutModal = true; }
  cancelLogout(): void { this.showLogoutModal = false; }
  
  confirmLogout(): void {
    this.authService.logout();
    this.showLogoutModal = false;
    this.showNotifications = false;
    this.router.navigate(['/login']);
  }
}