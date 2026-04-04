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

  constructor(private fb: FormBuilder, private httpService: HttpService, private router: Router) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  requestOtp() {
    if (this.emailForm.valid) {
      this.isLoading = true;
      this.httpService.generateOtp(this.emailForm.value).subscribe(
        (res) => {
          this.verifiedEmail = this.emailForm.value.email;
          this.errorMessage = '';
          this.successMessage = 'A 6-digit code has been sent to your email.';
          this.step = 2;
          this.isLoading = false;
        },
        (err) => {
          this.errorMessage = err.error?.message || 'Failed to send OTP. Check your email address.';
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
        otp: this.resetForm.value.otp,
        newPassword: this.resetForm.value.newPassword
      };

      this.httpService.resetWithOtp(payload).subscribe(
        (res) => {
          this.successMessage = 'Password updated securely! Redirecting to login...';
          this.errorMessage = '';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        (err) => {
          this.errorMessage = err.error?.message || 'Invalid or expired OTP.';
          this.isLoading = false;
        }
      );
    }
  }
}