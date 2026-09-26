import { toSignal } from "@angular/core/rxjs-interop";
import {
  Component,
  computed,
  inject,
  signal,
  linkedSignal,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Store, Field, FieldType, newField } from "./store";
@Component({
  imports: [RouterLink],
  template: `
    @if (form(); as f) {
      <h1 class="sr-only">Edit {{ f.name }}</h1>
      <div class="editor-toolbar">
        <nav aria-label="Breadcrumb">
          <a routerLink="/forms">My Forms</a><span> / </span>{{ f.name }}
        </nav>
        <div class="flex gap-3 items-center">
          <span class="saved">{{
            store.persisted()
              ? "Saved locally"
              : "Not saved · storage unavailable"
          }}</span
          ><a class="secondary" [routerLink]="['/forms', f.id, 'view']"
            >Preview</a
          ><button class="primary" (click)="publish()">
            {{ f.status === "Published" ? "Published ✓" : "Publish" }}
          </button>
        </div>
      </div>
      <div class="editor-layout">
        <section class="editor-canvas">
          <div class="form-paper">
            <label class="sr-only" for="form-title">Form title</label
            ><input
              id="form-title"
              class="title-input"
              [value]="f.name"
              (input)="updateForm('name', $event)"
            /><label class="sr-only" for="form-description"
              >Form description</label
            ><textarea
              id="form-description"
              class="description-input"
              rows="2"
              [value]="f.description"
              (input)="updateForm('description', $event)"
            ></textarea>
            @for (field of f.fields; track field.id; let i = $index) {
              <div
                class="field-card"
                [class.selected]="selected() === field.id"
              >
                <button
                  class="field-preview"
                  (click)="selectField(field.id)"
                  [attr.aria-label]="'Edit ' + field.label"
                >
                  <strong
                    >{{ field.label }}{{ field.required ? " *" : "" }}</strong
                  >
                  @if (field.description) {
                    <small>{{ field.description }}</small>
                  }
                  @if (hasOptions(field)) {
                    @for (option of field.options; track $index) {
                      <span class="mock-option"
                        ><span
                          class="mock-radio"
                          [class.square]="field.type === 'Checkboxes'"
                        ></span
                        >{{ option }}</span
                      >
                    }
                  } @else {
                    <span class="mock-input">{{
                      field.type === "Rating"
                        ? "☆ ☆ ☆ ☆ ☆"
                        : field.type === "Page break"
                          ? "Next page →"
                          : field.type === "Section"
                            ? "Section heading"
                            : field.type === "Hidden field"
                              ? "Hidden from respondents"
                              : field.type === "File upload"
                                ? "Choose file…"
                                : "Your answer…"
                    }}</span>
                  }
                </button>
                <div class="field-tools">
                  <button
                    [disabled]="i === 0"
                    (click)="move(i, -1)"
                    [attr.aria-label]="'Move ' + field.label + ' up'"
                  >
                    ↑</button
                  ><button
                    [disabled]="i === f.fields.length - 1"
                    (click)="move(i, 1)"
                    [attr.aria-label]="'Move ' + field.label + ' down'"
                  >
                    ↓</button
                  ><button
                    (click)="deleteField(field.id)"
                    [attr.aria-label]="'Delete ' + field.label"
                  >
                    ×
                  </button>
                </div>
              </div>
            }
            <button
              class="add-field"
              [class.add-active]="!selected()"
              (click)="showPicker()"
            >
              ＋ Add a field
            </button>
          </div>
        </section>
        <aside class="field-panel" aria-label="Field settings">
          @if (active(); as field) {
            <div class="panel-heading">
              <h2>{{ field.type }}</h2>
              <button
                class="icon-button"
                aria-label="Close field settings"
                (click)="selected.set(null)"
              >
                ×
              </button>
            </div>
            <label
              >Label<input
                id="field-label"
                [value]="field.label"
                (input)="change('label', $event)" /></label
            ><label
              >Description<textarea
                rows="2"
                [value]="field.description"
                (input)="change('description', $event)"
              ></textarea>
            </label>
            @if (hasOptions(field)) {
              <fieldset>
                <legend>Options</legend>
                @for (option of field.options; track $index; let i = $index) {
                  <div class="option-row">
                    <input
                      [attr.aria-label]="'Option ' + (i + 1)"
                      [value]="option"
                      (input)="optionChange(i, $event)"
                    /><button
                      [disabled]="field.options.length < 2"
                      [attr.aria-label]="'Remove option ' + (i + 1)"
                      (click)="removeOption(i)"
                    >
                      ×
                    </button>
                  </div>
                }
                <button
                  class="text-button"
                  (click)="patch({ options: [...field.options, 'New option'] })"
                >
                  ＋ Add option
                </button>
              </fieldset>
            }
            @if (
              !["Section", "Page break", "Hidden field"].includes(field.type)
            ) {
              <label class="switch-label"
                ><input
                  type="checkbox"
                  [checked]="field.required"
                  (change)="required($event)"
                />Required</label
              >
            }
            @if (field.type === "Hidden field") {
              <label
                >Hidden value<input
                  [value]="field.defaultValue ?? ''"
                  (input)="patch({ defaultValue: value($event) })"
              /></label>
            }
            @if (hasOptions(field) && field.type !== "Checkboxes") {
              <label
                >Default value<select
                  [value]="field.defaultValue ?? ''"
                  (change)="patch({ defaultValue: value($event) })"
                >
                  <option value="">None</option>
                  @for (option of field.options; track $index) {
                    <option>{{ option }}</option>
                  }
                </select></label
              >
            }
            <p class="helper">Changes save automatically in this browser.</p>
          } @else {
            <h2>Add field</h2>
            <label class="sr-only" for="field-search">Search field types</label
            ><input
              id="field-search"
              placeholder="Search fields…"
              [value]="fieldQuery()"
              (input)="fieldQuery.set(value($event))"
            />

            <div class="field-types">
              @for (type of filteredTypes(); track type; let i = $index) {
                @if (i === 0 || (!fieldQuery() && i === 10)) {
                  <p class="nav-caption field-group">
                    {{ i === 0 ? "BASIC" : "ADVANCED" }}
                  </p>
                }
                <button (click)="add(type)">
                  <span aria-hidden="true">{{ icons[type] }}</span
                  >{{ type }}
                </button>
              } @empty {
                <p>No matching field types.</p>
              }
            </div>
            <p class="helper">Choose a field to add it to your form.</p>
          }
        </aside>
      </div>
    } @else {
      <section class="page empty">
        <h1>Form not found</h1>
        <a routerLink="/forms">Back to My Forms</a>
      </section>
    }
  `,
})
export class Editor {
  store = inject(Store);
  route = inject(ActivatedRoute);
  params = toSignal(this.route.paramMap, { requireSync: true });
  get id() {
    return this.params().get("id")!;
  }
  form = computed(() =>
    this.store.forms().find((f) => f.id === this.id && !f.shared),
  );
  selected = linkedSignal({
    source: () => this.id,
    computation: (): string | null => null,
  });
  active = computed(() =>
    this.form()?.fields.find((f) => f.id === this.selected()),
  );
  fieldQuery = signal("");
  types: FieldType[] = [
    "Text input",
    "Paragraph",
    "Multiple choice",
    "Checkboxes",
    "Dropdown",
    "Number",
    "Date",
    "File upload",
    "Rating",
    "Signature",
    "Linear scale",
    "Phone",
    "Email",
    "Address",
    "Website",
    "Section",
    "Page break",
    "Hidden field",
  ];
  icons: Record<FieldType, string> = {
    "Text input": "T",
    Paragraph: "≡",
    "Multiple choice": "⊙",
    Checkboxes: "☑",
    Dropdown: "▾",
    Number: "#",
    Date: "▦",
    Email: "✉",
    Phone: "♧",
    Rating: "☆",
    "File upload": "⇧",
    Signature: "✎",
    "Linear scale": "↔",
    Address: "⌖",
    Website: "◎",
    Section: "▤",
    "Page break": "↵",
    "Hidden field": "◉",
  };
  filteredTypes = computed(() =>
    this.types.filter((t) =>
      t.toLowerCase().includes(this.fieldQuery().toLowerCase()),
    ),
  );
  selectField(id: string) {
    this.selected.set(id);
    requestAnimationFrame(() =>
      document.getElementById("field-label")?.focus(),
    );
  }
  showPicker() {
    this.selected.set(null);
    requestAnimationFrame(() =>
      document.getElementById("field-search")?.focus(),
    );
  }
  value(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  hasOptions(f: Field) {
    return ["Multiple choice", "Checkboxes", "Dropdown"].includes(f.type);
  }
  updateForm(key: "name" | "description", e: Event) {
    this.store.update(this.id, { [key]: this.value(e) });
  }
  change(key: "label" | "description", e: Event) {
    this.patch({ [key]: this.value(e) });
  }
  patch(changes: Partial<Field>) {
    const f = this.form();
    if (f)
      this.store.update(this.id, {
        fields: f.fields.map((field) =>
          field.id === this.selected() ? { ...field, ...changes } : field,
        ),
      });
  }
  required(e: Event) {
    this.patch({ required: (e.target as HTMLInputElement).checked });
  }
  optionChange(i: number, e: Event) {
    const field = this.active();
    if (field)
      this.patch({
        options: field.options.map((o, j) => (i === j ? this.value(e) : o)),
      });
  }
  removeOption(i: number) {
    const field = this.active();
    if (field) this.patch({ options: field.options.filter((_, j) => j !== i) });
  }
  add(type: FieldType) {
    const f = this.form();
    if (f) {
      const field = newField(type);
      this.store.update(this.id, { fields: [...f.fields, field] });
      this.selectField(field.id);
    }
  }
  deleteField(id: string) {
    const f = this.form();
    if (f && confirm("Remove this question?")) {
      this.store.update(this.id, {
        fields: f.fields.filter((field) => field.id !== id),
      });
      this.selected.set(null);
    }
  }
  move(i: number, delta: number) {
    const fields = [...(this.form()?.fields ?? [])];
    [fields[i], fields[i + delta]] = [fields[i + delta], fields[i]];
    this.store.update(this.id, { fields });
  }
  publish() {
    const f = this.form();
    if (!f) return;
    if (
      !f.name.trim() ||
      !f.fields.length ||
      f.fields.some(
        (field) =>
          !field.label.trim() ||
          (this.hasOptions(field) && field.options.some((o) => !o.trim())),
      )
    ) {
      this.store.notice.set(
        "Add a form title, at least one question, and non-empty labels and options before publishing.",
      );
      return;
    }
    this.store.update(this.id, { status: "Published" });
    this.store.notice.set(
      "Published in this demo. Use Preview to fill out your form. Links work in this browser only.",
    );
  }
}
