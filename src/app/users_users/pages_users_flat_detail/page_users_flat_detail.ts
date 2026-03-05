import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  createUsersFlatBookingApi,
  getUsersBookingsApi,
  getUsersBuildingFlatsApi,
  getUsersFlatDetailApi,
  getUsersFlatPicturesApi,
} from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import { toUserErrorMessage } from '../../shared/api_error_message';
import { ImagePreviewState } from '../../shared/image_preview_state';
import {
  BuildingAmenityUsers,
  UsersFlatSearchItemUsers,
  UsersCreateBookingResponseEnvelopeUsers,
  UsersFlatDetailResponseEnvelopeUsers,
  UserFlatPictureItemUsers,
  UsersFlatPicturesResponseEnvelopeUsers,
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
  private readonly imagePreviewState = inject(ImagePreviewState);

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly buildingId = signal<number | null>(null);
  protected readonly towerId = signal<number | null>(null);
  protected readonly flatId = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly detailResponse = signal<UsersFlatDetailResponseEnvelopeUsers | null>(null);
  protected readonly flatPicturesResponse = signal<UsersFlatPicturesResponseEnvelopeUsers | null>(null);
  protected readonly isLoadingFlatPictures = signal(false);
  protected readonly flatPicturesError = signal<string | null>(null);
  protected readonly isBookingModalOpen = signal(false);
  protected readonly isAuthRequiredModalOpen = signal(false);
  protected readonly isBookingSubmitting = signal(false);
  protected readonly bookingError = signal<string | null>(null);
  protected readonly bookingSuccess = signal<string | null>(null);
  protected readonly bookingResponse = signal<UsersCreateBookingResponseEnvelopeUsers | null>(null);
  protected readonly hasAlreadyBookedThisFlat = signal(false);
  protected readonly isAmenityModalOpen = signal(false);
  protected readonly selectedAmenity = signal<BuildingAmenityUsers | null>(null);
  protected readonly similarFlats = signal<UsersFlatSearchItemUsers[]>([]);
  protected readonly isLoadingSimilarFlats = signal(false);
  protected readonly similarFlatsError = signal<string | null>(null);
  protected readonly galleryIndex = signal(0);
  protected readonly loadedGalleryImageMap = signal<Record<string, true>>({});
  protected readonly shouldShowGalleryImagePlaceholder = computed(() => {
    if (this.isLoading() || this.isLoadingFlatPictures()) {
      return true;
    }
    const current = this.currentGalleryPicture();
    if (!current) {
      return false;
    }
    const url = (current.picture_url ?? '').trim();
    if (!url) {
      return false;
    }
    return !Boolean(this.loadedGalleryImageMap()[url]);
  });
  @ViewChild('flatCarouselList') private flatCarouselList?: ElementRef<HTMLElement>;
  @ViewChildren('flatCarouselSlide') private flatCarouselSlides?: QueryList<ElementRef<HTMLElement>>;

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
      this.similarFlats.set([]);
      this.similarFlatsError.set(null);
      this.isLoadingSimilarFlats.set(false);
      this.galleryIndex.set(0);
      this.loadedGalleryImageMap.set({});
      this.loadFlatDetail();
      this.loadFlatPictures();
      this.loadSimilarFlatsForBuilding();
      this.loadBookingState();
    });
  }

  protected loadFlatDetail(): void {
    const buildingId = this.buildingId();
    const towerId = this.towerId();
    const flatId = this.flatId();

    if (!buildingId || !towerId || !flatId) {
      this.error.set('Invalid building, tower, or flat id.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.detailResponse.set(null);

    getUsersFlatDetailApi(this.http, this.apiBaseUrl(), null, buildingId, towerId, flatId).subscribe({
      next: (response) => {
        this.detailResponse.set(response);
        this.ensureGalleryIndexInRange();
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load flat details right now.',
          }),
        );
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

  protected managerName(): string {
    const data = this.detailResponse()?.data;
    const value =
      data?.manager?.username ??
      data?.manager?.name ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['manager', 'username']) ??
      data?.admin?.name ??
      data?.admin_name ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['admin', 'username']);

    return this.normalizeContactValue(value);
  }

  protected managerEmail(): string {
    const data = this.detailResponse()?.data;
    const value =
      data?.manager?.email ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['manager', 'email']) ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['admin', 'email']) ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['building', 'admin_email']) ??
      this.pickTopLevelString(data as Record<string, unknown> | null | undefined, 'admin_email');

    return this.normalizeContactValue(value);
  }

  protected managerPhone(): string {
    const data = this.detailResponse()?.data;
    const value =
      data?.manager?.mobile_number ??
      data?.manager?.phone_number ??
      data?.manager?.phone ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['manager', 'mobile_number']) ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['manager', 'phone_number']) ??
      data?.admin?.phone ??
      data?.admin_phone ??
      data?.phone ??
      this.pickNestedString(data as Record<string, unknown> | null | undefined, ['admin', 'mobile_number']);

    return this.normalizeContactValue(value);
  }

  protected bookingPanelAddress(): string {
    const building = this.building();
    const tower = this.tower();
    const towerName = (tower?.name ?? '').trim();
    const buildingName = (building?.name ?? '').trim();
    const fullAddress = (
      building?.full_address ??
      [building?.address, building?.city, building?.state, building?.pincode].filter(Boolean).join(', ')
    ).trim();

    const parts = [
      towerName ? `Tower: ${towerName}` : null,
      buildingName ? `Building: ${buildingName}` : null,
      fullAddress ? `Address: ${fullAddress}` : null,
    ].filter((part): part is string => Boolean(part));

    return parts.length ? parts.join(' | ') : 'Not Available';
  }

  protected flatPictures(): UserFlatPictureItemUsers[] {
    return this.flatPicturesResponse()?.data ?? [];
  }

  protected displayFlatPictures(): UserFlatPictureItemUsers[] {
    const byPicturesApi = this.flatPictures();
    if (byPicturesApi.length > 0) {
      return byPicturesApi;
    }

    const byDetailApi = this.detailResponse()?.data?.pictures ?? [];
    return Array.isArray(byDetailApi) ? byDetailApi : [];
  }

  protected similarFlatsData(): UsersFlatSearchItemUsers[] {
    const currentFlatId = this.flatId();
    const currentBhk = (this.flat()?.bhk_type ?? '').toLowerCase().trim();
    const currentRent = Number(this.flat()?.rent_amount ?? 0);

    const rows = this.similarFlats().filter((item) => item.flat?.id !== currentFlatId);
    return [...rows].sort((a, b) => {
      const aBhk = (a.flat?.bhk_type ?? '').toLowerCase().trim();
      const bBhk = (b.flat?.bhk_type ?? '').toLowerCase().trim();
      const aBhkScore = aBhk && aBhk === currentBhk ? 0 : 1;
      const bBhkScore = bBhk && bBhk === currentBhk ? 0 : 1;
      if (aBhkScore !== bBhkScore) {
        return aBhkScore - bBhkScore;
      }
      const aRent = Number(a.flat?.rent_amount ?? 0);
      const bRent = Number(b.flat?.rent_amount ?? 0);
      return Math.abs(aRent - currentRent) - Math.abs(bRent - currentRent);
    });
  }

  protected openSimilarFlat(item: UsersFlatSearchItemUsers): void {
    const buildingId = item.building?.id;
    const towerId = item.tower?.id;
    const flatId = item.flat?.id;
    if (!buildingId || !towerId || !flatId) {
      return;
    }
    this.router.navigateByUrl(`/users/buildings/${buildingId}/towers/${towerId}/flats/${flatId}`);
  }

  protected galleryPictures(): Array<{ id: string; room_name: string; picture_url: string }> {
    const items: Array<{ id: string; room_name: string; picture_url: string }> = [];
    const seenUrls = new Set<string>();

    const mainPictureUrl = (this.flat()?.picture_url ?? '').trim();
    if (mainPictureUrl) {
      items.push({
        id: 'main-flat-picture',
        room_name: 'Main Flat Picture',
        picture_url: mainPictureUrl,
      });
      seenUrls.add(mainPictureUrl);
    }

    for (const picture of this.displayFlatPictures()) {
      const url = (picture.picture_url ?? '').trim();
      if (!url || seenUrls.has(url)) {
        continue;
      }
      items.push({
        id: `room-${picture.id}`,
        room_name: picture.room_name,
        picture_url: url,
      });
      seenUrls.add(url);
    }

    return items;
  }

  protected openAmenityModal(amenity: BuildingAmenityUsers): void {
    this.isAmenityModalOpen.set(true);
    this.selectedAmenity.set(amenity);
  }

  protected closeAmenityModal(): void {
    this.isAmenityModalOpen.set(false);
    this.selectedAmenity.set(null);
  }

  protected openImageModal(imageUrl: string, title?: string): void {
    const normalizedUrl = (imageUrl ?? '').trim();
    if (!normalizedUrl) {
      return;
    }

    const galleryItems = this.galleryPictures()
      .map((picture) => ({
        url: (picture.picture_url ?? '').trim(),
        name: picture.room_name,
      }))
      .filter((item) => item.url.length > 0);

    if (!galleryItems.length) {
      this.imagePreviewState.open(normalizedUrl, title);
      return;
    }

    const galleryIndex = galleryItems.findIndex((item) => item.url === normalizedUrl);
    if (galleryIndex >= 0) {
      this.imagePreviewState.openGallery(galleryItems, galleryIndex);
      return;
    }

    this.imagePreviewState.open(normalizedUrl, title);
  }

  protected openBookingModal(): void {
    if (!this.authState.accessToken()) {
      this.isAuthRequiredModalOpen.set(true);
      return;
    }
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

  protected closeAuthRequiredModal(): void {
    this.isAuthRequiredModalOpen.set(false);
  }

  protected returnUrlForAuth(): string {
    return this.router.url || '/home';
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

        this.bookingError.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to create booking right now.',
            conflictMessage: 'This flat is already booked for your account.',
          }),
        );
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

  private loadFlatPictures(): void {
    const buildingId = this.buildingId();
    const towerId = this.towerId();
    const flatId = this.flatId();
    if (!buildingId || !towerId || !flatId) {
      return;
    }

    this.isLoadingFlatPictures.set(true);
    this.flatPicturesError.set(null);
    this.flatPicturesResponse.set(null);

    getUsersFlatPicturesApi(this.http, this.apiBaseUrl(), null, buildingId, towerId, flatId).subscribe({
      next: (response) => {
        this.flatPicturesResponse.set(response);
        this.ensureGalleryIndexInRange();
        this.isLoadingFlatPictures.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.flatPicturesError.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load flat images right now.',
          }),
        );
        this.isLoadingFlatPictures.set(false);
      },
    });
  }

  private loadSimilarFlatsForBuilding(): void {
    const buildingId = this.buildingId();
    if (!buildingId) {
      return;
    }

    this.isLoadingSimilarFlats.set(true);
    this.similarFlatsError.set(null);
    this.similarFlats.set([]);

    getUsersBuildingFlatsApi(this.http, this.apiBaseUrl(), null, buildingId, {
      status: 'all',
      page: 1,
      per_page: 100,
    }).subscribe({
      next: (response) => {
        this.similarFlats.set(response.data?.items ?? []);
        this.isLoadingSimilarFlats.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.similarFlatsError.set(
          toUserErrorMessage(error, {
            defaultMessage: 'Unable to load similar properties right now.',
          }),
        );
        this.isLoadingSimilarFlats.set(false);
      },
    });
  }

  protected currentGalleryPicture(): { id: string; room_name: string; picture_url: string } | null {
    const pictures = this.galleryPictures();
    if (!pictures.length) {
      return null;
    }
    const index = this.normalizedGalleryIndex(pictures.length);
    return pictures[index] ?? null;
  }

  protected isGalleryPictureActive(index: number): boolean {
    const pictures = this.galleryPictures();
    if (!pictures.length) {
      return false;
    }
    return this.normalizedGalleryIndex(pictures.length) === index;
  }

  protected goToPreviousGalleryPicture(): void {
    const length = this.galleryPictures().length;
    if (!length) {
      return;
    }
    const current = this.normalizedGalleryIndex(length);
    const previous = (current - 1 + length) % length;
    this.scrollToGalleryIndex(previous, true);
  }

  protected goToNextGalleryPicture(): void {
    const length = this.galleryPictures().length;
    if (!length) {
      return;
    }
    const current = this.normalizedGalleryIndex(length);
    const next = (current + 1) % length;
    this.scrollToGalleryIndex(next, true);
  }

  protected goToGalleryPicture(index: number): void {
    this.scrollToGalleryIndex(index, true);
  }

  protected onGalleryScroll(): void {
    const list = this.flatCarouselList?.nativeElement;
    const slides = this.flatCarouselSlides?.toArray() ?? [];
    if (!list || !slides.length) {
      this.galleryIndex.set(0);
      return;
    }

    const listRect = list.getBoundingClientRect();
    const listCenter = listRect.left + listRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < slides.length; i += 1) {
      const slideRect = slides[i].nativeElement.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distance = Math.abs(slideCenter - listCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    this.galleryIndex.set(nearestIndex);
  }

  protected onGalleryImageLoad(url: string | null | undefined): void {
    const normalizedUrl = (url ?? '').trim();
    if (!normalizedUrl) {
      return;
    }
    this.loadedGalleryImageMap.update((prev) => (
      prev[normalizedUrl] ? prev : { ...prev, [normalizedUrl]: true }
    ));
  }

  private scrollToGalleryIndex(index: number, smooth: boolean): void {
    const list = this.flatCarouselList?.nativeElement;
    const slides = this.flatCarouselSlides?.toArray() ?? [];
    if (!list || !slides.length) {
      return;
    }
    const length = slides.length;
    const bounded = ((index % length) + length) % length;
    const targetSlide = slides[bounded].nativeElement;
    const nextLeft = Math.max(0, targetSlide.offsetLeft - (list.clientWidth - targetSlide.clientWidth) / 2);
    list.scrollTo({
      left: nextLeft,
      behavior: smooth ? 'smooth' : 'auto',
    });
    this.galleryIndex.set(bounded);
  }

  private ensureGalleryIndexInRange(): void {
    const pictures = this.galleryPictures();
    if (!pictures.length) {
      this.galleryIndex.set(0);
      return;
    }
    const normalized = this.normalizedGalleryIndex(pictures.length);
    this.galleryIndex.set(normalized);
    setTimeout(() => this.scrollToGalleryIndex(normalized, false), 0);
  }

  private normalizedGalleryIndex(length: number): number {
    if (length <= 0) {
      return 0;
    }
    const current = this.galleryIndex();
    if (!Number.isInteger(current) || current < 0) {
      return 0;
    }
    if (current >= length) {
      return 0;
    }
    return current;
  }

  private pickNestedString(
    source: Record<string, unknown> | null | undefined,
    path: [string, string],
  ): string | null {
    if (!source) {
      return null;
    }
    const [parentKey, childKey] = path;
    const parent = source[parentKey];
    if (!parent || typeof parent !== 'object') {
      return null;
    }
    const value = (parent as Record<string, unknown>)[childKey];
    return typeof value === 'string' ? value : null;
  }

  private pickTopLevelString(
    source: Record<string, unknown> | null | undefined,
    key: string,
  ): string | null {
    if (!source) {
      return null;
    }
    const value = source[key];
    return typeof value === 'string' ? value : null;
  }

  private normalizeContactValue(value: unknown): string {
    if (typeof value !== 'string') {
      return 'Not Available';
    }
    const normalized = value.trim();
    return normalized ? normalized : 'Not Available';
  }
}




