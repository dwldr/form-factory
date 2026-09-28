import { Tooltip } from "./tooltip";
import { ChromeState } from "./chrome";
import { Icon } from "./icon";
import { fieldStates, Answers, formPages } from "./form-version";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  Component,
  computed,
  inject,
  signal,
  linkedSignal,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Store, Field } from "./store";
@Component({
  imports: [Tooltip, RouterLink, Icon],
  template: `
    <section class="standalone-form">
      @if (form(); as f) {
        @if (preview() && !previewDismissed()) {
          <div class="preview-banner" role="region" aria-label="Form preview">
            <span
              ><strong>This is a preview only.</strong> Responses will not be
              saved.</span
            >
            <div class="flex items-center gap-3">
              <button
                class="preview-dismiss"
                aria-label="Dismiss preview banner"
                (click)="previewDismissed.set(true)"
              >
                ×
              </button>
            </div>
          </div>
        }
        <div class="view-close-row">
          <button class="text-button" (click)="closeWindow()">
            Close window
          </button>
        </div>
        @if (closeHint()) {
          <p class="close-window-hint" role="status">
            Your browser kept this tab open. Close it using the browser's tab
            controls.
          </p>
        }
        <div class="form-view-actions">
          <button
            class="icon-button"
            [attr.aria-label]="
              ui.dark() ? 'Switch to light mode' : 'Switch to dark mode'
            "
            [ffTooltip]="
              ui.dark() ? 'Switch to light mode' : 'Switch to dark mode'
            "
            (click)="ui.toggleTheme()"
          >
            <ff-icon [name]="ui.dark() ? 'moon' : 'sun'" />
          </button>
          @if (!preview() && store.publicUrl(record()!); as url) {
            <button
              class="icon-button"
              [ffTooltip]="url"
              [attr.aria-label]="
                'Copy ' +
                (f.visibility === 'private' ? 'private' : 'public') +
                ' form link'
              "
              (click)="copy()"
            >
              <ff-icon name="link" />
            </button>
          }
        </div>
        <div class="response-paper" id="form-content" tabindex="-1">
          @if (f.bannerImage) {
            <img
              class="form-banner-image"
              [class.banner-fit]="f.bannerFit"
              [src]="f.bannerImage"
              alt="Form banner"
            />
          }
          @if (submitted()) {
            <div class="empty">
              <span class="success-mark" aria-hidden="true">✓</span>
              <h1>Thank you!</h1>
              <p>
                @if (preview()) {
                  Your preview is complete. No response was saved.
                } @else {
                  Your response has been recorded in this demo.<br />
                  You may now close this browser tab or window.
                }
              </p>
              <button class="primary" (click)="restart()">
                Submit another response
              </button>
            </div>
          } @else {
            <h1>{{ f.name }}</h1>
            <p class="muted mb-6">{{ f.description }}</p>
            @if ((f.requiredMessageLocation ?? "Top") === "Top") {
              <p
                class="required-field-message"
                [style.text-align]="
                  (f.requiredMessageAlignment ?? 'Left').toLowerCase()
                "
              >
                {{
                  f.requiredMessage ?? "Required fields are marked with an *"
                }}
              </p>
            }
            @if (pages().length > 1) {
              <p class="helper">
                Page {{ step() + 1 }} of {{ pages().length }}
              </p>
            }
            <form
              (submit)="submit($event)"
              (input)="captureAnswers($event)"
              (change)="captureAnswers($event)"
            >
              @for (
                pageFields of pages();
                track $index;
                let pageIndex = $index
              ) {
                <div [hidden]="step() !== pageIndex">
                  @for (field of pageFields; track field.id) {
                    @if (field.type === "Hidden field") {
                      <input
                        type="hidden"
                        [name]="field.id"
                        [value]="field.defaultValue ?? ''"
                      />
                    } @else if (field.type === "Section") {
                      <h2 class="mb-3">{{ field.label }}</h2>
                      <p class="helper">{{ field.description }}</p>
                    } @else {
                      <fieldset
                        class="response-field"
                        [hidden]="!states()[field.id]?.visible"
                        [disabled]="!states()[field.id]?.visible"
                      >
                        <legend>
                          {{ field.label }}
                          @if (states()[field.id]?.required) {
                            <span aria-hidden="true"> *</span
                            ><span class="sr-only"> (required)</span>
                          }
                        </legend>
                        @if (field.description) {
                          <p class="helper" [id]="field.id + '-help'">
                            {{ field.description }}
                          </p>
                        }
                        @switch (field.type) {
                          @case ("Address") {
                            <textarea
                              rows="3"
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                states()[field.id]?.required &&
                                step() === pageIndex
                              "
                              autocomplete="street-address"
                            ></textarea>
                          }
                          @case ("File upload") {
                            <div class="file-upload-control">
                              <label
                                class="file-button"
                                [for]="'file-' + field.id"
                                >Choose file</label
                              ><input
                                class="sr-only"
                                type="file"
                                [id]="'file-' + field.id"
                                [name]="field.id"
                                [attr.aria-label]="field.label"
                                [required]="
                                  states()[field.id]?.required &&
                                  step() === pageIndex
                                "
                                (change)="fileSelected(field.id, $event)"
                              /><span>{{
                                fileNames()[field.id] || "No file selected"
                              }}</span>
                            </div>
                            <p class="helper">
                              Demo: only the filename is saved. File contents
                              are not uploaded.
                            </p>
                          }
                          @case ("Linear scale") {
                            <select
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                states()[field.id]?.required &&
                                step() === pageIndex
                              "
                            >
                              <option value="">Choose a score</option>
                              @for (
                                score of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                                track score
                              ) {
                                <option [value]="score">{{ score }}</option>
                              }
                            </select>
                          }
                          @case ("Signature") {
                            <input
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                states()[field.id]?.required &&
                                step() === pageIndex
                              "
                              placeholder="Type your full name"
                            />
                            <p class="helper">Typed signature for this demo.</p>
                          }
                          @case ("Paragraph") {
                            <textarea
                              rows="4"
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                states()[field.id]?.required &&
                                step() === pageIndex
                              "
                              [attr.aria-describedby]="
                                field.description ? field.id + '-help' : null
                              "
                            ></textarea>
                          }
                          @case ("Multiple choice") {
                            @for (option of field.options; track $index) {
                              <label class="choice"
                                ><input
                                  type="radio"
                                  [name]="field.id"
                                  [value]="option"
                                  [checked]="field.defaultValue === option"
                                  [required]="
                                    states()[field.id]?.required &&
                                    step() === pageIndex
                                  "
                                />{{ option }}</label
                              >
                            }
                          }
                          @case ("Checkboxes") {
                            @for (option of field.options; track $index) {
                              <label class="choice"
                                ><input
                                  type="checkbox"
                                  [name]="field.id"
                                  [value]="option"
                                />{{ option }}</label
                              >
                            }
                          }
                          @case ("Dropdown") {
                            <select
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                states()[field.id]?.required &&
                                step() === pageIndex
                              "
                            >
                              <option value="">Choose an option</option>
                              @for (option of field.options; track $index) {
                                <option
                                  [selected]="field.defaultValue === option"
                                >
                                  {{ option }}
                                </option>
                              }
                            </select>
                          }
                          @case ("Rating") {
                            <select
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                states()[field.id]?.required &&
                                step() === pageIndex
                              "
                            >
                              <option value="">Choose a rating</option>
                              @for (rating of [1, 2, 3, 4, 5]; track rating) {
                                <option [value]="rating">
                                  {{ rating }}
                                  {{ rating === 1 ? "star" : "stars" }}
                                </option>
                              }
                            </select>
                          }
                          @default {
                            <input
                              [type]="inputType(field)"
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                states()[field.id]?.required &&
                                step() === pageIndex
                              "
                              [attr.aria-describedby]="
                                field.description ? field.id + '-help' : null
                              "
                            />
                          }
                        }
                      </fieldset>
                    }
                  }
                </div>
              }
              @if (error()) {
                <p class="error" role="alert">{{ error() }}</p>
              }
              @if (step() > 0) {
                <button
                  type="button"
                  class="secondary mr-3"
                  (click)="step.set(step() - 1)"
                >
                  Back
                </button>
              }
              <button class="primary" type="submit">
                {{
                  step() < pages().length - 1
                    ? "Next page"
                    : preview()
                      ? "Test submission"
                      : "Submit response"
                }}
                →
              </button>
            </form>
          }
        </div>
        @if (!submitted() && f.requiredMessageLocation === "Bottom") {
          <p
            class="required-field-message required-message-bottom"
            [style.text-align]="
              (f.requiredMessageAlignment ?? 'Left').toLowerCase()
            "
          >
            {{ f.requiredMessage ?? "Required fields are marked with an *" }}
          </p>
        }
      } @else {
        <div class="response-paper empty">
          @if (denied()) {
            <h1>You don’t have permission to view this form</h1>
            <p>Log in with an account that has access.</p>
            <a
              class="primary"
              routerLink="/account"
              [queryParams]="{ returnTo: currentPath }"
              >Log in or change accounts</a
            >
          } @else {
            <h1>{{ deleted() ? "Draft deleted" : "Form unavailable" }}</h1>
            <p>
              {{
                deleted()
                  ? "This draft has been deleted. You can close this tab."
                  : "This form is not published, has been removed, or is not available in this browser."
              }}
            </p>
          }
        </div>
      }
    </section>
  `,
})
export class Viewer {
  closeHint = signal(false);
  closeWindow() {
    window.close();
    this.closeHint.set(true);
  }
  ui = inject(ChromeState);
  store = inject(Store);
  route = inject(ActivatedRoute);
  params = toSignal(this.route.paramMap, { requireSync: true });
  get id() {
    return this.params().get("id")!;
  }
  currentPath = location.pathname;
  routeData = toSignal(this.route.data, { requireSync: true });
  preview = computed(() => this.routeData()["preview"] === true);
  previewDismissed = signal(false);
  deleted = signal(false);
  record = computed(() => this.store.forms().find((f) => f.id === this.id));
  denied = computed(() => {
    const f = this.record();
    return (
      !!f &&
      (this.preview()
        ? !this.store.canEdit(f)
        : !!f.published && !this.store.canRead(f))
    );
  });
  form = computed(() => {
    const f = this.record();
    if (!f) return undefined;
    if (this.preview()) return this.store.canEdit(f) ? f : undefined;
    return f.published && this.store.canRead(f)
      ? {
          ...f,
          ...f.published,
          bannerImage: f.published.bannerImage,
          bannerFilename: f.published.bannerFilename,
          bannerFit: f.published.bannerFit,
          requiredMessage: f.published.requiredMessage,
          requiredMessageAlignment: f.published.requiredMessageAlignment,
          requiredMessageLocation: f.published.requiredMessageLocation,
        }
      : undefined;
  });
  submitted = linkedSignal({ source: () => this.id, computation: () => false });
  step = linkedSignal({ source: () => this.id, computation: () => 0 });
  pages = computed(() => formPages(this.form()?.fields ?? []));
  answers = linkedSignal({
    source: () => this.id,
    computation: (): Answers => ({}),
  });
  states = computed(() =>
    fieldStates(this.form()?.fields ?? [], this.answers()),
  );
  captureAnswers(event: Event) {
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const answers: Answers = {};
    for (const field of this.form()?.fields ?? [])
      answers[field.id] = data
        .getAll(field.id)
        .map((value) => (value instanceof File ? value.name : String(value)));
    this.answers.set(answers);
  }
  fileNames = signal<Record<string, string>>({});
  fileSelected(id: string, event: Event) {
    this.fileNames.update((names) => ({
      ...names,
      [id]: (event.target as HTMLInputElement).files?.[0]?.name ?? "",
    }));
  }
  restart() {
    this.answers.set({});
    this.fileNames.set({});
    this.step.set(0);
    this.submitted.set(false);
    this.error.set("");
  }

