import { Component, DestroyRef, Service, inject, signal } from "@angular/core";
import { Icon } from "./icon";
import { Store, readPreference } from "./store";
import { DatePipe } from "@angular/common";
@Service()
export class ChromeState {
  store = inject(Store);
  private systemTheme = matchMedia("(prefers-color-scheme: dark)");
  private savedTheme = readPreference("ff-dark");
  private followsSystem =
    this.savedTheme !== "true" && this.savedTheme !== "false";
  dark = signal(
    this.followsSystem ? this.systemTheme.matches : this.savedTheme === "true",
  );
  menu = signal(false);
  notifications = signal(false);
  toggleNotifications() {
    if (!this.notifications()) this.store.readNotifications();
    this.notifications.update((open) => !open);
  }
  constructor() {
    document.documentElement.classList.toggle("dark", this.dark());
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      if (!this.followsSystem) return;
      this.dark.set(event.matches);
      document.documentElement.classList.toggle("dark", this.dark());
    };
    this.systemTheme.addEventListener("change", onSystemThemeChange);
    inject(DestroyRef).onDestroy(() =>
      this.systemTheme.removeEventListener("change", onSystemThemeChange),
    );
  }
  toggleTheme() {
    this.followsSystem = false;
    this.dark.update((value) => !value);
    document.documentElement.classList.toggle("dark", this.dark());
    try {
      localStorage.setItem("ff-dark", String(this.dark()));
    } catch {}
  }
  openMenu() {
    this.menu.set(true);
    requestAnimationFrame(() =>
      document.getElementById("close-navigation")?.focus(),
    );
  }
}
@Component({
  selector: "ff-header-actions",
  imports: [Icon, DatePipe],
  template: `<div class="header-actions">
    <button
      class="icon-button"
      (click)="ui.toggleTheme()"
      [attr.aria-label]="
        ui.dark() ? 'Switch to light mode' : 'Switch to dark mode'
      "
    >
      <ff-icon [name]="ui.dark() ? 'moon' : 'sun'" />
    </button>
    <div class="relative notification-menu">
      <button
        class="icon-button notification-bell"
        [attr.aria-label]="
          ui.store.hasUnreadNotifications()
            ? 'Notifications, unread messages'
            : 'Notifications'
        "
        [attr.aria-expanded]="ui.notifications()"
        aria-controls="notification-history"
        (click)="ui.toggleNotifications()"
      >
        <ff-icon name="bell" />
        @if (ui.store.hasUnreadNotifications()) {
          <span class="notification-dot" aria-hidden="true"></span>
        }
      </button>
      @if (ui.notifications()) {
        <div
          class="popover notification"
          id="notification-history"
          role="region"
          aria-label="Notifications"
        >
          <strong>Notifications</strong>
          @if (ui.store.notificationHistory().length) {
            <ul class="notification-list">
              @for (record of ui.store.notificationHistory(); track record.id) {
                <li [class.notification-new]="record.highlighted">
                  @if (record.highlighted) {
                    <span class="notification-new-label">New</span>
                  }
                  <p>{{ record.message }}</p>
                  <time [attr.datetime]="record.createdAt">{{
                    record.createdAt | date: "MMM d, h:mm a"
                  }}</time>
                </li>
              }
            </ul>
          } @else {
            <p>
              You’re all caught up. Messages from this session will appear here.
            </p>
          }
        </div>
      }
    </div>
  </div>`,
})
export class HeaderActions {
  ui = inject(ChromeState);
}
