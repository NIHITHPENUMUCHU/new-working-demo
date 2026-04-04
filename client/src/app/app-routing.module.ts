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

// Import BOTH Guards
import { AuthGuard } from '../services/auth.guard'; 
import { NoAuthGuard } from '../services/no-auth.guard'; // NEW

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Public Routes (Protected by NoAuthGuard to prevent logged-in users from seeing them)
  { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },
  { path: 'registration', component: RegistrationComponent, canActivate: [NoAuthGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [NoAuthGuard] },

  // Protected Routes (Protected by AuthGuard to prevent logged-out users from seeing them)
  { path: 'dashboard', component: DashbaordComponent, canActivate: [AuthGuard] },
  { path: 'create-event', component: CreateEventComponent, canActivate: [AuthGuard] },
  { path: 'add-resource', component: AddResourceComponent, canActivate: [AuthGuard] },
  { path: 'resource-allocate', component: ResourceAllocateComponent, canActivate: [AuthGuard] },
  { path: 'view-events', component: ViewEventsComponent, canActivate: [AuthGuard] },
  { path: 'booking-details', component: BookingDetailsComponent, canActivate: [AuthGuard] },
  { path: 'live-ticketing', component: LiveTicketingComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }