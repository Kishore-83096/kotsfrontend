import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  getUsersBuildingAmenitiesApi,
  getUsersFlatDetailApi,
  getUsersProfileApi,
  searchUsersBuildingsApi,
  searchUsersFlatsApi,
} from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import {
  BuildingAmenityUsers,
  UsersBuildingSearchResponseEnvelopeUsers,
  UserBuildingListItemUsers,
  UsersFlatSearchItemUsers,
  UsersFlatSearchResponseEnvelopeUsers,
  UserProfileResponseEnvelopeUsers,
  UsersBuildingAmenitiesDataUsers,
} from '../typescript_users/type_users';
import { toUserErrorMessage } from '../../shared/api_error_message';

@Component({
  selector: 'app-page-users-welcome',
  standalone: true,
  templateUrl: './page_users_welcome.html',
  styleUrl: './page_users_welcome.css',
})
export class PageUsersWelcomeComponent implements OnInit {
  private readonly flatsPerPage = 9;
  private readonly buildingsPerPage = 9;
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly isLoadingUserData = signal(false);
  protected readonly userDataError = signal<string | null>(null);
  protected readonly buildingsResponse = signal<UsersBuildingSearchResponseEnvelopeUsers | null>(null);
  protected readonly currentBuildingsPage = signal(1);
  protected readonly flatsResponse = signal<UsersFlatSearchResponseEnvelopeUsers | null>(null);
  protected readonly isLoadingFlats = signal(false);
  protected readonly flatsError = signal<string | null>(null);
  protected readonly currentFlatsPage = signal(1);
  protected readonly flatStatusFilter = signal<'all' | 'available' | 'unavailable'>('all');
  protected readonly flatsPagination = computed(() => {
    const data = this.flatsResponse()?.data;
    return {
      page: data?.page ?? this.currentFlatsPage(),
      perPage: data?.per_page ?? this.flatsPerPage,
      total: data?.total ?? 0,
      totalPages: data?.total_pages ?? 0,
    };
  });
  protected readonly flatPageNumbers = computed(() => {
    const totalPages = this.flatsPagination().totalPages;
    const currentPage = this.flatsPagination().page;
    if (totalPages <= 1) {
      return [] as number[];
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let page = adjustedStart; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  });
  protected readonly canGoToPreviousFlatsPage = computed(
    () => this.flatsPagination().page > 1 && !this.isLoadingFlats(),
  );
  protected readonly canGoToNextFlatsPage = computed(
    () => this.flatsPagination().page < this.flatsPagination().totalPages && !this.isLoadingFlats(),
  );
  protected readonly buildingsPagination = computed(() => {
    const data = this.buildingsResponse()?.data;
    return {
      page: data?.page ?? this.currentBuildingsPage(),
      perPage: data?.per_page ?? this.buildingsPerPage,
      total: data?.total ?? 0,
      totalPages: data?.total_pages ?? 0,
    };
  });
  protected readonly buildingPageNumbers = computed(() => {
    const totalPages = this.buildingsPagination().totalPages;
    const currentPage = this.buildingsPagination().page;
    if (totalPages <= 1) {
      return [] as number[];
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let page = adjustedStart; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  });
  protected readonly canGoToPreviousBuildingsPage = computed(
    () => this.buildingsPagination().page > 1 && !this.isLoadingUserData(),
  );
  protected readonly canGoToNextBuildingsPage = computed(
    () =>
      this.buildingsPagination().page < this.buildingsPagination().totalPages &&
      !this.isLoadingUserData(),
  );
  protected readonly flatCounts = computed(() => {
    const statusCounts = this.flatsResponse()?.data?.['status_counts'] as
      | { all?: number; available?: number; unavailable?: number }
      | undefined;
    if (statusCounts) {
      return {
        total: statusCounts.all ?? 0,
        available: statusCounts.available ?? 0,
        unavailable: statusCounts.unavailable ?? 0,
      };
    }

    const flats = this.flatsData();
    const total = flats.length;
    const available = flats.filter((item) => item.flat.is_available).length;
    return {
      total,
      available,
      unavailable: total - available,
    };
  });
  protected readonly buildingCount = computed(() => this.buildingsPagination().total);
  protected readonly profileResponse = signal<UserProfileResponseEnvelopeUsers | null>(null);
  protected readonly amenitiesByBuilding = signal<Record<number, BuildingAmenityUsers[]>>({});
  protected readonly amenitiesByFlat = signal<Record<number, BuildingAmenityUsers[]>>({});
  protected readonly isAmenitiesModalOpen = signal(false);
  protected readonly amenitiesModalKind = signal<'building' | 'flat'>('building');
  protected readonly selectedAmenitiesBuilding = signal<UserBuildingListItemUsers | null>(null);
  protected readonly selectedAmenitiesFlat = signal<UsersFlatSearchItemUsers | null>(null);
  protected readonly isAmenitiesModalLoading = signal(false);
  protected readonly amenitiesModalError = signal<string | null>(null);
  protected readonly amenitiesModalData = signal<BuildingAmenityUsers[]>([]);
  protected readonly amenitiesModalTitle = computed(() => {
    if (this.amenitiesModalKind() === 'flat') {
      const selectedFlat = this.selectedAmenitiesFlat();
      if (selectedFlat) {
        return `Flat ${selectedFlat.flat.flat_number} Amenities`;
      }
      return 'Flat Amenities';
    }
    return `${this.selectedAmenitiesBuilding()?.name ?? 'Building'} Amenities`;
  });
  protected readonly amenitiesModalEmptyMessage = computed(() => {
    return this.amenitiesModalKind() === 'flat'
      ? 'No amenities attached to this flat.'
      : 'No amenities found for this building.';
  });
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
    this.loadFeaturedFlats();
    this.loadProfileIdentity();
  }

  protected loadUserData(): void {
    this.loadBuildingsPage(1);
  }

  protected goToBuildingsPage(page: number): void {
    const totalPages = this.buildingsPagination().totalPages;
    if (this.isLoadingUserData() || page < 1 || (totalPages > 0 && page > totalPages)) {
      return;
    }
    this.loadBuildingsPage(page);
  }

  protected goToPreviousBuildingsPage(): void {
    this.goToBuildingsPage(this.buildingsPagination().page - 1);
  }

  protected goToNextBuildingsPage(): void {
    this.goToBuildingsPage(this.buildingsPagination().page + 1);
  }

  private loadBuildingsPage(page = 1): void {
    this.currentBuildingsPage.set(page);
    this.isLoadingUserData.set(true);
    this.userDataError.set(null);
    this.buildingsResponse.set(null);

    searchUsersBuildingsApi(this.http, this.apiBaseUrl(), null, {
      page,
      per_page: this.buildingsPerPage,
    }).subscribe({
      next: (response) => {
        this.buildingsResponse.set(response);
        this.isLoadingUserData.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.userDataError.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load buildings right now.',
          }),
        );
        this.isLoadingUserData.set(false);
      },
    });
  }

  protected buildingsData(): UserBuildingListItemUsers[] {
    return this.buildingsResponse()?.data?.items ?? [];
  }

  protected flatsData(): UsersFlatSearchItemUsers[] {
    return this.flatsResponse()?.data?.items ?? [];
  }

  protected filteredFlatsData(): UsersFlatSearchItemUsers[] {
    return this.flatsData();
  }

  protected setFlatStatusFilter(filter: 'all' | 'available' | 'unavailable'): void {
    if (this.flatStatusFilter() === filter) {
      return;
    }
    this.flatStatusFilter.set(filter);
    this.loadFeaturedFlats(1);
  }

  protected goToFlatsPage(page: number): void {
    const totalPages = this.flatsPagination().totalPages;
    if (this.isLoadingFlats() || page < 1 || (totalPages > 0 && page > totalPages)) {
      return;
    }
    this.loadFeaturedFlats(page);
  }

  protected goToPreviousFlatsPage(): void {
    this.goToFlatsPage(this.flatsPagination().page - 1);
  }

  protected goToNextFlatsPage(): void {
    this.goToFlatsPage(this.flatsPagination().page + 1);
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

  protected openFlatDetail(item: UsersFlatSearchItemUsers): void {
    const buildingId = item.building.id;
    const towerId = item.tower.id;
    const flatId = item.flat.id;
    this.router.navigateByUrl(`/users/buildings/${buildingId}/towers/${towerId}/flats/${flatId}`);
  }

  protected openFlatAmenitiesModal(item: UsersFlatSearchItemUsers): void {
    this.amenitiesModalKind.set('flat');
    this.selectedAmenitiesFlat.set(item);
    this.selectedAmenitiesBuilding.set(null);
    this.isAmenitiesModalOpen.set(true);
    this.amenitiesModalError.set(null);
    this.amenitiesModalData.set([]);

    const cached = this.amenitiesByFlat()[item.flat.id];
    if (cached) {
      this.amenitiesModalData.set(cached);
      this.isAmenitiesModalLoading.set(false);
      return;
    }

    this.loadFlatAmenities(item);
  }

  protected openAmenitiesModal(building: UserBuildingListItemUsers): void {
    this.amenitiesModalKind.set('building');
    this.selectedAmenitiesBuilding.set(building);
    this.selectedAmenitiesFlat.set(null);
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
    this.selectedAmenitiesFlat.set(null);
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
        }
      },
    });
  }

  private loadFeaturedFlats(page = 1): void {
    this.currentFlatsPage.set(page);
    this.isLoadingFlats.set(true);
    this.flatsError.set(null);
    this.flatsResponse.set(null);

    searchUsersFlatsApi(this.http, this.apiBaseUrl(), null, {
      status: this.flatStatusFilter(),
      page,
      per_page: this.flatsPerPage,
    }).subscribe({
      next: (response) => {
        this.flatsResponse.set(response);
        this.isLoadingFlats.set(false);
      },
      error: () => {
        this.flatsError.set('Unable to load flats right now.');
        this.isLoadingFlats.set(false);
      },
    });
  }

  private loadBuildingAmenities(buildingId: number): void {
    this.isAmenitiesModalLoading.set(true);
    this.amenitiesModalError.set(null);

    getUsersBuildingAmenitiesApi(this.http, this.apiBaseUrl(), null, buildingId).subscribe({
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
        this.amenitiesModalError.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load building amenities right now.',
          }),
        );
        this.isAmenitiesModalLoading.set(false);
      },
    });
  }

  private loadFlatAmenities(item: UsersFlatSearchItemUsers): void {
    this.isAmenitiesModalLoading.set(true);
    this.amenitiesModalError.set(null);

    getUsersFlatDetailApi(
      this.http,
      this.apiBaseUrl(),
      null,
      item.building.id,
      item.tower.id,
      item.flat.id,
    ).subscribe({
      next: (response) => {
        const amenities = Array.isArray(response.data?.amenities) ? response.data.amenities : [];
        this.amenitiesByFlat.update((prev) => ({ ...prev, [item.flat.id]: amenities }));
        this.amenitiesModalData.set(amenities);
        this.isAmenitiesModalLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.amenitiesModalError.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load flat amenities right now.',
          }),
        );
        this.isAmenitiesModalLoading.set(false);
      },
    });
  }

}




