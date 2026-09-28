import { Tooltip } from "./tooltip";
import { FormSettings } from "./form-settings";
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
  imports: [Tooltip, RouterLink, Icon, HeaderActions, FormSettings],
  template: `
    @if (form(); as f) {
      <h1 class="sr-only">Edit {{ f.name }}</h1>
      <div class="editor-toolbar">
        <span class="mobile-menu-space" aria-hidden="true"></span>
        <div class="editor-context-row">
          <nav aria-label="Breadcrumb">
            <a routerLink="/forms">My Forms</a><span> / </span>{{ f.name }}
          </nav>
          <ff-header-actions />
        </div>
        <div class="flex gap-3 items-center editor-publish-actions">
          <span class="saved">{{
            store.persisted() ? "Saved" : "Not saved · storage unavailable"
          }}</span>
          @if (store.hasDraft(f)) {
            <a
              class="secondary"
              [routerLink]="['/forms', f.id, 'preview']"
              target="_blank"
              rel="noopener"
              aria-label="Preview (opens in a new tab)"
              >Preview</a
            >
          }
          <button class="primary" (click)="publish()">
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
          }
          @if (f.published) {
            <a [href]="store.publicUrl(f)" target="_blank" rel="noopener"
              >View live form</a
            >
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
            />Allow Rickety Cricket</label
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
          <div class="form-edit-heading">
            <button
              class="text-button edit-mode-toggle"
              [class.active]="editMode()"
              [attr.aria-pressed]="editMode()"
              (click)="toggleEditMode()"
            >
              <ff-icon name="pencil" />Edit
            </button>
          </div>
          @if (editMode()) {
            <div
              class="question-delete-toolbar"
              role="group"
              aria-label="Delete questions"
            >
              <button
                class="danger delete-action"
                [disabled]="!checkedFields().length"
                (click)="deleteQuestions(false)"
              >
                <ff-icon name="trash" />Delete selected ({{
                  checkedFields().length
                }})
              </button>
              <button
                class="danger delete-action"
                [disabled]="!displayFields().length"
                (click)="deleteQuestions(true)"
              >
                <ff-icon name="trash" />Delete all
              </button>
              <button class="secondary" (click)="toggleEditMode()">
                Cancel
              </button>
            </div>
          }
          <div class="form-paper">
            @if (f.bannerImage) {
              <div
                class="editable-banner"
                [class.banner-fit]="f.bannerFit"
                tabindex="0"
                aria-label="Form banner image controls"
              >
                <img
                  class="form-banner-image"
                  [src]="f.bannerImage"
                  alt="Form banner"
                />
                <div class="banner-image-actions">
                  <button class="secondary" (click)="bannerUpload.click()">
                    <ff-icon name="upload" />Replace this image
                  </button>
                  <button class="danger delete-action" (click)="deleteBanner()">
                    <ff-icon name="trash" />Delete this image
                  </button>
                </div>
              </div>
            }
            <input
              #bannerUpload
              hidden
              tabindex="-1"
              aria-label="Replace banner image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              (change)="uploadBanner($event)"
            />
            @if (imageError()) {
              <p class="error" role="alert">{{ imageError() }}</p>
            }
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
            @for (field of displayFields(); track field.id; let i = $index) {
              <div
                class="field-card"
                [attr.data-field-index]="i"
                [class.selected]="selected() === field.id"
                [class.page-break-card]="field.type === 'Page break'"
                [class.drag-over]="dropTarget() === i"
                [class.drag-source]="dragging() === i"
                [class.question-edit-mode]="editMode()"
                [class.field-placeholder]="field.id === placeholderId"
              >
                @if (editMode()) {
                  <input
                    class="question-checkbox"
                    type="checkbox"
                    [attr.aria-label]="'Select ' + field.label"
                    [checked]="checkedFields().includes(field.id)"
                    (change)="checkField(field.id, $event)"
                  />
                }
                <button
                  [id]="
                    field.id === placeholderId
                      ? 'field-placeholder'
                      : 'preview-' + field.id
                  "
                  class="field-preview"
                  (click)="selectField(field.id)"
                  [attr.aria-label]="
                    field.id === placeholderId
                      ? 'Choose an input type'
                      : 'Edit ' + field.label
                  "
                >
                  @if (field.id === placeholderId) {
                    <strong>Choose an input type</strong
                    ><span class="helper"
                      >Select a field type from the Field panel.</span
                    >
                  } @else {
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
                    [disabled]="i === displayFields().length - 1"
                    (click)="move(i, 1)"
                    [attr.aria-label]="'Move ' + field.label + ' down'"
                  >
                    ↓
                  </button>
                </div>
                @if (editMode()) {
                  <button
                    class="delete-field icon-button"
                    (click)="deleteField(field.id)"
                    [attr.aria-label]="'Delete ' + field.label"
                  >
                    <ff-icon name="trash" />
                  </button>
                }
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
          @if (f.requiredMessageLocation === "Bottom") {
            <p
              class="required-field-message required-message-bottom"
              [style.text-align]="
                (f.requiredMessageAlignment ?? 'Left').toLowerCase()
              "
            >
              {{ f.requiredMessage ?? "Required fields are marked with an *" }}
            </p>
          }
        </section>
        <aside class="field-panel" aria-label="Field settings">
          <div class="settings-tabs" role="tablist" aria-label="Form tools">
            <button
              id="settings-tab"
              role="tab"
              [attr.aria-selected]="panelTab() === 'settings'"
              [attr.tabindex]="panelTab() === 'settings' ? 0 : -1"
              aria-controls="settings-panel"
              (click)="setPanelTab('settings')"
              (keydown)="tabKey($event, 'settings')"
            >
              Form
            </button>
            <button
              id="add-tab"
              role="tab"
              [attr.aria-selected]="panelTab() === 'add'"
              [attr.tabindex]="panelTab() === 'add' ? 0 : -1"
              aria-controls="add-panel"
              (click)="setPanelTab('add')"
              (keydown)="tabKey($event, 'add')"
            >
              Field
            </button>
          </div>
          @if (panelTab() === "settings") {
            <div
              id="settings-panel"
              role="tabpanel"
              aria-labelledby="settings-tab"
            >
              <ff-form-settings
                [bannerImage]="f.bannerImage"
                [bannerFilename]="f.bannerFilename"
                [bannerFit]="f.bannerFit ?? false"
                [requiredMessage]="
                  f.requiredMessage ?? 'Required fields are marked with an *'
                "
                [requiredMessageLocation]="f.requiredMessageLocation ?? 'Top'"
                [requiredMessageAlignment]="
                  f.requiredMessageAlignment ?? 'Left'
                "
                (bannerUpload)="uploadBanner($event)"
                (settingsChange)="store.update(id, $event)"
                [fields]="f.fields"
                (fieldsChange)="store.update(id, { fields: $event })"
              />
            </div>
          } @else {
            <div id="add-panel" role="tabpanel" aria-labelledby="add-tab">
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
                    aria-label="Change question type"
                    ffTooltip="Change question type"
                    (click)="changeType()"
                  >
                    <ff-icon name="change" />
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
                    @for (
                      option of field.options;
                      track $index;
                      let i = $index
                    ) {
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
                      (click)="
                        patch({ options: [...field.options, 'New option'] })
                      "
                    >
                      ＋ Add option
                    </button>
                  </fieldset>
                }
                @if (
                  !["Section", "Page break", "Hidden field"].includes(
                    field.type
                  )
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
                <button
                  class="text-button delete-question-setting"
                  aria-label="Delete this question"
                  ffTooltip="Delete this question"
                  (click)="deleteField(field.id)"
                >
                  <ff-icon name="trash" />
                </button>
              } @else {
                <h2 class="sr-only">Add field</h2>
                <label class="sr-only" for="field-search"
                  >Search field types</label
                >
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
                    <p class="no-field-results">No matching field types.</p>
                  }
                </div>
                <p class="helper">Choose a field to add it to your form.</p>
              }
            </div>
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
  panelTab = linkedSignal({
    source: () => this.id,
    computation: (): "settings" | "add" => "settings",
  });
  selected = linkedSignal({
    source: () => this.id,
    computation: (): string | null => null,
  });
  active = computed(() =>
    this.form()?.fields.find((f) => f.id === this.selected()),
  );
  readonly placeholderId = "__new-field-placeholder";
  pendingIndex = linkedSignal({
    source: () => this.id,
    computation: (): number | null => null,
  });
  editMode = linkedSignal({ source: () => this.id, computation: () => false });
  checkedFields = signal<string[]>([]);
  displayFields = computed(() => {
    const fields = [...(this.form()?.fields ?? [])];
    const index = this.pendingIndex();
    if (index !== null)
      fields.splice(Math.min(index, fields.length), 0, {
        id: this.placeholderId,
        type: "Text input",
        label: "New field placeholder",
        description: "",
        required: false,
        options: [],
      });
    return fields;
  });
  toggleEditMode() {
    this.editMode.update((value) => !value);
    this.checkedFields.set([]);
  }
  checkField(id: string, event: Event) {
    this.checkedFields.update((ids) =>
      (event.target as HTMLInputElement).checked
        ? [...ids, id]
        : ids.filter((value) => value !== id),
    );
  }
  deleteQuestions(all: boolean) {
    const ids = all
      ? this.displayFields().map((field) => field.id)
      : this.checkedFields();
    if (
      !ids.length ||
      !confirm(
        all
          ? "Delete all questions in this form?"
          : `Delete ${ids.length} selected questions?`,
      )
    )
      return;
    this.removeFields(ids);
  }
  removeFields(ids: string[]) {
    const fields = this.displayFields().filter(
      (field) => !ids.includes(field.id),
    );
    const pending = fields.findIndex(
      (field) => field.id === this.placeholderId,
    );
    this.pendingIndex.set(pending < 0 ? null : pending);
    this.store.update(this.id, {
      fields: fields.filter((field) => field.id !== this.placeholderId),
    });
    this.checkedFields.set([]);
    if (ids.includes(this.selected() ?? "")) this.selected.set(null);
  }
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
    this.panelTab.set("add");
    if (id === this.placeholderId) {
      this.selected.set(null);
      return;
    }
    this.selected.set(id);
    requestAnimationFrame(() =>
      (
        document.getElementById("field-label") ??
        document.getElementById("add-tab")
      )?.focus(),
    );
  }
  setPanelTab(tab: "settings" | "add") {
    this.panelTab.set(tab);
    this.selected.set(null);
  }
  tabKey(event: KeyboardEvent, tab: "settings" | "add") {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "settings"
        : event.key === "End"
          ? "add"
          : tab === "settings"
            ? "add"
            : "settings";
    this.setPanelTab(next);
    document
      .getElementById(next === "settings" ? "settings-tab" : "add-tab")
      ?.focus();
  }
  imageError = signal("");
  private uploadVersion = 0;
  async uploadBanner(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const version = ++this.uploadVersion,
      formId = this.id;
    this.imageError.set("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      this.imageError.set(
        "Choose a PNG, JPEG, or WebP image no larger than 5 MB.",
      );
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const image = new Image();
      image.src = data;
      await image.decode();
      // Optimize large images for the browser-local demo's storage.
      const scale = Math.min(1, 1920 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const optimized = canvas.toDataURL("image/webp", 0.85);
      if (version === this.uploadVersion && formId === this.id)
        this.store.update(formId, {
          bannerImage: optimized.length < data.length ? optimized : data,
          bannerFilename: file.name,
        });
    } catch {
      if (version === this.uploadVersion && formId === this.id)
        this.imageError.set(
          "This image could not be opened. Please choose another file.",
        );
    }
  }
  deleteBanner() {
    if (!confirm("Delete this banner image?")) return;
    this.uploadVersion++;
    this.store.update(this.id, {
      bannerImage: undefined,
      bannerFilename: undefined,
      bannerFit: false,
    });
    this.imageError.set("");
  }
  changeType() {
    const field = this.active(),
      form = this.form();
    if (
      !field ||
      !form ||
      !confirm(
        "Change this question's type? Its settings and conditional rules will be cleared.",
      )
    )
      return;
    const index = form.fields.findIndex((f) => f.id === field.id);
    this.removeFields([field.id]);
    this.pendingIndex.set(index);
    this.showPicker();
  }
  showPicker() {
    this.fieldQuery.set("");
    this.panelTab.set("add");
    this.selected.set(null);
    if (this.pendingIndex() === null)
      this.pendingIndex.set(this.form()?.fields.length ?? 0);
    requestAnimationFrame(() =>
      document.getElementById("field-placeholder")?.focus(),
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
    if (field && confirm("Delete this option?"))
      this.patch({ options: field.options.filter((_, j) => j !== i) });
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
      const fields = [...f.fields];
      fields.splice(
        Math.min(this.pendingIndex() ?? fields.length, fields.length),
        0,
        field,
      );
      this.pendingIndex.set(null);
      this.store.update(this.id, { fields });
      this.selectField(field.id);
    }
  }
  deleteField(id: string) {
    if (
      confirm(
        id === this.placeholderId
          ? "Delete this field placeholder?"
          : "Remove this question?",
      )
    )
      this.removeFields([id]);
  }
  move(i: number, delta: number) {
    this.reorder(i, i + delta);
  }
  reorder(from: number, to: number) {
    const f = this.form();
    if (!f || to < 0 || to >= this.displayFields().length || from === to)
      return;
    const fields = moveField(this.displayFields(), from, to);
    const pending = fields.findIndex(
      (field) => field.id === this.placeholderId,
    );
    this.pendingIndex.set(pending < 0 ? null : pending);
    this.store.update(this.id, {
      fields: fields.filter((field) => field.id !== this.placeholderId),
    });
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
      const id = this.displayFields()[i].id;
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
      this.displayFields()
        .slice(0, i + 1)
        .filter((field) => field.type === "Page break").length + 1
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
      this.pendingIndex.set(null);
      this.checkedFields.set([]);
      this.store.discard(f.id);
      this.selected.set(null);
      if (!f.published) void this.router.navigate(["/forms"]);
      this.store.notify("Draft deleted.");
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
      this.store.notify(
        "Add a form title, at least one question, and non-empty labels and options before publishing.",
      );
      return;
    }
    this.store.publish(this.id);
    this.store.notify(
      "Published successfully. The form link now shows this version.",
    );
  }
}
