import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  createAdminAmenityApi,
  createAdminTowerApi,
  deleteAdminAmenityApi,
  deleteAdminBuildingApi,
  getAdminBuildingByIdApi,
  getAdminBuildingAmenitiesApi,
  getAdminBuildingTowersApi,
  updateAdminAmenityApi,
  updateAdminBuildingApi,
} from '../api_admins';
import { UsersAuthState } from '../../users_users/state_users_auth';
import {
  AdminBuildingDetailResponseEnvelopeAdmins,
  AdminBuildingAmenitiesResponseEnvelopeAdmins,
  AdminAmenityItemAdmins,
  AdminBuildingTowersResponseEnvelopeAdmins,
  AdminTowerItemAdmins,
} from '../typescript_admins/type_admins';
import { ImagePreviewState } from '../../shared/image_preview_state';

@Component({
  selector: 'app-page-admins-building-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page_admins_building_detail.html',
  styleUrl: './page_admins_building_detail.css',
})
export class PageAdminsBuildingDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authState = inject(UsersAuthState);
  private readonly imagePreviewState = inject(ImagePreviewState);

  protected readonly apiBaseUrl = signal('https://kots.onrender.com');
  protected readonly buildingId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingTowers = signal(false);
  protected readonly pageError = signal<string | null>(null);
  protected readonly towersError = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly isDeletingBuilding = signal(false);
  protected readonly deletingAmenityId = signal<number | null>(null);
  protected readonly buildingResponse = signal<AdminBuildingDetailResponseEnvelopeAdmins | null>(null);
  protected readonly towersResponse = signal<AdminBuildingTowersResponseEnvelopeAdmins | null>(null);
  protected readonly amenitiesResponse = signal<AdminBuildingAmenitiesResponseEnvelopeAdmins | null>(null);

  protected readonly isUpdateModalOpen = signal(false);
  protected readonly isUpdatingBuilding = signal(false);
  protected readonly updateModalError = signal<string | null>(null);
  protected readonly updateName = signal('');
  protected readonly updateAddress = signal('');
  protected readonly updateCity = signal('');
  protected readonly updateState = signal('');
  protected readonly updatePincode = signal('');
  protected readonly updateTotalTowers = signal('');
  protected readonly updatePictureFile = signal<File | null>(null);
  protected readonly updatePicturePreviewUrl = signal<string | null>(null);

  protected readonly isAddTowerModalOpen = signal(false);
  protected readonly isAddingTower = signal(false);
  protected readonly addTowerModalError = signal<string | null>(null);
  protected readonly addTowerName = signal('');
  protected readonly addTowerFloors = signal('');
  protected readonly addTowerTotalFlats = signal('');
  protected readonly addTowerPictureFile = signal<File | null>(null);
  protected readonly addTowerPicturePreviewUrl = signal<string | null>(null);

  protected readonly isAddAmenityModalOpen = signal(false);
  protected readonly isAddingAmenity = signal(false);
  protected readonly addAmenityModalError = signal<string | null>(null);
  protected readonly addAmenityName = signal('');
  protected readonly addAmenityDescription = signal('');
  protected readonly addAmenityPictureFile = signal<File | null>(null);
  protected readonly addAmenityPicturePreviewUrl = signal<string | null>(null);

  protected readonly isViewAmenitiesModalOpen = signal(false);
  protected readonly isLoadingAmenities = signal(false);
  protected readonly amenitiesModalError = signal<string | null>(null);
  protected readonly isEditAmenityModalOpen = signal(false);
  protected readonly isUpdatingAmenity = signal(false);
  protected readonly editAmenityModalError = signal<string | null>(null);
  protected readonly editAmenityId = signal<number | null>(null);
  protected readonly editAmenityName = signal('');
  protected readonly editAmenityDescription = signal('');
  protected readonly editAmenityPictureFile = signal<File | null>(null);
  protected readonly editAmenityPicturePreviewUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const rawBuildingId = params.get('buildingId');
      const parsed = rawBuildingId ? Number(rawBuildingId) : NaN;
      if (Number.isNaN(parsed)) {
        this.pageError.set('Invalid building id in route.');
        this.buildingId.set(null);
        this.resetRouteScopedState();
        return;
      }

      this.buildingId.set(parsed);
      this.resetRouteScopedState();
      this.loadBuilding();
      this.loadBuildingTowers();
    });
  }

  protected loadBuilding(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.pageError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.pageError.set('Building id is missing.');
      return;
    }

    this.isLoading.set(true);
    this.pageError.set(null);
    this.pageMessage.set(null);
    this.buildingResponse.set(null);

    getAdminBuildingByIdApi(this.http, this.apiBaseUrl(), token, buildingId).subscribe({
      next: (response) => {
        this.buildingResponse.set(response);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoading.set(false);
          return;
        }

        this.pageError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/buildings/{building_id}.'));
        this.isLoading.set(false);
      },
    });
  }

  protected towersData(): AdminTowerItemAdmins[] {
    return this.towersResponse()?.data ?? [];
  }

  protected loadBuildingTowers(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.towersError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.towersError.set('Building id is missing.');
      return;
    }

    this.isLoadingTowers.set(true);
    this.towersError.set(null);
    this.towersResponse.set(null);

    getAdminBuildingTowersApi(this.http, this.apiBaseUrl(), token, buildingId).subscribe({
      next: (response) => {
        this.towersResponse.set(response);
        this.isLoadingTowers.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingTowers.set(false);
          return;
        }

        this.towersError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/buildings/{building_id}/towers.'));
        this.isLoadingTowers.set(false);
      },
    });
  }

  protected amenitiesData(): AdminAmenityItemAdmins[] {
    return this.amenitiesResponse()?.data ?? [];
  }

  protected loadBuildingAmenities(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.amenitiesModalError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.amenitiesModalError.set('Building id is missing.');
      return;
    }

    this.isLoadingAmenities.set(true);
    this.amenitiesModalError.set(null);

    getAdminBuildingAmenitiesApi(this.http, this.apiBaseUrl(), token, buildingId).subscribe({
      next: (response) => {
        this.amenitiesResponse.set(response);
        this.isLoadingAmenities.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingAmenities.set(false);
          return;
        }

        this.amenitiesModalError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/buildings/{building_id}/amenities.'));
        this.isLoadingAmenities.set(false);
      },
    });
  }

  protected openUpdateModal(): void {
    const building = this.buildingResponse()?.data;
    if (!building) {
      return;
    }

    this.updateName.set(building.name ?? '');
    this.updateAddress.set(building.address ?? '');
    this.updateCity.set(building.city ?? '');
    this.updateState.set(building.state ?? '');
    this.updatePincode.set(building.pincode ?? '');
    this.updateTotalTowers.set(String(building.total_towers ?? ''));
    this.updatePictureFile.set(null);
    this.replacePreviewUrl(this.updatePicturePreviewUrl, null);
    this.updateModalError.set(null);
    this.isUpdateModalOpen.set(true);
  }

  protected closeUpdateModal(): void {
    this.isUpdateModalOpen.set(false);
    this.updateModalError.set(null);
    this.replacePreviewUrl(this.updatePicturePreviewUrl, null);
  }

  protected setUpdateName(value: string): void {
    this.updateName.set(value);
  }

  protected setUpdateAddress(value: string): void {
    this.updateAddress.set(value);
  }

  protected setUpdateCity(value: string): void {
    this.updateCity.set(value);
  }

  protected setUpdateState(value: string): void {
    this.updateState.set(value);
  }

  protected setUpdatePincode(value: string): void {
    this.updatePincode.set(value);
  }

  protected setUpdateTotalTowers(value: string): void {
    this.updateTotalTowers.set(value);
  }

  protected onUpdatePictureSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.updatePictureFile.set(file);
    this.replacePreviewUrl(this.updatePicturePreviewUrl, file);
  }

  protected updateBuilding(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.updateModalError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.updateModalError.set('Building id is missing.');
      return;
    }

    const name = this.updateName().trim();
    const address = this.updateAddress().trim();
    const city = this.updateCity().trim();
    const state = this.updateState().trim();
    const pincode = this.updatePincode().trim();
    const totalTowersRaw = this.updateTotalTowers().trim();

    if (!name || !address || !city || !state || !pincode) {
      this.updateModalError.set('Name, address, city, state, and pincode are required.');
      return;
    }
    if (totalTowersRaw && Number.isNaN(Number(totalTowersRaw))) {
      this.updateModalError.set('Total towers must be a number.');
      return;
    }

    this.isUpdatingBuilding.set(true);
    this.updateModalError.set(null);
    this.pageError.set(null);
    this.pageMessage.set(null);

    updateAdminBuildingApi(
      this.http,
      this.apiBaseUrl(),
      token,
      buildingId,
      {
        name,
        address,
        city,
        state,
        pincode,
        ...(totalTowersRaw ? { total_towers: Number(totalTowersRaw) } : {}),
      },
      this.updatePictureFile(),
    ).subscribe({
      next: (response) => {
        this.pageMessage.set(response.message || 'Building updated.');
        this.isUpdatingBuilding.set(false);
        this.closeUpdateModal();
        this.loadBuilding();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingBuilding.set(false);
          return;
        }

        this.updateModalError.set(this.extractErrorMessage(error, 'Failed to update building.'));
        this.isUpdatingBuilding.set(false);
      },
    });
  }

  protected deleteBuilding(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.pageError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.pageError.set('Building id is missing.');
      return;
    }

    const isConfirmed = confirm('Delete this building permanently? This will delete related towers, flats, and amenities.');
    if (!isConfirmed) {
      return;
    }

    this.isDeletingBuilding.set(true);
    this.pageError.set(null);
    this.pageMessage.set(null);

    deleteAdminBuildingApi(this.http, this.apiBaseUrl(), token, buildingId).subscribe({
      next: () => {
        this.isDeletingBuilding.set(false);
        this.router.navigateByUrl('/admins');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isDeletingBuilding.set(false);
          return;
        }

        this.pageError.set(this.extractErrorMessage(error, 'Failed to delete building.'));
        this.isDeletingBuilding.set(false);
      },
    });
  }

  protected openAddTowerModal(): void {
    this.addTowerName.set('');
    this.addTowerFloors.set('');
    this.addTowerTotalFlats.set('');
    this.addTowerPictureFile.set(null);
    this.replacePreviewUrl(this.addTowerPicturePreviewUrl, null);
    this.addTowerModalError.set(null);
    this.isAddTowerModalOpen.set(true);
  }

  protected openAddAmenityModal(): void {
    this.addAmenityName.set('');
    this.addAmenityDescription.set('');
    this.addAmenityPictureFile.set(null);
    this.replacePreviewUrl(this.addAmenityPicturePreviewUrl, null);
    this.addAmenityModalError.set(null);
    this.isAddAmenityModalOpen.set(true);
  }

  protected closeAddAmenityModal(): void {
    this.isAddAmenityModalOpen.set(false);
    this.addAmenityModalError.set(null);
    this.replacePreviewUrl(this.addAmenityPicturePreviewUrl, null);
  }

  protected setAddAmenityName(value: string): void {
    this.addAmenityName.set(value);
  }

  protected setAddAmenityDescription(value: string): void {
    this.addAmenityDescription.set(value);
  }

  protected onAddAmenityPictureSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.addAmenityPictureFile.set(file);
    this.replacePreviewUrl(this.addAmenityPicturePreviewUrl, file);
  }

  protected addAmenity(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.addAmenityModalError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.addAmenityModalError.set('Building id is missing.');
      return;
    }

    const name = this.addAmenityName().trim();
    const description = this.addAmenityDescription().trim();

    if (!name) {
      this.addAmenityModalError.set('Amenity name is required.');
      return;
    }

    this.isAddingAmenity.set(true);
    this.addAmenityModalError.set(null);
    this.pageError.set(null);
    this.pageMessage.set(null);

    createAdminAmenityApi(
      this.http,
      this.apiBaseUrl(),
      token,
      buildingId,
      {
        name,
        ...(description ? { description } : {}),
      },
      this.addAmenityPictureFile(),
    ).subscribe({
      next: (response) => {
        this.pageMessage.set(response.message || 'Amenity created.');
        this.isAddingAmenity.set(false);
        this.closeAddAmenityModal();
        if (this.isViewAmenitiesModalOpen()) {
          this.loadBuildingAmenities();
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isAddingAmenity.set(false);
          return;
        }

        this.addAmenityModalError.set(this.extractErrorMessage(error, 'Failed to create amenity.'));
        this.isAddingAmenity.set(false);
      },
    });
  }

  protected openViewAmenitiesModal(): void {
    this.isViewAmenitiesModalOpen.set(true);
    this.amenitiesModalError.set(null);
    this.amenitiesResponse.set(null);
    this.loadBuildingAmenities();
  }

  protected closeViewAmenitiesModal(): void {
    this.isViewAmenitiesModalOpen.set(false);
    this.amenitiesModalError.set(null);
  }

  protected openEditAmenityModal(amenity: AdminAmenityItemAdmins): void {
    this.editAmenityId.set(amenity.id);
    this.editAmenityName.set(amenity.name ?? '');
    this.editAmenityDescription.set(amenity.description ?? '');
    this.editAmenityPictureFile.set(null);
    this.replacePreviewUrl(this.editAmenityPicturePreviewUrl, null);
    this.editAmenityModalError.set(null);
    this.isEditAmenityModalOpen.set(true);
  }

  protected closeEditAmenityModal(): void {
    this.isEditAmenityModalOpen.set(false);
    this.isUpdatingAmenity.set(false);
    this.editAmenityModalError.set(null);
    this.editAmenityId.set(null);
    this.editAmenityPictureFile.set(null);
    this.replacePreviewUrl(this.editAmenityPicturePreviewUrl, null);
  }

  protected setEditAmenityName(value: string): void {
    this.editAmenityName.set(value);
  }

  protected setEditAmenityDescription(value: string): void {
    this.editAmenityDescription.set(value);
  }

  protected onEditAmenityPictureSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.editAmenityPictureFile.set(file);
    this.replacePreviewUrl(this.editAmenityPicturePreviewUrl, file);
  }

  protected updateAmenity(): void {
    const token = this.authState.accessToken();
    const amenityId = this.editAmenityId();
    if (!token) {
      this.editAmenityModalError.set('No active session found. Please login again.');
      return;
    }
    if (amenityId === null) {
      this.editAmenityModalError.set('Amenity id is missing.');
      return;
    }

    const name = this.editAmenityName().trim();
    const description = this.editAmenityDescription().trim();
    if (!name) {
      this.editAmenityModalError.set('Amenity name is required.');
      return;
    }

    this.isUpdatingAmenity.set(true);
    this.editAmenityModalError.set(null);
    this.amenitiesModalError.set(null);
    this.pageMessage.set(null);

    updateAdminAmenityApi(
      this.http,
      this.apiBaseUrl(),
      token,
      amenityId,
      {
        name,
        description,
      },
      this.editAmenityPictureFile(),
    ).subscribe({
      next: (response) => {
        this.pageMessage.set(response.message || 'Amenity updated.');
        this.isUpdatingAmenity.set(false);
        this.closeEditAmenityModal();
        this.loadBuildingAmenities();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingAmenity.set(false);
          return;
        }

        this.editAmenityModalError.set(this.extractErrorMessage(error, 'Failed to update amenity.'));
        this.isUpdatingAmenity.set(false);
      },
    });
  }

  protected deleteAmenity(amenityId: number): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.amenitiesModalError.set('No active session found. Please login again.');
      return;
    }

    const isConfirmed = confirm('Delete this amenity permanently?');
    if (!isConfirmed) {
      return;
    }

    this.deletingAmenityId.set(amenityId);
    this.amenitiesModalError.set(null);
    this.pageMessage.set(null);

    deleteAdminAmenityApi(this.http, this.apiBaseUrl(), token, amenityId).subscribe({
      next: (response) => {
        this.deletingAmenityId.set(null);
        this.pageMessage.set(response.message || 'Amenity deleted.');
        this.loadBuildingAmenities();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.deletingAmenityId.set(null);
          return;
        }

        this.amenitiesModalError.set(this.extractErrorMessage(error, 'Failed to delete amenity.'));
        this.deletingAmenityId.set(null);
      },
    });
  }

  protected closeAddTowerModal(): void {
    this.isAddTowerModalOpen.set(false);
    this.addTowerModalError.set(null);
    this.replacePreviewUrl(this.addTowerPicturePreviewUrl, null);
  }

  protected setAddTowerName(value: string): void {
    this.addTowerName.set(value);
  }

  protected setAddTowerFloors(value: string): void {
    this.addTowerFloors.set(value);
  }

  protected setAddTowerTotalFlats(value: string): void {
    this.addTowerTotalFlats.set(value);
  }

  protected onAddTowerPictureSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.addTowerPictureFile.set(file);
    this.replacePreviewUrl(this.addTowerPicturePreviewUrl, file);
  }

  protected addTower(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.addTowerModalError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.addTowerModalError.set('Building id is missing.');
      return;
    }

    const name = this.addTowerName().trim();
    const floorsRaw = this.addTowerFloors().trim();
    const totalFlatsRaw = this.addTowerTotalFlats().trim();

    if (!name || !floorsRaw) {
      this.addTowerModalError.set('Tower name and floors are required.');
      return;
    }
    if (name.length > 50) {
      this.addTowerModalError.set('Tower name must be at most 50 characters.');
      return;
    }

    const floorsNumber = Number(floorsRaw);
    if (!Number.isInteger(floorsNumber) || floorsNumber <= 0) {
      this.addTowerModalError.set('Floors must be a positive whole number.');
      return;
    }

    let totalFlatsNumber: number | null = null;
    if (totalFlatsRaw) {
      totalFlatsNumber = Number(totalFlatsRaw);
      if (!Number.isInteger(totalFlatsNumber) || totalFlatsNumber < 0) {
        this.addTowerModalError.set('Total flats must be a whole number (0 or more).');
        return;
      }
    }

    if (totalFlatsNumber !== null && totalFlatsNumber < floorsNumber) {
      this.addTowerModalError.set('Total flats should be greater than or equal to floors.');
      return;
    }

    this.isAddingTower.set(true);
    this.addTowerModalError.set(null);
    this.pageError.set(null);
    this.pageMessage.set(null);

    createAdminTowerApi(
      this.http,
      this.apiBaseUrl(),
      token,
      buildingId,
      {
        name,
        floors: floorsNumber,
        ...(totalFlatsNumber !== null ? { total_flats: totalFlatsNumber } : {}),
      },
      this.addTowerPictureFile(),
    ).subscribe({
      next: (response) => {
        this.pageMessage.set(response.message || 'Tower created.');
        this.isAddingTower.set(false);
        this.closeAddTowerModal();
        this.loadBuildingTowers();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isAddingTower.set(false);
          return;
        }

        this.addTowerModalError.set(this.extractErrorMessage(error, 'Failed to create tower.'));
        this.isAddingTower.set(false);
      },
    });
  }

  protected openImagePreview(imageUrl: string): void {
    this.imagePreviewState.open(imageUrl);
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

  private resetRouteScopedState(): void {
    this.isLoading.set(false);
    this.isLoadingTowers.set(false);
    this.pageError.set(null);
    this.towersError.set(null);
    this.pageMessage.set(null);
    this.buildingResponse.set(null);
    this.towersResponse.set(null);
    this.amenitiesResponse.set(null);
    this.isUpdateModalOpen.set(false);
    this.isAddTowerModalOpen.set(false);
    this.isAddAmenityModalOpen.set(false);
    this.isViewAmenitiesModalOpen.set(false);
    this.isEditAmenityModalOpen.set(false);
    this.isLoadingAmenities.set(false);
    this.amenitiesModalError.set(null);
    this.editAmenityId.set(null);
  }
}
