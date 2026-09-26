import { toSignal } from "@angular/core/rxjs-interop";
import { map, startWith } from "rxjs";
import { Component, inject, signal } from "@angular/core";
import { form, FormField, required, email } from "@angular/forms/signals";
import { Router } from "@angular/router";
import { Store, readPreference } from "./store";
@Component({
  imports: [FormField],
  template: `<section class="page">
    <div class="page-heading">
      <div>
        <h1>{{ members ? "Members" : "Team Settings" }}</h1>
        <p>
          {{
            members
              ? "The people behind your forms."
              : "Manage your demo workspace."
          }}
        </p>
      </div>
    </div>
    @if (members) {
      <section class="panel">
        <h2>Workspace members</h2>
        <p class="helper">This local demo uses a fixed sample team.</p>
        @for (member of team; track member.email) {
          <div class="member">
            <span
              class="avatar"
              [class.secondary-avatar]="member.initials !== 'DW'"
              >{{ member.initials }}</span
            >
            <div>
              <strong>{{ member.name }}</strong>
              <p class="muted">{{ member.email }}</p>
            </div>
            <span class="badge">{{ member.role }}</span>
          </div>
        }
      </section>
    } @else {
      <section class="panel settings-panel">
        <h2>Workspace details</h2>
        <form (submit)="save($event)">
          <label>Workspace name<input [formField]="settings.name" /></label
          ><label
            >Contact email<input type="email" [formField]="settings.email"
          /></label>
          <p class="helper">
            You’re signed in as Derek Wilder, an administrator. Settings are
            stored in this browser.
          </p>
          <button
            class="primary"
            type="submit"
            [disabled]="settings().invalid()"
          >
            Save changes
          </button>
        </form>
      </section>
    }
  </section>`,
})
export class Team {
  store = inject(Store);
  router = inject(Router);
  url = toSignal(
    this.router.events.pipe(
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { requireSync: true },
  );
  get members() {
    return this.url().split(/[?#]/)[0] === "/members";
  }
  model = signal({
    name: readPreference("ff-team-name") ?? "Derek’s Workspace",
    email: readPreference("ff-team-email") ?? "derek@example.com",
  });
  settings = form(this.model, (p) => {
    required(p.name);
    required(p.email);
    email(p.email);
  });
  team = [
    {
      initials: "DW",
      name: "Derek Wilder",
      email: "derek@example.com",
      role: "Admin",
    },
    {
      initials: "JL",
      name: "Jordan Lee",
      email: "jordan@example.com",
      role: "Editor",
    },
    {
      initials: "AM",
      name: "Alex Morgan",
      email: "alex@example.com",
      role: "Viewer",
    },
  ];
  save(e: Event) {
    e.preventDefault();
    if (this.settings().invalid()) return;
    try {
      localStorage.setItem("ff-team-name", this.model().name);
      localStorage.setItem("ff-team-email", this.model().email);
      this.store.notice.set("Workspace settings saved.");
    } catch {
      this.store.notice.set("Unable to save settings in this browser.");
    }
  }
}
