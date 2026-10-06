export const DEFAULT_THANK_YOU_MESSAGE =
  "Your response has been recorded in this demo.\nYou may now close this browser tab or window.";
export const BUTTON_COLORS = [
  {
    id: "yellow",
    label: "Yellow / dark text (default)",
    background: "#ffdb00",
    text: "#101820",
    hover: "#f4d000",
  },
  {
    id: "blue",
    label: "Blue / white text",
    background: "#1d4ed8",
    text: "#ffffff",
    hover: "#1e40af",
  },
  {
    id: "green",
    label: "Green / white text",
    background: "#166534",
    text: "#ffffff",
    hover: "#14532d",
  },
  {
    id: "purple",
    label: "Purple / white text",
    background: "#6b21a8",
    text: "#ffffff",
    hover: "#581c87",
  },
  {
    id: "teal",
    label: "Teal / white text",
    background: "#115e59",
    text: "#ffffff",
    hover: "#134e4a",
  },
  {
    id: "charcoal",
    label: "Charcoal / white text",
    background: "#1f2937",
    text: "#ffffff",
    hover: "#111827",
  },
] as const;
export type ButtonColor = (typeof BUTTON_COLORS)[number]["id"];
export function buttonColors(id?: string) {
  return BUTTON_COLORS.find((color) => color.id === id) ?? BUTTON_COLORS[0];
}
