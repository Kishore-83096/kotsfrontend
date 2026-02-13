import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ImagePreviewState } from '../../shared/image_preview_state';
import { getUsersBuildingTowersApi, getUsersBuildingsApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import { UserBuildingListItemUsers, UserTowerListItemUsers, UsersBuildingTowersResponseEnvelopeUsers } from '../typescript_users/type_users';

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
  private readonly authState = inject(UsersAuthState);
  private readonly imagePreviewState = inject(ImagePreviewState);

  protected readonly apiBaseUrl = signal('http://127.0.0.1:5000');
  protected readonly buildingId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly towersResponse = signal<UsersBuildingTowersResponseEnvelopeUsers | null>(null);
  protected readonly selectedBuilding = signal<UserBuildingListItemUsers | null>(null);

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
    const token = this.authState.accessToken();
    const id = this.buildingId();

    if (!token) {
      this.error.set('No active session found. Please login again.');
      return;
    }
    if (!id) {
      this.error.set('Invalid building id.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.towersResponse.set(null);

    getUsersBuildingTowersApi(this.http, this.apiBaseUrl(), token, id).subscribe({
      next: (response) => {
        this.towersResponse.set(response);
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

        this.error.set('Failed to fetch building towers.');
        this.isLoading.set(false);
      },
    });
  }

  protected towersData(): UserTowerListItemUsers[] {
    return this.towersResponse()?.data ?? [];
  }

  protected openTowerDetail(towerId: number): void {
    const buildingId = this.buildingId();
    if (!buildingId) {
      return;
    }

    this.router.navigateByUrl(`/users/buildings/${buildingId}/towers/${towerId}`);
  }

  protected openImagePreview(imageUrl: string): void {
    this.imagePreviewState.open(imageUrl);
  }

  protected amenitiesText(building: UserBuildingListItemUsers): string {
    const amenities = building.amenities ?? [];
    if (amenities.length === 0) {
      return 'N/A';
    }
    return amenities.map((amenity) => amenity.name).join(', ');
  }

  private loadBuildingSummary(): void {
    const token = this.authState.accessToken();
    const id = this.buildingId();

    if (!token || !id) {
      this.selectedBuilding.set(null);
      return;
    }

    getUsersBuildingsApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: (response) => {
        const matched = (response.data ?? []).find((building) => building.id === id) ?? null;
        this.selectedBuilding.set(matched);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.error.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
        }
      },
    });
  }
}
