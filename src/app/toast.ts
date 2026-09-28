import { Component, ElementRef, effect, inject, signal } from "@angular/core";
import { Store } from "./store";

@Component({
  selector: "ff-toast",
  template: `@if (store.notice()) {
    <div
      class="toast"
      role="status"
      tabindex="0"
      (focusin)="pause()"
      (focusout)="resume($event)"
    >
      <span>{{ store.notice() }}</span>
      @if (store.toastAction(); as action) {
        <button class="text-button toast-undo" (click)="action.run()">
          {{ action.label }}
        </button>
      }
      <button aria-label="Dismiss notification" (click)="store.notify('')">
        ✕
      </button>
      <span
        class="toast-progress"
        aria-hidden="true"
        [style.transform]="'scaleX(' + remaining() / 6000 + ')'"
      ></span>
    </div>
  }`,
})
export class Toast {
  store = inject(Store);
  remaining = signal(6000);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastTick = 0;
  constructor() {
    effect((cleanup) => {
      this.store.noticeVersion();
      const message = this.store.notice();
      this.remaining.set(6000);
      this.lastTick = performance.now();
      if (!message) {
        return;
      }
      const timer = setInterval(() => this.tick(), 50);
      cleanup(() => clearInterval(timer));
    });
  }
  private tick() {
    const now = performance.now();
    if (!this.host.nativeElement.contains(document.activeElement))
      this.remaining.update((value) =>
        Math.max(0, value - (now - this.lastTick)),
      );
    this.lastTick = now;
    if (this.remaining() === 0) this.store.notify("");
  }
  pause() {
    this.tick();
  }
  resume(event: FocusEvent) {
    if (
      (event.currentTarget as HTMLElement).contains(
        event.relatedTarget as Node | null,
      )
    )
      return;
    this.lastTick = performance.now();
  }
}
