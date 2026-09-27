import type { FormRecord, Field } from "./store";
export interface FormSnapshot {
  name: string;
  description: string;
  fields: Field[];
  visibility: "public" | "private";
  allowedUsers: string[];
}
export function snapshot(form: FormRecord): FormSnapshot {
  return structuredClone({
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
    ? { ...form, ...structuredClone(form.published), status: "Published" }
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
