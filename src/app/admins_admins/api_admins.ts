import {
  AdminBuildingAmenitiesResponseEnvelopeAdmins,
  AdminCreateFlatResponseEnvelopeAdmins,
  AdminCreateAmenityResponseEnvelopeAdmins,
  AdminUpdateAmenityResponseEnvelopeAdmins,
  AdminDeleteAmenityResponseEnvelopeAdmins,
  AdminSetFlatAmenitiesResponseEnvelopeAdmins,
  AdminBookingsListResponseEnvelopeAdmins,
  AdminBookingDetailResponseEnvelopeAdmins,
  AdminUpdateBookingStatusResponseEnvelopeAdmins,
  AdminDeleteFlatResponseEnvelopeAdmins,
  AdminBuildingTowersResponseEnvelopeAdmins,
  AdminBuildingDetailResponseEnvelopeAdmins,
  AdminFlatDetailResponseEnvelopeAdmins,
  AdminCreateTowerResponseEnvelopeAdmins,
  AdminBuildingsListResponseEnvelopeAdmins,
  AdminCreateBuildingResponseEnvelopeAdmins,
  AdminDeleteBuildingResponseEnvelopeAdmins,
  AdminDeleteTowerResponseEnvelopeAdmins,
  AdminTowerFlatsResponseEnvelopeAdmins,
  AdminTowerDetailResponseEnvelopeAdmins,
  AdminUpdateFlatResponseEnvelopeAdmins,
  AdminUpdateTowerResponseEnvelopeAdmins,
  AdminUpdateBuildingResponseEnvelopeAdmins,
  CreateAmenityRequestAdmins,
  UpdateAmenityRequestAdmins,
  CreateFlatRequestAdmins,
  CreateTowerRequestAdmins,
  CreateBuildingRequestAdmins,
  HealthEnvelopeAdmins,
  HealthStatusAdmins,
  UpdateFlatRequestAdmins,
  SetFlatAmenitiesRequestAdmins,
  UpdateBookingStatusRequestAdmins,
  UpdateBuildingRequestAdmins,
  UpdateTowerRequestAdmins,
} from './typescript_admins/type_admins';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

function normalizeToken(token: string): string {
  const trimmed = token.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice(7).trim() : trimmed;
}

export function checkHealthAdminsApi(
  http: HttpClient,
  apiBaseUrl: string,
): Observable<HealthStatusAdmins> {
  return http.get<HealthEnvelopeAdmins>(`${apiBaseUrl}/admins/health`).pipe(
    map((response) => {
      const result: HealthStatusAdmins = {
        module: 'admins',
        endpoint: '/admins/health',
        isHealthy: response.success,
        httpStatus: response.status_code,
        message: response.message,
        payload: response,
        error: null,
      };

      return result;
    }),
    catchError((error: { status?: number; error?: { message?: string } | string }) => {
      const fallbackMessage = 'Admins health endpoint unreachable';
      const message =
        typeof error?.error === 'object' && error.error && 'message' in error.error
          ? (error.error.message ?? fallbackMessage)
          : fallbackMessage;

      const result: HealthStatusAdmins = {
        module: 'admins',
        endpoint: '/admins/health',
        isHealthy: false,
        httpStatus: error?.status ?? null,
        message,
        payload: null,
        error: message,
      };

      return of(result);
    }),
  );
}

