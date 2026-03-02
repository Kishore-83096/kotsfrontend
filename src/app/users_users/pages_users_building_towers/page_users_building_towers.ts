import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { getUsersBuildingAmenitiesApi, getUsersBuildingTowersApi, getUsersBuildingsApi } from '../api_users_auth';
import {
  BuildingAmenityUsers,
  UserBuildingListItemUsers,
  UserTowerListItemUsers,
  UsersBuildingAmenitiesDataUsers,
  UsersBuildingTowersResponseEnvelopeUsers,
} from '../typescript_users/type_users';

@Component({
  selector: 'app-page-users-building-towers',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page_users_building_towers.html',
  styleUrl: './page_users_building_towers.css',
})
export class PageUsersBuildingTowersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly buildingId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly towersResponse = signal<UsersBuildingTowersResponseEnvelopeUsers | null>(null);
  protected readonly selectedBuilding = signal<UserBuildingListItemUsers | null>(null);
  protected readonly amenitiesByBuilding = signal<Record<number, BuildingAmenityUsers[]>>({});
  protected readonly isAmenitiesModalOpen = signal(false);
  protected readonly selectedAmenitiesBuilding = signal<UserBuildingListItemUsers | null>(null);
  protected readonly isAmenitiesModalLoading = signal(false);
  protected readonly amenitiesModalError = signal<string | null>(null);
  protected readonly amenitiesModalData = signal<BuildingAmenityUsers[]>([]);
  protected readonly isListScrolled = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('buildingId'));
      if (!Number.isFinite(id) || id <= 0) {
        this.error.set('Invalid building id.');
        this.buildingId.set(null);
        this.towersResponse.set(null);
        this.selectedBuilding.set(null);
        this.isLoading.set(false);
        return;
      }

      this.buildingId.set(id);
      this.towersResponse.set(null);
      this.selectedBuilding.set(null);
      this.error.set(null);
      this.loadTowers();
      this.loadBuildingSummary();
    });
  }

  protected loadTowers(): void {
    const id = this.buildingId();

    if (!id) {
      this.error.set('Invalid building id.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.towersResponse.set(null);

    getUsersBuildingTowersApi(this.http, this.apiBaseUrl(), null, id).subscribe({
      next: (response) => {
        this.towersResponse.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to fetch building towers.');
        this.isLoading.set(false);
      },
    });
  }

  protected towersData(): UserTowerListItemUsers[] {
    return [...(this.towersResponse()?.data ?? [])].sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base', numeric: true }),
    );
  }

  protected openTowerDetail(towerId: number): void {
    const buildingId = this.buildingId();
    if (!buildingId) {
      return;
    }

    this.router.navigateByUrl(`/users/buildings/${buildingId}/towers/${towerId}`);
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

  protected onListScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    this.isListScrolled.set((target?.scrollTop ?? 0) > 8);
  }

  private loadBuildingSummary(): void {
    const id = this.buildingId();

    if (!id) {
      this.selectedBuilding.set(null);
      return;
    }

    getUsersBuildingsApi(this.http, this.apiBaseUrl()).subscribe({
      next: (response) => {
        const matched = (response.data ?? []).find((building) => building.id === id) ?? null;
        this.selectedBuilding.set(matched);
      },
      error: () => {},
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
      error: () => {
        this.amenitiesModalError.set('Failed to fetch amenities.');
        this.isAmenitiesModalLoading.set(false);
      },
    });
  }
}




