import type { Field, FieldType, FormRecord } from "./store";

/** Fictional, internally consistent records for a fresh or reset demo. */
export function seedForms(now = new Date()): FormRecord[] {
  const field = (
    id: string,
    type: FieldType,
    label: string,
    options: string[] = [],
    required = false,
  ): Field => ({ id, type, label, options, required, description: "" });
  const identity = () => [
    field("name", "Text input", "Your name", [], true),
    field("email", "Email", "Email address", [], true),
  ];
  const contact = () => [
    ...identity(),
    field("message", "Paragraph", "How can we help?", [], true),
  ];
  const definitions: {
    name: string;
    description: string;
    buttonColor: NonNullable<FormRecord["buttonColor"]>;
    thankYouMessage: string;
    fields: Field[];
    rows?: string[][];
    draft?: boolean;
    shared?: boolean;
    private?: boolean;
  }[] = [
    {
      name: "Customer Feedback",
      buttonColor: "teal",
      thankYouMessage:
        "Thanks for sharing your feedback!\nYour ideas help us make every experience better.",
      description:
        "Tell us about your experience. These sample answers are fictional.",
      fields: [
        field(
          "experience",
          "Multiple choice",
          "How was your experience?",
          ["Excellent", "Good", "Average", "Poor"],
          true,
        ),
        {
          ...field("improve", "Paragraph", "What could we improve?"),
          visibleWhen: {
            fieldId: "experience",
            operator: "notEquals",
            value: "Excellent",
          },
          requiredWhen: {
            fieldId: "experience",
            operator: "equals",
            value: "Poor",
          },
        },
        field(
          "recommend",
          "Multiple choice",
          "Would you recommend us?",
          ["Yes", "Maybe", "No"],
          true,
        ),
      ],
      rows: [
        ["Excellent", "", "Yes"],
        ["Good", "More examples in the help center.", "Yes"],
        ["Poor", "Make the mobile checkout easier.", "No"],
        ["Average", "Clearer delivery estimates.", "Maybe"],
      ],
    },
    {
      name: "Event Registration",
      buttonColor: "purple",
      thankYouMessage:
        "Your registration has been recorded.\nThank you for joining our community design meetup!",
      description:
        "Register for the community design meetup. Use Next to choose your session.",
      fields: [
        ...identity(),
        field("break", "Page break", ""),
        field(
          "session",
          "Dropdown",
          "Choose a session",
          ["Morning", "Afternoon"],
          true,
        ),
        field("access", "Paragraph", "Accessibility or dietary requests"),
      ],
      rows: [
        [
          "Jamie Sample",
          "jamie@example.com",
          "",
          "Morning",
          "Vegetarian lunch",
        ],
        [
          "Morgan Example",
          "morgan@example.com",
          "",
          "Afternoon",
          "Step-free access",
        ],
        ["Taylor Demo", "taylor@example.com", "", "Morning", ""],
      ],
    },
    {
      name: "Job Application",
      buttonColor: "blue",
      thankYouMessage:
        "Thank you for your interest in joining our team.\nYour application has been recorded.",
      description:
        "Draft a simple application with a portfolio link and resume question.",
      draft: true,
      fields: [
        ...identity(),
        field("portfolio", "Website", "Portfolio website"),
        field("resume", "File upload", "Resume"),
        field("motivation", "Paragraph", "Why would you like to join?"),
      ],
    },
    {
      name: "Newsletter Signup",
      buttonColor: "green",
      thankYouMessage:
        "Thanks for signing up!\nYour newsletter preferences have been recorded.",
      description:
        "Choose the updates you want to receive. No email is sent by this demo.",
      fields: [
        ...identity(),
        field("topics", "Checkboxes", "Topics", [
          "Product updates",
          "Design tips",
          "Community events",
        ]),
      ],
      rows: [
        ["Casey Sample", "casey@example.com", "Design tips"],
        ["Alex Example", "alex@example.com", "Product updates"],
      ],
    },
    {
      name: "Product Research Survey",
      buttonColor: "charcoal",
      thankYouMessage:
        "Thanks for helping shape what comes next.\nYour research feedback has been recorded.",
      description: "Help prioritize the next set of improvements.",
      fields: [
        field(
          "role",
          "Dropdown",
          "Your role",
          ["Designer", "Developer", "Operations"],
          true,
        ),
        field(
          "priority",
          "Multiple choice",
          "Most useful improvement",
          ["Reporting", "Templates", "Integrations"],
          true,
        ),
        field("rating", "Rating", "How useful is the product?"),
      ],
      rows: [
        ["Designer", "Templates", "4"],
        ["Developer", "Integrations", "5"],
        ["Operations", "Reporting", "3"],
      ],
    },
    {
      name: "Employee Onboarding",
      buttonColor: "blue",
      thankYouMessage:
        "Welcome to the team!\nYour onboarding details have been recorded.",
      description: "Private draft for a new team member's first day.",
      draft: true,
      private: true,
      fields: [
        ...identity(),
        field("start", "Date", "Start date"),
        field("equipment", "Checkboxes", "Equipment needed", [
          "Laptop",
          "Monitor",
          "Keyboard",
        ]),
      ],
    },
    {
      name: "Website Feedback",
      buttonColor: "yellow",
      thankYouMessage:
        "Thanks for helping us improve our website.\nYour feedback has been recorded.",
      description: "Report a problem or suggest an improvement to a page.",
      fields: [
        field("page", "Website", "Page URL", [], true),
        field("kind", "Dropdown", "Feedback type", ["Bug", "Suggestion"], true),
        field("details", "Paragraph", "Describe your feedback", [], true),
      ],
      rows: [
        ["https://example.com/help", "Suggestion", "Add a searchable FAQ."],
        [
          "https://example.com/contact",
          "Bug",
          "The mobile layout needs more space.",
        ],
      ],
    },
    {
      name: "Workshop Registration",
      buttonColor: "green",
      thankYouMessage:
        "Your workshop registration has been recorded.\nThanks for making time to learn with us!",
      description: "Choose a workshop and tell us your experience level.",
      fields: [
        ...identity(),
        field(
          "workshop",
          "Dropdown",
          "Workshop",
          ["Accessible forms", "Design systems"],
          true,
        ),
        field("level", "Multiple choice", "Experience level", [
          "Beginner",
          "Intermediate",
          "Advanced",
        ]),
      ],
      rows: [
        ["Jordan Demo", "jordan@example.com", "Accessible forms", "Beginner"],
        ["Sam Sample", "sam@example.com", "Design systems", "Intermediate"],
      ],
    },
    {
      name: "Contact Us",
      buttonColor: "teal",
      thankYouMessage:
        "Thank you for getting in touch.\nYour message has been recorded.",
      description:
        "Send the demo team a question. Messages stay in this browser.",
      fields: contact(),
      rows: [
        [
          "Riley Example",
          "riley@example.com",
          "Can I duplicate a form and keep its conditional rules?",
        ],
        ["Avery Demo", "avery@example.com", "Where can I export my responses?"],
      ],
    },
    {
      name: "Volunteer Application",
      buttonColor: "purple",
      thankYouMessage:
        "Thanks for offering your time and talents.\nYour volunteer application has been recorded.",
      description: "An unpublished draft for community volunteers.",
      draft: true,
      fields: [
        ...identity(),
        field("availability", "Checkboxes", "Availability", [
          "Weekdays",
          "Weekends",
          "Evenings",
        ]),
        field("interests", "Paragraph", "How would you like to help?"),
      ],
    },
    {
      name: "Team Satisfaction",
      buttonColor: "yellow",
      thankYouMessage:
        "Thanks for sharing your perspective.\nYour feedback helps build a more supportive team.",
      description: "A private shared form for the demo team.",
      shared: true,
      private: true,
      fields: [
        field("rating", "Rating", "How supported do you feel?", [], true),
        field("suggestion", "Paragraph", "What would improve your week?"),
      ],
      rows: [
        ["4", "More time for focused work."],
        ["5", "Keep the weekly team check-in."],
      ],
    },
    {
      name: "Design Review",
      buttonColor: "charcoal",
      thankYouMessage:
        "Your design review has been recorded.\nThanks for helping make the details better.",
      description:
        "A private shared review with a conditional revision question.",
      shared: true,
      private: true,
      fields: [
        field(
          "decision",
          "Multiple choice",
          "Review decision",
          ["Approved", "Needs changes"],
          true,
        ),
        {
          ...field("revision", "Paragraph", "Requested changes"),
          visibleWhen: {
            fieldId: "decision",
            operator: "equals",
            value: "Needs changes",
          },
          requiredWhen: {
            fieldId: "decision",
            operator: "equals",
            value: "Needs changes",
          },
        },
      ],
      rows: [
        ["Approved", ""],
        ["Needs changes", "Increase the contrast on secondary buttons."],
      ],
    },
  ];
  const banners: Record<number, string> = {
    0: "homa-appliances-pWUyHVJgLhg-unsplash.jpg",
    1: "5208f60bfa402a80b9f1e2a15276c62c.jpg",
    4: "michael-denning-LXomcUwf4vQ-unsplash.jpg",
    7: "abel-y-costa-BhgeP48pDOE-unsplash.jpg",
  };
  return definitions.map((definition, index) => {
    const id = `form-${index + 1}`;
    const fields = definition.fields.map((f) => ({
      ...f,
      id: `${id}-${f.id}`,
      ...(f.visibleWhen
        ? {
            visibleWhen: {
              ...f.visibleWhen,
              fieldId: `${id}-${f.visibleWhen.fieldId}`,
            },
          }
        : {}),
      ...(f.requiredWhen
        ? {
            requiredWhen: {
              ...f.requiredWhen,
              fieldId: `${id}-${f.requiredWhen.fieldId}`,
            },
          }
        : {}),
    }));
    const entries = (definition.rows ?? []).map((row, rowIndex) => {
      const answers: Record<string, string> = {};
      const labels: Record<string, string> = {};
      fields.forEach((f, column) => {
        if (row[column] && f.type !== "Page break" && f.type !== "Section") {
          answers[f.id] = row[column];
          labels[f.id] = f.label;
        }
      });
      return {
        id: `sample-${id}-${rowIndex + 1}`,
        date: new Date(
          now.getTime() - (index * 3 + rowIndex + 1) * 3600000,
        ).toISOString(),
        answers,
        labels,
      };
    });
    return {
      id,
      ...(banners[index]
        ? {
            bannerImage: "/" + banners[index],
            bannerFilename: banners[index],
            bannerFit: true,
          }
        : {}),
      name: definition.name,
      description: definition.description,
      buttonColor: definition.buttonColor,
      thankYouMessage: definition.thankYouMessage,
      fields,
      entries,
      responses: entries.length,
      modified: new Date(now.getTime() - index * 86400000)
        .toISOString()
        .slice(0, 10),
      status: definition.draft ? "Draft" : "Published",
      shared: definition.shared ?? false,
      visibility: definition.private ? "private" : "public",
      allowedUsers: definition.shared ? ["derek", "alex"] : ["derek"],
    };
  });
}
