import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { getUsersBookingByIdApi, getUsersBookingsApi, getUsersFlatDetailApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import { toUserErrorMessage } from '../../shared/api_error_message';
import {
  UsersFlatDetailDataUsers,
  UsersBookingDetailResponseEnvelopeUsers,
  UsersBookingListItemUsers,
  UsersBookingsResponseEnvelopeUsers,
} from '../typescript_users/type_users';

@Component({
  selector: 'app-page-users-bookings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page_users_bookings.html',
  styleUrl: './page_users_bookings.css',
})
export class PageUsersBookingsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly bookingsResponse = signal<UsersBookingsResponseEnvelopeUsers | null>(null);
  protected readonly isBookingModalOpen = signal(false);
  protected readonly isLoadingBookingDetail = signal(false);
  protected readonly bookingDetailError = signal<string | null>(null);
  protected readonly bookingDetailResponse = signal<UsersBookingDetailResponseEnvelopeUsers | null>(null);
  protected readonly flatPreviewByBookingId = signal<Record<number, UsersFlatDetailDataUsers>>({});
  protected readonly bookingModalFlatDetail = signal<UsersFlatDetailDataUsers | null>(null);

  ngOnInit(): void {
    this.loadBookings();
  }

  protected loadBookings(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.error.set('No active session found. Please login again.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.bookingsResponse.set(null);
    this.flatPreviewByBookingId.set({});

    getUsersBookingsApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: (response) => {
        this.bookingsResponse.set(response);
        this.loadFlatPreviews(response.data ?? []);
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

        this.error.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load your bookings right now.',
          }),
        );
        this.isLoading.set(false);
      },
    });
  }

  protected bookingsData(): UsersBookingListItemUsers[] {
    return this.bookingsResponse()?.data ?? [];
  }

  protected openBookingDetailModal(bookingId: number): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.error.set('No active session found. Please login again.');
      return;
    }

    this.isBookingModalOpen.set(true);
    this.isLoadingBookingDetail.set(true);
    this.bookingDetailError.set(null);
    this.bookingDetailResponse.set(null);
    this.bookingModalFlatDetail.set(null);

    getUsersBookingByIdApi(this.http, this.apiBaseUrl(), token, bookingId).subscribe({
      next: (response) => {
        this.bookingDetailResponse.set(response);
        this.loadBookingModalFlatDetail(response.data);
        this.isLoadingBookingDetail.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.bookingDetailError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingBookingDetail.set(false);
          return;
        }

        this.bookingDetailError.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load booking details right now.',
          }),
        );
        this.isLoadingBookingDetail.set(false);
      },
    });
  }

  protected closeBookingDetailModal(): void {
    this.isBookingModalOpen.set(false);
    this.isLoadingBookingDetail.set(false);
    this.bookingDetailError.set(null);
    this.bookingDetailResponse.set(null);
    this.bookingModalFlatDetail.set(null);
  }

  protected flatPreviewForBooking(bookingId: number): UsersFlatDetailDataUsers | null {
    return this.flatPreviewByBookingId()[bookingId] ?? null;
  }

  protected openFlatDetailsFromBooking(booking: UsersBookingListItemUsers): void {
    if (!booking.building_id || !booking.tower_id || !booking.flat_id) {
      return;
    }
    this.closeBookingDetailModal();
    this.router.navigateByUrl(`/users/buildings/${booking.building_id}/towers/${booking.tower_id}/flats/${booking.flat_id}`);
  }

  protected formatBookingDate(value?: string | null): string {
    const date = this.parseBookingDate(value);
    if (!date) {
      return 'N/A';
    }
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      timeZone: 'Asia/Kolkata',
    }).format(date);
  }

  protected formatBookingTime(value?: string | null): string {
    const date = this.parseBookingDate(value);
    if (!date) {
      return 'N/A';
    }
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    })
      .format(date)
      .toLowerCase();
  }

  private parseBookingDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    // Backend stores UTC timestamps; if zone is missing, treat input as UTC.
    const hasZone = /(?:z|[+\-]\d{2}:\d{2})$/i.test(trimmed);
    const normalized = hasZone ? trimmed : `${trimmed}Z`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private loadFlatPreviews(bookings: UsersBookingListItemUsers[]): void {
    const token = this.authState.accessToken();
    if (!token) {
      return;
    }

    for (const booking of bookings) {
      if (!booking.building_id || !booking.tower_id || !booking.flat_id) {
        continue;
      }

      getUsersFlatDetailApi(this.http, this.apiBaseUrl(), token, booking.building_id, booking.tower_id, booking.flat_id).subscribe({
        next: (response) => {
          this.flatPreviewByBookingId.update((prev) => ({
            ...prev,
            [booking.id]: response.data,
          }));
        },
        error: () => {
          // Keep booking list resilient when a preview fetch fails.
        },
      });
    }
  }

  private loadBookingModalFlatDetail(booking: UsersBookingListItemUsers): void {
    const token = this.authState.accessToken();
    if (!token || !booking.building_id || !booking.tower_id || !booking.flat_id) {
      return;
    }

    getUsersFlatDetailApi(this.http, this.apiBaseUrl(), token, booking.building_id, booking.tower_id, booking.flat_id).subscribe({
      next: (response) => {
        this.bookingModalFlatDetail.set(response.data);
      },
      error: () => {
        // Modal can still show booking-level fields if flat detail fetch fails.
      },
    });
  }
}




