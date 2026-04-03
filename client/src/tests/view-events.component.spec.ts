import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { ViewEventsComponent } from '../app/view-events/view-events.component';

describe('ViewEventsComponent', () => {
  let component: ViewEventsComponent;
  let fixture: ComponentFixture<ViewEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewEventsComponent ],
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule, RouterTestingModule],
      providers: [HttpService, AuthService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate form fields as invalid when title is empty', fakeAsync(() => {
    const titleInput = component.itemForm.controls['title'];
    const descriptionInput = component.itemForm.controls['description'];
    const dateTimeInput = component.itemForm.controls['dateTime'];
    const locationInput = component.itemForm.controls['location'];
    const statusInput = component.itemForm.controls['status'];

    // Set valid values for other fields
    descriptionInput.setValue('Test Description');
    dateTimeInput.setValue('2024-02-21');
    locationInput.setValue('Test Location');
    statusInput.setValue('Test Status');

    titleInput.setValue('');
    expect(component.itemForm.valid).toBeFalsy();
  }));

  it('should validate form fields as invalid when description is empty', fakeAsync(() => {
    const titleInput = component.itemForm.controls['title'];
    const descriptionInput = component.itemForm.controls['description'];
    const dateTimeInput = component.itemForm.controls['dateTime'];
    const locationInput = component.itemForm.controls['location'];
    const statusInput = component.itemForm.controls['status'];

    // Set valid values for other fields
    titleInput.setValue('Test Title');
    dateTimeInput.setValue('2024-02-21');
    locationInput.setValue('Test Location');
    statusInput.setValue('Test Status');

    descriptionInput.setValue('');
    expect(component.itemForm.valid).toBeFalsy();
  }));
});
