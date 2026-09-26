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
  id: string;
  type: FieldType;
  label: string;
  description: string;
  required: boolean;
  options: string[];
  defaultValue?: string;
}
export interface Entry {
  id: string;
  date: string;
  answers: Record<string, string>;
  labels?: Record<string, string>;
}
export interface FormRecord {
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
export function newField(type: FieldType, label = "Untitled question"): Field {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    description: "",
    required: false,
    options: ["Option 1", "Option 2"],
  };
}
function seed(): FormRecord[] {
  const names = [
    "Customer Feedback",
    "Event Registration",
    "Job Application",
    "Newsletter Signup",
    "Product Research Survey",
    "Employee Onboarding",
    "Website Feedback",
    "Workshop Registration",
    "Contact Us",
    "Volunteer Application",
    "Team Satisfaction",
    "Design Review",
  ];
  return names.map((name, i) => ({
    id: `form-${i + 1}`,
    name,
    description:
      i === 0
        ? "We’d love to hear your thoughts. Your feedback helps us improve."
        : `Thank you for completing our ${name.toLowerCase()} form.`,
    status: i === 2 || i === 5 || i === 9 ? "Draft" : "Published",
    responses: [892, 1200, 0, 456, 734, 0, 64, 38, 21, 0, 48, 16][i],
    modified: `2026-09-${String(20 - i).padStart(2, "0")}`,
    shared: i >= 10,
    fields:
      i === 0
        ? [
            {
              ...newField(
                "Multiple choice",
                "What is your overall experience?",
              ),
              description: "Select one option",
              options: ["Excellent", "Good", "Average", "Poor"],
              required: true,
            },
            newField("Paragraph", "What did you like most?"),
            {
              ...newField(
                "Multiple choice",
                "Would you recommend us to a friend?",
              ),
              description: "Select one option",
              options: ["Yes", "Maybe", "No"],
            },
          ]
        : [
            newField("Text input", "Your name"),
            { ...newField("Email", "Email address"), required: true },
            newField("Paragraph", "Anything else you’d like to share?"),
          ],
    entries: [],
  }));
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
function validForm(value: unknown): value is FormRecord {
  if (!record(value)) return false;
  return (
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
      if (Array.isArray(data) && data.every(validForm)) return data;
    }
  } catch {}
  return seed();
}
@Service()
export class Store {
  readonly forms = signal<FormRecord[]>(read());
  readonly query = signal("");
  readonly notice = signal("");
  readonly persisted = signal(true);
  readonly own = computed(() => this.forms().filter((f) => !f.shared));
  constructor() {
    effect(() => {
      try {
        localStorage.setItem("form-factory-v1", JSON.stringify(this.forms()));
        this.persisted.set(true);
      } catch {
        this.persisted.set(false);
        this.notice.set(
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
    const id = crypto.randomUUID();
    this.forms.update((forms) => [
      {
        id,
        name,
        description: "Tell us a little about yourself.",
        status: "Draft",
        responses: 0,
        modified: new Date().toISOString().slice(0, 10),
        shared: false,
        fields: structuredClone(fields).map((f) => ({
          ...f,
          id: crypto.randomUUID(),
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
  reset() {
    this.forms.set(seed());
    this.query.set("");
    this.notice.set("Demo data has been reset.");
  }
  submit(id: string, answers: Record<string, string>) {
    const f = this.forms().find((f) => f.id === id);
    if (f)
      this.update(id, {
        responses: f.responses + 1,
        entries: [
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            answers,
            labels: Object.fromEntries(
              f.fields.map((field) => [field.id, field.label]),
            ),
          },
          ...f.entries,
        ],
      });
  }
}
