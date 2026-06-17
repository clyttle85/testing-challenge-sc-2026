/**
 * Mission Control - Senior QA Challenge
 * Worked automation example (deliverable 4)
 * ---------------------------------------------------------------------------
 * A data-driven UI test that drives the full deployment wizard and then checks
 * the UI-to-API "seam" using request interception. Three data rows:
 *
 *   1. Happy path   - a benign valid config; the green control.
 *   2. Alerts bug   - alerts toggled on; catches SC-B04 (alertsEnabled never
 *                     reaches the backend).
 *   3. Priority bug - slider set to 5; catches SC-B21 (priority off-by-one).
 *
 * Two modes:
 *   MODE A (default) - intercept the submit-config request and assert the
 *                      payload. Robust even when the upstream randomly errors
 *                      (SC-O06), because the request is sent regardless of
 *                      the response.
 *   MODE B (commented out) - drive the same flow but assert the Summary screen
 *                      instead. Flip by commenting Mode A and uncommenting B.
 *
 * Run: npx playwright test mission-control-test.spec.ts
 */

import { test, expect } from '@playwright/test';
import { DeploymentWizardPage } from './pages/DeploymentWizardPage.js';
import { cases } from './fixtures/deployment-cases.js';
import { LOCATORS } from './constants/locators.js';

const sorted = (a: string[]): string[] => [...a].sort();

for (const c of cases) {
  test(`deploy config - ${c.name}`, async ({ page }) => {
    const wizardPage = new DeploymentWizardPage(page);
    await wizardPage.goto();

    await wizardPage.fillStep1(c.inputs);
    await wizardPage.fillStep2(c.inputs);
    await wizardPage.fillStep3(c.inputs);

    // ===== MODE A: REQUEST INTERCEPTION ==================================
    // Capture the submit-config request and assert the payload. expect.soft is
    // used so every field mismatch is reported in one run rather than stopping
    // at the first. This is the layer that catches the UI-to-API seam bugs.
    //
    const submitRequest = wizardPage.waitForSubmitRequest();
    await wizardPage.clickDeploy();
    const payload = (await submitRequest).postDataJSON();
    
    expect.soft(payload.serviceName, 'serviceName').toBe(c.expectedPayload.serviceName);
    expect.soft(payload.region, 'region').toBe(c.expectedPayload.region);
    expect.soft(payload.priority, 'priority (SC-B21 when red)').toBe(c.expectedPayload.priority);
    expect.soft(payload.alertsEnabled, 'alertsEnabled (SC-B04 when red)').toBe(c.expectedPayload.alertsEnabled);
    expect.soft(payload.deploymentWindow, 'deploymentWindow').toBe(c.expectedPayload.deploymentWindow);
    expect.soft(payload.alertThreshold, 'alertThreshold').toBe(c.expectedPayload.alertThreshold);
    expect.soft(sorted(payload.notificationChannels), 'notificationChannels').toEqual(sorted(c.expectedPayload.notificationChannels));
    expect.soft(sorted(payload.accessRoles), 'accessRoles').toEqual(sorted(c.expectedPayload.accessRoles));
    expect.soft(payload.deploymentNotes, 'deploymentNotes').toBe(c.expectedPayload.deploymentNotes);

    // ===== MODE B: SUMMARY-SCREEN VALIDATION (default) ====================
    // Assert the rendered Summary instead of the request. Intentionally noisier:
    // also surfaces the Service Name / Region swap (SC-B20) and the raw-ISO
    // date (SC-B22) on every row, and depends on a successful submit, which
    // the random upstream (SC-O06) does not guarantee.
    // await wizardPage.clickDeploy();
    // await expect(page.getByText(LOCATORS.summary.successHeading)).toBeVisible();

    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.serviceName)).toHaveText(c.expectedSummary.serviceName);
    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.region)).toHaveText(c.expectedSummary.region);
    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.priority)).toHaveText(c.expectedSummary.priority);
    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.alertsEnabled)).toHaveText(c.expectedSummary.alertsEnabled);
    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.deploymentWindow)).toHaveText(c.expectedSummary.deploymentWindow);
    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.alertThreshold)).toHaveText(c.expectedSummary.alertThreshold);
    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.notificationChannels)).toHaveText(c.expectedSummary.notificationChannels);
    // await expect.soft(wizardPage.summaryValue(LOCATORS.summary.accessRoles)).toHaveText(c.expectedSummary.accessRoles);
  });
}
