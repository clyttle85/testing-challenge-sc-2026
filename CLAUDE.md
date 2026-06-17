# ScreenCloud Mission Control — Senior QA Challenge

## What this is

A take-home technical challenge for a Senior QA Engineer role at ScreenCloud.
Target app: the "Mission Control" Service Deployment Console, a 4-step wizard
at https://screencloudsqa.lovable.app/ (System Config → Schedule →
Permissions & Notes → Summary).

Note: the UI's own step indicator is inconsistent and out of order (it shows
"Step 1, Step 3, Step 4, Summary"). That is a logged bug (SC-B01), not a typo
in this file. Steps are referred to here by their real order: Step 1, Step 2,
Step 3, Summary.

## Deliverables and status

1. Exploratory testing — done
2. Findings log — done (separate docs, detailed + one-page summary, in both
   markdown and Word, not part of this repo)
3. Automation approach writeup — done (separate doc)
4. One working automation example — in progress, this repo

## Findings ID convention

`SC-<letter><NN>`. `SC` = ScreenCloud. Letter denotes the kind of finding:
`B` confirmed bug, `O` observation under investigation, `V` verified working,
`E` easter egg. Numbered sequentially within each letter stream, zero-padded
to two digits. Severity is tracked separately and is not implied by the
letter.

## The core theme driving the automation design

The most serious defects live in the UI-to-API seam: the screen looks
correct, but the submitted payload or the final Summary does not match what
the user entered. Neither a pure UI test (passes, screen looks right) nor a
pure API test (passes, it builds its own correct payload) catches this. The
test has to drive the UI and inspect the resulting request.

## Confirmed defects encoded in this test suite so far

- **SC-B04** — Enable Alerts toggle never reaches the backend. `alertsEnabled`
  is hardcoded `false` in the submitted payload regardless of the UI toggle
  state.
- **SC-B21** — Priority off-by-one. The slider is a native
  `<input type="range" min="0" max="4">` under a displayed scale of 1–5, so
  the submitted value is always one less than what the user selected.

Other confirmed defects exist in the full findings log but are not yet
automated here (out of scope for the single required example): SC-B19
(failed deploy shown as success), SC-B17 (empty config deploys), SC-B12
(Step 2 state lost on navigation), SC-B20 (Service Name/Region swapped on
Summary), SC-B13 (webhook validation errors but doesn't block deploy).

## DOM quirks worth remembering (cost real time to find)

- Most field labels are **not** programmatically associated with their
  control — no `for`/`id`, no wrapping. `page.getByLabel()` will not find:
  Service Name, Region, Deployment Window, Alert Threshold, Deployment
  Notes, or the Step 3 confirm checkbox. Use the `byLabelSibling()` helper
  (`div:has(> label:text-is(...)) > control`) or `getByPlaceholder()` where a
  real placeholder exists (Service Name, Alert Threshold).
- Notification Channels and Access Roles checkboxes **do** wrap their
  `<input>` inside `<label>`, so `getByRole('checkbox', { name })` works
  natively for those. No workaround needed.
- Enable Alerts is a `<button aria-pressed="true">`, not `role="switch"` with
  `aria-checked`. Locate via `byLabelSibling(..., 'button[aria-pressed]')`
  and read/compare the `aria-pressed` attribute.
- The Priority slider is a native `<input type="range">`; `getByRole('slider')`
  works directly. Its `min="0" max="4"` under a 1–5 display is the literal
  mechanism behind SC-B21.
- The submit-config upstream fails at random (SC-O06). Don't assert against
  a live, unmocked submit for the happy-path suite — mock the response for
  determinism, and write one dedicated test that forces the error to check
  SC-B19.

## Architecture

Playwright + TypeScript, Page Object Model.

constants/locators.ts        - LOCATORS data + byLabelSibling() helper
constants/urls.ts            - SUBMIT_CONFIG_ENDPOINT etc.
fixtures/deployment-cases.ts - DeploymentCase type + the data-driven rows
pages/deployment-wizard.page.ts - DeploymentWizardPage (the POM)
tests/*.spec.ts              - one test generated per data row, in a loop

### Data-driven backbone

A typed array of rows; each row carries inputs for all three screens plus an
`expectedPayload` and an `expectedSummary`. Looped to generate one test per
row, so a failure isolates cleanly to a single case. Currently three rows:
happy path (green control), the alerts bug, the priority bug.

### Two assertion modes, same test body

- **Mode A (active)** — intercept the `submit-config` POST via
  `page.waitForRequest`, assert the JSON payload against `expectedPayload`
  using `expect.soft` so every field mismatch is reported, not just the
  first.
- **Mode B (commented out)** — assert the rendered Summary screen instead,
  via `summaryValue(label)`. Left commented deliberately: it shows why
  interception is the more deterministic choice given the random upstream
  error, and that Mode B additionally surfaces SC-B20 and SC-B22 (raw ISO
  date on the Summary) on every row.

### `emittedPriority(slider) = slider - 1`

Used in rows that are **not** targeting the priority bug, to assert the
app's current (buggy) behaviour, so each red row fails on exactly one field.
The priority-bug row instead asserts the *intended* value and fails — that's
what pinpoints SC-B21. A deliberate characterisation-vs-specification
choice; be ready to explain it if asked.

### tsconfig notes

`module`/`moduleResolution` = `NodeNext` (the old `node`/`node10` resolution
is deprecated). `noEmit: true` — Playwright transpiles `.ts` itself, there is
no build step. `lib` includes `DOM`, needed because the slider helper's
`page.evaluate()` callback runs in-browser and references `window`,
`HTMLInputElement`, `Event`.

## Running
npx playwright test
npx playwright test --ui   # recommended for development and for demoing live

Expect happy path green; the alerts and priority rows red **by design** —
they encode real, confirmed bugs.

## Open items

- Confirm selectors against the live DOM if anything times out; they were
  derived from devtools screenshots and partially confirmed live, not a full
  live inspection session.
- Possible next additions if time allows: a scenario test for SC-B12 (Step 2
  data loss on navigation), SC-B14 (keyboard vs mouse on the confirm
  checkbox), and a forced-error test for SC-B19. These are described in the
  automation approach doc as the wider plan, not required for the single
  worked example.