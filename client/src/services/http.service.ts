import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  public serverName = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  Login(details: any): Observable<any> {
    return this.http.post(`${this.serverName}/api/user/login`, details);
  }
  registerUser(details: any): Observable<any> {
    return this.http.post(`${this.serverName}/api/user/register`, details);
  }
  
  getSecurityQuestions(payload: any): Observable<any> {
    return this.http.post(`${this.serverName}/api/user/forgot-password/questions`, payload);
  }

  resetPassword(payload: any): Observable<any> {
    return this.http.post(`${this.serverName}/api/user/forgot-password/reset`, payload);
  }

  // --- PLANNER ENDPOINTS ---
  createEvent(details: any): Observable<any> {
    return this.http.post(`${this.serverName}/api/planner/event`, details, { headers: this.getHeaders() });
  }
  GetAllevents(): Observable<any> {
    return this.http.get(`${this.serverName}/api/planner/events`, { headers: this.getHeaders() });
  }
  addResource(details: any): Observable<any> {
    return this.http.post(`${this.serverName}/api/planner/resource`, details, { headers: this.getHeaders() });
  }
  GetAllResources(): Observable<any> {
    return this.http.get(`${this.serverName}/api/planner/resources`, { headers: this.getHeaders() });
  }
  allocateResources(eventId: any, resourceId: any, details: any): Observable<any> {
    return this.http.post(`${this.serverName}/api/planner/allocate-resource/${eventId}/${resourceId}`, details, { headers: this.getHeaders() });
  }
  getAllAllocations(): Observable<any> {
    return this.http.get(`${this.serverName}/api/planner/allocations`, { headers: this.getHeaders() });
  }
  // NEW: Fetch staff members for assignment dropdown
  getStaffList(): Observable<any> {
    return this.http.get(`${this.serverName}/api/planner/staff-list`, { headers: this.getHeaders() });
  }

  // --- STAFF ENDPOINTS ---
  getEventDetails(eventId: any): Observable<any> {
    return this.http.get(`${this.serverName}/api/staff/event-details/${eventId}`, { headers: this.getHeaders() });
  }
  updateEvent(eventId: any, details: any): Observable<any> {
    return this.http.put(`${this.serverName}/api/staff/update-setup/${eventId}`, details, { headers: this.getHeaders() });
  }
  // NEW: Securely fetch events assigned to a specific staff member
  getStaffEvents(username: string): Observable<any> {
    return this.http.get(`${this.serverName}/api/staff/events/${username}`, { headers: this.getHeaders() });
  }

  // --- CLIENT ENDPOINTS ---
  getClientEventDetails(eventId: number): Observable<any> {
    return this.http.get(`${this.serverName}/api/client/event/${eventId}`, { headers: this.getHeaders() });
  }
  getActiveEvents(): Observable<any> {
    return this.http.get(`${this.serverName}/api/client/events/active`, { headers: this.getHeaders() });
  }
  bookEventPass(eventId: number): Observable<any> {
    return this.http.post(`${this.serverName}/api/client/book/${eventId}`, {}, { headers: this.getHeaders() });
  }

  // --- NOTIFICATION ENGINE ---
  getNotifications(rolePath: string): Observable<any> {
    return this.http.get(`${this.serverName}/api/${rolePath}/notifications`, { headers: this.getHeaders() });
  }
  markNotificationRead(rolePath: string, id: number): Observable<any> {
    return this.http.put(`${this.serverName}/api/${rolePath}/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }
  markAllNotificationsRead(rolePath: string): Observable<any> {
    return this.http.put(`${this.serverName}/api/${rolePath}/notifications/read-all`, {}, { headers: this.getHeaders() });
  }
}