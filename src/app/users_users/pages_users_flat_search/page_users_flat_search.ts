import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SearchUsersBuildingsParams,
  SearchUsersFlatsParams,
  searchUsersBuildingsApi,
  searchUsersFlatsApi,
} from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import {
  UserBuildingListItemUsers,
  UsersBuildingSearchResponseEnvelopeUsers,
  UsersFlatSearchItemUsers,
  UsersFlatSearchResponseEnvelopeUsers,
} from '../typescript_users/type_users';

@Component({
  selector: 'app-page-users-flat-search',
  standalone: true,
  templateUrl: './page_users_flat_search.html',
  styleUrl: './page_users_flat_search.css',
})
export class PageUsersFlatSearchComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authState = inject(UsersAuthState);

  protected readonly apiBaseUrl = signal('https://kots.onrender.com');
  protected readonly response = signal<UsersFlatSearchResponseEnvelopeUsers | null>(null);
  protected readonly buildingResponse = signal<UsersBuildingSearchResponseEnvelopeUsers | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly tab = signal<'flat' | 'building'>('flat');
  protected readonly isSearchDropdownOpen = signal(true);

  protected readonly buildingName = signal('');
  protected readonly address = signal('');
  protected readonly city = signal('');
  protected readonly state = signal('');
  protected readonly flatType = signal('');
  protected readonly minRent = signal('');
  protected readonly maxRent = signal('');
  protected readonly availableOnly = signal(true);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const queryTab = params.get('tab');
      this.tab.set(queryTab === 'building' ? 'building' : 'flat');
      this.buildingName.set(params.get('name') ?? '');
      this.address.set(params.get('address') ?? '');
      this.city.set(params.get('city') ?? '');
      this.state.set(params.get('state') ?? '');
      this.flatType.set(params.get('flat_type') ?? '');
      this.minRent.set(params.get('min_rent') ?? '');
      this.maxRent.set(params.get('max_rent') ?? '');
      this.availableOnly.set((params.get('available_only') ?? 'true').toLowerCase() !== 'false');
      this.loadResults();
    });
  }

  protected setAddress(value: string): void {
    this.address.set(value);
  }

  protected setBuildingName(value: string): void {
    this.buildingName.set(value);
  }

  protected setCity(value: string): void {
    this.city.set(value);
  }

  protected setState(value: string): void {
    this.state.set(value);
  }

  protected setFlatType(value: string): void {
    this.flatType.set(value);
  }

  protected setMinRent(value: string): void {
    this.minRent.set(value);
  }

  protected setMaxRent(value: string): void {
    this.maxRent.set(value);
  }

  protected setAvailableOnly(value: boolean): void {
    this.availableOnly.set(value);
  }

  protected submitSearch(): void {
    this.router.navigate(['/users/flats/search'], {
      queryParams: this.buildQueryParams(),
    });
  }

  protected clearFilters(): void {
    this.router.navigate(['/users/flats/search'], {
      queryParams: { tab: this.tab() },
    });
  }

  protected setTab(tab: 'flat' | 'building'): void {
    this.tab.set(tab);
    this.submitSearch();
  }

  protected toggleSearchDropdown(): void {
    this.isSearchDropdownOpen.update((prev) => !prev);
  }

  protected items(): UsersFlatSearchItemUsers[] {
    return this.response()?.data.items ?? [];
  }

  protected buildingItems(): UserBuildingListItemUsers[] {
    return this.buildingResponse()?.data.items ?? [];
  }

  protected total(): number {
    if (this.tab() === 'building') {
      return this.buildingResponse()?.data.total ?? 0;
    }
    return this.response()?.data.total ?? 0;
  }

  protected openFlatDetail(item: UsersFlatSearchItemUsers): void {
    const buildingId = item.building.id;
    const towerId = item.tower.id;
    const flatId = item.flat.id;
    this.router.navigateByUrl(`/users/buildings/${buildingId}/towers/${towerId}/flats/${flatId}`);
  }

  protected openBuildingTowers(building: UserBuildingListItemUsers): void {
    this.router.navigateByUrl(`/users/buildings/${building.id}/towers`);
  }

  private loadResults(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.authState.clearAuth();
      this.router.navigateByUrl('/users/login');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.response.set(null);
    this.buildingResponse.set(null);

    if (this.tab() === 'building') {
      searchUsersBuildingsApi(this.http, this.apiBaseUrl(), token, this.buildBuildingSearchParams()).subscribe({
        next: (result) => {
          this.buildingResponse.set(result);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 401) {
            this.authState.clearAuth();
            this.router.navigateByUrl('/users/login');
            this.isLoading.set(false);
            return;
          }
          const message =
            (err.error as { error?: { user_message?: string }; message?: string })?.error?.user_message ||
            (err.error as { message?: string })?.message ||
            'Failed to search buildings.';
          this.error.set(message);
          this.isLoading.set(false);
        },
      });
      return;
    }

    searchUsersFlatsApi(this.http, this.apiBaseUrl(), token, this.buildFlatSearchParams()).subscribe({
      next: (result) => {
        this.response.set(result);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoading.set(false);
          return;
        }
        const message =
          (err.error as { error?: { user_message?: string }; message?: string })?.error?.user_message ||
          (err.error as { message?: string })?.message ||
          'Failed to search flats.';
        this.error.set(message);
        this.isLoading.set(false);
      },
    });
  }

  private buildQueryParams(): Record<string, string | boolean> {
    const params: Record<string, string | boolean> = {};
    params['tab'] = this.tab();

    if (this.tab() === 'building') {
      const name = this.buildingName().trim();
      const address = this.address().trim();
      const city = this.city().trim();
      const state = this.state().trim();
      if (name) params['name'] = name;
      if (address) params['address'] = address;
      if (city) params['city'] = city;
      if (state) params['state'] = state;
      return params;
    }

    const address = this.address().trim();
    const city = this.city().trim();
    const state = this.state().trim();
    const flatType = this.flatType().trim();
    const minRent = this.minRent().trim();
    const maxRent = this.maxRent().trim();

    if (address) params['address'] = address;
    if (city) params['city'] = city;
    if (state) params['state'] = state;
    if (flatType) params['flat_type'] = flatType;
    if (minRent) params['min_rent'] = minRent;
    if (maxRent) params['max_rent'] = maxRent;
    params['available_only'] = this.availableOnly();
    return params;
  }

  private buildFlatSearchParams(): SearchUsersFlatsParams {
    const params: SearchUsersFlatsParams = {};
    const address = this.address().trim();
    const city = this.city().trim();
    const state = this.state().trim();
    const flatType = this.flatType().trim();
    const minRent = this.minRent().trim();
    const maxRent = this.maxRent().trim();

    if (address) params.address = address;
    if (city) params.city = city;
    if (state) params.state = state;
    if (flatType) params.flat_type = flatType;
    if (minRent) params.min_rent = minRent;
    if (maxRent) params.max_rent = maxRent;
    params.available_only = this.availableOnly();
    return params;
  }

  private buildBuildingSearchParams(): SearchUsersBuildingsParams {
    const params: SearchUsersBuildingsParams = {};
    const name = this.buildingName().trim();
    const address = this.address().trim();
    const city = this.city().trim();
    const state = this.state().trim();

    if (name) params.name = name;
    if (address) params.address = address;
    if (city) params.city = city;
    if (state) params.state = state;
    return params;
  }
}
