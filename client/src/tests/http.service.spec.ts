import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../environments/environment.development';

describe('HttpService', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpService,
        AuthService,
        { provide: AuthService, useValue: { getToken: () => 'mockToken' } }
      ]
    });
    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get booking details', () => {
    const eventId = 1;
    const mockResponse = { id: 1, content: 'Booking details' };

    service.getBookingDetails(eventId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/client/booking-details/${eventId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get event details', () => {
    const eventId = 123;
    const mockResponse = { id: 1, content: 'Event details' };

    service.GetEventdetails(eventId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/staff/event-details/${eventId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get all events', () => {
    const mockResponse = [{ id: 1, content: 'Event 1' }, { id: 2, content: 'Event 2' }];

    service.GetAllevents().subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/planner/events`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });

  it('should get all resources', () => {
    const mockResponse = [{ id: 1, content: 'Resource 1' }, { id: 2, content: 'Resource 2' }];

    service.GetAllResources().subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/planner/resources`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    req.flush(mockResponse);
  });


  it('should create event', () => {
    const details = { name: 'New Event', location: 'City' };
    const mockResponse = { success: true };

    service.createEvent(details).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/planner/event`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(details);
    req.flush(mockResponse);
  });

  it('should update event', () => {
    const details = { id: 1, name: 'Updated Event', location: 'Updated City' };
    const eventId = 123;
    const mockResponse = { success: true };

    service.updateEvent(details, eventId).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/staff/update-setup/${eventId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(details);
    req.flush(mockResponse);
  });

  it('should add resource', () => {
    const details = { name: 'New Resource', quantity: 10 };
    const mockResponse = { success: true };

    service.addResource(details).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/planner/resource`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(details);
    req.flush(mockResponse);
  });

  it('should allocate resources', () => {
    const details = { id: 1, quantity: 10 };
    const eventId = 123;
    const resourceId = 456;
    const mockResponse = { success: true };

    service.allocateResources(eventId, resourceId, details).subscribe((response: any) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/planner/allocate-resources?eventId=${eventId}&resourceId=${resourceId}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mockToken');
    expect(req.request.body).toEqual(details);
    req.flush(mockResponse);
  });

  it('should login', () => {
    const mockDetails = { username: 'testuser', password: 'testpassword' };
    const mockResponse = { token: 'mockToken' };

    service.Login(mockDetails).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service.serverName}/api/user/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual(mockDetails);
    req.flush(mockResponse);
  });
  it('should register user', () => {
    const mockDetails = { username: 'testuser', email: 'test@example.com', password: 'testpassword' };
    const mockResponse = { message: 'User registered successfully' };

    service.registerUser(mockDetails).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${service.serverName}/api/user/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual(mockDetails);
    req.flush(mockResponse);
  });
});
