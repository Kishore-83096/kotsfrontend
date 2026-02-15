import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { loginUsersApi, registerUsersApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';

@Component({
  selector: 'app-page-users-landing',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './page_users_landing.html',
  styleUrl: './page_users_landing.css',
})
export class PageUsersLandingComponent {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly activeTab = signal<'login' | 'register'>('login');
  protected readonly infoTab = signal<'overview' | 'roles' | 'flow' | 'stack'>('overview');
  protected readonly loginError = signal<string | null>(null);
  protected readonly registerError = signal<string | null>(null);
  protected readonly isLoginSubmitting = signal(false);
  protected readonly isRegisterSubmitting = signal(false);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
    this.loginError.set(null);
    this.registerError.set(null);
  }

  protected setInfoTab(tab: 'overview' | 'roles' | 'flow' | 'stack'): void {
    this.infoTab.set(tab);
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoginSubmitting.set(true);
    this.loginError.set(null);

    loginUsersApi(this.http, this.apiBaseUrl(), this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.authState.setLoginResult(response);
        this.isLoginSubmitting.set(false);
        this.router.navigateByUrl('/home');
      },
      error: (error: HttpErrorResponse) => {
        this.loginError.set(this.extractErrorMessage(error, 'Login failed.'));
        this.isLoginSubmitting.set(false);
      },
    });
  }

  protected submitRegistration(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload = this.registerForm.getRawValue();
    if (payload.password !== payload.confirmPassword) {
      this.registerError.set('Password and confirm password must match.');
      return;
    }

    this.isRegisterSubmitting.set(true);
    this.registerError.set(null);

    registerUsersApi(this.http, this.apiBaseUrl(), {
      email: payload.email,
      password: payload.password,
    }).subscribe({
      next: () => {
        loginUsersApi(this.http, this.apiBaseUrl(), {
          email: payload.email,
          password: payload.password,
        }).subscribe({
          next: (loginResponse) => {
            this.authState.setLoginResult(loginResponse);
            this.isRegisterSubmitting.set(false);
            this.router.navigateByUrl('/home');
          },
          error: (error: HttpErrorResponse) => {
            this.registerError.set(this.extractErrorMessage(error, 'Auto login failed after registration.'));
            this.isRegisterSubmitting.set(false);
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.registerError.set(this.extractErrorMessage(error, 'Registration failed.'));
        this.isRegisterSubmitting.set(false);
      },
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const envelope = error.error as { message?: string; error?: { user_message?: string; detail?: string } };
    return envelope?.error?.user_message ?? envelope?.message ?? envelope?.error?.detail ?? fallback;
  }
}




