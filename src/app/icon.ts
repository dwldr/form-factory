import { Component, computed, input } from "@angular/core";
const paths: Record<string, string> = {
  pencil: "m15 4 5 5 M4 20l5-1L21 7l-5-5L4 14z",
  copy: "M8 8h13v13H8z M16 8V3H3v13h5",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  grip: "M8 4h1 M15 4h1 M8 12h1 M15 12h1 M8 20h1 M15 20h1",
  "chevron-left": "m15 5-7 7 7 7",
  "arrow-left": "M20 12H4 M11 5l-7 7 7 7",
  "chevron-right": "m9 5 7 7-7 7",
  calendar: "M3 5h18v16H3z M3 10h18 M7 3v4 M17 3v4",

  home: "m3 10 9-7 9 7 M5 9v12h5v-7h4v7h5V9",
  forms: "M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h4",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  templates: "M3 5h18v16H3z M3 10h18 M9 10v11 M7 3v4 M17 3v4",
  chart: "m3 17 6-6 4 3 8-9 M15 5h6v6",
  settings:
    "m12 3 2 3 4-1 1 4 3 3-3 3-1 4-4-1-2 3-2-3-4 1-1-4-3-3 3-3 1-4 4 1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1",
  moon: "M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
};
@Component({
  selector: "ff-icon",
  host: { "aria-hidden": "true" },
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
  >
    <path [attr.d]="path()" />
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icon {
  name = input.required<string>();
  path = computed(() => paths[this.name()] ?? paths["forms"]);
}
