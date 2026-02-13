import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { checkHealthAdminsApi } from '../../admins_admins/api_admins';
import { checkHealthMasterApi } from '../../master_master/api_master';
import { checkHealthUsersApi } from '../../users_users/api_users';
import { HealthStatusAdmins } from '../../admins_admins/typescript_admins/type_admins';
import { HealthStatusMaster } from '../../master_master/typescript_master/type_master';
import { HealthStatusUsers } from '../../users_users/typescript_users/type_users';

type CombinedHealthStatus = HealthStatusUsers | HealthStatusAdmins | HealthStatusMaster;

@Component({
  selector: 'app-page-all-health-check',
  standalone: true,
  templateUrl: './page_all_health_check.html',
  styleUrl: './page_all_health_check.css',
})
export class PageAllHealthCheckComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly apiBaseUrl = signal('http://127.0.0.1:5000');
  protected readonly isChecking = signal(false);
  protected readonly checkedAt = signal<string | null>(null);
  protected readonly pageError = signal<string | null>(null);
  protected readonly healthResults = signal<CombinedHealthStatus[]>([]);

  ngOnInit(): void {
    this.runAllHealthChecks();
  }

  protected runAllHealthChecks(): void {
    this.isChecking.set(true);
    this.pageError.set(null);

    forkJoin({
      users: checkHealthUsersApi(this.http, this.apiBaseUrl()),
      admins: checkHealthAdminsApi(this.http, this.apiBaseUrl()),
      master: checkHealthMasterApi(this.http, this.apiBaseUrl()),
    }).subscribe({
      next: (results) => {
        this.healthResults.set([results.users, results.admins, results.master]);
        this.checkedAt.set(new Date().toISOString());
        this.isChecking.set(false);
      },
      error: () => {
        this.pageError.set('All health checks failed unexpectedly.');
        this.isChecking.set(false);
      },
    });
  }
}
