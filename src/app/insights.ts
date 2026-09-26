import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { Store } from "./store";
@Component({
  imports: [DatePipe, DecimalPipe],
  template: `<section class="page">
    <div class="page-heading">
      <div>
        <h1>Insights</h1>
        <p>A clearer picture of what your audience is saying.</p>
      </div>
      <label
        ><span class="sr-only">Choose form</span
        ><select [value]="selected()" (change)="select($event)">
          <option value="">All my forms</option>
          @for (f of store.own(); track f.id) {
            <option [value]="f.id">{{ f.name }}</option>
          }
        </select></label
      >
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <strong>{{ total() | number }}</strong>
        <p>Total responses</p>
      </div>
      <div class="stat-card">
        <strong>{{ entries().length }}</strong>
        <p>New demo submissions</p>
      </div>
      <div class="stat-card">
        <strong>{{ forms().length }}</strong>
        <p>Forms in this view</p>
      </div>
      <div class="stat-card">
        <strong>{{ published() }}</strong>
        <p>Published forms</p>
      </div>
    </div>
    <div class="analytics-grid">
      <section class="panel">
        <h2>Responses by form</h2>
        <p class="helper">
          Includes seeded historical totals and new demo submissions.
        </p>
        <div class="bar-chart">
          @for (f of forms(); track f.id) {
            <div class="chart-row">
              <div class="flex justify-between gap-3">
                <span>{{ f.name }}</span
                ><strong>{{ f.responses | number }}</strong>
              </div>
              <div class="bar-track">
                <div
                  class="bar"
                  [style.width.%]="(f.responses / max()) * 100"
                ></div>
              </div>
            </div>
          }
        </div>
      </section>
      <section class="panel">
        <h2>Publication overview</h2>
        <div class="donut" [style.background]="donut()">
          <div>
            <strong>{{ published() }}</strong
            ><span>published</span>
          </div>
        </div>
        <div class="flex justify-center gap-5">
          <span>● Published {{ published() }}</span
          ><span class="muted">○ Draft {{ forms().length - published() }}</span>
        </div>
        <p class="helper mt-6">
          Historical sample data includes response totals only. Individual
          answers appear below as you submit forms in the demo.
        </p>
      </section>
    </div>
    @if (selected()) {
      <section class="panel mt-6">
        <h2>Answer distribution</h2>
        <p class="helper">Based on new demo submissions for this form.</p>
        @for (question of breakdowns(); track question.id) {
          <h3 class="mt-6 mb-3">{{ question.label }}</h3>
          @for (option of question.options; track $index) {
            <div class="chart-row">
              <div class="flex justify-between gap-3">
                <span>{{ option.label }}</span
                ><strong>{{ option.count }}</strong>
              </div>
              <div class="bar-track">
                <div
                  class="bar"
                  [style.width.%]="(option.count / question.total) * 100"
                ></div>
              </div>
            </div>
          }
        } @empty {
          <p class="muted">
            This form has no choice or rating questions. Explore its individual
            answers below.
          </p>
        }
      </section>
    }
    <section class="panel mt-6">
      <div class="section-heading">
        <h2>Recent demo responses</h2>
        <button
          class="secondary"
          [disabled]="!entries().length"
          (click)="export()"
        >
          Export CSV
        </button>
      </div>
      @for (entry of entries(); track entry.id) {
        <details class="response-entry">
          <summary>
            {{ entry.formName }}
            <span class="muted">{{ entry.date | date: "MMM d, h:mm a" }}</span>
          </summary>
          <dl>
            @for (answer of entry.answers; track $index) {
              <dt>{{ answer.label }}</dt>
              <dd>{{ answer.value || "No answer" }}</dd>
            }
          </dl>
        </details>
      } @empty {
        <div class="empty">
          <h3>No new responses yet</h3>
          <p>
            Open a published form and submit a response to see its answers here.
          </p>
        </div>
      }
    </section>
  </section>`,
})
export class Insights {
  store = inject(Store);
  selected = signal("");
  forms = computed(() =>
    this.store
      .own()
      .filter((f) => !this.selected() || f.id === this.selected()),
  );
  total = computed(() => this.forms().reduce((n, f) => n + f.responses, 0));
  published = computed(
    () => this.forms().filter((f) => f.status === "Published").length,
  );
  max = computed(() => Math.max(1, ...this.forms().map((f) => f.responses)));
  donut = computed(
    () =>
      `conic-gradient(#11a76c 0 ${(this.published() / Math.max(1, this.forms().length)) * 100}%, var(--border) 0 100%)`,
  );
  entries = computed(() =>
    this.forms()
      .flatMap((f) =>
        f.entries.map((e) => ({
          ...e,
          formName: f.name,
          answers: Object.entries(e.answers).map(([id, value]) => ({
            label:
              e.labels?.[id] ??
              f.fields.find((field) => field.id === id)?.label ??
              "Removed question",
            value,
          })),
        })),
      )
      .sort((a, b) => b.date.localeCompare(a.date)),
  );
  breakdowns = computed(() =>
    this.forms().flatMap((f) =>
      f.fields
        .filter((field) =>
          ["Multiple choice", "Dropdown", "Rating", "Linear scale"].includes(
            field.type,
          ),
        )
        .map((field) => {
          const options =
            field.type === "Rating"
              ? ["1", "2", "3", "4", "5"]
              : field.type === "Linear scale"
                ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
                : field.options;
          return {
            id: field.id,
            label: field.label,
            total: Math.max(1, f.entries.length),
            options: options.map((label) => ({
              label,
              count: f.entries.filter((e) => e.answers[field.id] === label)
                .length,
            })),
          };
        }),
    ),
  );
  select(e: Event) {
    this.selected.set((e.target as HTMLSelectElement).value);
  }
  export() {
    const cell = (s: string) =>
      '"' + (/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"';
    const rows = [
      ["Form", "Submitted", "Question", "Answer"],
      ...this.entries().flatMap((e) =>
        e.answers.map((a) => [e.formName, e.date, a.label, a.value]),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "form-factory-responses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}
