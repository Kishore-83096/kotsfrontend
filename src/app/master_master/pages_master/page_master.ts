import { API_BASE_URL } from '../../shared/app_env';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { createMasterAdminApi, getMasterAdminByIdApi, getMasterAdminsApi } from '../api_master';
import {
  MasterAdminDetailResponseEnvelope,
  MasterAdminListItem,
  MasterAdminsResponseEnvelope,
} from '../typescript_master/type_master';
import { UsersAuthState } from '../../users_users/state_users_auth';

@Component({
  selector: 'app-page-master',
  standalone: true,
  templateUrl: './page_master.html',
  styleUrl: '../styles_master/style_master.css',
})
export class PageMasterComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly isLoadingAdmins = signal(false);
  protected readonly pageError = signal<string | null>(null);
  protected readonly adminsResponse = signal<MasterAdminsResponseEnvelope | null>(null);

  protected readonly isCreateAdminModalOpen = signal(false);
  protected readonly createAdminEmail = signal('');
  protected readonly createAdminPassword = signal('');
  protected readonly isCreatingAdmin = signal(false);
  protected readonly createAdminError = signal<string | null>(null);
  protected readonly createAdminSuccess = signal<string | null>(null);

  protected readonly isAdminDetailModalOpen = signal(false);
  protected readonly isLoadingAdminDetail = signal(false);
  protected readonly adminDetailError = signal<string | null>(null);
  protected readonly adminDetailResponse = signal<MasterAdminDetailResponseEnvelope | null>(null);

  ngOnInit(): void {
    this.loadAdmins();
  }

  protected admins(): MasterAdminListItem[] {
    return this.adminsResponse()?.data?.items ?? [];
  }

  protected loadAdmins(page = 1): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.pageError.set('No active session found. Please login again.');
      this.router.navigateByUrl('/users/login');
      return;
    }

    this.isLoadingAdmins.set(true);
    this.pageError.set(null);
    this.adminsResponse.set(null);

    getMasterAdminsApi(this.http, this.apiBaseUrl(), token, page, 10).subscribe({
      next: (response) => {
        this.adminsResponse.set(response);
        this.isLoadingAdmins.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.pageError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingAdmins.set(false);
          return;
        }

        this.pageError.set(this.extractErrorMessage(error, 'Failed to fetch admins.'));
        this.isLoadingAdmins.set(false);
      },
    });
  }

  protected openCreateAdminModal(): void {
    this.createAdminEmail.set('');
    this.createAdminPassword.set('');
    this.createAdminError.set(null);
    this.createAdminSuccess.set(null);
    this.isCreateAdminModalOpen.set(true);
  }

  protected closeCreateAdminModal(): void {
    this.isCreateAdminModalOpen.set(false);
  }

  protected setCreateAdminEmail(value: string): void {
    this.createAdminEmail.set(value);
  }

  protected setCreateAdminPassword(value: string): void {
    this.createAdminPassword.set(value);
  }

  protected createAdmin(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.createAdminError.set('No active session found. Please login again.');
      this.router.navigateByUrl('/users/login');
      return;
    }

    const email = this.createAdminEmail().trim();
    const password = this.createAdminPassword().trim();

    if (!email || !password) {
      this.createAdminError.set('Email and password are required.');
      return;
    }

    this.isCreatingAdmin.set(true);
    this.createAdminError.set(null);
    this.createAdminSuccess.set(null);

    createMasterAdminApi(this.http, this.apiBaseUrl(), token, { email, password }).subscribe({
      next: (response) => {
        this.createAdminSuccess.set(response.message || 'Admin created successfully.');
        this.createAdminPassword.set('');
        this.loadAdmins();
        this.closeCreateAdminModal();
        this.isCreatingAdmin.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.createAdminError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isCreatingAdmin.set(false);
          return;
        }

        this.createAdminError.set(this.extractErrorMessage(error, 'Failed to create admin.'));
        this.isCreatingAdmin.set(false);
      },
    });
  }

  protected openAdminDetailModal(adminId: number): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.adminDetailError.set('No active session found. Please login again.');
      this.router.navigateByUrl('/users/login');
      return;
    }

    this.isAdminDetailModalOpen.set(true);
    this.isLoadingAdminDetail.set(true);
    this.adminDetailError.set(null);
    this.adminDetailResponse.set(null);

    getMasterAdminByIdApi(this.http, this.apiBaseUrl(), token, adminId).subscribe({
      next: (response) => {
        this.adminDetailResponse.set(response);
        this.isLoadingAdminDetail.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.adminDetailError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingAdminDetail.set(false);
          return;
        }

        this.adminDetailError.set(this.extractErrorMessage(error, 'Failed to fetch admin details.'));
        this.isLoadingAdminDetail.set(false);
      },
    });
  }

  protected closeAdminDetailModal(): void {
    this.isAdminDetailModalOpen.set(false);
    this.isLoadingAdminDetail.set(false);
    this.adminDetailError.set(null);
    this.adminDetailResponse.set(null);
  }

  protected currentPage(): number {
    return this.adminsResponse()?.data?.page ?? 1;
  }

  protected totalPages(): number {
    return this.adminsResponse()?.data?.pages ?? 1;
  }

  protected canGoPrev(): boolean {
    return Boolean(this.adminsResponse()?.data?.has_prev);
  }

  protected canGoNext(): boolean {
    return Boolean(this.adminsResponse()?.data?.has_next);
  }

  protected goPrev(): void {
    if (!this.canGoPrev() || this.isLoadingAdmins()) {
      return;
    }
    this.loadAdmins(this.currentPage() - 1);
  }

  protected goNext(): void {
    if (!this.canGoNext() || this.isLoadingAdmins()) {
      return;
    }
    this.loadAdmins(this.currentPage() + 1);
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const envelope = error.error as { message?: string; error?: { user_message?: string; detail?: string } };
    return envelope?.error?.user_message ?? envelope?.message ?? envelope?.error?.detail ?? fallback;
  }
}




