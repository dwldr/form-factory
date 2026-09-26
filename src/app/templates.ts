import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Store, newField, Field } from "./store";
@Component({
  template: `<section class="page">
    <div class="page-heading">
      <div>
        <h1>A head start for every idea.</h1>
        <p>Thoughtfully built templates. Ready to make your own.</p>
      </div>
    </div>
    <div class="template-grid">
      @for (t of templates; track t.name) {
        <article class="template-card">
          <div class="template-art" [style.background]="t.color">
            <span aria-hidden="true">{{ t.icon }}</span>
          </div>
          <div class="template-body">
            <span class="eyebrow">{{ t.category }}</span>
            <h2>{{ t.name }}</h2>
            <p>{{ t.description }}</p>
            <button class="secondary" (click)="use(t.name, t.fields)">
              Use template →
            </button>
          </div>
        </article>
      }
    </div>
  </section>`,
})
export class Templates {
  store = inject(Store);
  router = inject(Router);
  templates = [
    {
      name: "Customer Feedback",
      category: "CUSTOMER EXPERIENCE",
      description: "Understand what’s working and where you can improve.",
      icon: "☺",
      color: "#fff4bd",
      fields: [
        {
          ...newField("Multiple choice", "How was your experience?"),
          options: ["Excellent", "Good", "Average", "Poor"],
          required: true,
        },
        newField("Paragraph", "What could we improve?"),
      ],
    },
    {
      name: "Event Registration",
      category: "EVENTS",
      description: "Bring people together, without the paperwork.",
      icon: "▦",
      color: "#dff4e9",
      fields: [
        newField("Text input", "Full name"),
        { ...newField("Email", "Email address"), required: true },
        {
          ...newField("Dropdown", "Ticket type"),
          options: ["General admission", "VIP"],
        },
      ],
    },
    {
      name: "Job Application",
      category: "PEOPLE & TEAMS",
      description: "Get to know your next great team member.",
      icon: "▤",
      color: "#e8e5fb",
      fields: [
        newField("Text input", "Full name"),
        { ...newField("Email", "Email address"), required: true },
        newField("Paragraph", "Tell us about your experience"),
      ],
    },
    {
      name: "Product Research",
      category: "RESEARCH",
      description: "Turn your audience’s perspective into your next big idea.",
      icon: "✦",
      color: "#ffe6dc",
      fields: [
        newField("Rating", "How useful is our product?"),
        newField("Paragraph", "What would you change?"),
      ],
    },
    {
      name: "Contact Us",
      category: "EVERYDAY ESSENTIALS",
      description: "Make it easy for the right conversations to find you.",
      icon: "✉",
      color: "#dfeefa",
      fields: [
        newField("Text input", "Your name"),
        { ...newField("Email", "Email address"), required: true },
        newField("Paragraph", "How can we help?"),
      ],
    },
    {
      name: "Team Check-in",
      category: "PEOPLE & TEAMS",
      description:
        "A little listening goes a long way. Check in with your team.",
      icon: "♧",
      color: "#f4e7ec",
      fields: [
        newField("Rating", "How are you feeling this week?"),
        newField("Paragraph", "What support do you need?"),
      ],
    },
  ];
  use(name: string, fields: Field[]) {
    void this.router.navigate([
      "/forms",
      this.store.create(name, fields),
      "edit",
    ]);
  }
}
