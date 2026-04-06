import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AddResourceComponent } from './add-resource/add-resource.component';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { DashbaordComponent } from './dashbaord/dashbaord.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LiveTicketingComponent } from './live-ticketing/live-ticketing.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { ResourceAllocateComponent } from './resource-allocate/resource-allocate.component';
import { ViewEventsComponent } from './view-events/view-events.component';

@NgModule({
  declarations: [
    AppComponent,
    AddResourceComponent,
    BookingDetailsComponent,
    CreateEventComponent,
    DashbaordComponent,
    ForgotPasswordComponent,
    LandingPageComponent,
    LiveTicketingComponent,
    LoginComponent,
    RegistrationComponent,
    ResourceAllocateComponent,
    ViewEventsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }