import { Component, input, output, signal } from "@angular/core";
import { Field, FieldCondition } from "./store";
import { Icon } from "./icon";

@Component({
  selector: "ff-form-settings",
  imports: [Icon],
  template: `
    <section class="banner-settings" aria-label="Form banner">
      <h3>Banner image</h3>
      <p class="helper">Optional PNG, JPEG, or WebP image, up to 1 MB.</p>
      @if (bannerImage()) {
        <img
          class="banner-thumbnail"
          [src]="bannerImage()"
          alt="Current form banner"
        />
        <button class="danger delete-action" (click)="deleteBanner()">
          <ff-icon name="trash" />Delete image
        </button>
      }
      <label
        >Upload banner image<input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          (change)="uploadBanner($event)"
      /></label>
      @if (imageError()) {
        <p class="error" role="alert">{{ imageError() }}</p>
      }
    </section>
    <p class="helper">
      Control when questions appear and when an answer is required. Changes save
      automatically.
    </p>
    @for (section of sections; track section.key) {
      <section class="rule-section" [attr.aria-label]="section.title">
        <h3>{{ section.title }}</h3>
        <p class="helper">{{ section.description }}</p>
        @for (field of rules(section.key); track field.id) {
          <div class="condition-card">
            <div class="condition-heading">
              <strong>{{ field.label }}</strong>
              <button
                class="icon-button"
                [attr.aria-label]="
                  'Remove ' +
                  section.title.toLowerCase() +
                  ' for ' +
                  field.label
                "
                (click)="remove(field, section.key)"
              >
                <ff-icon name="trash" />
              </button>
            </div>
            <label
              >When this earlier question
              <select
                [value]="field[section.key]!.fieldId"
                (change)="
                  change(field, section.key, {
                    fieldId: value($event),
                    value: '',
                  })
                "
              >
                <option value="" disabled>Choose a question</option>
                @for (source of sources(field); track source.id) {
                  <option [value]="source.id">{{ source.label }}</option>
                }
              </select>
            </label>
            @if (!valid(field, section.key)) {
              <p class="error">
                Choose an earlier question. This rule is inactive until its
                source is valid.
              </p>
            }
            <label
              >Answer
              <select
                [value]="field[section.key]!.operator"
                (change)="operator(field, section.key, $event)"
              >
                <option value="equals">matches</option>
                <option value="notEquals">does not match</option>
                <option value="answered">is answered</option>
              </select>
            </label>
            @if (field[section.key]!.operator !== "answered") {
              <label
                >Value<input
                  [value]="field[section.key]!.value"
                  (input)="change(field, section.key, { value: value($event) })"
                  placeholder="Enter the answer to match"
              /></label>
              <p class="helper">
                Text ignores capitalization. For choices, enter an option
                exactly.
              </p>
            }
            @if (section.key === "requiredWhen" && field.required) {
              <p class="helper">
                This question is already always required. Turn off Required in
                its field settings to require it only when this rule matches.
              </p>
            }
          </div>
        } @empty {
          <p class="helper">No rules yet.</p>
        }
        <label
          >Add a rule for
          <select
            #target
            [value]="''"
            (change)="add(section.key, target.value); target.value = ''"
          >
            <option value="">Choose a question</option>
            @for (field of targets(section.key); track field.id) {
              <option [value]="field.id">{{ field.label }}</option>
            }
          </select>
        </label>
        @if (!targets(section.key).length) {
          <p class="helper">
            Add at least two questions, or edit an existing rule above.
          </p>
        }
      </section>
    }
  `,
})
export class FormSettings {
  bannerImage = input<string>();
  bannerImageChange = output<string | undefined>();
  imageError = signal("");
  private uploadVersion = 0;
  async uploadBanner(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const version = ++this.uploadVersion;
    this.imageError.set("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1024 * 1024
    ) {
      this.imageError.set(
        "Choose a PNG, JPEG, or WebP image no larger than 1 MB.",
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
      if (version === this.uploadVersion) this.bannerImageChange.emit(data);
    } catch {
      if (version === this.uploadVersion)
        this.imageError.set(
          "This image could not be opened. Please choose another file.",
        );
    }
  }
  deleteBanner() {
    if (confirm("Delete the form banner image?")) {
      this.uploadVersion++;
      this.bannerImageChange.emit(undefined);
      this.imageError.set("");
    }
  }
  fields = input.required<Field[]>();
  fieldsChange = output<Field[]>();
  sections = [
    {
      key: "requiredWhen" as const,
      title: "Conditional requirements",
      description: "Require an answer when an earlier answer matches.",
    },
    {
      key: "visibleWhen" as const,
      title: "Conditional display",
      description:
        "Show a question only when an earlier answer matches. Otherwise hide it.",
    },
  ];
  question(field: Field) {
    return !["Section", "Page break", "Hidden field", "File upload"].includes(
      field.type,
    );
  }
  sources(field: Field) {
    return this.fields()
      .slice(
        0,
        this.fields().findIndex((f) => f.id === field.id),
      )
      .filter((f) => this.question(f));
  }
  targets(key: "visibleWhen" | "requiredWhen") {
    return this.fields().filter(
      (f) =>
        !["Section", "Page break", "Hidden field"].includes(f.type) &&
        !f[key] &&
        this.sources(f).length,
    );
  }
  rules(key: "visibleWhen" | "requiredWhen") {
    return this.fields().filter((f) => !!f[key]);
  }
  valid(field: Field, key: "visibleWhen" | "requiredWhen") {
    return this.sources(field).some((f) => f.id === field[key]?.fieldId);
  }
  value(event: Event) {
    return (event.target as HTMLInputElement).value;
  }
  add(key: "visibleWhen" | "requiredWhen", id: string) {
    const field = this.fields().find((f) => f.id === id);
    const source = field && this.sources(field)[0];
    if (field && source)
      this.change(field, key, {
        fieldId: source.id,
        operator: "equals",
        value: "",
      });
  }
  operator(field: Field, key: "visibleWhen" | "requiredWhen", event: Event) {
    this.change(field, key, {
      operator: this.value(event) as FieldCondition["operator"],
    });
  }
  change(
    field: Field,
    key: "visibleWhen" | "requiredWhen",
    patch: Partial<FieldCondition>,
  ) {
    this.fieldsChange.emit(
      this.fields().map((f) =>
        f.id === field.id
          ? ({ ...f, [key]: { ...f[key], ...patch } } as Field)
          : f,
      ),
    );
  }
  remove(field: Field, key: "visibleWhen" | "requiredWhen") {
    if (!confirm("Delete this conditional rule?")) return;
    this.fieldsChange.emit(
      this.fields().map((f) => {
        if (f.id !== field.id) return f;
        const next = { ...f };
        delete next[key];
        return next;
      }),
    );
  }
}
