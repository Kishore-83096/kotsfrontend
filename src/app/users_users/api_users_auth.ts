import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DeleteMeResponseEnvelopeUsers,
  LoginRequestUsers,
  LoginResponseEnvelopeUsers,
  LogoutResponseEnvelopeUsers,
  RegisterRequestUsers,
  RegisterResponseEnvelopeUsers,
  UpdateMeRequestUsers,
  UsersBuildingsResponseEnvelopeUsers,
  UsersBuildingAmenitiesResponseEnvelopeUsers,
  UsersBuildingAmenityDetailResponseEnvelopeUsers,
  UsersBuildingTowersResponseEnvelopeUsers,
  UsersBookingsResponseEnvelopeUsers,
  UsersBookingDetailResponseEnvelopeUsers,
  UsersCreateBookingResponseEnvelopeUsers,
  UsersBuildingSearchResponseEnvelopeUsers,
  UsersFlatDetailResponseEnvelopeUsers,
  UsersFlatSearchResponseEnvelopeUsers,
  UsersTowerFlatsResponseEnvelopeUsers,
  UsersTowerDetailResponseEnvelopeUsers,
  UserProfileResponseDataUsers,
  UserMeResponseEnvelopeUsers,
  UserProfileResponseEnvelopeUsers,
} from './typescript_users/type_users';

function normalizeToken(token: string): string {
  const trimmed = token.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice(7).trim() : trimmed;
}

export function registerUsersApi(
  http: HttpClient,
  apiBaseUrl: string,
  payload: RegisterRequestUsers,
): Observable<RegisterResponseEnvelopeUsers> {
  return http.post<RegisterResponseEnvelopeUsers>(`${apiBaseUrl}/users/register`, payload);
}

export function loginUsersApi(
  http: HttpClient,
  apiBaseUrl: string,
  payload: LoginRequestUsers,
): Observable<LoginResponseEnvelopeUsers> {
  return http.post<LoginResponseEnvelopeUsers>(`${apiBaseUrl}/users/login`, payload);
}

