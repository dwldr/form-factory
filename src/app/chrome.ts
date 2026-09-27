import { Component, Service, inject, signal } from "@angular/core";
import { Icon } from "./icon";
import { readPreference } from "./store";
@Service()
export class ChromeState {
  dark = signal(readPreference("ff-dark") === "true");
  menu = signal(false);
  notifications = signal(false);
  constructor() {
    document.documentElement.classList.toggle("dark", this.dark());
  }
  toggleTheme() {
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
  imports: [Icon],
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
    <div class="relative">
      <button
        class="icon-button"
        aria-label="Notifications"
        [attr.aria-expanded]="ui.notifications()"
        (click)="ui.notifications.set(!ui.notifications())"
      >
        <ff-icon name="bell" />
      </button>
      @if (ui.notifications()) {
        <div class="popover notification">
          <strong>You’re all caught up</strong>
          <p>New response notifications will appear here.</p>
        </div>
      }
    </div>
  </div>`,
})
export class HeaderActions {
  ui = inject(ChromeState);
}
