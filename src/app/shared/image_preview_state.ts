import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImagePreviewState {
  readonly imageUrl = signal<string | null>(null);

  open(url: string): void {
    this.imageUrl.set(url);
  }

  close(): void {
    this.imageUrl.set(null);
  }
}
