import { API_BASE_URL } from '../../shared/app_env';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { createUsersFlatBookingApi, getUsersBookingsApi, getUsersFlatDetailApi, getUsersFlatPicturesApi } from '../api_users_auth';
import { UsersAuthState } from '../state_users_auth';
import { ImagePreviewState } from '../../shared/image_preview_state';
import {
  BuildingAmenityUsers,
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
  protected readonly isBookingSubmitting = signal(false);
  protected readonly bookingError = signal<string | null>(null);
  protected readonly bookingSuccess = signal<string | null>(null);
  protected readonly bookingResponse = signal<UsersCreateBookingResponseEnvelopeUsers | null>(null);
  protected readonly hasAlreadyBookedThisFlat = signal(false);
  protected readonly isAmenityModalOpen = signal(false);
  protected readonly selectedAmenity = signal<BuildingAmenityUsers | null>(null);
  protected readonly galleryIndex = signal(0);
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
      this.galleryIndex.set(0);
      this.loadFlatDetail();
      this.loadFlatPictures();
      this.loadBookingState();
    });
  }

  protected loadFlatDetail(): void {
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    const towerId = this.towerId();
    const flatId = this.flatId();

    if (!token) {
      this.error.set('No active session found. Please login again.');
      return;
    }
    if (!buildingId || !towerId || !flatId) {
      this.error.set('Invalid building, tower, or flat id.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.detailResponse.set(null);

    getUsersFlatDetailApi(this.http, this.apiBaseUrl(), token, buildingId, towerId, flatId).subscribe({
      next: (response) => {
        this.detailResponse.set(response);
        this.ensureGalleryIndexInRange();
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

        this.error.set('Failed to fetch flat details.');
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

        const envelope = error.error as { message?: string; error?: { user_message?: string; detail?: string } };
        this.bookingError.set(envelope?.error?.user_message ?? envelope?.message ?? envelope?.error?.detail ?? 'Failed to create booking.');
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
    const token = this.authState.accessToken();
    const buildingId = this.buildingId();
    const towerId = this.towerId();
    const flatId = this.flatId();
    if (!token) {
      return;
    }
    if (!buildingId || !towerId || !flatId) {
      return;
    }

    this.isLoadingFlatPictures.set(true);
    this.flatPicturesError.set(null);
    this.flatPicturesResponse.set(null);

    getUsersFlatPicturesApi(this.http, this.apiBaseUrl(), token, buildingId, towerId, flatId).subscribe({
      next: (response) => {
        this.flatPicturesResponse.set(response);
        this.ensureGalleryIndexInRange();
        this.isLoadingFlatPictures.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isLoadingFlatPictures.set(false);
          return;
        }
        this.flatPicturesError.set('Failed to fetch flat pictures.');
        this.isLoadingFlatPictures.set(false);
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
    this.scrollToGalleryIndex(previous);
  }

  protected goToNextGalleryPicture(): void {
    const length = this.galleryPictures().length;
    if (!length) {
      return;
    }
    const current = this.normalizedGalleryIndex(length);
    const next = (current + 1) % length;
    this.scrollToGalleryIndex(next);
  }

  protected goToGalleryPicture(index: number): void {
    this.scrollToGalleryIndex(index);
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

  private scrollToGalleryIndex(index: number): void {
    const slides = this.flatCarouselSlides?.toArray() ?? [];
    if (!slides.length) {
      return;
    }
    const length = slides.length;
    const bounded = ((index % length) + length) % length;
    slides[bounded].nativeElement.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
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
    setTimeout(() => this.scrollToGalleryIndex(normalized), 0);
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
}




