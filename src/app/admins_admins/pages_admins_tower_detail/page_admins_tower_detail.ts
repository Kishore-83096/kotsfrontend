import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  createAdminFlatApi,
  deleteAdminFlatApi,
  deleteAdminTowerApi,
  getAdminBuildingAmenitiesApi,
  getAdminFlatByIdApi,
  getAdminTowerByIdApi,
  getAdminTowerFlatsApi,
  setAdminFlatAmenitiesApi,
  updateAdminFlatApi,
  updateAdminTowerApi,
} from '../api_admins';
import { UsersAuthState } from '../../users_users/state_users_auth';
import {
  AdminAmenityItemAdmins,
  AdminFlatItemAdmins,
  AdminFlatDetailResponseEnvelopeAdmins,
  AdminTowerDetailResponseEnvelopeAdmins,
  AdminTowerFlatsResponseEnvelopeAdmins,
} from '../typescript_admins/type_admins';
import { ImagePreviewState } from '../../shared/image_preview_state';

@Component({
  selector: 'app-page-admins-tower-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page_admins_tower_detail.html',
  styleUrl: './page_admins_tower_detail.css',
})
export class PageAdminsTowerDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authState = inject(UsersAuthState);
  private readonly imagePreviewState = inject(ImagePreviewState);

  protected readonly apiBaseUrl = signal('http://127.0.0.1:5000');
  protected readonly buildingId = signal<number | null>(null);
  protected readonly towerId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingFlats = signal(false);
  protected readonly pageError = signal<string | null>(null);
  protected readonly flatsError = signal<string | null>(null);
  protected readonly pageMessage = signal<string | null>(null);
  protected readonly isDeletingTower = signal(false);
  protected readonly deletingFlatId = signal<number | null>(null);
  protected readonly towerResponse = signal<AdminTowerDetailResponseEnvelopeAdmins | null>(null);
  protected readonly flatsResponse = signal<AdminTowerFlatsResponseEnvelopeAdmins | null>(null);
  protected readonly selectedFlatResponse = signal<AdminFlatDetailResponseEnvelopeAdmins | null>(null);

  protected readonly isViewFlatModalOpen = signal(false);
  protected readonly isLoadingFlatDetail = signal(false);
  protected readonly flatDetailModalError = signal<string | null>(null);

  protected readonly isUpdateTowerModalOpen = signal(false);
  protected readonly isUpdatingTower = signal(false);
  protected readonly updateTowerModalError = signal<string | null>(null);
  protected readonly updateTowerName = signal('');
  protected readonly updateTowerFloors = signal('');
  protected readonly updateTowerTotalFlats = signal('');
  protected readonly updateTowerPictureFile = signal<File | null>(null);
  protected readonly updateTowerPicturePreviewUrl = signal<string | null>(null);

  protected readonly isAddFlatModalOpen = signal(false);
  protected readonly isAddingFlat = signal(false);
  protected readonly addFlatModalError = signal<string | null>(null);
  protected readonly addFlatNumber = signal('');
  protected readonly addFloorNumber = signal('');
  protected readonly addBhkType = signal('');
  protected readonly addAreaSqft = signal('');
  protected readonly addRentAmount = signal('');
  protected readonly addSecurityDeposit = signal('');
  protected readonly addIsAvailable = signal(true);
  protected readonly addFlatPictureFile = signal<File | null>(null);
  protected readonly addFlatPicturePreviewUrl = signal<string | null>(null);

  protected readonly isUpdateFlatModalOpen = signal(false);
  protected readonly isUpdatingFlat = signal(false);
  protected readonly updateFlatModalError = signal<string | null>(null);
  protected readonly updateFlatId = signal<number | null>(null);
  protected readonly updateFlatNumber = signal('');
  protected readonly updateFlatFloorNumber = signal('');
  protected readonly updateFlatBhkType = signal('');
  protected readonly updateFlatAreaSqft = signal('');
  protected readonly updateFlatRentAmount = signal('');
  protected readonly updateFlatSecurityDeposit = signal('');
  protected readonly updateFlatIsAvailable = signal(true);
  protected readonly updateFlatPictureFile = signal<File | null>(null);
  protected readonly updateFlatPicturePreviewUrl = signal<string | null>(null);

  protected readonly isLinkAmenitiesModalOpen = signal(false);
  protected readonly isLoadingLinkAmenities = signal(false);
  protected readonly isLinkingAmenities = signal(false);
  protected readonly linkAmenitiesModalError = signal<string | null>(null);
  protected readonly linkAmenitiesFlatId = signal<number | null>(null);
  protected readonly linkAmenitiesList = signal<AdminAmenityItemAdmins[]>([]);
  protected readonly selectedAmenityIds = signal<number[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const rawBuildingId = params.get('buildingId');
      const rawTowerId = params.get('towerId');
      const parsedBuildingId = rawBuildingId ? Number(rawBuildingId) : NaN;
      const parsedTowerId = rawTowerId ? Number(rawTowerId) : NaN;

      if (Number.isNaN(parsedBuildingId) || Number.isNaN(parsedTowerId)) {
        this.pageError.set('Invalid building id or tower id in route.');
        this.buildingId.set(null);
        this.towerId.set(null);
        this.resetRouteScopedState();
        return;
      }

      this.buildingId.set(parsedBuildingId);
      this.towerId.set(parsedTowerId);
      this.resetRouteScopedState();
      this.loadTower();
      this.loadFlats();
    });
  }

  protected loadTower(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    const towerId = this.towerId();

    if (!token) {
      this.pageError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null || towerId === null) {
      this.pageError.set('Building id or tower id is missing.');
      return;
    }

    this.isLoading.set(true);
    this.pageError.set(null);
    this.pageMessage.set(null);
    this.towerResponse.set(null);

    getAdminTowerByIdApi(this.http, this.apiBaseUrl(), token, buildingId, towerId).subscribe({
      next: (response) => {
        this.towerResponse.set(response);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoading.set(false);
          return;
        }

        this.pageError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/buildings/{building_id}/towers/{tower_id}.'));
        this.isLoading.set(false);
      },
    });
  }

  protected flatsData(): AdminFlatItemAdmins[] {
    return this.flatsResponse()?.data ?? [];
  }

  protected loadFlats(): void {
    const token = this.authState.accessToken();
    const towerId = this.towerId();

    if (!token) {
      this.flatsError.set('No active session found. Please login again.');
      return;
    }
    if (towerId === null) {
      this.flatsError.set('Tower id is missing.');
      return;
    }

    this.isLoadingFlats.set(true);
    this.flatsError.set(null);
    this.flatsResponse.set(null);

    getAdminTowerFlatsApi(this.http, this.apiBaseUrl(), token, towerId).subscribe({
      next: (response) => {
        this.flatsResponse.set(response);
        this.isLoadingFlats.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingFlats.set(false);
          return;
        }

        this.flatsError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/towers/{tower_id}/flats.'));
        this.isLoadingFlats.set(false);
      },
    });
  }

  protected openViewFlatModal(flatId: number): void {
    this.isViewFlatModalOpen.set(true);
    this.flatDetailModalError.set(null);
    this.selectedFlatResponse.set(null);
    this.fetchFlatDetail(flatId);
  }

  protected closeViewFlatModal(): void {
    this.isViewFlatModalOpen.set(false);
    this.isLoadingFlatDetail.set(false);
    this.flatDetailModalError.set(null);
    this.selectedFlatResponse.set(null);
  }

  protected flatDetail(): AdminFlatItemAdmins | null {
    return this.selectedFlatResponse()?.data ?? null;
  }

  private fetchFlatDetail(flatId: number, onSuccess?: (flat: AdminFlatItemAdmins) => void): void {
    const token = this.authState.accessToken();
    const towerId = this.towerId();
    if (!token) {
      this.flatDetailModalError.set('No active session found. Please login again.');
      return;
    }
    if (towerId === null) {
      this.flatDetailModalError.set('Tower id is missing.');
      return;
    }

    this.isLoadingFlatDetail.set(true);
    this.flatDetailModalError.set(null);
    this.selectedFlatResponse.set(null);

    getAdminFlatByIdApi(this.http, this.apiBaseUrl(), token, towerId, flatId).subscribe({
      next: (response) => {
        this.selectedFlatResponse.set(response);
        this.isLoadingFlatDetail.set(false);
        if (onSuccess) {
          onSuccess(response.data);
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingFlatDetail.set(false);
          return;
        }
        this.flatDetailModalError.set(this.extractErrorMessage(error, 'Failed to fetch /admins/towers/{tower_id}/flats/{flat_id}.'));
        this.isLoadingFlatDetail.set(false);
      },
    });
  }

  protected openUpdateTowerModal(): void {
    const tower = this.towerResponse()?.data;
    if (!tower) {
      return;
    }

    this.updateTowerName.set(tower.name ?? '');
    this.updateTowerFloors.set(String(tower.floors ?? ''));
    this.updateTowerTotalFlats.set(String(tower.total_flats ?? ''));
    this.updateTowerPictureFile.set(null);
    this.replacePreviewUrl(this.updateTowerPicturePreviewUrl, null);
    this.updateTowerModalError.set(null);
    this.isUpdateTowerModalOpen.set(true);
  }

  protected closeUpdateTowerModal(): void {
    this.isUpdateTowerModalOpen.set(false);
    this.updateTowerModalError.set(null);
    this.replacePreviewUrl(this.updateTowerPicturePreviewUrl, null);
  }

  protected setUpdateTowerName(value: string): void {
    this.updateTowerName.set(value);
  }

  protected setUpdateTowerFloors(value: string): void {
    this.updateTowerFloors.set(value);
  }

  protected setUpdateTowerTotalFlats(value: string): void {
    this.updateTowerTotalFlats.set(value);
  }

  protected onUpdateTowerPictureSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.updateTowerPictureFile.set(file);
    this.replacePreviewUrl(this.updateTowerPicturePreviewUrl, file);
  }

  protected updateTower(): void {
    const token = this.authState.accessToken();
    const towerId = this.towerId();
    if (!token) {
      this.updateTowerModalError.set('No active session found. Please login again.');
      return;
    }
    if (towerId === null) {
      this.updateTowerModalError.set('Tower id is missing.');
      return;
    }

    const name = this.updateTowerName().trim();
    const floorsRaw = this.updateTowerFloors().trim();
    const totalFlatsRaw = this.updateTowerTotalFlats().trim();

    if (!name || !floorsRaw) {
      this.updateTowerModalError.set('Tower name and floors are required.');
      return;
    }
    if (name.length > 50) {
      this.updateTowerModalError.set('Tower name must be at most 50 characters.');
      return;
    }

    const floorsNumber = Number(floorsRaw);
    if (!Number.isInteger(floorsNumber) || floorsNumber <= 0) {
      this.updateTowerModalError.set('Floors must be a positive whole number.');
      return;
    }

    let totalFlatsNumber: number | null = null;
    if (totalFlatsRaw) {
      totalFlatsNumber = Number(totalFlatsRaw);
      if (!Number.isInteger(totalFlatsNumber) || totalFlatsNumber < 0) {
        this.updateTowerModalError.set('Total flats must be a whole number (0 or more).');
        return;
      }
    }

    this.isUpdatingTower.set(true);
    this.updateTowerModalError.set(null);
    this.pageError.set(null);
    this.pageMessage.set(null);

    updateAdminTowerApi(
      this.http,
      this.apiBaseUrl(),
      token,
      towerId,
      {
        name,
        floors: floorsNumber,
        ...(totalFlatsNumber !== null ? { total_flats: totalFlatsNumber } : {}),
      },
      this.updateTowerPictureFile(),
    ).subscribe({
      next: (response) => {
        this.pageMessage.set(response.message || 'Tower updated.');
        this.isUpdatingTower.set(false);
        this.closeUpdateTowerModal();
        this.loadTower();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingTower.set(false);
          return;
        }

        this.updateTowerModalError.set(this.extractErrorMessage(error, 'Failed to update tower.'));
        this.isUpdatingTower.set(false);
      },
    });
  }

  protected deleteTower(): void {
    const token = this.authState.accessToken();
    const towerId = this.towerId();
    const buildingId = this.buildingId();

    if (!token) {
      this.pageError.set('No active session found. Please login again.');
      return;
    }
    if (towerId === null || buildingId === null) {
      this.pageError.set('Tower id or building id is missing.');
      return;
    }

    const isConfirmed = confirm('Delete this tower permanently? This will delete related flats.');
    if (!isConfirmed) {
      return;
    }

    this.isDeletingTower.set(true);
    this.pageError.set(null);
    this.pageMessage.set(null);

    deleteAdminTowerApi(this.http, this.apiBaseUrl(), token, towerId).subscribe({
      next: () => {
        this.isDeletingTower.set(false);
        this.router.navigateByUrl(`/admins/buildings/${buildingId}`);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isDeletingTower.set(false);
          return;
        }

        this.pageError.set(this.extractErrorMessage(error, 'Failed to delete tower.'));
        this.isDeletingTower.set(false);
      },
    });
  }

  protected openAddFlatModal(): void {
    this.addFlatNumber.set('');
    this.addFloorNumber.set('');
    this.addBhkType.set('');
    this.addAreaSqft.set('');
    this.addRentAmount.set('');
    this.addSecurityDeposit.set('');
    this.addIsAvailable.set(true);
    this.addFlatPictureFile.set(null);
    this.replacePreviewUrl(this.addFlatPicturePreviewUrl, null);
    this.addFlatModalError.set(null);
    this.isAddFlatModalOpen.set(true);
  }

  protected closeAddFlatModal(): void {
    this.isAddFlatModalOpen.set(false);
    this.addFlatModalError.set(null);
    this.replacePreviewUrl(this.addFlatPicturePreviewUrl, null);
  }

  protected setAddFlatNumber(value: string): void {
    this.addFlatNumber.set(value);
  }

  protected setAddFloorNumber(value: string): void {
    this.addFloorNumber.set(value);
  }

  protected setAddBhkType(value: string): void {
    this.addBhkType.set(value);
  }

  protected setAddAreaSqft(value: string): void {
    this.addAreaSqft.set(value);
  }

  protected setAddRentAmount(value: string): void {
    this.addRentAmount.set(value);
  }

  protected setAddSecurityDeposit(value: string): void {
    this.addSecurityDeposit.set(value);
  }

  protected setAddIsAvailable(value: boolean): void {
    this.addIsAvailable.set(value);
  }

  protected onAddFlatPictureSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.addFlatPictureFile.set(file);
    this.replacePreviewUrl(this.addFlatPicturePreviewUrl, file);
  }

  protected addFlat(): void {
    const token = this.authState.accessToken();
    const towerId = this.towerId();
    if (!token) {
      this.addFlatModalError.set('No active session found. Please login again.');
      return;
    }
    if (towerId === null) {
      this.addFlatModalError.set('Tower id is missing.');
      return;
    }

    const flatNumber = this.addFlatNumber().trim();
    const floorRaw = this.addFloorNumber().trim();
    const bhkType = this.addBhkType().trim();
    const areaRaw = this.addAreaSqft().trim();
    const rentRaw = this.addRentAmount().trim();
    const depositRaw = this.addSecurityDeposit().trim();

    if (!flatNumber || !floorRaw || !bhkType || !areaRaw || !rentRaw || !depositRaw) {
      this.addFlatModalError.set('Flat number, floor number, BHK type, area, rent, and deposit are required.');
      return;
    }

    const floorNumber = Number(floorRaw);
    const areaSqft = Number(areaRaw);
    const rentAmount = Number(rentRaw);
    const securityDeposit = Number(depositRaw);

    if (!Number.isInteger(floorNumber) || floorNumber < 0) {
      this.addFlatModalError.set('Floor number must be a whole number (0 or more).');
      return;
    }
    if (!Number.isInteger(areaSqft) || areaSqft <= 0) {
      this.addFlatModalError.set('Area sqft must be a positive whole number.');
      return;
    }
    if (Number.isNaN(rentAmount) || rentAmount < 0) {
      this.addFlatModalError.set('Rent amount must be a valid number (0 or more).');
      return;
    }
    if (Number.isNaN(securityDeposit) || securityDeposit < 0) {
      this.addFlatModalError.set('Security deposit must be a valid number (0 or more).');
      return;
    }

    this.isAddingFlat.set(true);
    this.addFlatModalError.set(null);
    this.pageError.set(null);
    this.pageMessage.set(null);

    createAdminFlatApi(
      this.http,
      this.apiBaseUrl(),
      token,
      towerId,
      {
        flat_number: flatNumber,
        floor_number: floorNumber,
        bhk_type: bhkType,
        area_sqft: areaSqft,
        rent_amount: rentAmount,
        security_deposit: securityDeposit,
        is_available: this.addIsAvailable(),
      },
      this.addFlatPictureFile(),
    ).subscribe({
      next: (response) => {
        this.pageMessage.set(response.message || 'Flat created.');
        this.isAddingFlat.set(false);
        this.closeAddFlatModal();
        this.loadFlats();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isAddingFlat.set(false);
          return;
        }

        this.addFlatModalError.set(this.extractErrorMessage(error, 'Failed to create flat.'));
        this.isAddingFlat.set(false);
      },
    });
  }

  protected openUpdateFlatModal(flatId: number): void {
    this.isUpdateFlatModalOpen.set(true);
    this.updateFlatModalError.set(null);
    this.updateFlatPictureFile.set(null);
    this.replacePreviewUrl(this.updateFlatPicturePreviewUrl, null);
    this.updateFlatId.set(flatId);
    this.fetchFlatDetail(flatId, (flat) => this.hydrateUpdateFlatForm(flat));
  }

  protected closeUpdateFlatModal(): void {
    this.isUpdateFlatModalOpen.set(false);
    this.updateFlatModalError.set(null);
    this.updateFlatPictureFile.set(null);
    this.replacePreviewUrl(this.updateFlatPicturePreviewUrl, null);
    this.updateFlatId.set(null);
  }

  protected setUpdateFlatNumber(value: string): void {
    this.updateFlatNumber.set(value);
  }

  protected setUpdateFlatFloorNumber(value: string): void {
    this.updateFlatFloorNumber.set(value);
  }

  protected setUpdateFlatBhkType(value: string): void {
    this.updateFlatBhkType.set(value);
  }

  protected setUpdateFlatAreaSqft(value: string): void {
    this.updateFlatAreaSqft.set(value);
  }

  protected setUpdateFlatRentAmount(value: string): void {
    this.updateFlatRentAmount.set(value);
  }

  protected setUpdateFlatSecurityDeposit(value: string): void {
    this.updateFlatSecurityDeposit.set(value);
  }

  protected setUpdateFlatIsAvailable(value: boolean): void {
    this.updateFlatIsAvailable.set(value);
  }

  protected onUpdateFlatPictureSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.updateFlatPictureFile.set(file);
    this.replacePreviewUrl(this.updateFlatPicturePreviewUrl, file);
  }

  protected updateFlat(): void {
    const token = this.authState.accessToken();
    const flatId = this.updateFlatId();
    if (!token) {
      this.updateFlatModalError.set('No active session found. Please login again.');
      return;
    }
    if (flatId === null) {
      this.updateFlatModalError.set('Flat id is missing.');
      return;
    }

    const flatNumber = this.updateFlatNumber().trim();
    const floorRaw = this.updateFlatFloorNumber().trim();
    const bhkType = this.updateFlatBhkType().trim();
    const areaRaw = this.updateFlatAreaSqft().trim();
    const rentRaw = this.updateFlatRentAmount().trim();
    const depositRaw = this.updateFlatSecurityDeposit().trim();

    if (!flatNumber || !floorRaw || !bhkType || !areaRaw || !rentRaw || !depositRaw) {
      this.updateFlatModalError.set('Flat number, floor number, BHK type, area, rent, and deposit are required.');
      return;
    }

    const floorNumber = Number(floorRaw);
    const areaSqft = Number(areaRaw);
    const rentAmount = Number(rentRaw);
    const securityDeposit = Number(depositRaw);

    if (!Number.isInteger(floorNumber) || floorNumber < 0) {
      this.updateFlatModalError.set('Floor number must be a whole number (0 or more).');
      return;
    }
    if (!Number.isInteger(areaSqft) || areaSqft <= 0) {
      this.updateFlatModalError.set('Area sqft must be a positive whole number.');
      return;
    }
    if (Number.isNaN(rentAmount) || rentAmount < 0) {
      this.updateFlatModalError.set('Rent amount must be a valid number (0 or more).');
      return;
    }
    if (Number.isNaN(securityDeposit) || securityDeposit < 0) {
      this.updateFlatModalError.set('Security deposit must be a valid number (0 or more).');
      return;
    }

    this.isUpdatingFlat.set(true);
    this.updateFlatModalError.set(null);
    this.pageError.set(null);
    this.pageMessage.set(null);

    updateAdminFlatApi(
      this.http,
      this.apiBaseUrl(),
      token,
      flatId,
      {
        flat_number: flatNumber,
        floor_number: floorNumber,
        bhk_type: bhkType,
        area_sqft: areaSqft,
        rent_amount: rentAmount,
        security_deposit: securityDeposit,
        is_available: this.updateFlatIsAvailable(),
      },
      this.updateFlatPictureFile(),
    ).subscribe({
      next: (response) => {
        this.pageMessage.set(response.message || 'Flat updated.');
        this.isUpdatingFlat.set(false);
        this.closeUpdateFlatModal();
        this.loadFlats();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingFlat.set(false);
          return;
        }

        this.updateFlatModalError.set(this.extractErrorMessage(error, 'Failed to update flat.'));
        this.isUpdatingFlat.set(false);
      },
    });
  }

  protected deleteFlat(flatId: number): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.pageError.set('No active session found. Please login again.');
      return;
    }

    const isConfirmed = confirm('Delete this flat permanently?');
    if (!isConfirmed) {
      return;
    }

    this.deletingFlatId.set(flatId);
    this.pageError.set(null);
    this.pageMessage.set(null);

    deleteAdminFlatApi(this.http, this.apiBaseUrl(), token, flatId).subscribe({
      next: () => {
        this.deletingFlatId.set(null);
        this.pageMessage.set('Flat deleted.');
        this.loadFlats();
        if (this.flatDetail()?.id === flatId) {
          this.closeViewFlatModal();
        }
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.deletingFlatId.set(null);
          return;
        }

        this.pageError.set(this.extractErrorMessage(error, 'Failed to delete flat.'));
        this.deletingFlatId.set(null);
      },
    });
  }

  protected openLinkAmenitiesModal(flatId: number): void {
    const currentFlat = this.flatsData().find((flat) => flat.id === flatId);
    const existingAmenityIds = currentFlat?.amenity_ids ?? [];
    this.linkAmenitiesFlatId.set(flatId);
    this.selectedAmenityIds.set([...existingAmenityIds]);
    this.linkAmenitiesList.set([]);
    this.linkAmenitiesModalError.set(null);
    this.isLinkAmenitiesModalOpen.set(true);
    this.loadBuildingAmenitiesForLinking();
  }

  protected closeLinkAmenitiesModal(): void {
    this.isLinkAmenitiesModalOpen.set(false);
    this.isLoadingLinkAmenities.set(false);
    this.isLinkingAmenities.set(false);
    this.linkAmenitiesModalError.set(null);
    this.linkAmenitiesFlatId.set(null);
    this.linkAmenitiesList.set([]);
    this.selectedAmenityIds.set([]);
  }

  protected isAmenitySelected(amenityId: number): boolean {
    return this.selectedAmenityIds().includes(amenityId);
  }

  protected selectedAmenityNames(): string[] {
    const selectedIds = this.selectedAmenityIds();
    const amenities = this.linkAmenitiesList();
    return amenities.filter((amenity) => selectedIds.includes(amenity.id)).map((amenity) => amenity.name);
  }

  protected toggleAmenitySelection(amenityId: number, checked: boolean): void {
    const current = this.selectedAmenityIds();
    if (checked) {
      if (!current.includes(amenityId)) {
        this.selectedAmenityIds.set([...current, amenityId]);
      }
      return;
    }
    this.selectedAmenityIds.set(current.filter((id) => id !== amenityId));
  }

  protected linkSelectedAmenitiesToFlat(): void {
    const token = this.authState.accessToken();
    const flatId = this.linkAmenitiesFlatId();
    if (!token) {
      this.linkAmenitiesModalError.set('No active session found. Please login again.');
      return;
    }
    if (flatId === null) {
      this.linkAmenitiesModalError.set('Flat id is missing.');
      return;
    }

    const amenityIds = this.selectedAmenityIds();
    if (!amenityIds.length) {
      this.linkAmenitiesModalError.set('Select at least one amenity.');
      return;
    }

    this.isLinkingAmenities.set(true);
    this.linkAmenitiesModalError.set(null);
    this.pageMessage.set(null);

    setAdminFlatAmenitiesApi(this.http, this.apiBaseUrl(), token, flatId, { amenity_ids: amenityIds }).subscribe({
      next: (response) => {
        this.isLinkingAmenities.set(false);
        this.pageMessage.set(response.message || 'Flat amenities linked.');
        const flatsEnvelope = this.flatsResponse();
        if (flatsEnvelope?.data) {
          const updatedFlats = flatsEnvelope.data.map((flat) =>
            flat.id === flatId ? { ...flat, amenity_ids: [...amenityIds] } : flat,
          );
          this.flatsResponse.set({ ...flatsEnvelope, data: updatedFlats });
        }
        this.closeLinkAmenitiesModal();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLinkingAmenities.set(false);
          return;
        }

        this.linkAmenitiesModalError.set(this.extractErrorMessage(error, 'Failed to link amenities to flat.'));
        this.isLinkingAmenities.set(false);
      },
    });
  }

  protected openImagePreview(imageUrl: string): void {
    this.imagePreviewState.open(imageUrl);
  }

  private loadBuildingAmenitiesForLinking(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    if (!token) {
      this.linkAmenitiesModalError.set('No active session found. Please login again.');
      return;
    }
    if (buildingId === null) {
      this.linkAmenitiesModalError.set('Building id is missing.');
      return;
    }

    this.isLoadingLinkAmenities.set(true);
    this.linkAmenitiesModalError.set(null);

    getAdminBuildingAmenitiesApi(this.http, this.apiBaseUrl(), token, buildingId).subscribe({
      next: (response) => {
        this.linkAmenitiesList.set(response.data ?? []);
        this.isLoadingLinkAmenities.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingLinkAmenities.set(false);
          return;
        }
        this.linkAmenitiesModalError.set(this.extractErrorMessage(error, 'Failed to fetch building amenities.'));
        this.isLoadingLinkAmenities.set(false);
      },
    });
  }

  private hydrateUpdateFlatForm(flat: AdminFlatItemAdmins): void {
    this.updateFlatId.set(flat.id);
    this.updateFlatNumber.set(flat.flat_number ?? '');
    this.updateFlatFloorNumber.set(String(flat.floor_number ?? ''));
    this.updateFlatBhkType.set(flat.bhk_type ?? '');
    this.updateFlatAreaSqft.set(String(flat.area_sqft ?? ''));
    this.updateFlatRentAmount.set(String(flat.rent_amount ?? ''));
    this.updateFlatSecurityDeposit.set(String(flat.security_deposit ?? ''));
    this.updateFlatIsAvailable.set(Boolean(flat.is_available));
    this.updateFlatPictureFile.set(null);
    this.replacePreviewUrl(this.updateFlatPicturePreviewUrl, null);
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
    this.isLoadingFlats.set(false);
    this.pageError.set(null);
    this.flatsError.set(null);
    this.pageMessage.set(null);
    this.towerResponse.set(null);
    this.flatsResponse.set(null);
    this.selectedFlatResponse.set(null);
    this.isViewFlatModalOpen.set(false);
    this.isUpdateTowerModalOpen.set(false);
    this.isAddFlatModalOpen.set(false);
    this.isUpdateFlatModalOpen.set(false);
    this.isLinkAmenitiesModalOpen.set(false);
    this.flatDetailModalError.set(null);
    this.updateTowerModalError.set(null);
    this.addFlatModalError.set(null);
    this.updateFlatModalError.set(null);
    this.linkAmenitiesModalError.set(null);
    this.isLoadingFlatDetail.set(false);
    this.isLoadingLinkAmenities.set(false);
    this.isLinkingAmenities.set(false);
    this.linkAmenitiesFlatId.set(null);
    this.linkAmenitiesList.set([]);
    this.selectedAmenityIds.set([]);
  }
}
