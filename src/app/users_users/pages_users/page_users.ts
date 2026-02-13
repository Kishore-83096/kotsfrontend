import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { checkHealthUsersApi } from '../api_users';
import { HealthStatusUsers } from '../typescript_users/type_users';

@Component({
  selector: 'app-page-users',
  standalone: true,
  templateUrl: './page_users.html',
  styleUrl: '../styles_users/style_users.css',
})
export class PageUsersComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly apiBaseUrl = signal('http://127.0.0.1:5000');
  protected readonly isChecking = signal(false);
  protected readonly checkedAt = signal<string | null>(null);
  protected readonly pageError = signal<string | null>(null);
  protected readonly healthResult = signal<HealthStatusUsers | null>(null);

  ngOnInit(): void {
    this.runHealthCheck();
  }

  protected runHealthCheck(): void {
    this.isChecking.set(true);
    this.pageError.set(null);

    checkHealthUsersApi(this.http, this.apiBaseUrl()).subscribe({
      next: (result) => {
        this.healthResult.set(result);
        this.checkedAt.set(new Date().toISOString());
        this.isChecking.set(false);
      },
      error: () => {
        this.pageError.set('Users health check failed unexpectedly.');
        this.isChecking.set(false);
      },
    });
  }
}

