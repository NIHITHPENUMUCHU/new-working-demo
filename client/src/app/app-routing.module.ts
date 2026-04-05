import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { DashbaordComponent } from './dashbaord/dashbaord.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { AddResourceComponent } from './add-resource/add-resource.component';
import { ResourceAllocateComponent } from './resource-allocate/resource-allocate.component';
import { ViewEventsComponent } from './view-events/view-events.component';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { LiveTicketingComponent } from './live-ticketing/live-ticketing.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

// NEW: Import the Landing Page
import { LandingPageComponent } from './landing-page/landing-page.component';

// Import BOTH Guards
import { AuthGuard } from '../services/auth.guard'; 
import { NoAuthGuard } from '../services/no-auth.guard'; 

const routes: Routes = [
  // THE FIX: Make the Landing Page the default route. 
  // NoAuthGuard ensures logged-in users bypass this and go straight to the dashboard.
  { path: '', component: LandingPageComponent, canActivate: [NoAuthGuard] },
  
  // Public Routes 
  { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },
  { path: 'registration', component: RegistrationComponent, canActivate: [NoAuthGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [NoAuthGuard] },

  // Protected Routes 
  { path: 'dashboard', component: DashbaordComponent, canActivate: [AuthGuard] },
  { path: 'create-event', component: CreateEventComponent, canActivate: [AuthGuard] },
  { path: 'add-resource', component: AddResourceComponent, canActivate: [AuthGuard] },
  { path: 'resource-allocate', component: ResourceAllocateComponent, canActivate: [AuthGuard] },
  { path: 'view-events', component: ViewEventsComponent, canActivate: [AuthGuard] },
  { path: 'booking-details', component: BookingDetailsComponent, canActivate: [AuthGuard] },
  { path: 'live-ticketing', component: LiveTicketingComponent, canActivate: [AuthGuard] },

  // Catch-all redirects back to the landing page
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
