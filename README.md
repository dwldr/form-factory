# Form Factory

A responsive Angular demo for creating forms and exploring responses. The design follows the reference screens in `notes/`, using the existing brand assets and locally hosted Inter font. `src/public/landing.html` is unchanged.

## Run locally

```sh
npm install
npm start
```

Open http://localhost:4200. Startup binds Angular to `127.0.0.1:4200` and forwards traffic from only the Ethernet address `192.168.1.20:4200`, including live-reload connections. It does not listen on wildcard or VPN addresses. If the Ethernet address changes, update `ethernetHost` in `scripts/dev-server.mjs`; startup fails rather than falling back to all interfaces. Press Ctrl+C to stop both listeners. A local firewall may need to allow Node on private networks. Each browser and origin has its own demo data; using the LAN address does not synchronize records across devices. Production output is generated in `dist/form-factory/browser` with `npm run build`.

## Included

- Home dashboard, searchable My Forms with status filters and individual/bulk deletion, Shared with Me, and six reusable templates.
- Autosaving form builder with question settings, options, required fields, defaults, pointer drag-and-drop, Alt+Up/Down keyboard reordering, and a sticky editor toolbar.
- Separate draft and published versions: previews show the draft; public/private links show only the published snapshot. Delete draft restores the last publication, or deletes a never-published form.
- View and preview links open normal standalone browser tabs. Private forms enforce simulated account permissions, with a login/account-switch screen.
- Collapsible, viewport-pinned sidebar with icon-only navigation, focus/hover tooltips, and a bottom-pinned account menu. Search is stored in the URL so Back restores its query and results.
- All 18 field types from the mockup, including multi-page forms, sections, ratings, hidden values, and typed signatures.
- Published form submissions, required-field and email/URL validation, response totals, per-question answer distributions, and CSV export.
- Sample team, editable workspace settings, Derek Wilder admin profile, light/dark themes, and a dismissible/resettable demo banner.
- Lazy-loaded routes, strict TypeScript/template checking, Angular signals, Signal Forms for workspace settings, and Tailwind utilities plus shared component styles.

## Demo boundaries

Forms and responses are stored in this browser's localStorage and synchronize between same-origin tabs through storage events. There is no data server, real authentication, email delivery, or cross-browser sharing. Private-link checks demonstrate access control using the Derek/Alex/signed-out demo accounts; they are not server-enforced security. Copied links require the same browser data. File questions save filenames only; file contents are never uploaded. Signatures are typed demo responses. Shared forms and team members are sample records. Seeded historical response counts have no fabricated individual answers; newly submitted answers are stored and charted. Draft previews do not save responses.

Resetting the demo replaces all local form records and responses with the initial sample set. Workspace name, contact email, theme, and banner dismissal are separate preferences. Storage failures are reported instead of silently claiming a successful save.

## Checks

```sh
npm test
npm run build
npm run format:check
```

For a development-only axe audit, open any route with `?audit=1`, then click **Run accessibility audit**. The auditor remains available while navigating within that tab. It is replaced by an empty component in production, so axe and its interface are excluded from the production build.

See `VERIFICATION.md` for checks performed and remaining manual accessibility checks.

