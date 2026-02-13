import { HealthEnvelopeUsers, HealthStatusUsers } from './typescript_users/type_users';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export function checkHealthUsersApi(
  http: HttpClient,
  apiBaseUrl: string,
): Observable<HealthStatusUsers> {
  return http.get<HealthEnvelopeUsers>(`${apiBaseUrl}/users/health`).pipe(
    map((response) => {
      const result: HealthStatusUsers = {
        module: 'users',
        endpoint: '/users/health',
        isHealthy: response.success,
        httpStatus: response.status_code,
        message: response.message,
        payload: response,
        error: null,
      };

      return result;
    }),
    catchError((error: { status?: number; error?: { message?: string } | string }) => {
      const fallbackMessage = 'Users health endpoint unreachable';
      const message =
        typeof error?.error === 'object' && error.error && 'message' in error.error
          ? (error.error.message ?? fallbackMessage)
          : fallbackMessage;

      const result: HealthStatusUsers = {
        module: 'users',
        endpoint: '/users/health',
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
