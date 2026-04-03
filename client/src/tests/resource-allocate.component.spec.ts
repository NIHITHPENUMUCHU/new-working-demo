import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { ResourceAllocateComponent } from '../app/resource-allocate/resource-allocate.component';

describe('ResourceAllocateComponent', () => {
  let component: ResourceAllocateComponent;
  let fixture: ComponentFixture<ResourceAllocateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourceAllocateComponent ],
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule, RouterTestingModule],
      providers: [HttpService, AuthService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceAllocateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate form fields as invalid when quantity is empty', fakeAsync(() => {
    const quantityInput = component.itemForm.controls['quantity'];
    const eventIdInput = component.itemForm.controls['eventId'];
    const resourceIdInput = component.itemForm.controls['resourceId'];

    // Set valid values for other fields
    eventIdInput.setValue('Test Event Id');
    resourceIdInput.setValue('Test Resource Id');

    quantityInput.setValue('');
    expect(component.itemForm.valid).toBeFalsy();
  }));


});
