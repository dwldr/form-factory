import { Toast } from "./toast";
import { Tooltip } from "./tooltip";
import { ChromeState, HeaderActions } from "./chrome";
import { computed, afterEveryRender, DestroyRef } from "@angular/core";
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
  host: {
    "(keydown)": "handleKey($event)",
    "(document:click)": "closeOutsideMenus($event)",
  },
  imports: [
    Toast,
    Tooltip,
    AccessibilityAudit,
    HeaderActions,
    Icon,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
  ],
  template: `
    <a class="skip-link" href="#main" (click)="skip($event)">Skip to content</a>
    @if (audit) {
      <ff-accessibility-audit />
    }
    @if (standalone()) {
      <main id="main" class="standalone-main" tabindex="-1">
        <router-outlet />
      </main>
    } @else {
      @if (banner()) {
        <div class="demo-banner" role="region" aria-label="Demo information">
          <span
            ><strong>You’re exploring a demo.</strong> Changes are saved in this
            browser only. Some features may not work.</span
          >
          <div class="flex gap-4 items-center">
            <button (click)="reset()">Reset demo data</button
            ><button aria-label="Dismiss demo banner" (click)="dismiss()">
              ✕
            </button>
          </div>
        </div>
      }
      <div
        class="app-shell"
        [class.mobile-open]="menu()"
        [class.sidebar-collapsed]="collapsed()"
        [style.--banner-height]="bannerHeight() + 'px'"
        [attr.role]="menu() ? 'dialog' : null"
        [attr.aria-modal]="menu() ? true : null"
        [attr.aria-label]="menu() ? 'Navigation' : null"
      >
        <button
          id="close-navigation"
          class="mobile-navigation-toggle icon-button"
          [class.is-open]="menu()"
          [attr.aria-label]="menu() ? 'Close navigation' : 'Open navigation'"
          [attr.aria-expanded]="menu()"
          aria-controls="sidebar"
          (click)="menu() ? closeMenu() : openMenu()"
        >
          <span class="menu-lines" aria-hidden="true"
            ><span></span><span></span><span></span
          ></span>
        </button>
        @if (menu()) {
          <div
            class="mobile-nav-backdrop"
            aria-hidden="true"
            (click)="closeMenu()"
          ></div>
        }
        <aside class="sidebar" id="sidebar">
          <a routerLink="/" class="brand" aria-label="Form Factory home">
            @if (collapsed() && !menu()) {
              <img
                [ngSrc]="
                  dark()
                    ? 'brand-img-white-yellow.svg'
                    : 'brand-img-black.svg'
                "
                width="52"
                height="47"
                alt="Form Factory"
                priority
              />
            } @else {
              <img
                [ngSrc]="
                  dark() ? 'brand-white-yellow.svg' : 'brand-black.svg'
                "
                width="142"
                height="53"
                alt="Form Factory"
                priority
              />
            }
          </a>
          <nav aria-label="Main navigation">
            @for (item of nav; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                (click)="menu.set(false)"
                [attr.aria-label]="item.label"
                [ffTooltip]="collapsed() && !menu() ? item.label : null"
                ffTooltipPosition="right"
                ><ff-icon [name]="item.icon" /><span class="nav-label">{{
                  item.label
                }}</span></a
              >
            }
            <p class="nav-caption">TEAM</p>
            <a
              routerLink="/settings"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              (click)="menu.set(false)"
              aria-label="Team Settings"
              [ffTooltip]="collapsed() && !menu() ? 'Team Settings' : null"
              ffTooltipPosition="right"
              ><ff-icon name="settings" /><span class="nav-label"
                >Team Settings</span
              ></a
            ><a
              routerLink="/members"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              (click)="menu.set(false)"
              aria-label="Members"
              [ffTooltip]="collapsed() && !menu() ? 'Members' : null"
              ffTooltipPosition="right"
              ><ff-icon name="users" /><span class="nav-label">Members</span></a
            >
          </nav>
          <div class="user-area">
            @if (profile()) {
              <div class="popover">
                <strong>{{ accountName() }}</strong>
                <p>{{ accountEmail() }}</p>
                <p>Demo workspace</p>
                <a
                  routerLink="/account"
                  [queryParams]="{ returnTo: router.url }"
                  >Log in or change accounts →</a
                >
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
              [attr.aria-label]="accountName() + ' account menu'"
              [ffTooltip]="collapsed() && !menu() ? accountName() : null"
              ffTooltipPosition="right"
              (click)="profile.set(!profile())"
              [attr.aria-expanded]="profile()"
            >
              <span class="avatar">{{
                store.user() === "derek"
                  ? "DW"
                  : store.user() === "alex"
                    ? "RC"
                    : "?"
              }}</span
              ><span class="user-details"
                ><strong>{{ accountName() }}</strong
                ><small>{{ accountEmail() }}</small></span
              ><span class="user-chevron">⌄</span>
            </button>
          </div>
        </aside>
        <button
          class="sidebar-toggle icon-button"
          [attr.aria-label]="
            collapsed() ? 'Expand sidebar' : 'Collapse sidebar'
          "
          [attr.aria-expanded]="!collapsed()"
          aria-controls="sidebar"
          (click)="toggleSidebar()"
        >
          <ff-icon [name]="collapsed() ? 'chevron-right' : 'chevron-left'" />
        </button>
        <div class="workspace" [inert]="menu()">
          @if (!editing()) {
            <header class="topbar">
              <span class="mobile-menu-space" aria-hidden="true"></span>
              @if (showSearch()) {
                <label class="search"
                  ><ff-icon name="search" /><input
                    [attr.aria-label]="searchLabel()"
                    [placeholder]="searchLabel() + '…'"
                    [value]="store.query()"
                    (input)="search($event)"
                /></label>
              }
              <div class="flex items-center gap-3 ml-auto">
                <ff-header-actions />
                <button class="primary" (click)="create()">
                  <span aria-hidden="true">＋</span> New Form
                </button>
              </div>
            </header>
          }
          <main id="main" tabindex="-1"><router-outlet /></main>
        </div>
      </div>
    }
    <ff-toast />
  `,
})
export class App {
  audit = isDevMode() && new URLSearchParams(location.search).has("audit");
  store = inject(Store);
  router = inject(Router);
  banner = signal(true);
  ui = inject(ChromeState);
  dark = this.ui.dark;
  menu = this.ui.menu;
  collapsed = signal(readPreference("ff-sidebar-collapsed") === "true");
  bannerHeight = signal(0);
  routeUrl = signal(this.router.url);
  showSearch = () => true;
  searchLabel = computed(() =>
    this.routeUrl().startsWith("/templates")
      ? "Search templates"
      : /^\/(insights|responses)(\/|[?#]|$)/.test(this.routeUrl())
        ? "Search responses"
        : "Search forms",
  );
  standalone = computed(
    () =>
      /^\/(f|private|account)(\/|[?#]|$)/.test(this.routeUrl()) ||
      /\/forms\/[^/]+\/(view|preview)/.test(this.routeUrl()),
  );
  editing = computed(() => /\/forms\/[^/]+\/edit/.test(this.routeUrl()));
  accountName = computed(() =>
    this.store.user() === "derek"
      ? "Derek Wilder"
      : this.store.user() === "alex"
        ? "Rickety Cricket"
        : "Signed out",
  );
  accountEmail = computed(() =>
    this.store.user() === "derek"
      ? "derek@example.com"
      : this.store.user() === "alex"
        ? "cricket@example.com"
        : "Choose an account",
  );
  profile = signal(false);
  notifications = this.ui.notifications;
  nav = [
    { path: "/", label: "Home", icon: "home" },
    { path: "/forms", label: "My Forms", icon: "forms" },
    { path: "/shared", label: "Shared with me", icon: "users" },
    { path: "/templates", label: "Templates", icon: "templates" },
    { path: "/insights", label: "Insights", icon: "chart" },
  ];
  constructor() {
    let observedBanner: Element | null = null;
    const measureBanner = () =>
      this.bannerHeight.set(
        observedBanner?.getBoundingClientRect().height ?? 0,
      );
    const observer = new ResizeObserver(measureBanner);
    afterEveryRender(() => {
      const banner = document.querySelector(".demo-banner");
      if (banner !== observedBanner) {
        observer.disconnect();
        observedBanner = banner;
        if (banner) observer.observe(banner);
        measureBanner();
      }
    });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.routeUrl.set(event.urlAfterRedirects);
        this.store.query.set(
          this.router.parseUrl(event.urlAfterRedirects).queryParams["q"] ?? "",
        );
        this.menu.set(false);
        this.profile.set(false);
        this.notifications.set(false);
        if (!document.activeElement?.closest(".search"))
          requestAnimationFrame(() => document.getElementById("main")?.focus());
      }
    });
  }
  skip(event: Event) {
    event.preventDefault();
    this.menu.set(false);
    requestAnimationFrame(() => {
      const content =
        document.getElementById("form-content") ??
        document.getElementById("main");
      content?.focus({ preventScroll: true });
      content?.scrollIntoView({ block: "start" });
    });
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
      document.getElementById("close-navigation")?.focus(),
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
        "#close-navigation,#sidebar a[href],#sidebar button:not([disabled])",
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
  closeOutsideMenus(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".user-area")) this.profile.set(false);
    if (!target.closest(".notification-menu")) this.notifications.set(false);
  }
  toggleSidebar() {
    this.collapsed.update((value) => !value);
    try {
      localStorage.setItem("ff-sidebar-collapsed", String(this.collapsed()));
    } catch {}
  }
  dismiss() {
    this.banner.set(false);
    this.bannerHeight.set(0);
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
    const q = (event.target as HTMLInputElement).value;
    this.store.query.set(q);
    const tree = this.router.parseUrl(this.router.url);
    const path = this.router.url.split(/[?#]/)[0];
    const destination =
      path === "/templates"
        ? "/templates"
        : /^\/(insights|responses)(\/|$)/.test(path)
          ? "/responses"
          : ["/", "/forms", "/shared"].includes(path)
            ? path
            : "/forms";
    void this.router.navigate([destination], {
      queryParams: { q: q || null },
      replaceUrl: !!tree.queryParams["q"],
    });
  }
  create() {
    this.store.query.set("");
    if (this.store.user() !== "derek") {
      void this.router.navigate(["/account"]);
      return;
    }
    void this.router.navigate(["/forms", this.store.create(), "edit"]);
  }
}