  error = signal("");
  inputType(f: Field) {
    return (
      (
        {
          Website: "url",
          Email: "email",
          Phone: "tel",
          Number: "number",
          Date: "date",
        } as Record<string, string>
      )[f.type] ?? "text"
    );
  }
  submit(event: Event) {
    event.preventDefault();
    const f = this.form();
    if (!f) return;
    const data = new FormData(event.target as HTMLFormElement);
    const answers: Record<string, string> = {};
    for (const field of f.fields) {
      if (
        ["Section", "Page break"].includes(field.type) ||
        !this.states()[field.id]?.visible
      )
        continue;
      answers[field.id] = data
        .getAll(field.id)
        .map((value) => (value instanceof File ? value.name : String(value)))
        .join(", ");
      if (
        this.pages()[this.step()].some((q) => q.id === field.id) &&
        this.states()[field.id]?.required &&
        !answers[field.id].trim()
      ) {
        this.error.set("Please answer “" + field.label + "”.");
        return;
      }
    }
    this.error.set("");
    if (this.step() < this.pages().length - 1) {
      this.step.update((n) => n + 1);
      document.getElementById("main")?.focus();
      return;
    }
    if (!this.preview()) this.store.submit(f.id, answers);
    this.submitted.set(true);
    document.getElementById("main")?.focus();
  }
  copy() {
    const f = this.record();
    if (f) void this.store.copyUrl(f);
  }
  discard() {
    const f = this.record();
    if (
      f &&
      confirm(
        f.published
          ? "Delete unpublished changes and restore the published form?"
          : "Delete this unpublished draft?",
      )
    ) {
      this.store.discard(f.id);
      this.deleted.set(!f.published);
      this.step.set(0);
      this.store.notify("Draft deleted.");
    }
  }
}
