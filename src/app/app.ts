import { API_BASE_URL } from './shared/app_env';
import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, WritableSignal, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  deleteUsersMeApi,
  deleteUsersProfilePictureApi,
  getUsersMeApi,
  getUsersProfileApi,
  logoutUsersApi,
  updateUsersMeApi,
  updateUsersProfileApi,
  uploadUsersProfilePictureApi,
} from './users_users/api_users_auth';
import { HttpLoadingState } from './shared/http_loading_state';
import { ImagePreviewState } from './shared/image_preview_state';
import { UsersAuthState } from './users_users/state_users_auth';
import { UserMeResponseEnvelopeUsers, UserProfileResponseEnvelopeUsers } from './users_users/typescript_users/type_users';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authState = inject(UsersAuthState);
  private readonly imagePreviewState = inject(ImagePreviewState);
  private readonly httpLoadingState = inject(HttpLoadingState);
  private readonly document = inject(DOCUMENT);
  private readonly viewportWindow = this.document.defaultView;

  protected readonly apiBaseUrl = signal(API_BASE_URL);
  protected readonly isLoggingOut = signal(false);
  protected readonly isLoadingUserData = signal(false);
  protected readonly userDataError = signal<string | null>(null);
  protected readonly isSearchModalOpen = signal(false);
  protected readonly isProfileModalOpen = signal(false);
  protected readonly isTitleMenuOpen = signal(false);
  protected readonly activeModalTab = signal<'profile' | 'account'>('profile');
  protected readonly selectedProfilePictureFile = signal<File | null>(null);
  protected readonly selectedProfilePicturePreviewUrl = signal<string | null>(null);
  protected readonly isUpdatingProfilePicture = signal(false);
  protected readonly profilePictureActionError = signal<string | null>(null);
  protected readonly profilePictureActionMessage = signal<string | null>(null);
  protected readonly isUpdatingProfileDetails = signal(false);
  protected readonly profileDetailsActionError = signal<string | null>(null);
  protected readonly profileDetailsActionMessage = signal<string | null>(null);
  protected readonly isProfileUpdateOpen = signal(false);
  protected readonly isProfileDeleteOpen = signal(false);
  protected readonly profileFormUsername = signal('');
  protected readonly profileFormMobileNumber = signal('');
  protected readonly profileFormBio = signal('');
  protected readonly profileFormDateOfBirth = signal('');
  protected readonly profileFormCity = signal('');
  protected readonly profileFormState = signal('');
  protected readonly profileFormCountry = signal('');
  protected readonly isUpdatingAccountDetails = signal(false);
  protected readonly isDeletingAccount = signal(false);
  protected readonly isRouteTransitioning = signal(false);
  protected readonly isLoginHomeTransition = signal(false);
  protected readonly accountActionError = signal<string | null>(null);
  protected readonly accountActionMessage = signal<string | null>(null);
  protected readonly isAccountUpdateOpen = signal(false);
  protected readonly isAccountDeleteOpen = signal(false);
  protected readonly accountFormEmail = signal('');
  protected readonly accountFormPassword = signal('');
  protected readonly globalSearchTab = signal<'flat' | 'building'>('flat');
  protected readonly globalSearchBuildingName = signal('');
  protected readonly globalSearchAddress = signal('');
  protected readonly globalSearchCity = signal('');
  protected readonly globalSearchState = signal('');
  protected readonly globalSearchFlatType = signal('');
  protected readonly globalSearchMinRent = signal('');
  protected readonly globalSearchMaxRent = signal('');
  protected readonly hasSession = computed(() => Boolean(this.authState.accessToken()));
  protected readonly currentRoutePath = signal(this.normalizeRoutePath(this.router.url));
  protected readonly shouldShowGlobalHeader = computed(
    () => this.hasSession() && !this.isPublicEntryRoute(this.currentRoutePath()),
  );
  protected readonly shouldUseCompactHeaderMenu = computed(
    () => this.isMobileDevice() || this.isHeaderCompactMode(),
  );
  protected readonly shouldEnableHeaderSwapOnScroll = computed(() => {
    const path = this.currentRoutePath();
    return (
      path === '/home' ||
      path === '/users/bookings' ||
      path === '/users/flats/search' ||
      /^\/users\/buildings\/[^/]+\/towers$/.test(path) ||
      /^\/users\/buildings\/[^/]+\/towers\/[^/]+$/.test(path) ||
      /^\/users\/buildings\/[^/]+\/towers\/[^/]+\/flats\/[^/]+$/.test(path)
    );
  });
  protected readonly isGlobalHeaderHiddenOnScroll = signal(false);
  protected readonly shouldReserveHeaderSpace = computed(
    () => this.shouldShowGlobalHeader() && !this.isGlobalHeaderHiddenOnScroll(),
  );
  protected readonly deviceMode = signal<'mobile' | 'desktop'>(this.detectDeviceMode());
  protected readonly isHeaderCompactMode = signal(this.detectHeaderCompactMode());
  protected readonly isMobileDevice = computed(() => this.deviceMode() === 'mobile');
  protected readonly isDesktopDevice = computed(() => this.deviceMode() === 'desktop');
  protected readonly isGlobalLoading = computed(() => this.httpLoadingState.isLoading() || this.isRouteTransitioning());
  protected readonly showRouteTransitionOverlay = computed(() => this.hasSession() && this.isLoginHomeTransition());
  protected readonly globalPreviewImageUrl = this.imagePreviewState.imageUrl;
  protected readonly globalPreviewImageName = this.imagePreviewState.imageName;
  protected readonly globalPreviewImageIndex = this.imagePreviewState.currentIndex;
  protected readonly globalPreviewImageCount = this.imagePreviewState.totalCount;
  protected readonly globalPreviewHasMultiple = this.imagePreviewState.hasMultiple;
  protected readonly meResponse = signal<UserMeResponseEnvelopeUsers | null>(null);
  protected readonly profileResponse = signal<UserProfileResponseEnvelopeUsers | null>(null);
  protected readonly profileData = computed(() => this.profileResponse()?.data ?? null);
  protected readonly accountData = computed(() => this.meResponse()?.data ?? null);
  protected readonly displayEmail = computed(
    () => this.profileData()?.primary_email ?? this.accountData()?.email ?? this.authState.lastLoginResult()?.data.email ?? 'Authenticated User',
  );
  protected readonly profileImageUrl = computed(() => this.profileData()?.profile_pic_url ?? null);
  protected readonly profileInitials = computed(() => {
    const source = (this.profileData()?.username ?? this.displayEmail()).trim();
    return source ? source.slice(0, 1).toUpperCase() : 'U';
  });
  protected readonly roleBadges = computed(() => {
    const account = this.accountData();
    const rolesData = account?.roles;

    const hasAdmin =
      rolesData?.admin === true || rolesData?.is_admin === true || account?.is_admin === true;

    const hasMaster =
      rolesData?.master === true || rolesData?.is_master === true || account?.is_master === true;

    const badges: string[] = [];
    if (hasAdmin) {
      badges.push('ADMIN');
    }
    if (hasMaster) {
      badges.push('MASTER');
    }
    return badges;
  });
  protected readonly hasAdminAccess = computed(() => this.roleBadges().includes('ADMIN'));
  protected readonly hasMasterAccess = computed(() => this.roleBadges().includes('MASTER'));
  private imageMutationObserver: MutationObserver | null = null;
  private readonly onWindowResize = () => this.refreshDeviceMode();
  private lastAppContentScrollTop = 0;

  protected readonly profileRows = computed(() => {
    const profile = this.profileData();
    return [
      ['Username', profile?.username ?? 'N/A'],
      ['Primary Email', profile?.primary_email ?? 'N/A'],
      ['Mobile Number', profile?.mobile_number ?? 'N/A'],
      ['Bio', profile?.bio ?? 'N/A'],
      ['Date Of Birth', profile?.date_of_birth ?? 'N/A'],
      ['City', profile?.city ?? 'N/A'],
      ['State', profile?.state ?? 'N/A'],
      ['Country', profile?.country ?? 'N/A'],
      ['Created At', profile?.created_at ?? 'N/A'],
      ['Updated At', profile?.updated_at ?? 'N/A'],
    ] as const;
  });

  protected readonly accountRows = computed(() => {
    const account = this.accountData();
    return [
      ['Email', account?.email ?? 'N/A'],
      ['Role', account?.role ?? 'N/A'],
      ['Is Admin', account?.is_admin === true ? 'Yes' : 'No'],
      ['Is Master', account?.is_master === true ? 'Yes' : 'No'],
      ['Created At', account?.created_at ?? 'N/A'],
      ['Status Code', this.meResponse()?.status_code ?? 'N/A'],
      ['Message', this.meResponse()?.message ?? 'N/A'],
    ] as const;
  });

  constructor() {
    effect(() => {
      if (this.hasSession()) {
        this.loadUserData();
      } else {
        this.meResponse.set(null);
        this.profileResponse.set(null);
        this.isProfileModalOpen.set(false);
        this.isSearchModalOpen.set(false);
      }
    });

    effect(() => {
      const overflow = this.isProfileModalOpen() || this.isSearchModalOpen() || this.globalPreviewImageUrl() ? 'hidden' : '';
      this.document.body.style.overflow = overflow;
      this.document.documentElement.style.overflow = overflow;
    });

    effect(() => {
      this.applyDeviceSelectors(this.deviceMode());
    });

    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.closeMobileHeaderMenus();
          const fromPath = this.normalizeRoutePath(this.router.url);
          const toPath = this.normalizeRoutePath(event.url);
          this.currentRoutePath.set(toPath);
          this.isGlobalHeaderHiddenOnScroll.set(false);
          this.lastAppContentScrollTop = 0;
          this.isLoginHomeTransition.set(this.shouldShowLoginHomeTransition(fromPath, toPath));
          this.isRouteTransitioning.set(true);
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.currentRoutePath.set(this.normalizeRoutePath(this.router.url));
          this.isGlobalHeaderHiddenOnScroll.set(false);
          this.lastAppContentScrollTop = 0;
          this.isRouteTransitioning.set(false);
          this.isLoginHomeTransition.set(false);
        }
      });

    this.setupGlobalImageLoadingState();
    if (this.viewportWindow) {
      this.viewportWindow.addEventListener('resize', this.onWindowResize, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (this.imageMutationObserver) {
      this.imageMutationObserver.disconnect();
      this.imageMutationObserver = null;
    }
    if (this.viewportWindow) {
      this.viewportWindow.removeEventListener('resize', this.onWindowResize);
    }
  }

  protected closeGlobalImagePreview(): void {
    this.imagePreviewState.close();
  }

  protected showPreviousGlobalPreviewImage(): void {
    this.imagePreviewState.previous();
  }

  protected showNextGlobalPreviewImage(): void {
    this.imagePreviewState.next();
  }

  protected openProfileModal(): void {
    this.closeMobileHeaderMenus();
    this.activeModalTab.set('profile');
    this.isProfileModalOpen.set(true);
    if (!this.meResponse() || !this.profileResponse()) {
      this.loadUserData();
    }
  }

  protected setActiveModalTab(tab: 'profile' | 'account'): void {
    this.activeModalTab.set(tab);
  }

  protected closeProfileModal(): void {
    this.isProfileModalOpen.set(false);
  }

  protected toggleProfileUpdateOpen(): void {
    this.isProfileUpdateOpen.set(!this.isProfileUpdateOpen());
  }

  protected toggleProfileDeleteOpen(): void {
    this.isProfileDeleteOpen.set(!this.isProfileDeleteOpen());
  }

  protected toggleAccountUpdateOpen(): void {
    this.isAccountUpdateOpen.set(!this.isAccountUpdateOpen());
  }

  protected toggleAccountDeleteOpen(): void {
    this.isAccountDeleteOpen.set(!this.isAccountDeleteOpen());
  }

  protected onProfilePictureFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    this.selectedProfilePictureFile.set(file);
    this.replacePreviewUrl(this.selectedProfilePicturePreviewUrl, file);
    this.profilePictureActionError.set(null);
    this.profilePictureActionMessage.set(null);
  }

  protected setProfileFormUsername(value: string): void {
    this.profileFormUsername.set(value);
  }

  protected setProfileFormMobileNumber(value: string): void {
    this.profileFormMobileNumber.set(value);
  }

  protected setProfileFormBio(value: string): void {
    this.profileFormBio.set(value);
  }

  protected setProfileFormDateOfBirth(value: string): void {
    this.profileFormDateOfBirth.set(value);
  }

  protected setProfileFormCity(value: string): void {
    this.profileFormCity.set(value);
  }

  protected setProfileFormState(value: string): void {
    this.profileFormState.set(value);
  }

  protected setProfileFormCountry(value: string): void {
    this.profileFormCountry.set(value);
  }

  protected setAccountFormEmail(value: string): void {
    this.accountFormEmail.set(value);
  }

  protected setAccountFormPassword(value: string): void {
    this.accountFormPassword.set(value);
  }

  protected openSearchModal(): void {
    this.closeMobileHeaderMenus();
    this.isSearchModalOpen.set(true);
  }

  protected closeSearchModal(): void {
    this.isSearchModalOpen.set(false);
  }

  protected toggleTitleMenu(): void {
    this.isTitleMenuOpen.update((value) => !value);
  }

  protected closeMobileHeaderMenus(): void {
    this.isTitleMenuOpen.set(false);
  }

  protected setGlobalSearchAddress(value: string): void {
    this.globalSearchAddress.set(value);
  }

  protected setGlobalSearchTab(tab: 'flat' | 'building'): void {
    this.globalSearchTab.set(tab);
  }

  protected setGlobalSearchBuildingName(value: string): void {
    this.globalSearchBuildingName.set(value);
  }

  protected setGlobalSearchCity(value: string): void {
    this.globalSearchCity.set(value);
  }

  protected setGlobalSearchState(value: string): void {
    this.globalSearchState.set(value);
  }

  protected setGlobalSearchFlatType(value: string): void {
    this.globalSearchFlatType.set(value);
  }

  protected setGlobalSearchMinRent(value: string): void {
    this.globalSearchMinRent.set(value);
  }

  protected setGlobalSearchMaxRent(value: string): void {
    this.globalSearchMaxRent.set(value);
  }

  protected submitGlobalFlatSearch(): void {
    const queryParams: Record<string, string | boolean> = {};
    const searchTab = this.globalSearchTab();
    const buildingName = this.globalSearchBuildingName().trim();
    const address = this.globalSearchAddress().trim();
    const city = this.globalSearchCity().trim();
    const state = this.globalSearchState().trim();
    const flatType = this.globalSearchFlatType().trim();
    const minRent = this.globalSearchMinRent().trim();
    const maxRent = this.globalSearchMaxRent().trim();

    queryParams['tab'] = searchTab;
    if (searchTab === 'building' && buildingName) queryParams['name'] = buildingName;
    if (address) queryParams['address'] = address;
    if (city) queryParams['city'] = city;
    if (state) queryParams['state'] = state;
    if (searchTab === 'flat') {
      if (flatType) queryParams['flat_type'] = flatType;
      if (minRent) queryParams['min_rent'] = minRent;
      if (maxRent) queryParams['max_rent'] = maxRent;
      queryParams['available_only'] = true;
    }

    this.isSearchModalOpen.set(false);
    this.router.navigate(['/users/flats/search'], { queryParams });
  }

  protected onAppContentScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    const nextTop = Math.max(target?.scrollTop ?? 0, 0);
    const HIDE_TRIGGER_SCROLL_TOP = 88;
    const SHOW_TRIGGER_SCROLL_TOP = 32;
    const HIDE_DELTA = 10;
    const SHOW_DELTA = 6;

    if (!this.shouldEnableHeaderSwapOnScroll() || !this.shouldShowGlobalHeader()) {
      this.isGlobalHeaderHiddenOnScroll.set(false);
      this.lastAppContentScrollTop = nextTop;
      return;
    }

    if (nextTop <= SHOW_TRIGGER_SCROLL_TOP) {
      this.isGlobalHeaderHiddenOnScroll.set(false);
      this.lastAppContentScrollTop = nextTop;
      return;
    }

    const delta = nextTop - this.lastAppContentScrollTop;
    const isCurrentlyHidden = this.isGlobalHeaderHiddenOnScroll();

    // Use hysteresis so tiny scroll jitter around header boundary does not toggle visibility.
    if (!isCurrentlyHidden && nextTop >= HIDE_TRIGGER_SCROLL_TOP && delta >= HIDE_DELTA) {
      this.isGlobalHeaderHiddenOnScroll.set(true);
    } else if (isCurrentlyHidden && (nextTop <= SHOW_TRIGGER_SCROLL_TOP || delta <= -SHOW_DELTA)) {
      this.isGlobalHeaderHiddenOnScroll.set(false);
    }

    this.lastAppContentScrollTop = nextTop;
  }

  protected updateAccountDetails(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.accountActionError.set('No active session found. Please login again.');
      return;
    }

    const nextEmail = this.accountFormEmail().trim();
    const nextPassword = this.accountFormPassword().trim();
    if (!nextEmail && !nextPassword) {
      this.accountActionError.set('Enter email or password to update account.');
      return;
    }

    this.isUpdatingAccountDetails.set(true);
    this.accountActionError.set(null);
    this.accountActionMessage.set(null);

    updateUsersMeApi(this.http, this.apiBaseUrl(), token, {
      ...(nextEmail ? { email: nextEmail } : {}),
      ...(nextPassword ? { password: nextPassword } : {}),
    }).subscribe({
      next: () => {
        this.accountActionMessage.set('Account details updated successfully.');
        this.accountFormPassword.set('');
        this.loadUserData();
        this.isUpdatingAccountDetails.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.accountActionError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingAccountDetails.set(false);
          return;
        }

        this.accountActionError.set(this.extractErrorMessage(error, 'Failed to update account details.'));
        this.isUpdatingAccountDetails.set(false);
      },
    });
  }

  protected deleteAccount(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.accountActionError.set('No active session found. Please login again.');
      return;
    }

    if (!confirm('Are you sure you want to delete your account permanently?')) {
      return;
    }

    this.isDeletingAccount.set(true);
    this.accountActionError.set(null);
    this.accountActionMessage.set(null);

    deleteUsersMeApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: () => {
        this.authState.clearAuth();
        this.isDeletingAccount.set(false);
        this.router.navigateByUrl('/users/login');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.accountActionError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isDeletingAccount.set(false);
          return;
        }

        this.accountActionError.set(this.extractErrorMessage(error, 'Failed to delete account.'));
        this.isDeletingAccount.set(false);
      },
    });
  }

  protected updateProfileDetails(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.profileDetailsActionError.set('No active session found. Please login again.');
      return;
    }

    this.isUpdatingProfileDetails.set(true);
    this.profileDetailsActionError.set(null);
    this.profileDetailsActionMessage.set(null);

    const payload = {
      username: this.profileFormUsername().trim() || null,
      mobile_number: this.profileFormMobileNumber().trim() || null,
      bio: this.profileFormBio().trim() || null,
      date_of_birth: this.profileFormDateOfBirth().trim() || null,
      city: this.profileFormCity().trim() || null,
      state: this.profileFormState().trim() || null,
      country: this.profileFormCountry().trim() || null,
    };

    updateUsersProfileApi(this.http, this.apiBaseUrl(), token, payload).subscribe({
      next: () => {
        this.profileDetailsActionMessage.set('Profile details updated successfully.');
        this.loadUserData();
        this.isUpdatingProfileDetails.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.profileDetailsActionError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingProfileDetails.set(false);
          return;
        }

        this.profileDetailsActionError.set(this.extractErrorMessage(error, 'Failed to update profile details.'));
        this.isUpdatingProfileDetails.set(false);
      },
    });
  }

  protected uploadSelectedProfilePicture(): void {
    const token = this.authState.accessToken();
    const file = this.selectedProfilePictureFile();

    if (!token) {
      this.profilePictureActionError.set('No active session found. Please login again.');
      return;
    }
    if (!file) {
      this.profilePictureActionError.set('Please choose an image file first.');
      return;
    }

    this.isUpdatingProfilePicture.set(true);
    this.profilePictureActionError.set(null);
    this.profilePictureActionMessage.set(null);

    uploadUsersProfilePictureApi(this.http, this.apiBaseUrl(), token, file, 'kots/profile_pics').subscribe({
      next: () => {
        this.profilePictureActionMessage.set('Profile picture updated successfully.');
        this.selectedProfilePictureFile.set(null);
        this.replacePreviewUrl(this.selectedProfilePicturePreviewUrl, null);
        this.loadUserData();
        this.isUpdatingProfilePicture.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.profilePictureActionError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingProfilePicture.set(false);
          return;
        }

        this.profilePictureActionError.set(this.extractErrorMessage(error, 'Failed to update profile picture.'));
        this.isUpdatingProfilePicture.set(false);
      },
    });
  }

  protected removeProfilePicture(): void {
    const token = this.authState.accessToken();
    if (!token) {
      this.profilePictureActionError.set('No active session found. Please login again.');
      return;
    }

    this.isUpdatingProfilePicture.set(true);
    this.profilePictureActionError.set(null);
    this.profilePictureActionMessage.set(null);

    deleteUsersProfilePictureApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: () => {
        this.profilePictureActionMessage.set('Profile picture removed successfully.');
        this.loadUserData();
        this.isUpdatingProfilePicture.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.profilePictureActionError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          this.router.navigateByUrl('/users/login');
          this.isUpdatingProfilePicture.set(false);
          return;
        }

        this.profilePictureActionError.set(this.extractErrorMessage(error, 'Failed to remove profile picture.'));
        this.isUpdatingProfilePicture.set(false);
      },
    });
  }

  private loadUserData(): void {
    const token = this.authState.accessToken();
    if (!token) {
      return;
    }

    this.isLoadingUserData.set(true);
    this.userDataError.set(null);
    this.meResponse.set(null);
    this.profileResponse.set(null);

    forkJoin({
      me: getUsersMeApi(this.http, this.apiBaseUrl(), token),
      profile: getUsersProfileApi(this.http, this.apiBaseUrl(), token),
    }).subscribe({
      next: (response) => {
        this.meResponse.set(response.me);
        this.profileResponse.set(response.profile);
        this.patchProfileFormFromResponse(response.profile.data);
        this.patchAccountFormFromResponse(response.me.data);
        this.isLoadingUserData.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.userDataError.set('Session expired. Please login again.');
          this.authState.clearAuth();
          const currentPath = this.normalizeRoutePath(this.router.url);
          if (!this.isPublicEntryRoute(currentPath)) {
            this.router.navigateByUrl('/users/login');
          }
          this.isLoadingUserData.set(false);
          return;
        }

        this.userDataError.set('Failed to fetch account/profile details.');
        this.isLoadingUserData.set(false);
      },
    });
  }

  protected logout(): void {
    this.closeMobileHeaderMenus();
    const token = this.authState.accessToken();
    if (!token) {
      this.authState.clearAuth();
      this.router.navigateByUrl('/');
      return;
    }

    this.isLoggingOut.set(true);

    logoutUsersApi(this.http, this.apiBaseUrl(), token).subscribe({
      next: () => {
        this.authState.clearAuth();
        this.isLoggingOut.set(false);
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.authState.clearAuth();
        this.isLoggingOut.set(false);
        this.router.navigateByUrl('/');
      },
    });
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

  private patchProfileFormFromResponse(profile: UserProfileResponseEnvelopeUsers['data']): void {
    this.profileFormUsername.set((profile?.username as string | null | undefined) ?? '');
    this.profileFormMobileNumber.set((profile?.mobile_number as string | null | undefined) ?? '');
    this.profileFormBio.set((profile?.bio as string | null | undefined) ?? '');
    this.profileFormDateOfBirth.set((profile?.date_of_birth as string | null | undefined) ?? '');
    this.profileFormCity.set((profile?.city as string | null | undefined) ?? '');
    this.profileFormState.set((profile?.state as string | null | undefined) ?? '');
    this.profileFormCountry.set((profile?.country as string | null | undefined) ?? '');
  }

  private patchAccountFormFromResponse(account: UserMeResponseEnvelopeUsers['data']): void {
    this.accountFormEmail.set((account?.email as string | null | undefined) ?? '');
    this.accountFormPassword.set('');
  }

  private setupGlobalImageLoadingState(): void {
    const root = this.document.body;
    if (!root) {
      return;
    }

    const prepareImage = (image: HTMLImageElement): void => {
      this.applyOptimizedImageSource(image);
      image.classList.add('app-img-track');
      image.classList.remove('img-loaded', 'img-error');

      const sourceKey = image.currentSrc || image.src || '';
      if (sourceKey) {
        image.dataset['imgTrackSrc'] = sourceKey;
      }

      const markLoaded = (isLoaded: boolean): void => {
        image.classList.add(isLoaded ? 'img-loaded' : 'img-error');
      };

      if (image.complete) {
        markLoaded(image.naturalWidth > 0 && image.naturalHeight > 0);
        return;
      }

      image.addEventListener('load', () => markLoaded(true), { once: true });
      image.addEventListener('error', () => markLoaded(false), { once: true });
    };

    const scanNode = (node: Node): void => {
      if (node instanceof HTMLImageElement) {
        prepareImage(node);
        return;
      }
      if (node instanceof Element) {
        node.querySelectorAll('img').forEach((img) => prepareImage(img));
      }
    };

    root.querySelectorAll('img').forEach((img) => prepareImage(img));

    this.imageMutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => scanNode(node));
          continue;
        }

        if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) {
          const target = mutation.target;
          const sourceKey = target.currentSrc || target.src || '';
          if (target.dataset['imgTrackSrc'] !== sourceKey) {
            prepareImage(target);
          }
        }
      }
    });

    this.imageMutationObserver.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  }

  private applyOptimizedImageSource(image: HTMLImageElement): void {
    const currentSrc = image.getAttribute('src');
    if (!currentSrc || currentSrc.startsWith('blob:') || currentSrc.startsWith('data:')) {
      return;
    }

    const previousOriginalSrc = image.dataset['imgOriginalSrc'];
    const previousOptimizedSrc = previousOriginalSrc
      ? this.optimizeCloudinaryImageUrl(previousOriginalSrc, this.resolveTargetImageWidth(image))
      : null;
    const originalSrc = !previousOriginalSrc || currentSrc !== previousOptimizedSrc
      ? currentSrc
      : previousOriginalSrc;
    image.dataset['imgOriginalSrc'] = originalSrc;

    const optimizedSrc = this.optimizeCloudinaryImageUrl(originalSrc, this.resolveTargetImageWidth(image));
    if (optimizedSrc !== currentSrc) {
      image.setAttribute('src', optimizedSrc);
    }
  }

  private optimizeCloudinaryImageUrl(url: string, targetWidth: number): string {
    if (!/^https?:\/\/res\.cloudinary\.com\//i.test(url)) {
      return url;
    }

    const uploadMarker = '/upload/';
    const markerIndex = url.indexOf(uploadMarker);
    if (markerIndex < 0) {
      return url;
    }

    const startIndex = markerIndex + uploadMarker.length;
    const remainder = url.slice(startIndex);
    if (!remainder) {
      return url;
    }

    const width = Math.max(80, Math.min(1800, Math.round(targetWidth)));
    const transform = `f_auto,q_auto,c_limit,w_${width}`;
    return `${url.slice(0, startIndex)}${transform}/${remainder}`;
  }

  private resolveTargetImageWidth(image: HTMLImageElement): number {
    const displayWidth = image.getBoundingClientRect().width || image.clientWidth || 0;
    if (displayWidth > 0) {
      const dpr = this.viewportWindow?.devicePixelRatio ?? 1;
      return displayWidth * Math.min(Math.max(dpr, 1), 2);
    }

    const classes = image.classList;
    if (classes.contains('header-avatar')) return 96;
    if (classes.contains('avatar-fallback')) return 96;
    if (classes.contains('profile-image-large')) return 260;
    if (classes.contains('upload-preview-image')) return 320;
    if (classes.contains('amenity-image')) return 420;
    if (classes.contains('global-image-preview-full')) return 1600;
    if (classes.contains('result-image')) return 760;
    if (classes.contains('building-image')) return 900;
    if (classes.contains('tower-image')) return 900;
    if (classes.contains('flat-image')) return 900;
    if (classes.contains('booking-image')) return 760;
    if (classes.contains('modal-flat-image')) return 980;
    if (classes.contains('flat-gallery-image')) return 980;
    if (classes.contains('amenity-modal-image')) return 980;

    return 960;
  }

  private normalizeRoutePath(url: string): string {
    const trimmed = (url || '/').trim();
    if (!trimmed) {
      return '/';
    }
    const pathOnly = trimmed.split('?')[0].split('#')[0] || '/';
    return pathOnly === '' ? '/' : pathOnly;
  }

  private shouldShowLoginHomeTransition(fromPath: string, toPath: string): boolean {
    return toPath === '/home' && this.isPublicEntryRoute(fromPath);
  }

  private isPublicEntryRoute(path: string): boolean {
    return path === '/' || path === '/users/login' || path === '/users/register';
  }

  private detectDeviceMode(): 'mobile' | 'desktop' {
    if (!this.viewportWindow) {
      return 'desktop';
    }
    return this.viewportWindow.innerWidth <= 768 ? 'mobile' : 'desktop';
  }

  private refreshDeviceMode(): void {
    this.deviceMode.set(this.detectDeviceMode());
    this.isHeaderCompactMode.set(this.detectHeaderCompactMode());
  }

  private detectHeaderCompactMode(): boolean {
    if (!this.viewportWindow) {
      return false;
    }
    return this.viewportWindow.innerWidth <= 1220;
  }

  private applyDeviceSelectors(mode: 'mobile' | 'desktop'): void {
    const root = this.document.documentElement;
    const body = this.document.body;
    root?.setAttribute('data-device', mode);
    body?.classList.toggle('device-mobile', mode === 'mobile');
    body?.classList.toggle('device-desktop', mode === 'desktop');
  }
}




