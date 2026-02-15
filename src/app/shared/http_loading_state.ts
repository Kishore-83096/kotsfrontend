import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HttpLoadingState {
  private readonly pendingRequests = signal(0);
  readonly isLoading = computed(() => this.pendingRequests() > 0);

  begin(): void {
    this.pendingRequests.update((value) => value + 1);
  }

  end(): void {
    this.pendingRequests.update((value) => (value > 0 ? value - 1 : 0));
  }
}


