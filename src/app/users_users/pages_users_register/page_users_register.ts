import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { registerUsersApi, loginUsersApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';

@Component({
  selector: 'app-page-users-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './page_users_register.html',
  styleUrl: './page_users_register.css',
})
export class PageUsersRegisterComponent {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly isSubmitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submitRegistration(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload = this.registerForm.getRawValue();
    this.isSubmitting.set(true);
    this.formError.set(null);

    registerUsersApi(this.http, this.apiBaseUrl(), payload).subscribe({
      next: () => {
        loginUsersApi(this.http, this.apiBaseUrl(), payload).subscribe({
          next: (loginResponse) => {
            this.authState.setLoginResult(loginResponse);
            this.isSubmitting.set(false);
            this.router.navigateByUrl('/home');
          },
          error: (error: HttpErrorResponse) => {
            this.formError.set(this.extractErrorMessage(error, 'Auto login failed after registration.'));
            this.isSubmitting.set(false);
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.formError.set(this.extractErrorMessage(error, 'Registration failed.'));
        this.isSubmitting.set(false);
      },
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const envelope = error.error as { message?: string; error?: { user_message?: string; detail?: string } };
    return envelope?.error?.user_message ?? envelope?.message ?? envelope?.error?.detail ?? fallback;
  }
}




