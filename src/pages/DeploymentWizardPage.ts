import { Page, Locator } from '@playwright/test';
import { LOCATORS, byLabelSibling } from '../constants/locators.js';
import { SUBMIT_CONFIG_ENDPOINT } from '../constants/urls.js';
import type { DeploymentCase } from '../fixtures/deployment-cases.js';

export class DeploymentWizardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
    // Wait for React to finish mounting its controlled components. Without this,
    // fills race against React's initial render and get overwritten by useState("").
    await this.page.waitForLoadState('networkidle');
  }

  private async setSlider(value: number): Promise<void> {
    const slider = this.page.getByRole('slider'); // unchanged - native range input genuinely is role "slider"
    await slider.evaluate((el, v) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )!.set!;
      setter.call(input, String(v));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }

  private async setToggle(on: boolean): Promise<void> {
    // Rendered as <button aria-pressed>, not role="switch" with aria-checked.
    const toggle = byLabelSibling(this.page, LOCATORS.step1.alertsToggleLabel, 'button[aria-pressed]');
    const isOn = (await toggle.getAttribute('aria-pressed')) === 'true';
    if (isOn !== on) await toggle.click();
  }

  async fillStep1(inputs: DeploymentCase['inputs']): Promise<void> {
    await this.page.getByPlaceholder(LOCATORS.step1.serviceNamePlaceholder).fill(inputs.serviceName);
    await byLabelSibling(this.page, LOCATORS.step1.region, 'select').selectOption(inputs.region);
    // Slider DOM range is 0–4; UI displays 1–5. Subtract 1 to map display value → range position.
    // This is NOT related to SC-B21 — it is the correct user simulation. The SC-B21 off-by-one
    // is in what the APP SUBMITS (the range value) vs what it should submit (the display value).
    await this.setSlider(inputs.priority - 1);
    await this.setToggle(inputs.alertsEnabled);
    await this.page.getByRole('button', { name: LOCATORS.nav.nextButton }).click();
  }

  async fillStep2(inputs: DeploymentCase['inputs']): Promise<void> {
    await byLabelSibling(this.page, LOCATORS.step2.deploymentWindow, 'input').fill(inputs.deploymentWindow);
    await this.page.getByPlaceholder(LOCATORS.step2.alertThresholdPlaceholder).fill(String(inputs.alertThreshold));
    for (const channel of inputs.channels) {
      await this.page.getByRole('checkbox', { name: channel }).check(); // unchanged - these labels wrap properly
    }
    await this.page.getByRole('button', { name: LOCATORS.nav.nextButton }).click();
  }

  async fillStep3(inputs: DeploymentCase['inputs']): Promise<void> {
    for (const role of inputs.roles) {
      await this.page.getByRole('checkbox', { name: role }).check(); // unchanged - wraps properly
    }
    await byLabelSibling(this.page, LOCATORS.step3.deploymentNotes, 'textarea').fill(inputs.notes);
    // .check() (mouse path) is used deliberately - keyboard toggle does not enable Deploy (SC-B14)
    await byLabelSibling(this.page, LOCATORS.step3.confirmCheckboxLabel, 'input[type="checkbox"]').check();
  }

  waitForSubmitRequest(): Promise<import('@playwright/test').Request> {
    return this.page.waitForRequest(
      (r) => r.url().includes(SUBMIT_CONFIG_ENDPOINT) && r.method() === 'POST',
    );
  }

  async clickDeploy(): Promise<void> {
    await this.page.getByRole('button', { name: LOCATORS.nav.deployButton }).click();
  }

  summaryValue(label: string): Locator {
    return this.page
      .locator('div')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator('xpath=following-sibling::div[1]');
  }
}