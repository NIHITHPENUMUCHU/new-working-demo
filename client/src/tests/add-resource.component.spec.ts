import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AddResourceComponent } from '../app/add-resource/add-resource.component';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { HttpService } from '../services/http.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';

describe('AddResourceComponent', () => {
  let component: AddResourceComponent;
  let fixture: ComponentFixture<AddResourceComponent>;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddResourceComponent ],
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule, RouterTestingModule],
      providers: [HttpService, AuthService]
    }).compileComponents();

    formBuilder = TestBed.inject(FormBuilder);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddResourceComponent);
    component = fixture.componentInstance;
    component.itemForm = formBuilder.group({
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      availability: ['', [Validators.required]]
    });
    fixture.detectChanges();
  });


it('should require name field', () => {
  const nameControl = component.itemForm.get('name');
  nameControl?.setValue('');
  expect(nameControl?.valid).toBeFalsy();
  expect(nameControl?.errors?.['required']).toBeTruthy();
});

  it('should require type field', () => {
    const typeControl = component.itemForm.get('type');
    typeControl?.setValue('');
    expect(typeControl?.valid).toBeFalsy();
 

    typeControl?.setValue('Test Type');
    expect(typeControl?.valid).toBeTruthy();
  });

  it('should require availability field1', () => {
    const availabilityControl = component.itemForm.get('availability');
    availabilityControl?.setValue('');
    expect(availabilityControl?.valid).toBeFalsy();
   

    availabilityControl?.setValue('Test Availability');
    expect(availabilityControl?.valid).toBeTruthy();
  });
});
