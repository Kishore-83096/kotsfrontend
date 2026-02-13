import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ImagePreviewState } from '../../shared/image_preview_state';
import { getUsersTowerDetailApi, getUsersTowerFlatsApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import { UserFlatListItemUsers, UsersTowerDetailResponseEnvelopeUsers, UsersTowerFlatsResponseEnvelopeUsers } from '../typescript_users/type_users';

@Component({
  selector: 'app-page-users-tower-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page_users_tower_detail.html',
  styleUrl: './page_users_tower_detail.css',
})
export class PageUsersTowerDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authState = inject(UsersAuthState);
  private readonly imagePreviewState = inject(ImagePreviewState);

  protected readonly apiBaseUrl = signal('http://127.0.0.1:5000');
  protected readonly buildingId = signal<number | null>(null);
  protected readonly towerId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly detailResponse = signal<UsersTowerDetailResponseEnvelopeUsers | null>(null);
  protected readonly flatsResponse = signal<UsersTowerFlatsResponseEnvelopeUsers | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const buildingId = Number(params.get('buildingId'));
      const towerId = Number(params.get('towerId'));

      if (!Number.isFinite(buildingId) || buildingId <= 0 || !Number.isFinite(towerId) || towerId <= 0) {
        this.error.set('Invalid building or tower id.');
        this.buildingId.set(null);
        this.towerId.set(null);
        this.detailResponse.set(null);
        this.flatsResponse.set(null);
        this.isLoading.set(false);
        return;
      }

      this.buildingId.set(buildingId);
      this.towerId.set(towerId);
      this.detailResponse.set(null);
      this.flatsResponse.set(null);
      this.error.set(null);
      this.loadTowerDetail();
    });
  }

  protected loadTowerDetail(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    const towerId = this.towerId();

    if (!token) {
      this.error.set('No active session found. Please login again.');
      return;
    }
    if (!buildingId || !towerId) {
      this.error.set('Invalid building or tower id.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.detailResponse.set(null);
    this.flatsResponse.set(null);

    forkJoin({
      detail: getUsersTowerDetailApi(this.http, this.apiBaseUrl(), token, buildingId, towerId),
      flats: getUsersTowerFlatsApi(this.http, this.apiBaseUrl(), token, buildingId, towerId),
    }).subscribe({
      next: (response) => {
        this.detailResponse.set(response.detail);
        this.flatsResponse.set(response.flats);
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

        this.error.set('Failed to fetch tower details.');
        this.isLoading.set(false);
      },
    });
  }

  protected tower() {
    return this.detailResponse()?.data?.tower ?? null;
  }

  protected building() {
    return this.detailResponse()?.data?.building ?? null;
  }

  protected flatsData(): UserFlatListItemUsers[] {
    return this.flatsResponse()?.data?.items ?? [];
  }

  protected openFlatDetail(flatId: number): void {
    const buildingId = this.buildingId();
    const towerId = this.towerId();
    if (!buildingId || !towerId) {
      return;
    }

    this.router.navigateByUrl(`/users/buildings/${buildingId}/towers/${towerId}/flats/${flatId}`);
  }

  protected openImagePreview(imageUrl: string): void {
    this.imagePreviewState.open(imageUrl);
  }
}
