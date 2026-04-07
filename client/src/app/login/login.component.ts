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
  isLoading: boolean = false;
  
  // NEW: State for the password toggle
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_=+-]).{8,}$/;

    this.itemForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]{4,20}$/)]],
      password: ['', [Validators.required, Validators.pattern(passwordRegex)]]
    });
  }

  // --- LIVE VALIDATION HELPERS ---
  get isUsernameValid() { 
    return this.itemForm.get('username')?.valid && this.itemForm.get('username')?.dirty; 
  }
  
  get isPasswordValid() { 
    return this.itemForm.get('password')?.valid && this.itemForm.get('password')?.dirty; 
  }

  // --- NEW: TOGGLE FUNCTION ---
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.isLoading = true; 
      this.showError = false;

      this.httpService.Login(this.itemForm.value).subscribe(
        (res: any) => {
          if (res && res.token) {
            this.authService.saveToken(res.token);
            this.authService.SetRole(res.role); 

            const currentUsername = this.itemForm.value.username;
            const normalizedName = currentUsername.toLowerCase();
            localStorage.setItem('username', currentUsername);
            
            const oldLoginTime = localStorage.getItem('lastLogin_' + normalizedName);
            if (oldLoginTime) {
               localStorage.setItem('previousLogin_' + normalizedName, oldLoginTime);
            } else {
               localStorage.setItem('previousLogin_' + normalizedName, new Date().toISOString());
            }
            localStorage.setItem('lastLogin_' + normalizedName, new Date().toISOString());

            const userRole = res.role.toUpperCase();
            
            if (userRole === 'PLANNER' || userRole === 'STAFF' || userRole === 'CLIENT') {
              this.router.navigateByUrl('/dashboard');
            } else {
              this.router.navigateByUrl('/');
            }

          } else {
            this.isLoading = false; 
            this.showError = true;
            this.errorMessage = "Invalid response from server.";
          }
        },
        (error: any) => {
          this.isLoading = false; 
          this.showError = true;
          this.errorMessage = "Login failed. Incorrect username or password.";
        }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}