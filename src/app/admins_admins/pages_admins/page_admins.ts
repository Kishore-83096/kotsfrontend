import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  createAdminBuildingApi,
  getAdminBookingByIdApi,
  getAdminBookingsApi,
  getAdminMyBuildingsApi,
  updateAdminBookingStatusApi,
} from '../api_admins';
import { ImagePreviewState } from '../../shared/image_preview_state';
import { UsersAuthState } from '../../users_users/state_users_auth';
import {
  AdminBookingItemAdmins,
  AdminBookingStatusAdmins,
  AdminBookingDetailResponseEnvelopeAdmins,
  AdminBookingsListResponseEnvelopeAdmins,
  AdminBuildingItemAdmins,
  AdminBuildingsListResponseEnvelopeAdmins,
} from '../typescript_admins/type_admins';

@Component({
  selector: 'app-page-admins',
  standalone: true,
  templateUrl: './page_admins.html',
  styleUrl: '../styles_admins/style_admins.css',
})
export class PageAdminsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);
  private readonly imagePreviewState = inject(ImagePreviewState);

  protected readonly apiBaseUrl = signal('https://kots.onrender.com');
  protected readonly isLoadingBuildings = signal(false);
  protected readonly isCreatingBuilding = signal(false);
  protected readonly pageError = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly buildingsResponse = signal<AdminBuildingsListResponseEnvelopeAdmins | null>(null);
  protected readonly isCreateModalOpen = signal(false);
  protected readonly isBookingsModalOpen = signal(false);
  protected readonly isBookingDetailModalOpen = signal(false);
  protected readonly isLoadingBookings = signal(false);
  protected readonly isLoadingBookingDetail = signal(false);
  protected readonly isUpdatingBookingStatus = signal(false);
  protected readonly bookingsModalError = signal<string | null>(null);
  protected readonly bookingDetailError = signal<string | null>(null);
  protected readonly bookingsResponse = signal<AdminBookingsListResponseEnvelopeAdmins | null>(null);
  protected readonly selectedBookingResponse = signal<AdminBookingDetailResponseEnvelopeAdmins | null>(null);
  protected readonly updateBookingStatus = signal<AdminBookingStatusAdmins>('PENDING');

  protected readonly createName = signal('');
  protected readonly createAddress = signal('');
  protected readonly createCity = signal('');
  protected readonly createState = signal('');
  protected readonly createPincode = signal('');
  protected readonly createTotalTowers = signal('');
  protected readonly selectedCreatePictureFile = signal<File | null>(null);
  protected readonly selectedCreatePicturePreviewUrl = signal<string | null>(null);
  protected readonly createModalError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMyBuildings();
  }

  protected buildingsData(): AdminBuildingItemAdmins[] {
    return this.buildingsResponse()?.data ?? [];
  }

  protected loadMyBuildings(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.pageError.set('No active session found. Please login again.');
      return;
    }

    this.isLoadingBuildings.set(true);
    this.pageError.set(null);
    this.actionMessage.set(null);
    this.buildingsResponse.set(null);

    getAdminMyBuildingsApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: (response) => {
        this.buildingsResponse.set(response);
        this.isLoadingBuildings.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingBuildings.set(false);
          return;
        }

        this.pageError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/buildings/my.'));
        this.isLoadingBuildings.set(false);
      },
    });
  }

  protected openBuildingDetail(buildingId: number): void {
    this.router.navigateByUrl(`/admins/buildings/${buildingId}`);
  }

  protected openCreateModal(): void {
    this.createModalError.set(null);
    this.isCreateModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.createModalError.set(null);
  }

  protected setCreateName(value: string): void {
    this.createName.set(value);
  }

  protected setCreateAddress(value: string): void {
    this.createAddress.set(value);
  }

  protected setCreateCity(value: string): void {
    this.createCity.set(value);
  }

  protected setCreateState(value: string): void {
    this.createState.set(value);
  }

  protected setCreatePincode(value: string): void {
    this.createPincode.set(value);
  }

  protected setCreateTotalTowers(value: string): void {
    this.createTotalTowers.set(value);
  }

  protected onCreatePictureFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.selectedCreatePictureFile.set(file);
    this.replacePreviewUrl(this.selectedCreatePicturePreviewUrl, file);
  }

  protected openImagePreview(imageUrl: string): void {
    this.imagePreviewState.open(imageUrl);
  }

  protected openBookingsModal(): void {
    this.isBookingsModalOpen.set(true);
    this.bookingsModalError.set(null);
    this.bookingDetailError.set(null);
    this.bookingsResponse.set(null);
    this.selectedBookingResponse.set(null);
    this.loadBookings();
  }

  protected closeBookingsModal(): void {
    this.isBookingsModalOpen.set(false);
    this.isBookingDetailModalOpen.set(false);
    this.bookingsModalError.set(null);
    this.bookingDetailError.set(null);
    this.selectedBookingResponse.set(null);
  }

  protected closeBookingDetailModal(): void {
    this.isBookingDetailModalOpen.set(false);
    this.isLoadingBookingDetail.set(false);
    this.bookingDetailError.set(null);
    this.selectedBookingResponse.set(null);
  }

  protected bookingsData(): AdminBookingItemAdmins[] {
    return this.bookingsResponse()?.data ?? [];
  }

  protected selectedBooking(): AdminBookingItemAdmins | null {
    return this.selectedBookingResponse()?.data ?? null;
  }

  protected loadBookings(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.bookingsModalError.set('No active session found. Please login again.');
      return;
    }

    this.isLoadingBookings.set(true);
    this.bookingsModalError.set(null);

    getAdminBookingsApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: (response) => {
        this.bookingsResponse.set(response);
        this.isLoadingBookings.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingBookings.set(false);
          return;
        }

        this.bookingsModalError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/bookings.'));
        this.isLoadingBookings.set(false);
      },
    });
  }

  protected viewBooking(bookingId: number): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.bookingDetailError.set('No active session found. Please login again.');
      return;
    }

    this.isLoadingBookingDetail.set(true);
    this.bookingDetailError.set(null);
    this.selectedBookingResponse.set(null);
    this.isBookingDetailModalOpen.set(true);

    getAdminBookingByIdApi(this.http, this.apiBaseUrl(), token, bookingId).subscribe({
      next: (response) => {
        this.selectedBookingResponse.set(response);
        this.updateBookingStatus.set(response.data.status);
        this.isLoadingBookingDetail.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingBookingDetail.set(false);
          return;
        }

        this.bookingDetailError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/bookings/{booking_id}.'));
        this.isLoadingBookingDetail.set(false);
      },
    });
  }

  protected setUpdateBookingStatus(value: string): void {
    if (value === 'PENDING' || value === 'APPROVED' || value === 'DECLINED') {
      this.updateBookingStatus.set(value);
    }
  }

  protected updateSelectedBookingStatus(): void {
    const token = this.authState.accessToken();
    const booking = this.selectedBooking();
    if (!token) {
      this.bookingDetailError.set('No active session found. Please login again.');
      return;
    }
    if (!booking) {
      this.bookingDetailError.set('Select a booking first.');
      return;
    }

    this.isUpdatingBookingStatus.set(true);
    this.bookingDetailError.set(null);
    this.actionMessage.set(null);

    updateAdminBookingStatusApi(this.http, this.apiBaseUrl(), token, booking.id, { status: this.updateBookingStatus() }).subscribe({
      next: (response) => {
        this.isUpdatingBookingStatus.set(false);
        this.actionMessage.set(response.message || 'Booking status updated.');

        const updatedStatus = response.data.status;
        const detailEnvelope = this.selectedBookingResponse();
        if (detailEnvelope?.data) {
          this.selectedBookingResponse.set({
            ...detailEnvelope,
            data: { ...detailEnvelope.data, status: updatedStatus },
          });
        }

        const listEnvelope = this.bookingsResponse();
        if (listEnvelope?.data) {
          this.bookingsResponse.set({
            ...listEnvelope,
            data: listEnvelope.data.map((item) =>
              item.id === booking.id ? { ...item, status: updatedStatus } : item,
            ),
          });
        }

        this.closeBookingDetailModal();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingBookingStatus.set(false);
          return;
        }

        this.bookingDetailError.set(this.extractErrorMessage(error, 'Failed to update booking status.'));
        this.isUpdatingBookingStatus.set(false);
      },
    });
  }

  protected createBuilding(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.createModalError.set('No active session found. Please login again.');
      return;
    }

    const name = this.createName().trim();
    const address = this.createAddress().trim();
    const city = this.createCity().trim();
    const state = this.createState().trim();
    const pincode = this.createPincode().trim();
    const totalTowersRaw = this.createTotalTowers().trim();

    if (!name || !address || !city || !state || !pincode) {
      this.createModalError.set('Name, address, city, state, and pincode are required.');
      return;
    }

    if (totalTowersRaw && Number.isNaN(Number(totalTowersRaw))) {
      this.createModalError.set('Total towers must be a number.');
      return;
    }

    this.isCreatingBuilding.set(true);
    this.createModalError.set(null);
    this.actionMessage.set(null);

    createAdminBuildingApi(
      this.http,
      this.apiBaseUrl(),
      token,
      {
        name,
        address,
        city,
        state,
        pincode,
        ...(totalTowersRaw ? { total_towers: Number(totalTowersRaw) } : {}),
      },
      this.selectedCreatePictureFile(),
    ).subscribe({
      next: (response) => {
        this.actionMessage.set(response.message || 'Building created.');
        this.resetCreateForm();
        this.closeCreateModal();
        this.loadMyBuildings();
        this.isCreatingBuilding.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isCreatingBuilding.set(false);
          return;
        }

        this.createModalError.set(this.extractErrorMessage(error, 'Failed to create building.'));
        this.isCreatingBuilding.set(false);
      },
    });
  }

  private resetCreateForm(): void {
    this.createName.set('');
    this.createAddress.set('');
    this.createCity.set('');
    this.createState.set('');
    this.createPincode.set('');
    this.createTotalTowers.set('');
    this.selectedCreatePictureFile.set(null);
    this.replacePreviewUrl(this.selectedCreatePicturePreviewUrl, null);
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const envelope = error.error as { message?: string; error?: { user_message?: string; detail?: string } };
    return envelope?.error?.user_message ?? envelope?.message ?? envelope?.error?.detail ?? fallback;
  }

  private replacePreviewUrl(target: WritableSignal<string | null>, file: File | null): void {
    const previous = target();
    if (previous) {
      URL.revokeObjectURL(previous);
    }
    target.set(file ? URL.createObjectURL(file) : null);
  }
}
