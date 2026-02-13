import {
  CreateAdminRequestMaster,
  HealthEnvelopeMaster,
  HealthStatusMaster,
  MasterAdminDetailResponseEnvelope,
  MasterAdminsResponseEnvelope,
  MasterCreateAdminResponseEnvelope,
} from './typescript_master/type_master';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

function normalizeToken(token: string): string {
  const trimmed = token.trim();
  return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice(7).trim() : trimmed;
}

export function checkHealthMasterApi(
  http: HttpClient,
  apiBaseUrl: string,
): Observable<HealthStatusMaster> {
  return http.get<HealthEnvelopeMaster>(`${apiBaseUrl}/master/health`).pipe(
    map((response) => {
      const result: HealthStatusMaster = {
        module: 'master',
        endpoint: '/master/health',
        isHealthy: response.success,
        httpStatus: response.status_code,
        message: response.message,
        payload: response,
        error: null,
      };

      return result;
    }),
    catchError((error: { status?: number; error?: { message?: string } | string }) => {
      const fallbackMessage = 'Master health endpoint unreachable';
      const message =
        typeof error?.error === 'object' && error.error && 'message' in error.error
          ? (error.error.message ?? fallbackMessage)
          : fallbackMessage;

      const result: HealthStatusMaster = {
        module: 'master',
        endpoint: '/master/health',
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

export function getMasterAdminsApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  page = 1,
  perPage = 10,
): Observable<MasterAdminsResponseEnvelope> {
  return http.get<MasterAdminsResponseEnvelope>(`${apiBaseUrl}/master/admins`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
    params: {
      page,
      per_page: perPage,
    },
  });
}

export function createMasterAdminApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  payload: CreateAdminRequestMaster,
): Observable<MasterCreateAdminResponseEnvelope> {
  return http.post<MasterCreateAdminResponseEnvelope>(`${apiBaseUrl}/master/create-admin`, payload, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}

export function getMasterAdminByIdApi(
  http: HttpClient,
  apiBaseUrl: string,
  token: string,
  adminId: number,
): Observable<MasterAdminDetailResponseEnvelope> {
  return http.get<MasterAdminDetailResponseEnvelope>(`${apiBaseUrl}/master/admins/${adminId}`, {
    headers: new HttpHeaders({
      Authorization: `Bearer ${normalizeToken(token)}`,
    }),
  });
}
