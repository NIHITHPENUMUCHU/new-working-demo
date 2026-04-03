import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token: string | null = null;
  private isLoggedIn: boolean = false;

  constructor() { 
    this.token = localStorage.getItem('token');
    this.isLoggedIn = !!this.token;
  }

  saveToken(token: string): void {
    this.token = token;
    this.isLoggedIn = true;
    localStorage.setItem('token', token);
  }

  SetRole(role: any): void {
    localStorage.setItem('role', role);
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getLoginStatus(): boolean {
    return this.isLoggedIn || !!localStorage.getItem('token');
  }

  getToken(): string | null {
    this.token = localStorage.getItem('token');
    return this.token;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.token = null;
    this.isLoggedIn = false;
  }
}