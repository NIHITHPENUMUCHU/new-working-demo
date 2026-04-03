import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { CreateEventComponent } from '../app/create-event/create-event.component';

describe('CreateEventComponent', () => {
  let component: CreateEventComponent;
  let fixture: ComponentFixture<CreateEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateEventComponent ],
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule, RouterTestingModule],
      providers: [HttpService, AuthService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate form fields', fakeAsync(() => {
    const titleInput = component.itemForm.controls['title'];
    const descriptionInput = component.itemForm.controls['description'];
    const dateTimeInput = component.itemForm.controls['dateTime'];
    const locationInput = component.itemForm.controls['location'];
    const statusInput = component.itemForm.controls['status'];

    titleInput.setValue('');
    descriptionInput.setValue('');
    dateTimeInput.setValue('');
    locationInput.setValue('');
    statusInput.setValue('');

    expect(component.itemForm.valid).toBeFalsy();

    titleInput.setValue('Test Title');
    descriptionInput.setValue('Test Description');
    dateTimeInput.setValue('2024-02-21');
    locationInput.setValue('Test Location');
    statusInput.setValue('Test Status');

    expect(component.itemForm.valid).toBeTruthy();
  }));
  it('should validate form fields as invalid', fakeAsync(() => {
    const titleInput = component.itemForm.controls['title'];
    const descriptionInput = component.itemForm.controls['description'];
    const dateTimeInput = component.itemForm.controls['dateTime'];
    const locationInput = component.itemForm.controls['location'];
    const statusInput = component.itemForm.controls['status'];
  
    // Set valid values for all fields
    titleInput.setValue('Test Title');
    descriptionInput.setValue('Test Description');
    dateTimeInput.setValue('2024-02-21');
    locationInput.setValue('Test Location');
    statusInput.setValue('Test Status');
  
    expect(component.itemForm.valid).toBeTruthy();
  
    // Set empty values for all fields
    titleInput.setValue('');
    descriptionInput.setValue('');
    dateTimeInput.setValue('');
    locationInput.setValue('');
    statusInput.setValue('');
  
    expect(component.itemForm.valid).toBeFalsy();
  
    // Set valid value for one field and keep others empty
    titleInput.setValue('Test Title');
    descriptionInput.setValue('');
    dateTimeInput.setValue('');
    locationInput.setValue('');
    statusInput.setValue('');
  
    expect(component.itemForm.valid).toBeFalsy();
  }));
  
});
