import { seedForms as seed } from "./sample-data";
import { copyText } from "./clipboard";
import {
  NotificationRecord,
  addNotification,
  openNotifications,
} from "./notification-state";
import {
  FormSnapshot,
  migrateForm,
  hasDraft,
  publishForm,
  discardDraft,
  canReadForm,
  duplicateForm,
} from "./form-version";
import { Service, computed, effect, signal } from "@angular/core";
export type FieldType =
  | "Text input"
  | "Paragraph"
  | "Multiple choice"
  | "Checkboxes"
  | "Dropdown"
  | "Number"
  | "Date"
  | "Email"
  | "Phone"
  | "Rating"
  | "File upload"
  | "Signature"
  | "Linear scale"
  | "Address"
  | "Website"
  | "Section"
  | "Page break"
  | "Hidden field";
export interface Field {
  visibleWhen?: FieldCondition;
  requiredWhen?: FieldCondition;
  id: string;
  type: FieldType;
  label: string;
  description: string;
  required: boolean;
  options: string[];
  defaultValue?: string;
}
export interface FieldCondition {
  fieldId: string;
  operator: "equals" | "notEquals" | "answered";
  value: string;
}
export interface Entry {
  id: string;
  date: string;
  answers: Record<string, string>;
  labels?: Record<string, string>;
}
export interface FormRecord {
  bannerImage?: string;
  bannerFilename?: string;
  bannerFit?: boolean;
  requiredMessage?: string;
  showRequiredMessage?: boolean;
  requiredMessageAlignment?: "Left" | "Center" | "Right";
  requiredMessageLocation?: "Top" | "Bottom" | "Hidden";
  published?: FormSnapshot | null;
  visibility?: "public" | "private";
  allowedUsers?: string[];
  id: string;
  name: string;
  description: string;
  status: "Published" | "Draft";
  responses: number;
  modified: string;
  shared: boolean;
  fields: Field[];
  entries: Entry[];
}
export function uniqueId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20)
  );
}
export function newField(type: FieldType, label = "Untitled question"): Field {
  return {
    id: uniqueId(),
    type,
    label,
    description: "",
    required: false,
    options: ["Option 1", "Option 2"],
  };
}
export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringMap(value: unknown): value is Record<string, string> {
  return (
    record(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}
function validField(value: unknown): value is Field {
  if (!record(value)) return false;
  const types: string[] = [
    "Text input",
    "Paragraph",
    "Multiple choice",
    "Checkboxes",
    "Dropdown",
    "Number",
    "Date",
    "Email",
    "Phone",
    "Rating",
    "File upload",
    "Signature",
    "Linear scale",
    "Address",
    "Website",
    "Section",
    "Page break",
    "Hidden field",
  ];
  return (
    [value["visibleWhen"], value["requiredWhen"]].every(
      (rule) =>
        rule === undefined ||
        (record(rule) &&
          typeof rule["fieldId"] === "string" &&
          ["equals", "notEquals", "answered"].includes(
            String(rule["operator"]),
          ) &&
          typeof rule["value"] === "string"),
    ) &&
    typeof value["id"] === "string" &&
    typeof value["type"] === "string" &&
    types.includes(value["type"]) &&
    typeof value["label"] === "string" &&
    typeof value["description"] === "string" &&
    typeof value["required"] === "boolean" &&
    Array.isArray(value["options"]) &&
    value["options"].every((option: unknown) => typeof option === "string") &&
    (value["defaultValue"] === undefined ||
      typeof value["defaultValue"] === "string")
  );
}
function validBanner(value: unknown): boolean {
  return (
    value === undefined ||
    [
      "/abel-y-costa-BhgeP48pDOE-unsplash.jpg",
      "/michael-denning-LXomcUwf4vQ-unsplash.jpg",
    ].includes(String(value)) ||
    (typeof value === "string" &&
      value.length <= 7000000 &&
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
  );
}
function validPresentation(value: Record<string, unknown>): boolean {
  return (
    (value["bannerFilename"] === undefined ||
      typeof value["bannerFilename"] === "string") &&
    (value["showRequiredMessage"] === undefined ||
      typeof value["showRequiredMessage"] === "boolean") &&
    (value["bannerFit"] === undefined ||
      typeof value["bannerFit"] === "boolean") &&
    (value["requiredMessage"] === undefined ||
      typeof value["requiredMessage"] === "string") &&
    (value["requiredMessageAlignment"] === undefined ||
      ["Left", "Center", "Right"].includes(
        String(value["requiredMessageAlignment"]),
      )) &&
    (value["requiredMessageLocation"] === undefined ||
      ["Top", "Bottom", "Hidden"].includes(
        String(value["requiredMessageLocation"]),
      ))
  );
}
function validSnapshot(value: unknown): boolean {
  return (
    record(value) &&
    validBanner(value["bannerImage"]) &&
    validPresentation(value) &&
    typeof value["name"] === "string" &&
    typeof value["description"] === "string" &&
    Array.isArray(value["fields"]) &&
    value["fields"].every(validField) &&
    ["public", "private"].includes(String(value["visibility"])) &&
    Array.isArray(value["allowedUsers"]) &&
    value["allowedUsers"].every((user: unknown) => typeof user === "string")
  );
}
function validForm(value: unknown): value is FormRecord {
  if (!record(value)) return false;
  return (
    validBanner(value["bannerImage"]) &&
    validPresentation(value) &&
    typeof value["id"] === "string" &&
    typeof value["name"] === "string" &&
    typeof value["description"] === "string" &&
    ["Published", "Draft"].includes(String(value["status"])) &&
    typeof value["responses"] === "number" &&
    Number.isFinite(value["responses"]) &&
    value["responses"] >= 0 &&
    typeof value["modified"] === "string" &&
    Number.isFinite(Date.parse(value["modified"])) &&
    typeof value["shared"] === "boolean" &&
    (value["visibility"] === undefined ||
      ["public", "private"].includes(String(value["visibility"]))) &&
    (value["allowedUsers"] === undefined ||
      (Array.isArray(value["allowedUsers"]) &&
        value["allowedUsers"].every(
          (user: unknown) => typeof user === "string",
        ))) &&
    (value["published"] === undefined ||
      value["published"] === null ||
      validSnapshot(value["published"])) &&
    Array.isArray(value["fields"]) &&
    value["fields"].every(validField) &&
    Array.isArray(value["entries"]) &&
    value["entries"].every(
      (entry: unknown) =>
        record(entry) &&
        typeof entry["id"] === "string" &&
        typeof entry["date"] === "string" &&
        Number.isFinite(Date.parse(entry["date"])) &&
        stringMap(entry["answers"]) &&
        (entry["labels"] === undefined || stringMap(entry["labels"])),
    )
  );
}
function read(): FormRecord[] {
  try {
    const raw = readPreference("form-factory-v1");
    if (raw) {
      const data: unknown = JSON.parse(raw);
      if (Array.isArray(data) && data.every(validForm))
        return data.map(migrateForm);
    }
  } catch {}
  return seed().map(migrateForm);
}
@Service()
export class Store {
  readonly forms = signal<FormRecord[]>(read());
  readonly query = signal("");
  private readonly toast = signal("");
  readonly noticeVersion = signal(0);
  readonly notice = this.toast.asReadonly();
  readonly notificationHistory = signal<NotificationRecord[]>([]);
  readonly hasUnreadNotifications = computed(() =>
    this.notificationHistory().some((record) => !record.seen),
  );
  readonly toastAction = signal<{ label: string; run: () => void } | null>(
    null,
  );
  notify(
    message: string,
    action: { label: string; run: () => void } | null = null,
  ) {
    this.toastAction.set(action);
    this.toast.set(message);
    this.noticeVersion.update((version) => version + 1);
    if (message.trim())
      this.notificationHistory.update((records) =>
        addNotification(records, uniqueId(), message, new Date().toISOString()),
      );
  }
  readNotifications() {
    this.notificationHistory.update(openNotifications);
  }
  readonly persisted = signal(true);
  readonly user = signal<string | null>(
    readPreference("ff-account") ?? "derek",
  );
  readonly own = computed(() => this.forms().filter((f) => this.canEdit(f)));
  hasDraft = hasDraft;
  canEdit(f: FormRecord) {
    return this.user() === "derek" && !f.shared;
  }
  canRead(f: FormRecord) {
    return canReadForm(f, this.user());
  }
  publicPath(f: FormRecord) {
    return f.published
      ? "/" +
          (f.published.visibility === "private" ? "private" : "f") +
          "/" +
          f.id
      : null;
  }
  publicUrl(f: FormRecord) {
    const path = this.publicPath(f);
    return path ? location.origin + path : null;
  }
  async copyUrl(f: FormRecord) {
    const url = this.publicUrl(f);
    if (!url) return;
    this.notify(
      (await copyText(url))
        ? "Form link copied."
        : "Copy this form link: " + url,
    );
  }
  setAccount(user: string) {
    this.user.set(user);
    try {
      localStorage.setItem("ff-account", user);
    } catch {}
  }
  publish(id: string) {
    this.forms.update((forms) =>
      forms.map((f) => (f.id === id && this.canEdit(f) ? publishForm(f) : f)),
    );
  }
  discard(id: string) {
    this.forms.update((forms) =>
      forms.flatMap((f) => {
        if (f.id !== id || !this.canEdit(f)) return [f];
        const restored = discardDraft(f);
        return restored ? [restored] : [];
      }),
    );
  }

  constructor() {
    window.addEventListener("storage", (event) => {
      if (event.key === "form-factory-v1") this.forms.set(read());
      if (event.key === "ff-account") this.user.set(event.newValue ?? "derek");
    });

    effect(() => {
      try {
        localStorage.setItem("form-factory-v1", JSON.stringify(this.forms()));
        this.persisted.set(true);
      } catch {
        this.persisted.set(false);
        this.notify(
          "Storage is unavailable or full. Changes only last for this session.",
        );
      }
    });
  }
  update(id: string, changes: Partial<FormRecord>) {
    this.forms.update((forms) =>
      forms.map((f) =>
        f.id === id
          ? {
              ...f,
              ...changes,
              modified: new Date().toISOString().slice(0, 10),
            }
          : f,
      ),
    );
  }
  create(
    name = "Untitled form",
    fields: Field[] = [newField("Text input", "Your name")],
  ) {
    const id = uniqueId();
    this.forms.update((forms) => [
      {
        id,
        name,
        description: "Tell us a little about yourself.",
        status: "Draft",
        published: null,
        visibility: "public",
        allowedUsers: ["derek"],
        responses: 0,
        modified: new Date().toISOString().slice(0, 10),
        shared: false,
        fields: structuredClone(fields).map((f) => ({
          ...f,
          id: uniqueId(),
        })),
        entries: [],
      },
      ...forms,
    ]);
    return id;
  }
  remove(ids: string[]) {
    this.forms.update((forms) =>
      forms.filter((f) => !ids.includes(f.id) || f.shared),
    );
  }
  duplicate(id: string) {
    const source = this.forms().find((form) => form.id === id);
    if (!source || !this.canEdit(source)) return;
    const copy = duplicateForm(source, this.forms(), uniqueId);
    this.forms.update((forms) => [copy, ...forms]);
    this.notify(`Created “${copy.name}”.`);
  }
  reset() {
    this.forms.set(seed().map(migrateForm));
    this.query.set("");
    this.notify("Demo data has been reset.");
  }
  submit(id: string, answers: Record<string, string>) {
    const f = this.forms().find((f) => f.id === id);
    if (f?.published && this.canRead(f))
      this.update(id, {
        responses: f.responses + 1,
        entries: [
          {
            id: uniqueId(),
            date: new Date().toISOString(),
            answers,
            labels: Object.fromEntries(
              f.published.fields.map((field) => [field.id, field.label]),
            ),
          },
          ...f.entries,
        ],
      });
  }
}
