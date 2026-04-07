import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit, OnDestroy {
  itemForm!: FormGroup;
  showMessage: boolean = false;
  responseMessage: string = '';
  showError: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  
  roleSubscription!: Subscription;

  // --- NEW: TOGGLE STATES ---
  showPassword = false;
  showAuthCode = false;

  // --- ENTERPRISE SECURITY CODES ---
  readonly PLANNER_CODE = 'PLANNER-ADMIN-2026';
  readonly STAFF_CODE = 'STAFF-OPERATIONS-2026';

  // --- SECURITY QUESTIONS ---
  q1List = ['What is your favorite color?', 'What was your childhood nickname?', 'What is the name of your favorite pet?'];
  q2List = ['In what city were you born?', 'What was your first car?', 'What is your favorite food?'];
  q3List = ['What high school did you attend?', 'What is your favorite movie?', 'Who was your childhood hero?'];

  constructor(
    private formBuilder: FormBuilder,
    private httpService: HttpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_=+-]).{8,}$/;

    this.itemForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_-]{4,20}$/)]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,30}$/)]],
      password: ['', [Validators.required, Validators.pattern(passwordRegex)]],
      role: ['', Validators.required],
      authCode: [''], // Hidden field for the secret passcode

      // Security Verification Fields
      securityQuestion1: [''],
      securityAnswer1: [''],
      securityQuestion2: [''],
      securityAnswer2: [''],
      securityQuestion3: [''],
      securityAnswer3: ['']
    });

    // Listen to the dropdown menu to trigger the security code requirement
    this.roleSubscription = this.itemForm.get('role')!.valueChanges.subscribe(role => {
      const authControl = this.itemForm.get('authCode');
      const securityControls = [
        'securityQuestion1', 'securityAnswer1',
        'securityQuestion2', 'securityAnswer2',
        'securityQuestion3', 'securityAnswer3'
      ];
      
      // Make security questions REQUIRED for everyone once a role is selected
      securityControls.forEach(ctrl => {
        this.itemForm.get(ctrl)?.setValidators([Validators.required]);
      });

      if (role === 'PLANNER') {
        authControl?.setValidators([Validators.required, Validators.pattern(`^${this.PLANNER_CODE}$`)]);
      } else if (role === 'STAFF') {
        authControl?.setValidators([Validators.required, Validators.pattern(`^${this.STAFF_CODE}$`)]);
      } else {
        // Client selected - remove administrative passcode requirement
        authControl?.clearValidators();
      }
      
      authControl?.setValue(''); 
      authControl?.updateValueAndValidity();
      securityControls.forEach(ctrl => {
        this.itemForm.get(ctrl)?.updateValueAndValidity();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  // --- NEW: TOGGLE FUNCTIONS ---
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  toggleAuthCodeVisibility(): void {
    this.showAuthCode = !this.showAuthCode;
  }

  // --- LIVE VALIDATION HELPERS ---
  get isUsernameValid() { return this.itemForm.get('username')?.valid && this.itemForm.get('username')?.dirty; }
  get isEmailValid() { return this.itemForm.get('email')?.valid && this.itemForm.get('email')?.dirty; }
  get isRoleValid() { return this.itemForm.get('role')?.valid && this.itemForm.get('role')?.dirty; }
  get isAuthCodeValid() { return this.itemForm.get('authCode')?.valid && this.itemForm.get('authCode')?.value !== ''; }

  // Dynamic Password Strength Checks
  get pwdValue() { return this.itemForm.get('password')?.value || ''; }
  get hasMinLength() { return this.pwdValue.length >= 8; }
  get hasUpper() { return /[A-Z]/.test(this.pwdValue); }
  get hasLower() { return /[a-z]/.test(this.pwdValue); }
  get hasNumber() { return /[0-9]/.test(this.pwdValue); }
  get hasSymbol() { return /[!@#$%^&*_=+-]/.test(this.pwdValue); }
  get isPasswordValid() { return this.itemForm.get('password')?.valid && this.itemForm.get('password')?.dirty; }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.isLoading = true;
      this.showError = false;
      this.showMessage = false;
      
      // Extract the authCode out of the data so we only send core user details to Java
      const { authCode, ...secureUserData } = this.itemForm.value;

      this.httpService.registerUser(secureUserData).subscribe(
        (res: any) => {
          this.isLoading = false;
          this.showMessage = true;
          this.responseMessage = "Registration successful! Redirecting to login...";
          setTimeout(() => { this.router.navigate(['/login']); }, 2000);
        },
        (error: any) => {
          this.isLoading = false;
          this.showError = true;
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = "An unexpected error occurred. Please try again.";
          }
        }
      );
    } else {
      this.itemForm.markAllAsTouched();
    }
  }
}