import { Page, Locator } from '@playwright/test';

/**
 * For fields where <label> is a plain DOM sibling of its control (no
 * for/id, no wrapping). page.getByLabel() will not find these elements -
 * they have no accessible name for assistive tech either, which is its
 * own minor accessibility defect alongside the existing findings.
 */
export function byLabelSibling(page: Page, labelText: string, controlSelector: string): Locator {
  return page.locator(`div:has(> label:text-is("${labelText}")) > ${controlSelector}`);
}

export const LOCATORS = {
  step1: {
    serviceNamePlaceholder: 'e.g. payments-api',  // used via getByPlaceholder
    region: 'Region',                              // used via byLabelSibling(..., 'select')
    alertsToggleLabel: 'Enable Alerts',             // used via byLabelSibling(..., 'button[aria-pressed]')
  },
  step2: {
    deploymentWindow: 'Deployment Window',                              // byLabelSibling(..., 'input')
    alertThresholdPlaceholder: 'Trigger alert after N consecutive failures', // getByPlaceholder
  },
  step3: {
    deploymentNotes: 'Deployment Notes',                       // byLabelSibling(..., 'textarea')
    confirmCheckboxLabel: 'I confirm this configuration is correct', // byLabelSibling(..., 'input[type="checkbox"]')
  },
  nav: {
    backButton: /back/i,
    nextButton: /next/i,
    deployButton: /deploy configuration/i,
  },
  summary: {
    successHeading: 'Deployment Submitted',
    serviceName: 'Service Name',
    region: 'Region',
    priority: 'Priority',
    alertsEnabled: 'Alerts Enabled',
    deploymentWindow: 'Deployment Window',
    alertThreshold: 'Alert Threshold',
    notificationChannels: 'Notification Channels',
    accessRoles: 'Access Roles',
  },
};