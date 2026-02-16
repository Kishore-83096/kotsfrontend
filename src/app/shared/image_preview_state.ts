import { Injectable, computed, signal } from '@angular/core';

export type ImagePreviewItem = {
  url: string;
  name?: string;
};

@Injectable({ providedIn: 'root' })
export class ImagePreviewState {
  readonly items = signal<ImagePreviewItem[]>([]);
  readonly currentIndex = signal(0);
  readonly imageUrl = computed<string | null>(() => {
    const list = this.items();
    if (!list.length) {
      return null;
    }
    const index = this.normalizeIndex(this.currentIndex(), list.length);
    return list[index]?.url ?? null;
  });
  readonly imageName = computed<string | null>(() => {
    const list = this.items();
    if (!list.length) {
      return null;
    }
    const index = this.normalizeIndex(this.currentIndex(), list.length);
    return list[index]?.name ?? null;
  });
  readonly totalCount = computed(() => this.items().length);
  readonly hasMultiple = computed(() => this.items().length > 1);

  open(url: string, name?: string): void {
    const normalizedUrl = (url ?? '').trim();
    if (!normalizedUrl) {
      return;
    }
    this.items.set([{ url: normalizedUrl, ...(name ? { name } : {}) }]);
    this.currentIndex.set(0);
  }

  openGallery(items: ImagePreviewItem[], startIndex = 0): void {
    const normalizedItems = (items ?? [])
      .map((item) => ({
        url: (item?.url ?? '').trim(),
        name: (item?.name ?? '').trim() || undefined,
      }))
      .filter((item) => item.url.length > 0);

    if (!normalizedItems.length) {
      this.close();
      return;
    }

    this.items.set(normalizedItems);
    this.currentIndex.set(this.normalizeIndex(startIndex, normalizedItems.length));
  }

  previous(): void {
    const count = this.items().length;
    if (count <= 1) {
      return;
    }
    this.currentIndex.set((this.currentIndex() - 1 + count) % count);
  }

  next(): void {
    const count = this.items().length;
    if (count <= 1) {
      return;
    }
    this.currentIndex.set((this.currentIndex() + 1) % count);
  }

  close(): void {
    this.items.set([]);
    this.currentIndex.set(0);
  }

  private normalizeIndex(index: number, length: number): number {
    if (!Number.isInteger(index) || length <= 0) {
      return 0;
    }
    return ((index % length) + length) % length;
  }
}


