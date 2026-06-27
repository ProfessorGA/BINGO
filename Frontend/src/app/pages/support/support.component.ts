import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupportService } from '../../services/support.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit {
  supportForm!: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  isError = false;

  countryCodes = [
    { code: '+1', name: 'US/Canada' },
    { code: '+44', name: 'UK' },
    { code: '+91', name: 'India' },
    { code: '+971', name: 'UAE' },
    { code: '+61', name: 'Australia' }
  ];

  constructor(private fb: FormBuilder, private supportService: SupportService) {}

  ngOnInit() {
    this.supportForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      countryCode: ['+91', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      email: ['', [Validators.required, Validators.email]],
      helpMessage: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';

    this.supportService.submitRequest(this.supportForm.value).subscribe({
      next: (res) => {
        this.submitMessage = 'Thank you! Your request has been submitted successfully.';
        this.isError = false;
        this.supportForm.reset({ countryCode: '+91' });
        this.isSubmitting = false;
      },
      error: (err) => {
        this.submitMessage = 'There was an error submitting your request. Please try again.';
        this.isError = true;
        this.isSubmitting = false;
      }
    });
  }

  onClear() {
    this.supportForm.reset({ countryCode: '+91' });
    this.submitMessage = '';
  }
}
