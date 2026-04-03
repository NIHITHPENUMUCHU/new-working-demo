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

const routes: Routes = [
  // Default route pushes the user to the login screen
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // Explicit feature routes
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'dashboard', component: DashbaordComponent },
  { path: 'create-event', component: CreateEventComponent },
  { path: 'add-resource', component: AddResourceComponent },
  { path: 'resource-allocate', component: ResourceAllocateComponent },
  { path: 'view-events', component: ViewEventsComponent },
  { path: 'booking-details', component: BookingDetailsComponent },
  { path: 'live-ticketing', component: LiveTicketingComponent },

  // Wildcard fallback if the user types a bad URL
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

