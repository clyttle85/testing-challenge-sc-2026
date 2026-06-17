# Mission Control – QA Automation Challenge

This project demonstrates a structured QA approach combining exploratory testing, defect discovery, and data-driven Playwright automation.

It focuses on validating a deployment wizard through both UI-level assertions and UI-to-API contract testing via request interception.

---

## Overview

The testing strategy was built in three stages:

1. Exploratory manual testing  
2. Structured defect documentation  
3. Data-driven automation (UI + API validation layers)

The goal was to identify functional issues early, then encode those findings into repeatable automated tests that validate both:
- Backend request payload correctness
- Frontend summary UI consistency

---

## Exploratory Testing Approach

- Brief was analysed while manual testing was performed independently
- Findings were captured in real time in Markdown
- This evolved into:
  - Detailed defect log
  - Summary report

---

## Defect Documentation

Outputs:
- Full defect log (detailed observations)
- Summary report (key risks and issues)

Key defect themes:
- Data mismatches
- UI/API inconsistencies
- Known SC-* system defects

---

## Automation Strategy

Data-driven test model:

Each test case includes:
- Input data
- Expected API payload
- Expected UI summary values

---

## Mode A – API Contract Validation

- Intercepts submit-config request
- Validates payload via expect.soft
- Continues execution on failure
- Reports all mismatches together

Catches:
- UI → API mapping issues
- Silent data loss
- Transformation bugs

---

## Mode B – UI Validation

- Validates summary screen
- Ensures UI consistency
- Dependent on backend success

Exposes:
- Field swaps
- Formatting issues
- Backend instability issues

---

## Architecture

/pages – Page Object Model  
/fixtures – test data  
/constants – locators  
/tests – spec files  

---

## Key Principles

- Data-driven testing  
- Page Object Model  
- Soft assertions for full defect capture  
- API + UI dual validation  

---

## Known Defects Covered

- SC-B04 – Alerts not passed correctly  
- SC-B21 – Priority off-by-one  
- SC-B20 – Field swap (Service/Region)  
- SC-B22 – Date formatting issue  
- SC-O06 – Intermittent upstream failure  

---

## Running Tests

npm install  
npx playwright test  

UI mode:
npm run test:ui  

Headed mode:
npx playwright test --headed  

---

## Summary

This project demonstrates a QA workflow from exploration → documentation → automation, focusing on data integrity between UI and API layers.
