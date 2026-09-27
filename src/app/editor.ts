import { ChromeState, HeaderActions } from "./chrome";
import { moveField } from "./form-version";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  Component,
  computed,
  inject,
  signal,
  linkedSignal,
} from "@angular/core";
import { ActivatedRoute, RouterLink, Router } from "@angular/router";
import { Store, Field, FieldType, newField } from "./store";
import { Icon } from "./icon";
@Component({
  imports: [RouterLink, Icon, HeaderActions],
  template: `
    @if (form(); as f) {
      <h1 class="sr-only">Edit {{ f.name }}</h1>
      <div class="editor-toolbar">
        <button
          class="mobile-toggle icon-button"
          aria-label="Toggle navigation"
          (click)="ui.openMenu()"
        >
          ☰
        </button>
        <nav aria-label="Breadcrumb">
          <a routerLink="/forms">My Forms</a><span> / </span>{{ f.name }}
        </nav>
        <div class="flex gap-3 items-center">
          <ff-header-actions />
          <span class="saved">{{
            store.persisted() ? "Saved" : "Not saved · storage unavailable"
          }}</span
          ><a
            class="secondary"
            [routerLink]="['/forms', f.id, 'preview']"
            target="_blank"
            rel="noopener"
            aria-label="Preview (opens in a new tab)"
            >Preview</a
          ><button class="primary" (click)="publish()">
            {{
              f.published && !store.hasDraft(f)
                ? "Published ✓"
                : f.published
                  ? "Publish changes"
                  : "Publish"
            }}
          </button>
        </div>
      </div>
      <div class="draft-toolbar">
        <span role="status">
          @if (store.hasDraft(f)) {
            <strong>Unpublished draft</strong> · changes are not live
          } @else {
            Published version is up to date
          }</span
        ><label class="visibility-control"
          >Access<select
            aria-label="Form access"
            [value]="f.visibility ?? 'public'"
            (change)="setVisibility($event)"
          >
            <option value="public">Public · anyone with the link</option>
            <option value="private">Private · permitted accounts only</option>
          </select></label
        >
        @if (f.visibility === "private") {
          <label class="choice"
            ><input
              type="checkbox"
              [checked]="f.allowedUsers?.includes('alex')"
              (change)="allowAlex($event)"
            />Allow Alex Morgan</label
          >
        }
        @if (store.hasDraft(f)) {
          <button class="text-button" (click)="discard()">
            <ff-icon name="trash" /> Delete draft
          </button>
        }
      </div>
      <p class="sr-only" id="reorder-help">
        Drag a handle to reorder questions, or focus it and press Alt plus Up or
        Down. Arrow buttons also move questions.
      </p>
      <div class="sr-only" role="status">{{ reorderNotice() }}</div>
      <div class="editor-layout">
        <section
          class="editor-canvas"
          id="form-content"
          tabindex="-1"
          aria-label="Form content"
        >
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
                [attr.data-field-index]="i"
                [class.selected]="selected() === field.id"
                [class.page-break-card]="field.type === 'Page break'"
                [class.drag-over]="dropTarget() === i"
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
                  @if (
                    field.type === "Multiple choice" ||
                    field.type === "Checkboxes"
                  ) {
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
                    @switch (field.type) {
                      @case ("Paragraph") {
                        <span class="mock-input mock-textarea"
                          >Your answer…</span
                        >
                      }
                      @case ("Address") {
                        <span class="mock-input mock-textarea"
                          >Street address, city, postal code…</span
                        >
                      }
                      @case ("Dropdown") {
                        <span class="mock-input mock-select"
                          ><span>{{
                            field.defaultValue || "Choose an option"
                          }}</span
                          ><span aria-hidden="true">⌄</span></span
                        >
                      }
                      @case ("Date") {
                        <span class="mock-input mock-select"
                          ><span>mm/dd/yyyy</span><ff-icon name="calendar"
                        /></span>
                      }
                      @case ("File upload") {
                        <span class="mock-file"
                          ><span class="file-button">Choose file</span
                          ><span>No file selected</span></span
                        >
                      }
                      @case ("Page break") {
                        <span class="page-break-preview"
                          >Page break · Page {{ pageNumber(i) }} starts
                          below</span
                        >
                      }
                      @case ("Section") {
                        <span class="helper">Section heading</span>
                      }
                      @case ("Hidden field") {
                        <span class="helper">Hidden from respondents</span>
                      }
                      @case ("Rating") {
                        <span class="mock-input">☆ ☆ ☆ ☆ ☆</span>
                      }
                      @default {
                        <span class="mock-input">Your answer…</span>
                      }
                    }
                  }
                </button>
                <div class="field-tools">
                  <button
                    class="drag-handle"
                    (pointerdown)="pointerStart($event, i)"
                    (pointermove)="pointerMove($event)"
                    (pointerup)="pointerEnd($event)"
                    (pointercancel)="dragEnd()"
                    [id]="'drag-' + field.id"
                    [attr.aria-label]="'Reorder ' + field.label"
                    aria-describedby="reorder-help"
                    (keydown)="reorderKey($event, i)"
                  >
                    <ff-icon name="grip" />
                  </button>
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
                    ↓
                  </button>
                </div>
                <button
                  class="delete-field icon-button"
                  (click)="deleteField(field.id)"
                  [attr.aria-label]="'Delete ' + field.label"
                >
                  <ff-icon name="trash" />
                </button>
              </div>
            }
            <button
              class="add-field"
              [class.add-active]="!selected()"
              (click)="showPicker()"
            >
              ＋ Add field
            </button>
          </div>
        </section>
        <aside class="field-panel" aria-label="Field settings">
          @if (active(); as field) {
            <div class="panel-heading">
              <h2>
                <span class="field-heading-icon" aria-hidden="true">{{
                  icons[field.type]
                }}</span
                >{{ field.type }}
              </h2>
              <button
                class="icon-button"
                id="field-settings-back"
                aria-label="Back to field types"
                (click)="showPicker()"
              >
                <ff-icon name="arrow-left" />
              </button>
            </div>
            @if (field.type !== "Page break") {
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
            }
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
            <p class="helper">Changes save automatically.</p>
          } @else {
            <h2>Add field</h2>
            <label class="sr-only" for="field-search">Search field types</label>
            <div class="search field-search">
              <ff-icon name="search" />
              <input
                id="field-search"
                placeholder="Search fields…"
                [value]="fieldQuery()"
                (input)="fieldQuery.set(value($event))"
              />
            </div>

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
  ui = inject(ChromeState);
  router = inject(Router);
  dragging = signal<number | null>(null);
  dropTarget = signal<number | null>(null);
  reorderNotice = signal("");
  route = inject(ActivatedRoute);
  params = toSignal(this.route.paramMap, { requireSync: true });
  get id() {
    return this.params().get("id")!;
  }
  form = computed(() =>
    this.store.forms().find((f) => f.id === this.id && this.store.canEdit(f)),
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
      (
        document.getElementById("field-label") ??
        document.getElementById("field-settings-back")
      )?.focus(),
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
      const field = newField(
        type,
        type === "Page break"
          ? "Page break"
          : type === "Section"
            ? "Section heading"
            : "Untitled question",
      );
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
    this.reorder(i, i + delta);
  }
  reorder(from: number, to: number) {
    const f = this.form();
    if (!f || to < 0 || to >= f.fields.length || from === to) return;
    const fields = moveField(f.fields, from, to);
    this.store.update(this.id, { fields });
    this.reorderNotice.set(
      fields[to].label +
        " moved to position " +
        (to + 1) +
        " of " +
        fields.length,
    );
  }
  reorderKey(event: KeyboardEvent, i: number) {
    if (
      event.altKey &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      const id = this.form()?.fields[i].id;
      this.move(i, event.key === "ArrowUp" ? -1 : 1);
      requestAnimationFrame(() =>
        document.getElementById("drag-" + id)?.focus(),
      );
    }
  }
  pointerStart(event: PointerEvent, i: number) {
    if (event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.focus();
    handle.setPointerCapture(event.pointerId);
    this.dragging.set(i);
    this.dropTarget.set(i);
  }
  pointerMove(event: PointerEvent) {
    if (this.dragging() === null) return;
    const card = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-field-index]");
    if (card) this.dropTarget.set(Number(card.dataset["fieldIndex"]));
    if (event.clientY < 100) window.scrollBy(0, -12);
    else if (event.clientY > innerHeight - 80) window.scrollBy(0, 12);
  }
  pointerEnd(event: PointerEvent) {
    const from = this.dragging(),
      to = this.dropTarget();
    if (from !== null && to !== null) this.reorder(from, to);
    const handle = event.currentTarget as HTMLElement;
    if (handle.hasPointerCapture(event.pointerId))
      handle.releasePointerCapture(event.pointerId);
    this.dragEnd();
  }
  dragEnd() {
    this.dragging.set(null);
    this.dropTarget.set(null);
  }
  pageNumber(i: number) {
    return (
      (this.form()
        ?.fields.slice(0, i + 1)
        .filter((field) => field.type === "Page break").length ?? 0) + 1
    );
  }
  setVisibility(event: Event) {
    this.store.update(this.id, {
      visibility: this.value(event) === "private" ? "private" : "public",
    });
  }
  allowAlex(event: Event) {
    this.store.update(this.id, {
      allowedUsers: (event.target as HTMLInputElement).checked
        ? ["derek", "alex"]
        : ["derek"],
    });
  }
  discard() {
    const f = this.form();
    if (
      f &&
      confirm(
        f.published
          ? "Delete all unpublished changes and restore the published form?"
          : "Delete this unpublished form draft?",
      )
    ) {
      this.store.discard(f.id);
      this.selected.set(null);
      if (!f.published) void this.router.navigate(["/forms"]);
      this.store.notice.set("Draft deleted.");
    }
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
    this.store.publish(this.id);
    this.store.notice.set(
      "Published successfully. The form link now shows this version.",
    );
  }
}
