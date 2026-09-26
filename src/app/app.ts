import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd } from "@angular/router";
import { AccessibilityAudit } from "./accessibility-audit";
import { isDevMode } from "@angular/core";
import { Icon } from "./icon";
import { Component, inject, signal } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { Store, readPreference } from "./store";
@Component({
  selector: "app-root",
  host: { "(keydown)": "handleKey($event)" },
  imports: [
    AccessibilityAudit,
    Icon,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
  ],
  template: `
    @if (audit) {
      <ff-accessibility-audit />
    }
    <a class="skip-link" href="#main" (click)="skip($event)">Skip to content</a>
    @if (banner()) {
      <div class="demo-banner" role="region" aria-label="Demo information">
        <span
          ><strong>You’re exploring a demo.</strong> Changes are saved in this
          browser only.</span
        >
        <div class="flex gap-4 items-center">
          <button (click)="reset()">Reset demo data</button
          ><button aria-label="Dismiss demo banner" (click)="dismiss()">
            ✕
          </button>
        </div>
      </div>
    }
    <div class="app-shell" [class.mobile-open]="menu()">
      <aside
        class="sidebar"
        id="sidebar"
        [attr.role]="menu() ? 'dialog' : null"
        [attr.aria-modal]="menu() ? true : null"
        [attr.aria-label]="menu() ? 'Navigation' : null"
      >
        @if (menu()) {
          <button
            id="close-navigation"
            class="close-navigation icon-button"
            aria-label="Close navigation"
            (click)="closeMenu()"
          >
            ×
          </button>
        }
        <a routerLink="/" class="brand" aria-label="Form Factory home"
          ><img
            [ngSrc]="dark() ? '/brand-white-yellow.svg' : '/brand-black.svg'"
            width="142"
            height="53"
            alt="Form Factory"
            priority
        /></a>
        <nav aria-label="Main navigation">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              [routerLinkActiveOptions]="{ exact: item.path === '/' }"
              (click)="menu.set(false)"
              ><ff-icon [name]="item.icon" />{{ item.label }}</a
            >
          }
          <p class="nav-caption">TEAM</p>
          <a
            routerLink="/settings"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            (click)="menu.set(false)"
            ><ff-icon name="settings" />Team Settings</a
          ><a
            routerLink="/members"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            (click)="menu.set(false)"
            ><ff-icon name="users" />Members</a
          >
        </nav>
        <div class="user-area">
          @if (profile()) {
            <div class="popover">
              <strong>Derek Wilder</strong>
              <p>derek@example.com</p>
              <p>Administrator · Demo workspace</p>
              <button class="text-button" (click)="reset()">
                Reset demo data
              </button>
              <a routerLink="/settings" (click)="profile.set(false)"
                >Workspace settings →</a
              >
            </div>
          }
          <button
            class="user-button"
            (click)="profile.set(!profile())"
            [attr.aria-expanded]="profile()"
          >
            <span class="avatar">DW</span
            ><span><strong>Derek</strong><small>derek@example.com</small></span
            ><span>⌄</span>
          </button>
        </div>
      </aside>
      <div class="workspace" [inert]="menu()">
        <header class="topbar">
          <button
            class="mobile-toggle icon-button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="menu()"
            (click)="openMenu()"
            aria-controls="sidebar"
          >
            ☰</button
          ><label class="search"
            ><ff-icon name="search" /><input
              aria-label="Search forms"
              placeholder="Search forms…"
              [value]="store.query()"
              (input)="search($event)"
          /></label>
          <div class="flex items-center gap-3">
            <button
              class="icon-button"
              (click)="toggleTheme()"
              [attr.aria-label]="
                dark() ? 'Switch to light mode' : 'Switch to dark mode'
              "
            >
              <ff-icon [name]="dark() ? 'moon' : 'sun'" />
            </button>
            <div class="relative">
              <button
                class="icon-button"
                aria-label="Notifications"
                [attr.aria-expanded]="notifications()"
                (click)="notifications.set(!notifications())"
              >
                <ff-icon name="bell" />
              </button>
              @if (notifications()) {
                <div class="popover notification">
                  <strong>You’re all caught up</strong>
                  <p>New response notifications will appear here.</p>
                </div>
              }
            </div>
            <button class="primary" (click)="create()">
              <span aria-hidden="true">＋</span> New Form
            </button>
          </div>
        </header>
        <main id="main" tabindex="-1"><router-outlet /></main>
      </div>
    </div>
    <div class="toast" role="status" [class.hidden]="!store.notice()">
      {{ store.notice()
      }}<button
        aria-label="Dismiss notification"
        (click)="store.notice.set('')"
      >
        ✕
      </button>
    </div>
  `,
})
export class App {
  audit = isDevMode() && new URLSearchParams(location.search).has("audit");
  store = inject(Store);
  router = inject(Router);
  banner = signal(readPreference("ff-banner") !== "hidden");
  dark = signal(readPreference("ff-dark") === "true");
  menu = signal(false);
  profile = signal(false);
  notifications = signal(false);
  nav = [
    { path: "/", label: "Home", icon: "home" },
    { path: "/forms", label: "My Forms", icon: "forms" },
    { path: "/shared", label: "Shared with me", icon: "users" },
    { path: "/templates", label: "Templates", icon: "templates" },
    { path: "/insights", label: "Insights", icon: "chart" },
  ];
  constructor() {
    document.documentElement.classList.toggle("dark", this.dark());
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.menu.set(false);
        this.profile.set(false);
        this.notifications.set(false);
        if (
          document.activeElement?.getAttribute("aria-label") !== "Search forms"
        )
          requestAnimationFrame(() => document.getElementById("main")?.focus());
      }
    });
  }
  skip(event: Event) {
    event.preventDefault();
    document.getElementById("main")?.focus();
  }
  openMenu() {
    this.menu.set(true);
    requestAnimationFrame(() =>
      document.getElementById("close-navigation")?.focus(),
    );
  }
  closeMenu() {
    this.menu.set(false);
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(".mobile-toggle")?.focus(),
    );
  }
  handleKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.profile.set(false);
      this.notifications.set(false);
      if (this.menu()) this.closeMenu();
    }
    if (!this.menu() || event.key !== "Tab") return;
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(
        "#sidebar a[href],#sidebar button:not([disabled])",
      ),
    );
    const first = items[0],
      last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  toggleTheme() {
    this.dark.update((v) => !v);
    document.documentElement.classList.toggle("dark", this.dark());
    try {
      localStorage.setItem("ff-dark", String(this.dark()));
    } catch {}
  }
  dismiss() {
    this.banner.set(false);
    try {
      localStorage.setItem("ff-banner", "hidden");
    } catch {}
  }
  reset() {
    if (
      confirm(
        "Reset all demo forms and responses? Your changes will be removed.",
      )
    ) {
      this.store.reset();
      void this.router.navigate(["/"]);
    }
  }
  search(event: Event) {
    this.store.query.set((event.target as HTMLInputElement).value);
    if (!["/", "/forms", "/shared"].includes(this.router.url))
      void this.router.navigate(["/forms"]);
  }
  create() {
    this.store.query.set("");
    void this.router.navigate(["/forms", this.store.create(), "edit"]);
  }
}
