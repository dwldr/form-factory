import { Tooltip } from "./tooltip";
import { Icon } from "./icon";
import { toSignal } from "@angular/core/rxjs-interop";
import { map, startWith } from "rxjs";
import {
  Component,
  computed,
  inject,
  signal,
  linkedSignal,
} from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { Store } from "./store";
@Component({
  imports: [Tooltip, Icon, RouterLink, DatePipe, DecimalPipe],
  template: `
    <section class="page">
      <div class="page-heading">
        <div>
          <h1>
            {{
              shared
                ? "Shared with me"
                : home
                  ? "Welcome back, Derek"
                  : "My Forms"
            }}
          </h1>
          <p>
            {{
              shared
                ? "Forms shared by the people you work with."
                : home
                  ? "Here’s what’s happening with your forms."
                  : "Build, share, and manage your forms in one place."
            }}
          </p>
        </div>
        <span class="muted">{{
          home ? "Your workspace at a glance" : filtered().length + " forms"
        }}</span>
      </div>
      @if (home) {
        <div class="stats-grid">
          @for (stat of stats(); track stat.label) {
            <div class="stat-card">
              <span
                class="stat-icon"
                [style.color]="stat.color"
                aria-hidden="true"
                ><ff-icon [name]="stat.icon" /></span
              ><strong>{{ stat.value | number }}</strong>
              <p>{{ stat.label }}</p>
            </div>
          }
        </div>
      }
      <div class="section-heading">
        <h2>
          {{ home ? "Recent Forms" : shared ? "Shared forms" : "All forms" }}
        </h2>
        <div class="flex gap-3 items-center">
          @if (selected().length) {
            <button class="danger" (click)="removeSelected()">
              Delete selected ({{ selected().length }})
            </button>
          }
          @if (home) {
            <a routerLink="/forms"
              >View all <span aria-hidden="true">→</span></a
            >
          } @else {
            <select
              aria-label="Filter by status"
              [value]="status()"
              (change)="status.set(value($event))"
            >
              <option value="">All statuses</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
          }
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              @if (!shared) {
                <th class="check-cell">
                  <input
                    type="checkbox"
                    aria-label="Select all visible forms"
                    [checked]="allSelected()"
                    (change)="selectAll($event)"
                  />
                </th>
              }
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Responses</th>
              <th scope="col">Last Modified</th>
              <th scope="col" class="form-link-cell">
                <span class="sr-only">Link</span>
              </th>
              <th scope="col" class="form-actions-cell">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (f of visible(); track f.id) {
              <tr>
                @if (!shared) {
                  <td>
                    <input
                      type="checkbox"
                      [attr.aria-label]="'Select ' + f.name"
                      [checked]="selected().includes(f.id)"
                      (change)="toggle(f.id)"
                    />
                  </td>
                }
                <td>
                  <a
                    class="form-name"
                    [routerLink]="
                      shared ? store.publicPath(f) : ['/forms', f.id, 'edit']
                    "
                    [attr.target]="shared ? '_blank' : null"
                    rel="noopener"
                    (click)="shared && clearResultSearch()"
                    >{{ f.name }}</a
                  >
                </td>
                <td>
                  <span
                    class="badge"
                    [class.published]="f.status === 'Published'"
                    >{{ f.status === "Published" ? "⊙" : "⊖" }}
                    {{ f.status }}</span
                  >
                </td>
                <td>{{ f.responses | number }}</td>
                <td class="muted nowrap">
                  {{ f.modified | date: "MMM d, y" : "UTC" }}
                </td>
                <td class="form-link-cell">
                  @if (store.publicUrl(f); as url) {
                    <button
                      class="icon-button url-tooltip"
                      [ffTooltip]="url"
                      [attr.aria-label]="
                        'Copy ' +
                        f.name +
                        ' ' +
                        (f.published?.visibility === 'private'
                          ? 'private'
                          : 'public') +
                        ' link'
                      "
                      (click)="store.copyUrl(f)"
                    >
                      <ff-icon name="link" />
                    </button>
                  } @else {
                    <span class="muted" aria-label="No published link">—</span>
                  }
                </td>
                <td class="form-actions-cell">
                  <div class="row-actions">
                    <a
                      class="icon-button"
                      [routerLink]="
                        f.published
                          ? store.publicPath(f)
                          : ['/forms', f.id, 'preview']
                      "
                      target="_blank"
                      rel="noopener"
                      (click)="clearResultSearch()"
                      [attr.aria-label]="
                        (f.published ? 'View ' : 'Preview ') +
                        f.name +
                        ' (opens in a new tab)'
                      "
                      >↗</a
                    >
                    @if (!shared) {
                      <button
                        class="icon-button delete-form"
                        [attr.aria-label]="'Delete ' + f.name"
                        (click)="remove(f.id, f.name)"
                      >
                        <ff-icon name="trash" />
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty">
                  <h3>No forms found</h3>
                  <p>Try another search or create your first form.</p>
                  <button class="secondary" (click)="clear()">
                    Clear filters
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (home) {
        <div class="home-footer">
          <span class="mini-brand" aria-hidden="true">✦</span>
          <div>
            <strong>Good questions lead to great things.</strong>
            <p>Start with a template and make it your own.</p>
          </div>
          <a routerLink="/templates" class="secondary">Explore templates →</a>
        </div>
      }
    </section>
  `,
})
export class Dashboard {
  store = inject(Store);
  router = inject(Router);
  url = toSignal(
    this.router.events.pipe(
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { requireSync: true },
  );
  get home() {
    return this.url().split(/[?#]/)[0] === "/";
  }
  get shared() {
    return this.url().split(/[?#]/)[0] === "/shared";
  }
  selected = linkedSignal({
    source: () => this.url(),
    computation: (): string[] => [],
  });
  status = signal("");
  filtered = computed(() =>
    this.store
      .forms()
      .filter(
        (f) =>
          f.shared === this.shared &&
          (this.shared ? this.store.canRead(f) : this.store.canEdit(f)) &&
          f.name.toLowerCase().includes(this.store.query().toLowerCase()) &&
          (!this.status() || f.status === this.status()),
      ),
  );
  visible = computed(() =>
    this.home && !this.store.query()
      ? this.filtered().slice(0, 5)
      : this.filtered(),
  );
  allSelected = computed(
    () =>
      this.visible().length > 0 &&
      this.visible().every((f) => this.selected().includes(f.id)),
  );
  stats = computed(() => [
    {
      label: "Total Forms",
      value: this.store.own().length,
      icon: "forms",
      color: "#52627a",
    },
    {
      label: "Total Responses",
      value: this.store.own().reduce((sum, f) => sum + f.responses, 0),
      icon: "users",
      color: "#078c4c",
    },
    {
      label: "Published Forms",
      value: this.store.own().filter((f) => f.status === "Published").length,
      icon: "chart",
      color: "#cd4b24",
    },
    {
      label: "Shared with You",
      value: this.store.forms().filter((f) => f.shared).length,
      icon: "link",
      color: "#365ee8",
    },
  ]);
  clearResultSearch() {
    if (this.store.query()) {
      this.store.query.set("");
      void this.router.navigate([this.router.url.split(/[?#]/)[0]]);
    }
  }
  value(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }
  toggle(id: string) {
    this.selected.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }
  selectAll(e: Event) {
    this.selected.set(
      (e.target as HTMLInputElement).checked
        ? this.visible().map((f) => f.id)
        : [],
    );
  }
  remove(id: string, name: string) {
    if (confirm("Delete “" + name + "” and its responses?"))
      this.store.remove([id]);
  }
  removeSelected() {
    if (
      confirm(
        "Delete " +
          this.selected().length +
          " selected forms and their responses?",
      )
    ) {
      this.store.remove(this.selected());
      this.selected.set([]);
    }
  }
  clear() {
    this.status.set("");
    this.store.query.set("");
    void this.router.navigate([this.router.url.split(/[?#]/)[0]]);
  }
}
