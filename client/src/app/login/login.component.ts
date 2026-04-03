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

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.httpService.Login(this.itemForm.value).subscribe(
        (res: any) => {
          if (res && res.token) {
            this.authService.saveToken(res.token);
            this.authService.SetRole(res.role); 

            // 1. Save the username
            const currentUsername = this.itemForm.value.username;
            const normalizedName = currentUsername.toLowerCase();
            localStorage.setItem('username', currentUsername);
            
            // 2. THE FIX: The Timestamp Rotation!
            // First, get the old login time (if it exists)
            const oldLoginTime = localStorage.getItem('lastLogin_' + normalizedName);
            
            if (oldLoginTime) {
               // Move the old time into the "previous" slot
               localStorage.setItem('previousLogin_' + normalizedName, oldLoginTime);
            } else {
               // If it's their absolute first time logging in, just use current time so it's not blank
               localStorage.setItem('previousLogin_' + normalizedName, new Date().toISOString());
            }

            // Finally, record the NEW current login time
            localStorage.setItem('lastLogin_' + normalizedName, new Date().toISOString());

            this.router.navigateByUrl('/dashboard');
          } else {
            this.showError = true;
            this.errorMessage = "Invalid response from server.";
          }
        },
        (error: any) => {
          this.showError = true;
          this.errorMessage = "Login failed. Incorrect username or password.";
        }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}