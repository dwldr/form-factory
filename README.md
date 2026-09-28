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

## Form rules and duplication

The editor opens on the Form tab. The Field tab contains the field picker and individual question settings. Add field creates a movable placeholder; choosing a field replaces it at that position. Edit mode exposes question checkboxes and confirmed individual/bulk deletion. The Form tab accepts an optional PNG, JPEG, or WebP banner up to 5 MB, optimized for local storage and included in the published snapshot. Banner replacement/deletion is available on focus or hover over the image, with an optional edge-to-edge fit. The uploaded filename remains visible in settings. Show required message controls visibility, with optional text, top/bottom placement, and left/center/right alignment. Fit image to form defaults to checked and appears only when a banner is present. These presentation settings remain drafts until published.

Each question can have one conditional-display rule and one conditional-required rule based on an earlier question. Rules support matching an answer, not matching an answer, or checking whether it is answered. Comparisons ignore capitalization; checkbox answers match individual selected options. Hidden questions are excluded from submissions and validation. A deleted or reordered source makes its rule inactive until an earlier source is chosen again. Rules are saved in drafts and only become live when published.

Templates have their own search. Insights links to My Responses, where actual submissions can be searched and opened individually. Toasts dismiss after six seconds with a progress indicator, pause while keyboard focus is inside them, and remain recorded in the notifications menu. Clicking outside the notifications or account menu closes it.

Duplicate Form creates an independent unpublished draft with fresh field identifiers, preserved settings and rules, and no responses. Names use “copy”, “copy 2”, and subsequent available numbers.

## Demo boundaries

Forms and responses are stored in this browser's localStorage and synchronize between same-origin tabs through storage events. There is no data server, real authentication, email delivery, or cross-browser sharing. Private-link checks demonstrate access control using the Derek/Rickety Cricket/signed-out demo accounts; they are not server-enforced security. Copied links require the same browser data. File questions save filenames only; file contents are never uploaded. Signatures are typed demo responses. Shared forms and team members are sample records. Fresh demo data includes 12 varied forms and 22 explicitly fictional sample responses with matching totals, captured question labels, and recent timestamps. Samples demonstrate conditional questions, page breaks, private shared forms, unpublished drafts, and banner images on four forms. Older saved demo data may still contain historical totals without individual answers. New submissions are stored and charted. Draft previews do not save responses.

Resetting the demo replaces all local form records and responses with the refreshed sample set. Updating the application preserves existing saved forms; use Reset demo data only when you want to replace them with the new samples. Workspace name, contact email, and theme are separate preferences. The demo banner reappears on every page load; dismissing it only hides it until the next reload. Storage failures are reported instead of silently claiming a successful save.

## Checks

```sh
npm test
npm run build
npm run format:check
```

For a development-only axe audit, open any route with `?audit=1`, then click **Run accessibility audit**. The auditor remains available while navigating within that tab. It is replaced by an empty component in production, so axe and its interface are excluded from the production build.

See `VERIFICATION.md` for checks performed and remaining manual accessibility checks.
