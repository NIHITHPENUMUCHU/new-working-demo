import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {

  showBackToTop: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    if (this.authService.getLoginStatus()) {
      const role = this.authService.getRole()?.toUpperCase();
      if (role === 'PLANNER') this.router.navigate(['/dashboard']);
      else if (role === 'STAFF') this.router.navigate(['/view-events']);
      else if (role === 'CLIENT') this.router.navigate(['/booking-details']);
    }
  }

  // Listen to window scroll to show/hide the Back to Top button
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Show button if scrolled down more than 400 pixels
    this.showBackToTop = window.scrollY > 400;
  }

  // Smooth scroll to top function
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}