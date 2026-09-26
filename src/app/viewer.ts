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
  imports: [RouterLink],
  template: `
    <section class="page">
      @if (form(); as f) {
        <div class="page-heading">
          <div>
            <a routerLink="/forms">← Back to forms</a>
            <p>
              {{
                f.status === "Draft"
                  ? "Draft preview · submissions are not saved"
                  : "Demo form · responses stay in this browser"
              }}
            </p>
          </div>
          <div class="flex gap-3">
            @if (!f.shared) {
              <a class="secondary" [routerLink]="['/forms', f.id, 'edit']"
                >Edit form</a
              >
            }
            <button class="secondary" (click)="copy()">Copy link</button>
          </div>
        </div>
        <div class="response-paper">
          @if (submitted()) {
            <div class="empty">
              <span class="success-mark" aria-hidden="true">✓</span>
              <h1>Thank you!</h1>
              <p>
                {{
                  f.status === "Draft"
                    ? "Your preview is complete. No response was saved."
                    : "Your response has been recorded in this demo."
                }}
              </p>
              <button class="primary" (click)="restart()">
                Submit another response
              </button>
            </div>
          } @else {
            <h1>{{ f.name }}</h1>
            <p class="muted mb-6">{{ f.description }}</p>
            @if (pages().length > 1) {
              <p class="helper">
                Page {{ step() + 1 }} of {{ pages().length }}
              </p>
            }
            <form (submit)="submit($event)">
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
                      <fieldset class="response-field">
                        <legend>
                          {{ field.label }}
                          @if (field.required) {
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
                                field.required && step() === pageIndex
                              "
                              autocomplete="street-address"
                            ></textarea>
                          }
                          @case ("File upload") {
                            <input
                              type="file"
                              [name]="field.id"
                              [attr.aria-label]="field.label"
                              [required]="
                                field.required && step() === pageIndex
                              "
                            />
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
                                field.required && step() === pageIndex
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
                                field.required && step() === pageIndex
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
                                field.required && step() === pageIndex
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
                                    field.required && step() === pageIndex
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
                                field.required && step() === pageIndex
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
                                field.required && step() === pageIndex
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
                                field.required && step() === pageIndex
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
                    : f.status === "Draft"
                      ? "Test submission"
                      : "Submit response"
                }}
                →
              </button>
            </form>
          }
        </div>
      } @else {
        <h1>Form not found</h1>
        <p>This demo link requires the original browser’s local data.</p>
        <a routerLink="/forms">Back to forms</a>
      }
    </section>
  `,
})
export class Viewer {
  store = inject(Store);
  route = inject(ActivatedRoute);
  params = toSignal(this.route.paramMap, { requireSync: true });
  get id() {
    return this.params().get("id")!;
  }
  form = computed(() => this.store.forms().find((f) => f.id === this.id));
  submitted = linkedSignal({ source: () => this.id, computation: () => false });
  step = linkedSignal({ source: () => this.id, computation: () => 0 });
  pages = computed(() => {
    const pages: Field[][] = [[]];
    for (const field of this.form()?.fields ?? []) {
      if (field.type === "Page break") {
        if (pages[pages.length - 1].length) pages.push([]);
      } else pages[pages.length - 1].push(field);
    }
    return pages.filter((p, i) => p.length || i === 0);
  });
  restart() {
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
      if (["Section", "Page break"].includes(field.type)) continue;
      answers[field.id] = data
        .getAll(field.id)
        .map((value) => (value instanceof File ? value.name : String(value)))
        .join(", ");
      if (
        this.pages()[this.step()].some((q) => q.id === field.id) &&
        field.required &&
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
    if (f.status === "Published") this.store.submit(f.id, answers);
    this.submitted.set(true);
    document.getElementById("main")?.focus();
  }
  async copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      this.store.notice.set(
        "Link copied. Demo links only work in this browser with its local data.",
      );
    } catch {
      this.store.notice.set(
        "Copy the address from your browser to share this local demo link.",
      );
    }
  }
}
