import { Component, computed, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { DatePipe } from "@angular/common";
import { Store } from "./store";

@Component({
  imports: [RouterLink, DatePipe],
  template: `<section class="page">
    <nav class="response-breadcrumb" aria-label="Breadcrumb">
      <a routerLink="/insights">Insights</a><span aria-hidden="true"> / </span>
      @if (detailId()) {
        <a routerLink="/responses" [queryParams]="{ q: store.query() || null }"
          >My Responses</a
        ><span aria-hidden="true"> / </span
        ><span aria-current="page">Response</span>
      } @else {
        <span aria-current="page">My Responses</span>
      }
    </nav>
    @if (detailId()) {
      @if (detail(); as response) {
        <div class="page-heading">
          <div>
            <h1>{{ response.formName }}</h1>
            <p>Submitted {{ response.date | date: "MMM d, y, h:mm a" }}</p>
          </div>
        </div>
        <dl class="panel response-detail">
          @for (answer of response.answers; track answer.id) {
            <dt>{{ answer.label }}</dt>
            <dd>{{ answer.value || "No answer" }}</dd>
          } @empty {
            <p>No answers were recorded.</p>
          }
        </dl>
      } @else {
        <div class="empty">
          <h1>Response not found</h1>
          <a routerLink="/responses">Back to My Responses</a>
        </div>
      }
    } @else {
      <div class="page-heading">
        <div>
          <h1>My Responses</h1>
          <p>
            Individual responses submitted in this demo. Historical sample
            totals do not contain individual answers.
          </p>
        </div>
        <span class="muted">{{ filtered().length }} responses</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Submitted</th>
              <th scope="col">Answers</th>
            </tr>
          </thead>
          <tbody>
            @for (response of filtered(); track response.formId + response.id) {
              <tr>
                <td>
                  <a
                    class="form-name"
                    [routerLink]="['/responses', response.formId, response.id]"
                    [queryParams]="{ q: store.query() || null }"
                    >{{ response.formName }}</a
                  >
                </td>
                <td>{{ response.date | date: "MMM d, y, h:mm a" }}</td>
                <td>{{ response.answers.length }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="empty">
                  <h2>
                    {{
                      store.query()
                        ? "No matching responses"
                        : "No responses yet"
                    }}
                  </h2>
                  <p>
                    {{
                      store.query()
                        ? "Try a different search."
                        : "Submit a published form to see its response here."
                    }}
                  </p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </section>`,
})
export class Responses {
  store = inject(Store);
  params = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });
  detailId = computed(() => this.params().get("entryId"));
  entries = computed(() =>
    this.store
      .own()
      .flatMap((form) =>
        form.entries.map((entry) => ({
          ...entry,
          formId: form.id,
          formName: form.name,
          answers: Object.entries(entry.answers).map(([id, value]) => ({
            id,
            value,
            label:
              entry.labels?.[id] ??
              form.fields.find((field) => field.id === id)?.label ??
              "Removed question",
          })),
        })),
      )
      .sort((a, b) => b.date.localeCompare(a.date)),
  );
  detail = computed(() =>
    this.entries().find(
      (entry) =>
        entry.id === this.detailId() &&
        entry.formId === this.params().get("formId"),
    ),
  );
  filtered = computed(() =>
    this.entries().filter((entry) =>
      [
        entry.formName,
        entry.date,
        ...entry.answers.flatMap((answer) => [answer.label, answer.value]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(this.store.query().trim().toLowerCase()),
    ),
  );
}
