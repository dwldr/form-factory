import type { ButtonColor } from "./form-presentation";
import type { FormRecord, Field } from "./store";
export interface FormSnapshot {
  thankYouMessage?: string;
  buttonColor?: ButtonColor;
  bannerImage?: string;
  bannerFilename?: string;
  bannerFit?: boolean;
  requiredMessage?: string;
  showRequiredMessage?: boolean;
  requiredMessageAlignment?: "Left" | "Center" | "Right";
  requiredMessageLocation?: "Top" | "Bottom" | "Hidden";
  name: string;
  description: string;
  fields: Field[];
  visibility: "public" | "private";
  allowedUsers: string[];
}
export function snapshot(form: FormRecord): FormSnapshot {
  return structuredClone({
    ...(form.thankYouMessage !== undefined
      ? { thankYouMessage: form.thankYouMessage }
      : {}),
    ...(form.buttonColor !== undefined
      ? { buttonColor: form.buttonColor }
      : {}),
    ...(form.bannerImage ? { bannerImage: form.bannerImage } : {}),
    ...(form.bannerFilename ? { bannerFilename: form.bannerFilename } : {}),
    ...(form.bannerFit !== undefined ? { bannerFit: form.bannerFit } : {}),
    ...(form.requiredMessage !== undefined
      ? { requiredMessage: form.requiredMessage }
      : {}),
    ...(form.requiredMessageAlignment !== undefined
      ? { requiredMessageAlignment: form.requiredMessageAlignment }
      : {}),
    ...(form.requiredMessageLocation !== undefined
      ? { requiredMessageLocation: form.requiredMessageLocation }
      : {}),
    ...(form.showRequiredMessage !== undefined
      ? { showRequiredMessage: form.showRequiredMessage }
      : {}),
    name: form.name,
    description: form.description,
    fields: form.fields,
    visibility: form.visibility ?? "public",
    allowedUsers: form.allowedUsers ?? ["derek"],
  });
}
export function migrateForm(form: FormRecord): FormRecord {
  const result = {
    ...form,
    visibility: form.visibility ?? (form.shared ? "private" : "public"),
    allowedUsers: form.allowedUsers ?? ["derek"],
  };
  return {
    ...result,
    published:
      form.published === undefined
        ? form.status === "Published"
          ? snapshot(result)
          : null
        : form.published,
  };
}
export function hasDraft(form: FormRecord): boolean {
  return (
    !form.published ||
    JSON.stringify(snapshot(form)) !== JSON.stringify(form.published)
  );
}
export function publishForm(form: FormRecord): FormRecord {
  return { ...form, status: "Published", published: snapshot(form) };
}
export function discardDraft(form: FormRecord): FormRecord | null {
  return form.published
    ? {
        ...form,
        ...structuredClone(form.published),
        thankYouMessage: form.published.thankYouMessage,
        buttonColor: form.published.buttonColor,
        bannerImage: form.published.bannerImage,
        bannerFilename: form.published.bannerFilename,
        bannerFit: form.published.bannerFit,
        requiredMessage: form.published.requiredMessage,
        showRequiredMessage: form.published.showRequiredMessage,
        requiredMessageAlignment: form.published.requiredMessageAlignment,
        requiredMessageLocation: form.published.requiredMessageLocation,
        status: "Published",
      }
    : null;
}
export function canReadForm(form: FormRecord, user: string | null): boolean {
  return (
    !!form.published &&
    (form.published.visibility === "public" ||
      user === "derek" ||
      (!!user && form.published.allowedUsers.includes(user)))
  );
}
export function moveField(fields: Field[], from: number, to: number): Field[] {
  if (from < 0 || to < 0 || from >= fields.length || to >= fields.length)
    return fields;
  const next = [...fields];
  const [field] = next.splice(from, 1);
  next.splice(to, 0, field);
  return next;
}
export function formPages(fields: Field[]): Field[][] {
  const pages: Field[][] = [[]];
  for (const field of fields) {
    if (field.type === "Page break") pages.push([]);
    else pages[pages.length - 1].push(field);
  }
  return pages;
}
export function duplicateForm(
  source: FormRecord,
  forms: FormRecord[],
  id: () => string,
): FormRecord {
  const base = source.name.replace(/ copy(?: \d+)?$/, "");
  let name = `${base} copy`;
  for (let index = 2; forms.some((form) => form.name === name); index++)
    name = `${base} copy ${index}`;
  const fields = structuredClone(source.fields);
  const ids = new Map(fields.map((field) => [field.id, id()]));
  for (const field of fields) {
    field.id = ids.get(field.id)!;
    for (const key of ["visibleWhen", "requiredWhen"] as const) {
      const rule = field[key];
      if (rule && ids.has(rule.fieldId)) rule.fieldId = ids.get(rule.fieldId)!;
      else delete field[key];
    }
  }
  return {
    ...structuredClone(source),
    id: id(),
    name,
    fields,
    status: "Draft",
    published: null,
    responses: 0,
    entries: [],
    shared: false,
    modified: new Date().toISOString().slice(0, 10),
  };
}

export type Answers = Record<string, string[]>;
/** Earlier, visible sources only: reordering/deleting a source never creates a cycle. */
export function fieldStates(fields: Field[], answers: Answers) {
  const states: Record<string, { visible: boolean; required: boolean }> = {};
  for (const field of fields) {
    const matches = (rule: Field["visibleWhen"]) => {
      if (!rule || !states[rule.fieldId]?.visible) return false;
      const source = fields.find((item) => item.id === rule.fieldId);
      const values =
        answers[rule.fieldId] ??
        (source?.defaultValue ? [source.defaultValue] : []);
      const filled = values.some((value) => value.trim().length > 0);
      if (rule.operator === "answered") return filled;
      if (!filled) return false;
      const equal = values.some(
        (value) =>
          value.trim().toLowerCase() === rule.value.trim().toLowerCase(),
      );
      return rule.operator === "equals" ? equal : !equal;
    };
    const validSource = (rule: Field["visibleWhen"]) =>
      !!rule && !!states[rule.fieldId];
    const visible =
      !validSource(field.visibleWhen) || matches(field.visibleWhen);
    states[field.id] = {
      visible,
      required: visible && (field.required || matches(field.requiredWhen)),
    };
  }
  return states;
}