export function logoutUsersApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<LogoutResponseEnvelopeUsers> {
  return http.post<LogoutResponseEnvelopeUsers>(`${apiBaseUrl}/users/logout`, null, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersMeApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<UserMeResponseEnvelopeUsers> {
  return http.get<UserMeResponseEnvelopeUsers>(`${apiBaseUrl}/users/me`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersProfileApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<UserProfileResponseEnvelopeUsers> {
  return http.get<UserProfileResponseEnvelopeUsers>(`${apiBaseUrl}/users/profile`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersBuildingsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<UsersBuildingsResponseEnvelopeUsers> {
  return http.get<UsersBuildingsResponseEnvelopeUsers>(`${apiBaseUrl}/users/buildings`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersBuildingAmenitiesApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
): Observable<UsersBuildingAmenitiesResponseEnvelopeUsers> {
  return http.get<UsersBuildingAmenitiesResponseEnvelopeUsers>(`${apiBaseUrl}/users/buildings/${buildingId}/amenities`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersBuildingAmenityByIdApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  amenityId: number,
): Observable<UsersBuildingAmenityDetailResponseEnvelopeUsers> {
  return http.get<UsersBuildingAmenityDetailResponseEnvelopeUsers>(
    `${apiBaseUrl}/users/buildings/${buildingId}/amenities/${amenityId}`,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${normalizeToken(token)}`,
      }),
    },
  );
}

export function getUsersBuildingTowersApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
): Observable<UsersBuildingTowersResponseEnvelopeUsers> {
  return http.get<UsersBuildingTowersResponseEnvelopeUsers>(`${apiBaseUrl}/users/buildings/${buildingId}/towers`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersTowerDetailApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  towerId: number,
): Observable<UsersTowerDetailResponseEnvelopeUsers> {
  return http.get<UsersTowerDetailResponseEnvelopeUsers>(
    `${apiBaseUrl}/users/buildings/${buildingId}/towers/${towerId}`,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${normalizeToken(token)}`,
      }),
    },
  );
}

export function getUsersTowerFlatsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  towerId: number,
): Observable<UsersTowerFlatsResponseEnvelopeUsers> {
  return http.get<UsersTowerFlatsResponseEnvelopeUsers>(
    `${apiBaseUrl}/users/buildings/${buildingId}/towers/${towerId}/flats`,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${normalizeToken(token)}`,
      }),
    },
  );
}

export function getUsersFlatDetailApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  towerId: number,
  flatId: number,
): Observable<UsersFlatDetailResponseEnvelopeUsers> {
  return http.get<UsersFlatDetailResponseEnvelopeUsers>(
    `${apiBaseUrl}/users/buildings/${buildingId}/towers/${towerId}/flats/${flatId}`,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${normalizeToken(token)}`,
      }),
    },
  );
}

export interface SearchUsersFlatsParams {
  address?: string;
  city?: string;
  state?: string;
  flat_type?: string;
  min_rent?: string | number;
  max_rent?: string | number;
  available_only?: boolean;
  page?: number;
  per_page?: number;
}

export function searchUsersFlatsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  params: SearchUsersFlatsParams,
): Observable<UsersFlatSearchResponseEnvelopeUsers> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });

  return http.get<UsersFlatSearchResponseEnvelopeUsers>(
    `${apiBaseUrl}/users/flats/search?${searchParams.toString()}`,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${normalizeToken(token)}`,
      }),
    },
  );
}

export interface SearchUsersBuildingsParams {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  page?: number;
  per_page?: number;
}

export function searchUsersBuildingsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  params: SearchUsersBuildingsParams,
): Observable<UsersBuildingSearchResponseEnvelopeUsers> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });

  return http.get<UsersBuildingSearchResponseEnvelopeUsers>(
    `${apiBaseUrl}/users/buildings/search?${searchParams.toString()}`,
    {
      headers: new HttpHeaders({
        Authorization: `Bearer ${normalizeToken(token)}`,
      }),
    },
  );
}

export function createUsersFlatBookingApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  flatId: number,
): Observable<UsersCreateBookingResponseEnvelopeUsers> {
  return http.post<UsersCreateBookingResponseEnvelopeUsers>(`${apiBaseUrl}/users/flats/${flatId}/bookings`, {}, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersBookingsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<UsersBookingsResponseEnvelopeUsers> {
  return http.get<UsersBookingsResponseEnvelopeUsers>(`${apiBaseUrl}/users/bookings`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getUsersBookingByIdApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  bookingId: number,
): Observable<UsersBookingDetailResponseEnvelopeUsers> {
  return http.get<UsersBookingDetailResponseEnvelopeUsers>(`${apiBaseUrl}/users/bookings/${bookingId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function updateUsersMeApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  payload: UpdateMeRequestUsers,
): Observable<UserMeResponseEnvelopeUsers> {
  return http.put<UserMeResponseEnvelopeUsers>(`${apiBaseUrl}/users/me`, payload, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function deleteUsersMeApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<DeleteMeResponseEnvelopeUsers> {
  return http.delete<DeleteMeResponseEnvelopeUsers>(`${apiBaseUrl}/users/me`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function updateUsersProfileApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  payload: Partial<UserProfileResponseDataUsers>,
): Observable<UserProfileResponseEnvelopeUsers> {
  return http.put<UserProfileResponseEnvelopeUsers>(`${apiBaseUrl}/users/profile`, payload, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function uploadUsersProfilePictureApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  file: File,
  folder?: string,
): Observable<UserProfileResponseEnvelopeUsers> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  return http.post<UserProfileResponseEnvelopeUsers>(`${apiBaseUrl}/users/profile/picture`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function deleteUsersProfilePictureApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<UserProfileResponseEnvelopeUsers> {
  return http.delete<UserProfileResponseEnvelopeUsers>(`${apiBaseUrl}/users/profile/picture`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}


