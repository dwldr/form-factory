# Form Factory

A responsive Angular demo for creating forms and exploring responses. The design follows the reference screens in `notes/`, using the existing brand assets and locally hosted Inter font. `src/public/landing.html` is unchanged.

## Run locally

```sh
npm install
npm start
```

Open http://localhost:4200. Production output is generated in `dist/form-factory/browser` with `npm run build`.

## Included

- Home dashboard, searchable My Forms with status filters and individual/bulk deletion, Shared with Me, and six reusable templates.
- Autosaving form builder with question settings, options, required fields, defaults, reordering, and publishing.
- All 18 field types from the mockup, including multi-page forms, sections, ratings, hidden values, and typed signatures.
- Published form submissions, required-field and email/URL validation, response totals, per-question answer distributions, and CSV export.
- Sample team, editable workspace settings, Derek Wilder admin profile, light/dark themes, and a dismissible/resettable demo banner.
- Lazy-loaded routes, strict TypeScript/template checking, Angular signals, Signal Forms for workspace settings, and Tailwind utilities plus shared component styles.

## Demo boundaries

Forms and responses are stored in this browser's localStorage. There is no server, real authentication, email delivery, or cross-browser sharing. Copied links require the same browser data. File questions save filenames only; file contents are never uploaded. Signatures are typed demo responses. Shared forms and team members are sample records. Seeded historical response counts have no fabricated individual answers; newly submitted answers are stored and charted. Draft previews do not save responses.

Resetting the demo replaces all local form records and responses with the initial sample set. Workspace name, contact email, theme, and banner dismissal are separate preferences. Storage failures are reported instead of silently claiming a successful save.

## Checks

```sh
npm run build
npm run format:check
```

For a development-only axe audit, open any route with `?audit=1`, then click **Run accessibility audit**. The auditor remains available while navigating within that tab. It is replaced by an empty component in production, so axe and its interface are excluded from the production build.

See `VERIFICATION.md` for checks performed and remaining manual accessibility checks.

