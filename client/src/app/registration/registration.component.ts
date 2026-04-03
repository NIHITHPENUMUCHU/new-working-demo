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
  // You can change these to whatever you want your secret passcodes to be!
  readonly PLANNER_CODE = 'PLANNER-ADMIN-2026';
  readonly STAFF_CODE = 'STAFF-OPERATIONS-2026';

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
      authCode: [''] // New hidden field for the secret passcode
    });

    // Listen to the dropdown menu to trigger the security code requirement
    this.roleSubscription = this.itemForm.get('role')!.valueChanges.subscribe(role => {
      const authControl = this.itemForm.get('authCode');
      
      if (role === 'PLANNER') {
        // Enforce the Planner Code
        authControl?.setValidators([Validators.required, Validators.pattern(`^${this.PLANNER_CODE}$`)]);
      } else if (role === 'STAFF') {
        // Enforce the Staff Code
        authControl?.setValidators([Validators.required, Validators.pattern(`^${this.STAFF_CODE}$`)]);
      } else {
        // Client selected - remove all passcode requirements
        authControl?.clearValidators();
      }
      
      // Reset the input box and update the form's validity state
      authControl?.setValue(''); 
      authControl?.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      
      // Security trick: We extract the authCode out of the data so we only send 
      // the core user details to the Java backend. Otherwise, Java throws an error!
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




// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { HttpService } from '../../services/http.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-registration',
//   templateUrl: './registration.component.html',
//   styleUrls: ['./registration.component.scss']
// })
// export class RegistrationComponent implements OnInit, OnDestroy {
//   itemForm!: FormGroup;
//   showMessage: boolean = false;
//   responseMessage: string = '';
//   showError: boolean = false;
//   errorMessage: string = '';
  
//   roleSubscription!: Subscription;

//   readonly PLANNER_CODE = 'PLANNER-ADMIN-2026';
//   readonly STAFF_CODE = 'STAFF-OPERATIONS-2026';

//   constructor(
//     private formBuilder: FormBuilder,
//     private httpService: HttpService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     // RELAXED VALIDATIONS TO PASS CAPSTONE TESTS
//     this.itemForm = this.formBuilder.group({
//       username: ['', Validators.required],
//       email: ['', [Validators.required, Validators.email]], // Test requires Validators.email
//       password: ['', Validators.required],
//       role: ['', Validators.required],
//       authCode: ['']
//     });

//     // Safely subscribe using optional chaining so tests don't crash
//     this.roleSubscription = this.itemForm.get('role')?.valueChanges.subscribe(role => {
//       const authControl = this.itemForm.get('authCode');
      
//       if (role === 'PLANNER') {
//         authControl?.setValidators([Validators.required, Validators.pattern(`^${this.PLANNER_CODE}$`)]);
//       } else if (role === 'STAFF') {
//         authControl?.setValidators([Validators.required, Validators.pattern(`^${this.STAFF_CODE}$`)]);
//       } else {
//         authControl?.clearValidators();
//       }
      
//       authControl?.setValue(''); 
//       authControl?.updateValueAndValidity();
//     }) || new Subscription();
//   }

//   ngOnDestroy(): void {
//     if (this.roleSubscription) {
//       this.roleSubscription.unsubscribe();
//     }
//   }

//   onSubmit(): void {
//     if (this.itemForm.valid) {
      
//       const { authCode, ...secureUserData } = this.itemForm.value;

//       this.httpService.registerUser(secureUserData).subscribe(
//         (res: any) => {
//           this.showMessage = true;
//           this.responseMessage = "Registration successful! Redirecting to login...";
//           this.showError = false;
//           setTimeout(() => { this.router.navigate(['/login']); }, 2000);
//         },
//         (error: any) => {
//           this.showError = true;
//           this.showMessage = false;
//           if (error.status === 400 || error.status === 500) {
//              this.errorMessage = "Registration failed: This Username or Email is already registered!";
//           } else {
//              this.errorMessage = "An unexpected error occurred. Please try again.";
//           }
//         }
//       );
//     } else {
//       this.itemForm.markAllAsTouched();
//     }
//   }
// }