import { Component, signal } from "@angular/core";

/** Opt-in local audit panel, enabled only in development with ?audit=1. */
@Component({
  selector: "ff-accessibility-audit",
  template: `
    <aside
      id="accessibility-audit"
      aria-label="Development accessibility audit"
    >
      <button class="secondary" [disabled]="running()" (click)="run()">
        Run accessibility audit
      </button>
      <pre role="status">{{ result() }}</pre>
    </aside>
  `,
  styles: `
    aside {
      padding: 16px;
      border-top: 1px solid var(--border);
    }
    pre {
      white-space: pre-wrap;
      font-size: 12px;
      max-height: 260px;
      overflow: auto;
    }
  `,
})
export class AccessibilityAudit {
  running = signal(false);
  result = signal("Ready to check this screen with axe-core.");

  async run() {
    this.running.set(true);
    try {
      const axe = await import("axe-core");
      const report = await axe.default.run({
        exclude: ["#accessibility-audit"],
      });
      this.result.set(
        JSON.stringify(
          {
            url: location.pathname,
            violations: report.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
            passes: report.passes.length,
            manualReview: report.incomplete.map((v) => v.id),
          },
          null,
          2,
        ),
      );
    } catch (error) {
      this.result.set(String(error));
    } finally {
      this.running.set(false);
    }
  }
}
