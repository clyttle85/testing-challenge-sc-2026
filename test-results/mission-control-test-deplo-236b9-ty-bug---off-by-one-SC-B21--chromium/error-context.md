# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mission-control-test.spec.ts >> deploy config - priority bug - off-by-one (SC-B21)
- Location: src\mission-control-test.spec.ts:32:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('div').filter({ hasText: /^Service Name$/ }).locator('xpath=following-sibling::div[1]')
Expected: "inventoryservice"
Received: "ap-southeast-1"
Timeout:  5000ms

Call log:
  - Expect "soft toHaveText" with timeout 5000ms
  - waiting for locator('div').filter({ hasText: /^Service Name$/ }).locator('xpath=following-sibling::div[1]')
    14 × locator resolved to <div>ap-southeast-1</div>
       - unexpected value "ap-southeast-1"

```

```yaml
- text: ap-southeast-1
```

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('div').filter({ hasText: /^Region$/ }).locator('xpath=following-sibling::div[1]')
Expected: "ap-southeast-1"
Received: "inventoryservice"
Timeout:  5000ms

Call log:
  - Expect "soft toHaveText" with timeout 5000ms
  - waiting for locator('div').filter({ hasText: /^Region$/ }).locator('xpath=following-sibling::div[1]')
    14 × locator resolved to <div>inventoryservice</div>
       - unexpected value "inventoryservice"

```

```yaml
- text: inventoryservice
```

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('div').filter({ hasText: /^Priority$/ }).locator('xpath=following-sibling::div[1]')
Expected: "5"
Received: "4"
Timeout:  5000ms

Call log:
  - Expect "soft toHaveText" with timeout 5000ms
  - waiting for locator('div').filter({ hasText: /^Priority$/ }).locator('xpath=following-sibling::div[1]')
    14 × locator resolved to <div>4</div>
       - unexpected value "4"

```

```yaml
- text: "4"
```

# Test source

```ts
  1  | /**
  2  |  * Mission Control - Senior QA Challenge
  3  |  * Worked automation example (deliverable 4)
  4  |  * ---------------------------------------------------------------------------
  5  |  * A data-driven UI test that drives the full deployment wizard and then checks
  6  |  * the UI-to-API "seam" using request interception. Three data rows:
  7  |  *
  8  |  *   1. Happy path   - a benign valid config; the green control.
  9  |  *   2. Alerts bug   - alerts toggled on; catches SC-B04 (alertsEnabled never
  10 |  *                     reaches the backend).
  11 |  *   3. Priority bug - slider set to 5; catches SC-B21 (priority off-by-one).
  12 |  *
  13 |  * Two modes:
  14 |  *   MODE A (default) - intercept the submit-config request and assert the
  15 |  *                      payload. Robust even when the upstream randomly errors
  16 |  *                      (SC-O06), because the request is sent regardless of
  17 |  *                      the response.
  18 |  *   MODE B (commented out) - drive the same flow but assert the Summary screen
  19 |  *                      instead. Flip by commenting Mode A and uncommenting B.
  20 |  *
  21 |  * Run: npx playwright test mission-control-test.spec.ts
  22 |  */
  23 | 
  24 | import { test, expect } from '@playwright/test';
  25 | import { DeploymentWizardPage } from './pages/DeploymentWizardPage.js';
  26 | import { cases } from './fixtures/deployment-cases.js';
  27 | import { LOCATORS } from './constants/locators.js';
  28 | 
  29 | const sorted = (a: string[]): string[] => [...a].sort();
  30 | 
  31 | for (const c of cases) {
  32 |   test(`deploy config - ${c.name}`, async ({ page }) => {
  33 |     const wizardPage = new DeploymentWizardPage(page);
  34 |     await wizardPage.goto();
  35 | 
  36 |     await wizardPage.fillStep1(c.inputs);
  37 |     await wizardPage.fillStep2(c.inputs);
  38 |     await wizardPage.fillStep3(c.inputs);
  39 | 
  40 |     // ===== MODE A: REQUEST INTERCEPTION ==================================
  41 |     // Capture the submit-config request and assert the payload. expect.soft is
  42 |     // used so every field mismatch is reported in one run rather than stopping
  43 |     // at the first. This is the layer that catches the UI-to-API seam bugs.
  44 |     //
  45 |     // const submitRequest = wizardPage.waitForSubmitRequest();
  46 |     // await wizardPage.clickDeploy();
  47 |     // const payload = (await submitRequest).postDataJSON();
  48 |     //
  49 |     // expect.soft(payload.serviceName, 'serviceName').toBe(c.expectedPayload.serviceName);
  50 |     // expect.soft(payload.region, 'region').toBe(c.expectedPayload.region);
  51 |     // expect.soft(payload.priority, 'priority (SC-B21 when red)').toBe(c.expectedPayload.priority);
  52 |     // expect.soft(payload.alertsEnabled, 'alertsEnabled (SC-B04 when red)').toBe(c.expectedPayload.alertsEnabled);
  53 |     // expect.soft(payload.deploymentWindow, 'deploymentWindow').toBe(c.expectedPayload.deploymentWindow);
  54 |     // expect.soft(payload.alertThreshold, 'alertThreshold').toBe(c.expectedPayload.alertThreshold);
  55 |     // expect.soft(sorted(payload.notificationChannels), 'notificationChannels').toEqual(sorted(c.expectedPayload.notificationChannels));
  56 |     // expect.soft(sorted(payload.accessRoles), 'accessRoles').toEqual(sorted(c.expectedPayload.accessRoles));
  57 |     // expect.soft(payload.deploymentNotes, 'deploymentNotes').toBe(c.expectedPayload.deploymentNotes);
  58 | 
  59 |     // ===== MODE B: SUMMARY-SCREEN VALIDATION (default) ====================
  60 |     // Assert the rendered Summary instead of the request. Intentionally noisier:
  61 |     // also surfaces the Service Name / Region swap (SC-B20) and the raw-ISO
  62 |     // date (SC-B22) on every row, and depends on a successful submit, which
  63 |     // the random upstream (SC-O06) does not guarantee.
  64 |     await wizardPage.clickDeploy();
  65 |     await expect(page.getByText(LOCATORS.summary.successHeading)).toBeVisible();
  66 | 
  67 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.serviceName)).toHaveText(c.expectedSummary.serviceName);
  68 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.region)).toHaveText(c.expectedSummary.region);
> 69 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.priority)).toHaveText(c.expectedSummary.priority);
     |                                                                           ^ Error: expect(locator).toHaveText(expected) failed
  70 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.alertsEnabled)).toHaveText(c.expectedSummary.alertsEnabled);
  71 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.deploymentWindow)).toHaveText(c.expectedSummary.deploymentWindow);
  72 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.alertThreshold)).toHaveText(c.expectedSummary.alertThreshold);
  73 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.notificationChannels)).toHaveText(c.expectedSummary.notificationChannels);
  74 |     await expect.soft(wizardPage.summaryValue(LOCATORS.summary.accessRoles)).toHaveText(c.expectedSummary.accessRoles);
  75 |   });
  76 | }
  77 | 
```