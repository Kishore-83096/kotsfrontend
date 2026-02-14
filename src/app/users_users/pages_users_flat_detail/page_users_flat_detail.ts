import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { createUsersFlatBookingApi, getUsersBookingsApi, getUsersFlatDetailApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import {
  BuildingAmenityUsers,
  UsersCreateBookingResponseEnvelopeUsers,
  UsersFlatDetailResponseEnvelopeUsers,
  UsersBookingsResponseEnvelopeUsers,
} from '../typescript_users/type_users';

@Component({
  selector: 'app-page-users-flat-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page_users_flat_detail.html',
  styleUrl: './page_users_flat_detail.css',
})
export class PageUsersFlatDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal('https://kots.onrender.com');
  protected readonly buildingId = signal<number | null>(null);
  protected readonly towerId = signal<number | null>(null);
  protected readonly flatId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly detailResponse = signal<UsersFlatDetailResponseEnvelopeUsers | null>(null);
  protected readonly isBookingModalOpen = signal(false);
  protected readonly isBookingSubmitting = signal(false);
  protected readonly bookingError = signal<string | null>(null);
  protected readonly bookingSuccess = signal<string | null>(null);
  protected readonly bookingResponse = signal<UsersCreateBookingResponseEnvelopeUsers | null>(null);
  protected readonly hasAlreadyBookedThisFlat = signal(false);
  protected readonly isAmenityModalOpen = signal(false);
  protected readonly selectedAmenity = signal<BuildingAmenityUsers | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const buildingId = Number(params.get('buildingId'));
      const towerId = Number(params.get('towerId'));
      const flatId = Number(params.get('flatId'));

      if (
        !Number.isFinite(buildingId) ||
        buildingId <= 0 ||
        !Number.isFinite(towerId) ||
        towerId <= 0 ||
        !Number.isFinite(flatId) ||
        flatId <= 0
      ) {
        this.error.set('Invalid building, tower, or flat id.');
        this.buildingId.set(null);
        this.towerId.set(null);
        this.flatId.set(null);
        this.detailResponse.set(null);
        this.isLoading.set(false);
        return;
      }

      this.buildingId.set(buildingId);
      this.towerId.set(towerId);
      this.flatId.set(flatId);
      this.detailResponse.set(null);
      this.bookingResponse.set(null);
      this.bookingError.set(null);
      this.bookingSuccess.set(null);
      this.hasAlreadyBookedThisFlat.set(false);
      this.isBookingModalOpen.set(false);
      this.closeAmenityModal();
      this.error.set(null);
      this.loadFlatDetail();
      this.loadBookingState();
    });
  }

  protected loadFlatDetail(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    const towerId = this.towerId();
    const flatId = this.flatId();

    if (!token) {
      this.error.set('No active session found. Please login again.');
      return;
    }
    if (!buildingId || !towerId || !flatId) {
      this.error.set('Invalid building, tower, or flat id.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.detailResponse.set(null);

    getUsersFlatDetailApi(this.http, this.apiBaseUrl(), token, buildingId, towerId, flatId).subscribe({
      next: (response) => {
        this.detailResponse.set(response);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.error.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoading.set(false);
          return;
        }

        this.error.set('Failed to fetch flat details.');
        this.isLoading.set(false);
      },
    });
  }

  protected flat() {
    return this.detailResponse()?.data?.flat ?? null;
  }

  protected tower() {
    return this.detailResponse()?.data?.tower ?? null;
  }

  protected building() {
    return this.detailResponse()?.data?.building ?? null;
  }

  protected amenities(): BuildingAmenityUsers[] {
    return this.detailResponse()?.data?.amenities ?? [];
  }

  protected openAmenityModal(amenity: BuildingAmenityUsers): void {
    this.isAmenityModalOpen.set(true);
    this.selectedAmenity.set(amenity);
  }

  protected closeAmenityModal(): void {
    this.isAmenityModalOpen.set(false);
    this.selectedAmenity.set(null);
  }

  protected openBookingModal(): void {
    if (this.hasAlreadyBookedThisFlat()) {
      return;
    }
    this.bookingError.set(null);
    this.bookingSuccess.set(null);
    this.bookingResponse.set(null);
    this.isBookingModalOpen.set(true);
  }

  protected closeBookingModal(): void {
    this.isBookingModalOpen.set(false);
  }

  protected createBooking(): void {
    const token = this.authState.accessToken();
    const flatId = this.flatId();
    if (!token) {
      this.bookingError.set('No active session found. Please login again.');
      return;
    }
    if (!flatId) {
      this.bookingError.set('Invalid flat id.');
      return;
    }

    this.isBookingSubmitting.set(true);
    this.bookingError.set(null);
    this.bookingSuccess.set(null);

    createUsersFlatBookingApi(this.http, this.apiBaseUrl(), token, flatId).subscribe({
      next: (response) => {
        this.bookingResponse.set(response);
        this.bookingSuccess.set(response.message || 'Booking created successfully.');
        this.hasAlreadyBookedThisFlat.set(true);
        this.isBookingSubmitting.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.bookingError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isBookingSubmitting.set(false);
          return;
        }

        const envelope = error.error as { message?: string; error?: { user_message?: string; detail?: string } };
        this.bookingError.set(envelope?.error?.user_message ?? envelope?.message ?? envelope?.error?.detail ?? 'Failed to create booking.');
        if (error.status === 409) {
          this.hasAlreadyBookedThisFlat.set(true);
        }
        this.isBookingSubmitting.set(false);
      },
    });
  }

  private loadBookingState(): void {
    const token = this.authState.accessToken();
    const flatId = this.flatId();
    if (!token || !flatId) {
      return;
    }

    getUsersBookingsApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: (response: UsersBookingsResponseEnvelopeUsers) => {
        const found = (response.data ?? []).some((booking) => booking.flat_id === flatId);
        this.hasAlreadyBookedThisFlat.set(found);
      },
      error: () => {
        // Non-blocking: keep booking flow usable even if this lookup fails.
      },
    });
  }
}