export function getAdminMyBuildingsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<AdminBuildingsListResponseEnvelopeAdmins> {
  return http.get<AdminBuildingsListResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/my`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminBuildingByIdApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
): Observable<AdminBuildingDetailResponseEnvelopeAdmins> {
  return http.get<AdminBuildingDetailResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function createAdminBuildingApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  payload: CreateBuildingRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminCreateBuildingResponseEnvelopeAdmins> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('address', payload.address);
  formData.append('city', payload.city);
  formData.append('state', payload.state);
  formData.append('pincode', payload.pincode);

  if (payload.total_towers !== undefined && payload.total_towers !== null) {
    formData.append('total_towers', String(payload.total_towers));
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.post<AdminCreateBuildingResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function updateAdminBuildingApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  payload: UpdateBuildingRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminUpdateBuildingResponseEnvelopeAdmins> {
  const formData = new FormData();
  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }
  if (payload.address !== undefined) {
    formData.append('address', payload.address);
  }
  if (payload.city !== undefined) {
    formData.append('city', payload.city);
  }
  if (payload.state !== undefined) {
    formData.append('state', payload.state);
  }
  if (payload.pincode !== undefined) {
    formData.append('pincode', payload.pincode);
  }
  if (payload.total_towers !== undefined && payload.total_towers !== null) {
    formData.append('total_towers', String(payload.total_towers));
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.put<AdminUpdateBuildingResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function deleteAdminBuildingApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
): Observable<AdminDeleteBuildingResponseEnvelopeAdmins> {
  return http.delete<AdminDeleteBuildingResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function createAdminTowerApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  payload: CreateTowerRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminCreateTowerResponseEnvelopeAdmins> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('floors', String(payload.floors));
  if (payload.total_flats !== undefined && payload.total_flats !== null) {
    formData.append('total_flats', String(payload.total_flats));
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.post<AdminCreateTowerResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}/towers`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminBuildingTowersApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
): Observable<AdminBuildingTowersResponseEnvelopeAdmins> {
  return http.get<AdminBuildingTowersResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}/towers`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminTowerByIdApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  towerId: number,
): Observable<AdminTowerDetailResponseEnvelopeAdmins> {
  return http.get<AdminTowerDetailResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}/towers/${towerId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function updateAdminTowerApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  towerId: number,
  payload: UpdateTowerRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminUpdateTowerResponseEnvelopeAdmins> {
  const formData = new FormData();
  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }
  if (payload.floors !== undefined && payload.floors !== null) {
    formData.append('floors', String(payload.floors));
  }
  if (payload.total_flats !== undefined && payload.total_flats !== null) {
    formData.append('total_flats', String(payload.total_flats));
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.put<AdminUpdateTowerResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/towers/${towerId}`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function deleteAdminTowerApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  towerId: number,
): Observable<AdminDeleteTowerResponseEnvelopeAdmins> {
  return http.delete<AdminDeleteTowerResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/towers/${towerId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function createAdminFlatApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  towerId: number,
  payload: CreateFlatRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminCreateFlatResponseEnvelopeAdmins> {
  const formData = new FormData();
  formData.append('flat_number', payload.flat_number);
  formData.append('floor_number', String(payload.floor_number));
  formData.append('bhk_type', payload.bhk_type);
  formData.append('area_sqft', String(payload.area_sqft));
  formData.append('rent_amount', String(payload.rent_amount));
  formData.append('security_deposit', String(payload.security_deposit));
  if (payload.is_available !== undefined) {
    formData.append('is_available', String(payload.is_available));
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.post<AdminCreateFlatResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/towers/${towerId}/flats`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminTowerFlatsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  towerId: number,
): Observable<AdminTowerFlatsResponseEnvelopeAdmins> {
  return http.get<AdminTowerFlatsResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/towers/${towerId}/flats`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminFlatByIdApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  towerId: number,
  flatId: number,
): Observable<AdminFlatDetailResponseEnvelopeAdmins> {
  return http.get<AdminFlatDetailResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/towers/${towerId}/flats/${flatId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function updateAdminFlatApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  flatId: number,
  payload: UpdateFlatRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminUpdateFlatResponseEnvelopeAdmins> {
  const formData = new FormData();
  if (payload.flat_number !== undefined) {
    formData.append('flat_number', payload.flat_number);
  }
  if (payload.floor_number !== undefined && payload.floor_number !== null) {
    formData.append('floor_number', String(payload.floor_number));
  }
  if (payload.bhk_type !== undefined) {
    formData.append('bhk_type', payload.bhk_type);
  }
  if (payload.area_sqft !== undefined && payload.area_sqft !== null) {
    formData.append('area_sqft', String(payload.area_sqft));
  }
  if (payload.rent_amount !== undefined && payload.rent_amount !== null) {
    formData.append('rent_amount', String(payload.rent_amount));
  }
  if (payload.security_deposit !== undefined && payload.security_deposit !== null) {
    formData.append('security_deposit', String(payload.security_deposit));
  }
  if (payload.is_available !== undefined) {
    formData.append('is_available', String(payload.is_available));
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.put<AdminUpdateFlatResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/flats/${flatId}`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function deleteAdminFlatApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  flatId: number,
): Observable<AdminDeleteFlatResponseEnvelopeAdmins> {
  return http.delete<AdminDeleteFlatResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/flats/${flatId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function createAdminAmenityApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
  payload: CreateAmenityRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminCreateAmenityResponseEnvelopeAdmins> {
  const formData = new FormData();
  formData.append('name', payload.name);
  if (payload.description !== undefined && payload.description !== null) {
    formData.append('description', payload.description);
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.post<AdminCreateAmenityResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}/amenities`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminBuildingAmenitiesApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  buildingId: number,
): Observable<AdminBuildingAmenitiesResponseEnvelopeAdmins> {
  return http.get<AdminBuildingAmenitiesResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/buildings/${buildingId}/amenities`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function updateAdminAmenityApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  amenityId: number,
  payload: UpdateAmenityRequestAdmins,
  file?: File | null,
  folder?: string,
): Observable<AdminUpdateAmenityResponseEnvelopeAdmins> {
  const formData = new FormData();
  if (payload.name !== undefined) {
    formData.append('name', payload.name);
  }
  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }
  if (file) {
    formData.append('file', file);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return http.put<AdminUpdateAmenityResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/amenities/${amenityId}`, formData, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function deleteAdminAmenityApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  amenityId: number,
): Observable<AdminDeleteAmenityResponseEnvelopeAdmins> {
  return http.delete<AdminDeleteAmenityResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/amenities/${amenityId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function setAdminFlatAmenitiesApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  flatId: number,
  payload: SetFlatAmenitiesRequestAdmins,
): Observable<AdminSetFlatAmenitiesResponseEnvelopeAdmins> {
  return http.put<AdminSetFlatAmenitiesResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/flats/${flatId}/amenities`, payload, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminBookingsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
): Observable<AdminBookingsListResponseEnvelopeAdmins> {
  return http.get<AdminBookingsListResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/bookings`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getAdminBookingByIdApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  bookingId: number,
): Observable<AdminBookingDetailResponseEnvelopeAdmins> {
  return http.get<AdminBookingDetailResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/bookings/${bookingId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function updateAdminBookingStatusApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  bookingId: number,
  payload: UpdateBookingStatusRequestAdmins,
): Observable<AdminUpdateBookingStatusResponseEnvelopeAdmins> {
  return http.put<AdminUpdateBookingStatusResponseEnvelopeAdmins>(`${apiBaseUrl}/admins/bookings/${bookingId}/status`, payload, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}
