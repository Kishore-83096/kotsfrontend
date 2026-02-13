import { Injectable, signal } from '@angular/core';
import { LoginResponseEnvelopeUsers } from './typescript_users/type_users';

const ACCESS_TOKEN_KEY = 'kots_users_access_token';
const LAST_LOGIN_RESULT_KEY = 'kots_users_last_login_result';

@Injectable({ providedIn: 'root' })
export class UsersAuthState {
  readonly accessToken = signal<string | null>(this.readAccessToken());
  readonly lastLoginResult = signal<LoginResponseEnvelopeUsers | null>(this.readLastLoginResult());

  setLoginResult(result: LoginResponseEnvelopeUsers): void {
    this.lastLoginResult.set(result);
    this.accessToken.set(result.data.token);
    localStorage.setItem(LAST_LOGIN_RESULT_KEY, JSON.stringify(result));
    localStorage.setItem(ACCESS_TOKEN_KEY, result.data.token);
  }

  clearLoginResult(): void {
    this.lastLoginResult.set(null);
    localStorage.removeItem(LAST_LOGIN_RESULT_KEY);
  }

  clearAuth(): void {
    this.accessToken.set(null);
    this.lastLoginResult.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LAST_LOGIN_RESULT_KEY);
  }

  private readAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private readLastLoginResult(): LoginResponseEnvelopeUsers | null {
    const raw = localStorage.getItem(LAST_LOGIN_RESULT_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginResponseEnvelopeUsers;
    } catch {
      return null;
    }
  }
}
