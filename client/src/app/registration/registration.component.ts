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
  
  roleSubscription!: Subscription;

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

    // Listen to the dropdown menu to trigger the security code & questions requirement
    this.roleSubscription = this.itemForm.get('role')!.valueChanges.subscribe(role => {
      const authControl = this.itemForm.get('authCode');
      const securityControls = [
        'securityQuestion1', 'securityAnswer1',
        'securityQuestion2', 'securityAnswer2',
        'securityQuestion3', 'securityAnswer3'
      ];
      
      if (role === 'PLANNER') {
        authControl?.setValidators([Validators.required, Validators.pattern(`^${this.PLANNER_CODE}$`)]);
        securityControls.forEach(ctrl => this.itemForm.get(ctrl)?.setValidators([Validators.required]));
      } else if (role === 'STAFF') {
        authControl?.setValidators([Validators.required, Validators.pattern(`^${this.STAFF_CODE}$`)]);
        securityControls.forEach(ctrl => this.itemForm.get(ctrl)?.setValidators([Validators.required]));
      } else {
        // Client selected - remove all passcode & security question requirements
        authControl?.clearValidators();
        securityControls.forEach(ctrl => this.itemForm.get(ctrl)?.clearValidators());
      }
      
      // Reset the inputs and update the form's validity state
      authControl?.setValue(''); 
      authControl?.updateValueAndValidity();
      securityControls.forEach(ctrl => {
        this.itemForm.get(ctrl)?.setValue('');
        this.itemForm.get(ctrl)?.updateValueAndValidity();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      
      // Security trick: Extract the authCode so we only send core details to backend
      const { authCode, ...secureUserData } = this.itemForm.value;

      this.httpService.registerUser(secureUserData).subscribe(
        (res: any) => {
          this.showMessage = true;
          this.responseMessage = "Registration successful! Redirecting to login...";
          this.showError = false;
          setTimeout(() => { this.router.navigate(['/login']); }, 2000);
        },
        (error: any) => {
          this.showError = true;
          this.showMessage = false;
          if (error.status === 400 || error.status === 500) {
             this.errorMessage = "Registration failed: This Username or Email is already registered!";
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