import {
  Directive,
  ElementRef,
  Renderer2,
  inject,
  input,
  OnDestroy,
} from "@angular/core";
let tooltipId = 0;
/** A body-level tooltip stays visible outside scrollable tables and sidebars. */
@Directive({
  selector: "[ffTooltip]",
  host: {
    "(mouseenter)": "show()",
    "(mouseleave)": "hide()",
    "(focusin)": "show()",
    "(focusout)": "hide()",
    "(keydown.escape)": "hide()",
  },
})
export class Tooltip implements OnDestroy {
  ffTooltip = input<string | null>(null);
  ffTooltipPosition = input<"bottom" | "right">("bottom");
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);
  private tip: HTMLElement | null = null;
  private previousDescription: string | null = null;
  show() {
    const text = this.ffTooltip();
    if (!text || this.tip) return;
    const element = this.element.nativeElement;
    const rect = element.getBoundingClientRect();
    const tip = this.renderer.createElement("div") as HTMLElement;
    tip.id = "ff-tooltip-" + ++tooltipId;
    tip.className = "floating-tooltip";
    if (this.ffTooltipPosition() === "right")
      tip.classList.add("sidebar-tooltip");
    tip.setAttribute("role", "tooltip");
    tip.textContent = text;
    document.body.appendChild(tip);
    const bounds = tip.getBoundingClientRect();
    const right = this.ffTooltipPosition() === "right";
    tip.style.left =
      Math.max(
        8,
        Math.min(
          right ? rect.right + 8 : rect.left,
          innerWidth - bounds.width - 8,
        ),
      ) + "px";
    tip.style.top =
      (right
        ? Math.max(
            8,
            Math.min(
              rect.top + (rect.height - bounds.height) / 2,
              innerHeight - bounds.height - 8,
            ),
          )
        : rect.bottom + bounds.height + 10 < innerHeight
          ? rect.bottom + 8
          : Math.max(8, rect.top - bounds.height - 8)) + "px";
    this.previousDescription = element.getAttribute("aria-describedby");
    element.setAttribute(
      "aria-describedby",
      [this.previousDescription, tip.id].filter(Boolean).join(" "),
    );
    this.tip = tip;
  }
  hide() {
    if (!this.tip) return;
    this.tip.remove();
    this.tip = null;
    const element = this.element.nativeElement;
    if (this.previousDescription)
      element.setAttribute("aria-describedby", this.previousDescription);
    else element.removeAttribute("aria-describedby");
  }
  ngOnDestroy() {
    this.hide();
  }
}
