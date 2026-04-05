import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  emailForm: FormGroup;
  resetForm: FormGroup;
  
  step: number = 1; 
  verifiedEmail: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  
  questions: any = { q1: '', q2: '', q3: '' };

  constructor(private fb: FormBuilder, private httpService: HttpService, private router: Router) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_=+-]).{8,}$/;
    
    this.resetForm = this.fb.group({
      a1: ['', Validators.required],
      a2: ['', Validators.required],
      a3: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(passwordRegex)]]
    });
  }

  verifyEmail() {
    if (this.emailForm.valid) {
      this.isLoading = true;
      const payload = { email: this.emailForm.value.email };
      
      this.httpService.getSecurityQuestions(payload).subscribe(
        (res) => {
          this.questions = res;
          this.verifiedEmail = this.emailForm.value.email;
          this.errorMessage = '';
          this.successMessage = 'Identity verification required.';
          this.step = 2;
          this.isLoading = false;
        },
        (err) => {
          this.errorMessage = err.error?.message || 'Email not found or Account Recovery not set up.';
          this.isLoading = false;
        }
      );
    }
  }

  resetPassword() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      const payload = {
        email: this.verifiedEmail,
        a1: this.resetForm.value.a1,
        a2: this.resetForm.value.a2,
        a3: this.resetForm.value.a3,
        newPassword: this.resetForm.value.newPassword
      };

      this.httpService.resetPassword(payload).subscribe(
        (res) => {
          this.successMessage = 'Password updated securely! Redirecting to login...';
          this.errorMessage = '';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        (err) => {
          this.errorMessage = err.error?.message || 'Verification failed. Incorrect answers.';
          this.isLoading = false;
        }
      );
    }
  }
}