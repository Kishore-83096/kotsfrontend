import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { loginUsersApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';

@Component({
  selector: 'app-page-users-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './page_users_login.html',
  styleUrl: './page_users_login.css',
})
export class PageUsersLoginComponent {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly isSubmitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.formError.set(null);

    loginUsersApi(this.http, this.apiBaseUrl(), this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.authState.setLoginResult(response);
        this.isSubmitting.set(false);
        this.router.navigateByUrl('/home');
      },
      error: (error: HttpErrorResponse) => {
        this.formError.set(this.extractErrorMessage(error, 'Login failed.'));
        this.isSubmitting.set(false);
      },
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const envelope = error.error as { message?: string; error?: { user_message?: string; detail?: string } };
    return envelope?.error?.user_message ?? envelope?.message ?? envelope?.error?.detail ?? fallback;
  }
}




