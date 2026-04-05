import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  itemForm!: FormGroup;
  showError: boolean = false;
  errorMessage: string = '';
  
  // NEW: Triggers the Animated Frosted-Glass Overlay
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Removed password regex - backend handles authentication check
    this.itemForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]{4,20}$/)]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.isLoading = true; // Show loader
      this.showError = false;

      this.httpService.Login(this.itemForm.value).subscribe(
        (res: any) => {
          if (res && res.token) {
            this.authService.saveToken(res.token);
            this.authService.SetRole(res.role); 

            // Save username
            const currentUsername = this.itemForm.value.username;
            const normalizedName = currentUsername.toLowerCase();
            localStorage.setItem('username', currentUsername);
            
            // Handle Timestamp Rotation
            const oldLoginTime = localStorage.getItem('lastLogin_' + normalizedName);
            if (oldLoginTime) {
               localStorage.setItem('previousLogin_' + normalizedName, oldLoginTime);
            } else {
               localStorage.setItem('previousLogin_' + normalizedName, new Date().toISOString());
            }
            localStorage.setItem('lastLogin_' + normalizedName, new Date().toISOString());

            // --- CRITICAL FIX: Route Based on Role ---
            const userRole = res.role.toUpperCase();
            
            if (userRole === 'PLANNER') {
              this.router.navigateByUrl('/dashboard');
            } else if (userRole === 'STAFF') {
              this.router.navigateByUrl('/view-events');
            } else if (userRole === 'CLIENT') {
              this.router.navigateByUrl('/booking-details');
            } else {
              this.router.navigateByUrl('/');
            }

          } else {
            this.isLoading = false; // Hide loader
            this.showError = true;
            this.errorMessage = "Invalid response from server.";
          }
        },
        (error: any) => {
          this.isLoading = false; // Hide loader
          this.showError = true;
          this.errorMessage = "Login failed. Incorrect username or password.";
        }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}