import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, computed, signal } from '@angular/core';

@Component({
  selector: 'app-image-cropper-interactive',
  standalone: true,
  template: `
    @if (isOpen) {
      <section class="cropper-backdrop" (click)="cancel()">
        <article class="cropper-modal" (click)="$event.stopPropagation()">
          <header class="cropper-header">
            <h3>Crop Image (16:9)</h3>
          </header>

          @if (errorMessage(); as error) {
            <p class="cropper-error">{{ error }}</p>
          }

          <div class="cropper-stage">
            @if (sourceImageUrl(); as sourceUrl) {
              <div class="cropper-image-stage" tabindex="0" (keydown)="onStageKeyDown($event)">
                <img
                  #sourceImageEl
                  class="cropper-image"
                  [src]="sourceUrl"
                  alt="Source image"
                  [style.transform]="imageTransform()"
                  [style.width.px]="imageDisplayWidth()"
                  [style.height.px]="imageDisplayHeight()"
                  (load)="onImageRendered()"
                />
                <div
                  #overlayEl
                  class="cropper-overlay"
                  (pointerdown)="onOverlayPointerDown($event)"
                  (wheel)="onOverlayWheel($event)"
                >
                  @if (cropBox(); as box) {
                    <div
                      class="cropper-crop-box"
                      [style.left.px]="box.left"
                      [style.top.px]="box.top"
                      [style.width.px]="box.width"
                      [style.height.px]="box.height"
                    ></div>
                  }
                </div>
              </div>
              <p class="cropper-hint">Drag the image to move it. Scroll or use the slider to zoom. The crop box stays fixed.</p>
            } @else {
              <div class="cropper-empty">Select an image to start cropping.</div>
            }
          </div>

          <div class="cropper-controls">
            <label>
              <span>Zoom</span>
              <input
                type="range"
                [min]="minZoom()"
                max="3"
                step="0.01"
                [value]="zoom()"
                (input)="onZoomInput($any($event.target).value)"
              />
            </label>
          </div>

          <footer class="cropper-actions">
            <button type="button" class="action-btn ghost" (click)="cancel()">Cancel</button>
            <button type="button" class="action-btn primary" (click)="confirmCrop()">Confirm</button>
          </footer>

          <canvas #cropCanvas class="cropper-canvas-hidden"></canvas>
        </article>
      </section>
    }
  `,
  styles: [`
    .cropper-backdrop {
      position: fixed;
      inset: 0;
      background: rgb(30, 23, 16);
      z-index: 1200;
      display: grid;
      place-items: center;
      padding: 1rem;
    }

    .cropper-modal {
      width: min(760px, 100%);
      max-height: 95vh;
      overflow: hidden;
      background: linear-gradient(170deg, #fff 0%, #f8f2e9 100%);
      border: 0;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      padding: 1.1rem;
      color: var(--color-text);
      display: grid;
      gap: 0.85rem;
    }

    .cropper-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-bottom: 0.6rem;
      border-bottom: 1px solid color-mix(in srgb, var(--color-border-soft) 86%, #fff);
    }

    .cropper-header h3 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.45rem;
    }

    .cropper-error {
      margin: 0;
      color: var(--color-danger);
      font-size: 0.95rem;
    }

    .cropper-stage {
      display: grid;
      gap: 0.5rem;
    }

    .cropper-image-stage {
      position: relative;
      width: 100%;
      max-height: 60vh;
      overflow: hidden;
      border-radius: 0.75rem;
      border: 1px solid var(--color-border-soft);
      background: var(--color-surface-muted);
      height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
    }

    .cropper-image {
      position: absolute;
      left: 50%;
      top: 50%;
      display: block;
      max-width: none;
      max-height: none;
      transform-origin: center;
    }

    .cropper-overlay {
      position: absolute;
      inset: 0;
      cursor: grab;
      touch-action: none;
    }

    .cropper-overlay:active {
      cursor: grabbing;
    }

    .cropper-crop-box {
      position: absolute;
      border: 2px solid var(--color-primary);
      box-shadow: 0 0 0 20000px color-mix(in srgb, var(--color-surface) 82%, transparent);
      border-radius: 0.5rem;
      pointer-events: none;
    }

    .cropper-hint {
      margin: 0;
      font-size: 0.9rem;
      color: var(--color-text-soft);
    }

    .cropper-empty {
      padding: 2rem;
      text-align: center;
      color: var(--color-text-soft);
      border: 1px dashed var(--color-border-soft);
      border-radius: 0.75rem;
    }

    .cropper-controls {
      display: grid;
      gap: 0.75rem;
    }

    .cropper-controls label {
      display: grid;
      gap: 0.3rem;
      font-size: 0.9rem;
      color: var(--color-text-soft);
    }

    .cropper-controls input[type='range'] {
      width: 100%;
    }

    .cropper-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .cropper-canvas-hidden {
      display: none;
    }
  `],
})
export class ImageCropperInteractiveComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() sourceFile: File | null = null;
  @Input() aspectRatio = 16 / 9;
  @Input() cropPadding = 24;
  @Input() zoomSensitivity = 0.005;
  @Input() keyboardStep = 10;
  @Input() maxZoom = 3;
  @Output() readonly cancelled = new EventEmitter<void>();
  @Output() readonly cropped = new EventEmitter<File>();

  @ViewChild('cropCanvas') private cropCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sourceImageEl') private sourceImageRef?: ElementRef<HTMLImageElement>;
  @ViewChild('overlayEl') private overlayRef?: ElementRef<HTMLDivElement>;

  protected readonly sourceImageUrl = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly displayWidth = signal(0);
  protected readonly displayHeight = signal(0);
  protected readonly cropBoxSize = signal<{ width: number; height: number } | null>(null);
  protected readonly imageDisplayWidth = signal(0);
  protected readonly imageDisplayHeight = signal(0);

  protected readonly zoom = signal(1);
  protected readonly panXPercent = signal(0);
  protected readonly panYPercent = signal(0);

  protected readonly minZoom = computed(() => {
    const box = this.cropBoxSize();
    const imageWidth = this.imageDisplayWidth();
    const imageHeight = this.imageDisplayHeight();
    if (!box || !imageWidth || !imageHeight) {
      return 1;
    }
    const minX = box.width / imageWidth;
    const minY = box.height / imageHeight;
    return Math.max(1, minX, minY);
  });

  protected readonly cropBox = computed(() => {
    const box = this.cropBoxSize();
    const width = this.displayWidth();
    const height = this.displayHeight();
    if (!box || !width || !height) {
      return null;
    }
    return {
      left: width / 2 - box.width / 2,
      top: height / 2 - box.height / 2,
      width: box.width,
      height: box.height,
    };
  });

  protected readonly imageTransform = computed(() => {
    const pan = this.getPanPixels();
    return `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${this.zoom()})`;
  });

  private sourceImageObjectUrl: string | null = null;
  private sourceImage: HTMLImageElement | null = null;
  private sourceWidth = 0;
  private sourceHeight = 0;
  private activePointerId: number | null = null;
  private dragStartClientX = 0;
  private dragStartClientY = 0;
  private dragStartPanX = 0;
  private dragStartPanY = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sourceFile']) {
      void this.prepareSourceImage();
    }

    if (changes['isOpen']?.currentValue) {
      setTimeout(() => this.updatePreview(), 0);
      setTimeout(() => this.syncDisplayMetrics(), 0);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
    this.detachDragListeners();
  }

  protected onImageRendered(): void {
    this.syncDisplayMetrics();
    this.updatePreview();
  }

  protected onZoomInput(rawValue: string): void {
    const parsed = Number(rawValue);
    const minZoom = this.minZoom();
    const next = Number.isFinite(parsed) ? this.clamp(parsed, minZoom, this.maxZoom) : minZoom;
    this.zoom.set(next);
    this.clampPanWithinBounds();
    this.updatePreview();
  }

  protected onOverlayWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!this.sourceImage) {
      return;
    }
    const minZoom = this.minZoom();
    const next = this.clamp(this.zoom() - event.deltaY * this.zoomSensitivity, minZoom, this.maxZoom);
    this.zoom.set(next);
    this.clampPanWithinBounds();
    this.updatePreview();
  }

  protected onStageKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }

    const max = this.getMaxPanPixels();
    if (!max) {
      return;
    }

    let deltaX = 0;
    let deltaY = 0;
    if (key === 'ArrowLeft') {
      deltaX = -this.keyboardStep;
    } else if (key === 'ArrowRight') {
      deltaX = this.keyboardStep;
    } else if (key === 'ArrowUp') {
      deltaY = -this.keyboardStep;
    } else if (key === 'ArrowDown') {
      deltaY = this.keyboardStep;
    }

    const panX = max.x ? this.clamp(this.getPanPixels().x + deltaX, -max.x, max.x) : 0;
    const panY = max.y ? this.clamp(this.getPanPixels().y + deltaY, -max.y, max.y) : 0;

    this.panXPercent.set(max.x ? (panX / max.x) * 100 : 0);
    this.panYPercent.set(max.y ? (panY / max.y) * 100 : 0);
    this.updatePreview();
    event.preventDefault();
  }

  protected onOverlayPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !this.sourceImage) {
      return;
    }

    const overlay = this.overlayRef?.nativeElement;
    if (!overlay) {
      return;
    }

    this.activePointerId = event.pointerId;
    this.dragStartClientX = event.clientX;
    this.dragStartClientY = event.clientY;
    this.dragStartPanX = this.panXPercent();
    this.dragStartPanY = this.panYPercent();
    overlay.setPointerCapture?.(event.pointerId);
    this.attachDragListeners();
    event.preventDefault();
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected confirmCrop(): void {
    if (!this.sourceImage || !this.sourceFile) {
      this.errorMessage.set('Please select an image first.');
      return;
    }

    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) {
      this.errorMessage.set('Cropper canvas is not available.');
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.errorMessage.set('Unable to generate cropped image.');
          return;
        }

        const sourceName = this.sourceFile?.name ?? 'image';
        const dotIndex = sourceName.lastIndexOf('.');
        const baseName = dotIndex > 0 ? sourceName.slice(0, dotIndex) : sourceName;
        const mimeType = blob.type || this.sourceFile?.type || 'image/jpeg';
        const extension = mimeType.includes('png') ? 'png' : 'jpg';

        const croppedFile = new File([blob], `${baseName}-cropped.${extension}`, {
          type: mimeType,
          lastModified: Date.now(),
        });

        this.cropped.emit(croppedFile);
      },
      this.sourceFile.type || 'image/jpeg',
      0.92,
    );
  }

  private async prepareSourceImage(): Promise<void> {
    this.errorMessage.set(null);
    this.zoom.set(1);
    this.panXPercent.set(0);
    this.panYPercent.set(0);

    const file = this.sourceFile;
    if (!file) {
      this.sourceImage = null;
      this.sourceWidth = 0;
      this.sourceHeight = 0;
      this.sourceImageUrl.set(null);
      this.revokeObjectUrl();
      return;
    }

    this.revokeObjectUrl();
    this.sourceImageObjectUrl = URL.createObjectURL(file);

    const image = new Image();
    image.src = this.sourceImageObjectUrl;

    try {
      await image.decode();
      this.sourceImage = image;
      this.sourceWidth = image.naturalWidth;
      this.sourceHeight = image.naturalHeight;
      this.sourceImageUrl.set(this.sourceImageObjectUrl);
      setTimeout(() => this.syncDisplayMetrics(), 0);
      setTimeout(() => this.updatePreview(), 0);
    } catch {
      this.sourceImage = null;
      this.sourceWidth = 0;
      this.sourceHeight = 0;
      this.errorMessage.set('Unable to load selected image.');
    }
  }

  private syncDisplayMetrics(): void {
    const overlay = this.overlayRef?.nativeElement;
    if (!overlay || !this.sourceWidth || !this.sourceHeight) {
      return;
    }
    const width = overlay.clientWidth;
    const height = overlay.clientHeight;
    if (!width || !height) {
      return;
    }

    this.displayWidth.set(width);
    this.displayHeight.set(height);

    const baseScale = Math.min(width / this.sourceWidth, height / this.sourceHeight);
    this.imageDisplayWidth.set(this.sourceWidth * baseScale);
    this.imageDisplayHeight.set(this.sourceHeight * baseScale);

    const maxWidth = Math.max(0, width - this.cropPadding * 2);
    const maxHeight = Math.max(0, height - this.cropPadding * 2);
    let boxWidth = Math.min(maxWidth, maxHeight * this.aspectRatio);
    let boxHeight = boxWidth / this.aspectRatio;
    if (boxHeight > maxHeight) {
      boxHeight = maxHeight;
      boxWidth = boxHeight * this.aspectRatio;
    }
    this.cropBoxSize.set({ width: boxWidth, height: boxHeight });

    const minZoom = this.minZoom();
    if (this.zoom() < minZoom) {
      this.zoom.set(minZoom);
    }
    this.clampPanWithinBounds();
  }

  private updatePreview(): void {
    if (!this.isOpen || !this.sourceImage || !this.sourceWidth || !this.sourceHeight) {
      return;
    }

    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const { sx, sy, sw, sh } = this.buildCropRect();
    const outputWidth = Math.max(1600, Math.round(sw));
    const outputHeight = Math.max(900, Math.round(outputWidth / this.aspectRatio));

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.errorMessage.set('Unable to initialize cropper preview.');
      return;
    }

    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(this.sourceImage, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
  }

  private buildCropRect(): { sx: number; sy: number; sw: number; sh: number } {
    const displayWidth = this.displayWidth();
    const displayHeight = this.displayHeight();
    const box = this.cropBoxSize();
    const imageWidth = this.imageDisplayWidth();
    const imageHeight = this.imageDisplayHeight();
    if (!displayWidth || !displayHeight || !box || !this.sourceWidth || !this.sourceHeight) {
      return { sx: 0, sy: 0, sw: this.sourceWidth, sh: this.sourceHeight };
    }

    const zoom = this.zoom();
    const baseScale = imageWidth / this.sourceWidth;
    const scaledWidth = imageWidth * zoom;
    const scaledHeight = imageHeight * zoom;
    const pan = this.getPanPixels();

    const imageLeft = displayWidth / 2 - scaledWidth / 2 + pan.x;
    const imageTop = displayHeight / 2 - scaledHeight / 2 + pan.y;
    const cropLeft = displayWidth / 2 - box.width / 2;
    const cropTop = displayHeight / 2 - box.height / 2;
    const factor = baseScale * zoom;

    let sx = (cropLeft - imageLeft) / factor;
    let sy = (cropTop - imageTop) / factor;
    const sw = box.width / factor;
    const sh = box.height / factor;

    sx = this.clamp(sx, 0, Math.max(0, this.sourceWidth - sw));
    sy = this.clamp(sy, 0, Math.max(0, this.sourceHeight - sh));

    return { sx, sy, sw, sh };
  }

  private getPanPixels(): { x: number; y: number } {
    const max = this.getMaxPanPixels();
    if (!max) {
      return { x: 0, y: 0 };
    }
    return {
      x: (this.panXPercent() / 100) * max.x,
      y: (this.panYPercent() / 100) * max.y,
    };
  }

  private getMaxPanPixels(): { x: number; y: number } | null {
    const width = this.displayWidth();
    const height = this.displayHeight();
    const box = this.cropBoxSize();
    const imageWidth = this.imageDisplayWidth();
    const imageHeight = this.imageDisplayHeight();
    if (!width || !height || !box) {
      return null;
    }
    if (!imageWidth || !imageHeight) {
      return null;
    }
    const scaledWidth = imageWidth * this.zoom();
    const scaledHeight = imageHeight * this.zoom();
    const maxX = Math.max(0, (scaledWidth - box.width) / 2);
    const maxY = Math.max(0, (scaledHeight - box.height) / 2);
    return { x: maxX, y: maxY };
  }

  private clampPanWithinBounds(): void {
    const max = this.getMaxPanPixels();
    if (!max || max.x === 0) {
      this.panXPercent.set(0);
    } else {
      this.panXPercent.set(this.clamp(this.panXPercent(), -100, 100));
    }

    if (!max || max.y === 0) {
      this.panYPercent.set(0);
    } else {
      this.panYPercent.set(this.clamp(this.panYPercent(), -100, 100));
    }
  }

  private attachDragListeners(): void {
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerEnd);
    document.addEventListener('pointercancel', this.handlePointerEnd);
  }

  private detachDragListeners(): void {
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerEnd);
    document.removeEventListener('pointercancel', this.handlePointerEnd);
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.activePointerId === null || event.pointerId !== this.activePointerId) {
      return;
    }

    const max = this.getMaxPanPixels();
    if (!max || (!max.x && !max.y)) {
      return;
    }

    const deltaX = event.clientX - this.dragStartClientX;
    const deltaY = event.clientY - this.dragStartClientY;

    const panX = max.x ? this.clamp((this.dragStartPanX / 100) * max.x + deltaX, -max.x, max.x) : 0;
    const panY = max.y ? this.clamp((this.dragStartPanY / 100) * max.y + deltaY, -max.y, max.y) : 0;

    this.panXPercent.set(max.x ? (panX / max.x) * 100 : 0);
    this.panYPercent.set(max.y ? (panY / max.y) * 100 : 0);
    this.updatePreview();
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (this.activePointerId === null || event.pointerId !== this.activePointerId) {
      return;
    }
    this.activePointerId = null;
    this.detachDragListeners();
  };

  private revokeObjectUrl(): void {
    if (this.sourceImageObjectUrl) {
      URL.revokeObjectURL(this.sourceImageObjectUrl);
      this.sourceImageObjectUrl = null;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
