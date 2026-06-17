export type Channel = 'Email' | 'Slack' | 'PagerDuty' | 'Webhook';
export type Role = 'Admin' | 'Developer' | 'Viewer' | 'Auditor';

export interface DeploymentCase {
  name: string;
  targets: string;
  inputs: {
    serviceName: string;
    region: string;
    priority: number;           // slider position the user sets (1–5)
    alertsEnabled: boolean;     // toggle position the user sets
    // ISO 'YYYY-MM-DDTHH:mm' — required by Playwright .fill() on type="datetime-local".
    // The field renders to the user as DD/MM/YYYY HH:mm (locale display). The year
    // segment accepts up to 6 characters (no maxlength guard) — logged defect.
    deploymentWindow: string;
    alertThreshold: number;
    channels: Channel[];
    roles: Role[];
    notes: string;
  };
  expectedPayload: {
    serviceName: string;
    region: string;
    priority: number;
    alertsEnabled: boolean;
    deploymentWindow: string;
    alertThreshold: number;
    notificationChannels: Channel[];
    accessRoles: Role[];
    deploymentNotes: string;
  };
  expectedSummary: {
    serviceName: string;
    region: string;
    priority: string;             // as rendered ('' when blank)
    alertsEnabled: 'Yes' | 'No';
    deploymentWindow: string;
    alertThreshold: string;
    notificationChannels: string; // comma-joined as rendered
    accessRoles: string;
  };
}

/**
 * Documents the CURRENT (buggy) behaviour: the app stores and displays one
 * less than the slider value (SC-B21). Non-priority rows use this to lock the
 * current behaviour so they stay green and isolate their own failure.
 */
export const emittedPriority = (slider: number): number => slider - 1;

export const cases: DeploymentCase[] = [
  // ---- ROW 1: HAPPY PATH (green control) -----------------------------------
  {
    name: 'happy path - valid config, alerts off',
    targets: 'Proves the harness drives the whole wizard and asserts a correct submission end to end.',
    inputs: {
      serviceName: 'checkoutservice', // lowercase, no hyphen: side-steps SC-B03/SC-B23
      region: 'us-east-1',
      priority: 3,
      alertsEnabled: false,           // off, so SC-B04 is not exercised
      deploymentWindow: '2026-09-01T09:00',
      alertThreshold: 5,
      channels: ['Email', 'Slack'],
      roles: ['Admin', 'Viewer'],
      notes: 'Scheduled rollout',
    },
    expectedPayload: {
      serviceName: 'checkoutservice',
      region: 'us-east-1',
      priority: emittedPriority(3),   // characterised: locks current behaviour so the control is green
      alertsEnabled: false,
      deploymentWindow: '2026-09-01T09:00',
      alertThreshold: 5,
      notificationChannels: ['Email', 'Slack'],
      accessRoles: ['Admin', 'Viewer'],
      deploymentNotes: 'Scheduled rollout',
    },
    expectedSummary: {
      serviceName: 'checkoutservice',
      region: 'us-east-1',
      priority: String(emittedPriority(3)),
      alertsEnabled: 'No',
      deploymentWindow: '01/09/2026 09:00', // intended display; summary may show raw ISO (SC-B22)
      alertThreshold: '5',
      notificationChannels: 'Email, Slack',
      accessRoles: 'Admin, Viewer',
    },
  },

  // ---- ROW 2: ALERTS BUG (SC-B04) ------------------------------------------
  {
    name: 'alerts bug - toggle on never reaches the backend (SC-B04)',
    targets: 'Alerts toggled ON. Asserts alertsEnabled true. Fails because the app hardcodes it false.',
    inputs: {
      serviceName: 'paymentsapi',
      region: 'eu-west-1',
      priority: 3,
      alertsEnabled: true,            // ON
      deploymentWindow: '2026-09-01T09:00',
      alertThreshold: 10,
      channels: ['Email'],
      roles: ['Admin'],
      notes: 'Alerts must be enabled',
    },
    expectedPayload: {
      serviceName: 'paymentsapi',
      region: 'eu-west-1',
      priority: emittedPriority(3),   // characterised so this row isolates the alerts failure
      alertsEnabled: true,            // INTENDED: user switched alerts on -> assertion fails (SC-B04)
      deploymentWindow: '2026-09-01T09:00',
      alertThreshold: 10,
      notificationChannels: ['Email'],
      accessRoles: ['Admin'],
      deploymentNotes: 'Alerts must be enabled',
    },
    expectedSummary: {
      serviceName: 'paymentsapi',
      region: 'eu-west-1',
      priority: String(emittedPriority(3)),
      alertsEnabled: 'Yes',           // INTENDED -> summary shows 'No' (SC-B04), so this fails
      deploymentWindow: '01/09/2026 09:00',
      alertThreshold: '10',
      notificationChannels: 'Email',
      accessRoles: 'Admin',
    },
  },

  // ---- ROW 3: PRIORITY BUG (SC-B21) ----------------------------------------
  {
    name: 'priority bug - off-by-one (SC-B21)',
    targets: 'Priority slider set to 5. Asserts the intended 5. Fails because the app emits 4.',
    inputs: {
      serviceName: 'inventoryservice',
      region: 'ap-southeast-1',
      priority: 5,
      alertsEnabled: false,
      deploymentWindow: '2026-09-01T09:00',
      alertThreshold: 3,
      channels: ['Slack', 'PagerDuty'],
      roles: ['Developer', 'Auditor'],
      notes: 'High priority service',
    },
    expectedPayload: {
      serviceName: 'inventoryservice',
      region: 'ap-southeast-1',
      priority: 5,                    // INTENDED: user selected 5 -> app emits 4, so this fails (SC-B21)
      alertsEnabled: false,
      deploymentWindow: '01/09/2026 09:00', // pass-through assumption; confirm format on first run
      alertThreshold: 3,
      notificationChannels: ['Slack', 'PagerDuty'],
      accessRoles: ['Developer', 'Auditor'],
      deploymentNotes: 'High priority service',
    },
    expectedSummary: {
      serviceName: 'inventoryservice',
      region: 'ap-southeast-1',
      priority: '5',                  // INTENDED -> summary shows '4', so this fails
      alertsEnabled: 'No',
      deploymentWindow: '01/09/2026 09:00',
      alertThreshold: '3',
      notificationChannels: 'Slack, PagerDuty',
      accessRoles: 'Developer, Auditor',
    },
  },
];
