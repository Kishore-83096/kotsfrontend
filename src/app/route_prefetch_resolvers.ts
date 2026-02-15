import { API_BASE_URL as APP_API_BASE_URL } from './shared/app_env';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, UrlTree } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { UsersAuthState } from './users_users/state_users_auth';

const API_BASE_URL = APP_API_BASE_URL;

function normalizeToken(token: string): string {
  const trimmed = token.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice(7).trim() : trimmed;
}

function authHeaders(token: string): HttpHeaders {
  return new HttpHeaders({
    Authorization: `Bearer ${normalizeToken(token)}`,
  });
}

function unauthorizedToLogin(error: unknown, authState: UsersAuthState, router: Router): UrlTree | true {
  const status = (error as { status?: number } | null)?.status;
  if (status === 401) {
    authState.clearAuth();
    return router.parseUrl('/users/login');
  }
  return true;
}

function parseRouteId(route: ActivatedRouteSnapshot, key: string): number | null {
  const parsed = Number(route.paramMap.get(key));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export const usersHomePrefetchResolver: ResolveFn<true | UrlTree> = () => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  return http
    .get(`${API_BASE_URL}/users/buildings`, {
      headers: authHeaders(token),
      observe: 'response',
    })
    .pipe(
      map(() => true as const),
      catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
    );
};

export const usersBookingsPrefetchResolver: ResolveFn<true | UrlTree> = () => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  return http
    .get(`${API_BASE_URL}/users/bookings`, {
      headers: authHeaders(token),
      observe: 'response',
    })
    .pipe(
      map(() => true as const),
      catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
    );
};

export const usersSearchPrefetchResolver: ResolveFn<true | UrlTree> = () => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  return http
    .get(`${API_BASE_URL}/users/flats/search`, {
      headers: authHeaders(token),
      observe: 'response',
    })
    .pipe(
      map(() => true as const),
      catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
    );
};

export const usersBuildingTowersPrefetchResolver: ResolveFn<true | UrlTree> = (route) => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  const buildingId = parseRouteId(route, 'buildingId');
  if (!buildingId) {
    return of(true);
  }

  return forkJoin([
    http.get(`${API_BASE_URL}/users/buildings`, { headers: authHeaders(token), observe: 'response' }),
    http.get(`${API_BASE_URL}/users/buildings/${buildingId}/towers`, { headers: authHeaders(token), observe: 'response' }),
  ]).pipe(
    map(() => true as const),
    catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
  );
};

export const usersTowerDetailPrefetchResolver: ResolveFn<true | UrlTree> = (route) => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  const buildingId = parseRouteId(route, 'buildingId');
  const towerId = parseRouteId(route, 'towerId');
  if (!buildingId || !towerId) {
    return of(true);
  }

  return forkJoin([
    http.get(`${API_BASE_URL}/users/buildings/${buildingId}/towers/${towerId}`, { headers: authHeaders(token), observe: 'response' }),
    http.get(`${API_BASE_URL}/users/buildings/${buildingId}/towers/${towerId}/flats`, { headers: authHeaders(token), observe: 'response' }),
  ]).pipe(
    map(() => true as const),
    catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
  );
};

export const usersFlatDetailPrefetchResolver: ResolveFn<true | UrlTree> = (route) => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  const buildingId = parseRouteId(route, 'buildingId');
  const towerId = parseRouteId(route, 'towerId');
  const flatId = parseRouteId(route, 'flatId');
  if (!buildingId || !towerId || !flatId) {
    return of(true);
  }

  return forkJoin([
    http.get(`${API_BASE_URL}/users/buildings/${buildingId}/towers/${towerId}/flats/${flatId}`, { headers: authHeaders(token), observe: 'response' }),
    http.get(`${API_BASE_URL}/users/bookings`, { headers: authHeaders(token), observe: 'response' }),
  ]).pipe(
    map(() => true as const),
    catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
  );
};

export const adminsHomePrefetchResolver: ResolveFn<true | UrlTree> = () => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  return http
    .get(`${API_BASE_URL}/admins/buildings/my`, {
      headers: authHeaders(token),
      observe: 'response',
    })
    .pipe(
      map(() => true as const),
      catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
    );
};

export const adminsBuildingDetailPrefetchResolver: ResolveFn<true | UrlTree> = (route) => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  const buildingId = parseRouteId(route, 'buildingId');
  if (!buildingId) {
    return of(true);
  }

  return forkJoin([
    http.get(`${API_BASE_URL}/admins/buildings/${buildingId}`, { headers: authHeaders(token), observe: 'response' }),
    http.get(`${API_BASE_URL}/admins/buildings/${buildingId}/towers`, { headers: authHeaders(token), observe: 'response' }),
  ]).pipe(
    map(() => true as const),
    catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
  );
};

export const adminsTowerDetailPrefetchResolver: ResolveFn<true | UrlTree> = (route) => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  const buildingId = parseRouteId(route, 'buildingId');
  const towerId = parseRouteId(route, 'towerId');
  if (!buildingId || !towerId) {
    return of(true);
  }

  return forkJoin([
    http.get(`${API_BASE_URL}/admins/buildings/${buildingId}/towers/${towerId}`, { headers: authHeaders(token), observe: 'response' }),
    http.get(`${API_BASE_URL}/admins/towers/${towerId}/flats`, { headers: authHeaders(token), observe: 'response' }),
  ]).pipe(
    map(() => true as const),
    catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
  );
};

export const masterHomePrefetchResolver: ResolveFn<true | UrlTree> = () => {
  const http = inject(HttpClient);
  const authState = inject(UsersAuthState);
  const router = inject(Router);
  const token = authState.accessToken();
  if (!token) {
    return router.parseUrl('/users/login');
  }

  return http
    .get(`${API_BASE_URL}/master/admins`, {
      headers: authHeaders(token),
      observe: 'response',
      params: { page: 1, per_page: 10 },
    })
    .pipe(
      map(() => true as const),
      catchError((error: unknown) => of(unauthorizedToLogin(error, authState, router))),
    );
};




