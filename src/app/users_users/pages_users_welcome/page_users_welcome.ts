import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { getUsersBuildingAmenitiesApi, getUsersBuildingsApi, getUsersProfileApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import {
  BuildingAmenityUsers,
  UserBuildingListItemUsers,
  UserProfileResponseEnvelopeUsers,
  UsersBuildingAmenitiesDataUsers,
  UsersBuildingsResponseEnvelopeUsers,
} from '../typescript_users/type_users';

@Component({
  selector: 'app-page-users-welcome',
  standalone: true,
  templateUrl: './page_users_welcome.html',
  styleUrl: './page_users_welcome.css',
})
export class PageUsersWelcomeComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly isLoadingUserData = signal(false);
  protected readonly userDataError = signal<string | null>(null);
  protected readonly buildingsResponse = signal<UsersBuildingsResponseEnvelopeUsers | null>(null);
  protected readonly profileResponse = signal<UserProfileResponseEnvelopeUsers | null>(null);
  protected readonly amenitiesByBuilding = signal<Record<number, BuildingAmenityUsers[]>>({});
  protected readonly isAmenitiesModalOpen = signal(false);
  protected readonly selectedAmenitiesBuilding = signal<UserBuildingListItemUsers | null>(null);
  protected readonly isAmenitiesModalLoading = signal(false);
  protected readonly amenitiesModalError = signal<string | null>(null);
  protected readonly amenitiesModalData = signal<BuildingAmenityUsers[]>([]);
  protected readonly welcomeIdentity = computed(() => {
    const profile = this.profileResponse()?.data;
    const username = typeof profile?.username === 'string' ? profile.username.trim() : '';
    if (username) {
      return username;
    }
    const primaryEmail = typeof profile?.primary_email === 'string' ? profile.primary_email.trim() : '';
    if (primaryEmail) {
      return primaryEmail;
    }
    return this.authState.lastLoginResult()?.data.email ?? 'User';
  });

  ngOnInit(): void {
    this.loadUserData();
    this.loadProfileIdentity();
  }

  protected loadUserData(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.userDataError.set('No active session found. Please login again.');
      return;
    }

    this.isLoadingUserData.set(true);
    this.userDataError.set(null);
    this.buildingsResponse.set(null);

    getUsersBuildingsApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: (response) => {
        this.buildingsResponse.set(response);
        this.isLoadingUserData.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.userDataError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingUserData.set(false);
          return;
        }

        this.userDataError.set('Failed to fetch /users/buildings.');
        this.isLoadingUserData.set(false);
      },
    });
  }

  protected buildingsData(): UserBuildingListItemUsers[] {
    return this.buildingsResponse()?.data ?? [];
  }

  protected amenitiesText(building: UserBuildingListItemUsers): string {
    const amenities = building.amenities ?? [];
    if (amenities.length === 0) {
      return 'N/A';
    }

    return amenities.map((amenity) => amenity.name).join(', ');
  }

  protected openBuildingTowers(buildingId: number): void {
    this.router.navigateByUrl(`/users/buildings/${buildingId}/towers`);
  }

  protected openAmenitiesModal(building: UserBuildingListItemUsers): void {
    this.selectedAmenitiesBuilding.set(building);
    this.isAmenitiesModalOpen.set(true);
    this.amenitiesModalError.set(null);
    this.amenitiesModalData.set([]);

    const cached = this.amenitiesByBuilding()[building.id];
    if (cached) {
      this.amenitiesModalData.set(cached);
      this.isAmenitiesModalLoading.set(false);
      return;
    }

    this.loadBuildingAmenities(building.id);
  }

  protected closeAmenitiesModal(): void {
    this.isAmenitiesModalOpen.set(false);
    this.selectedAmenitiesBuilding.set(null);
    this.isAmenitiesModalLoading.set(false);
    this.amenitiesModalError.set(null);
    this.amenitiesModalData.set([]);
  }

  private loadProfileIdentity(): void {
    const token = this.authState.accessToken();
    if (!token) {
      return;
    }

    getUsersProfileApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: (response) => {
        this.profileResponse.set(response);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
        }
      },
    });
  }

  private loadBuildingAmenities(buildingId: number): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.userDataError.set('No active session found. Please login again.');
      return;
    }

    this.isAmenitiesModalLoading.set(true);
    this.amenitiesModalError.set(null);

    getUsersBuildingAmenitiesApi(this.http, this.apiBaseUrl(), token, buildingId).subscribe({
      next: (response) => {
        const payload = (response.data ?? {}) as Partial<UsersBuildingAmenitiesDataUsers> | BuildingAmenityUsers[];
        const amenities = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.amenities)
            ? payload.amenities
            : [];
        this.amenitiesByBuilding.update((prev) => ({ ...prev, [buildingId]: amenities }));
        this.amenitiesModalData.set(amenities);
        this.isAmenitiesModalLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isAmenitiesModalLoading.set(false);
          return;
        }

        this.amenitiesModalError.set('Failed to fetch amenities.');
        this.isAmenitiesModalLoading.set(false);
      },
    });
  }

}




