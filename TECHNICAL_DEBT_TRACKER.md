# FNG Technical Debt Tracker

## Purpose
This file tracks prioritized technical debt items with clear ownership, acceptance criteria, and validation commands.

## Status Legend
- `open`: Identified and not yet started.
- `in-progress`: Being actively worked.
- `done`: Implemented and validated.

## P0 - Security and Deploy Hygiene

### TD-001 Secure infra DB parameterization
- Status: `done`
- Scope:
  - Remove hardcoded DB URL from Bicep secrets.
  - Introduce secure `databaseUrl` parameter and wire it through infra modules.
  - Add deployment parameters file.
- Files:
  - `infra/resources.bicep`
  - `infra/main.bicep`
  - `infra/main.parameters.json`
- Done criteria:
  - No hardcoded credential-like DB URL in Bicep.
  - Diagnostics clear for modified infra files.
- Validation:
  - VS Code Problems panel (`get_errors`) on infra files.

### TD-002 Remove duplicate/conflicting Azure deploy workflow block
- Status: `done`
- Scope:
  - Keep CI deterministic by removing stale deployment block that referenced invalid contexts.
- Files:
  - `.github/workflows/main.yml`
- Done criteria:
  - Workflow file parses without context warnings.
- Validation:
  - VS Code Problems panel (`get_errors`) on workflow file.

## P1 - Quality and DX

### TD-003 Accessibility fixes (dashboards)
- Status: `done`
- Scope:
  - Add explicit accessible naming for icon-only buttons and range input.
- Files:
  - `apps/admin-dashboard/src/pages/FleetManagement.tsx`
  - `apps/merchant-dashboard/src/pages/ProfilePage.tsx`
- Done criteria:
  - Existing accessibility warnings resolved in edited files.
- Validation:
  - VS Code Problems panel (`get_errors`) on both files.

### TD-004 E2E deterministic configuration
- Status: `done`
- Scope:
  - Remove hardcoded URL drift.
  - Add env-driven base URLs.
  - Add Playwright web server orchestration and CI-safe defaults.
- Files:
  - `tests/e2e/main_flow.spec.ts`
  - `tests/playwright.config.ts`
- Done criteria:
  - Diagnostics clean.
  - Config supports local and CI runs.
- Validation:
  - VS Code Problems panel (`get_errors`) for e2e config/spec files.

### TD-005 Add dedicated E2E CI job
- Status: `done`
- Scope:
  - Add Playwright CI job with browser installation and report artifact upload.
- Files:
  - `.github/workflows/ci.yml`
  - `tests/package.json`
- Done criteria:
  - Workflow contains e2e job with explicit setup and artifact publishing.
- Validation:
  - VS Code Problems panel (`get_errors`) for workflow and tests package file.

### TD-006 Cross-platform TS casing hygiene
- Status: `done`
- Scope:
  - Enable `forceConsistentCasingInFileNames` for `driver-app-rn` tsconfig.
- Files:
  - `apps/driver-app-rn/tsconfig.json`
- Done criteria:
  - Casing warning resolved for this file.
- Validation:
  - VS Code Problems panel (`get_errors`) for tsconfig file.

## P2 - Next Backlog

### TD-007 Playwright flow realism
- Status: `done`
- Scope:
  - Replace placeholder/mock selectors with deterministic test IDs and real authenticated flow fixtures.
  - Add CI path gating so Playwright runs only when dashboard or test surfaces change.
- Suggested files:
  - `tests/e2e/main_flow.spec.ts`
  - dashboard login/order pages
  - `.github/workflows/ci.yml`
- Acceptance:
  - Stable pass in CI over repeated runs.
  - E2E selectors use `data-testid` hooks for login and order interactions.
  - E2E job skips cleanly on unrelated backend-only changes.
- Validation:
  - `npx playwright test -c playwright.config.ts --workers=1 --reporter=list` (local): `2 passed`.

### TD-009 Release gate for deterministic E2E
- Status: `done`
- Scope:
  - Require Playwright smoke pass as PR gate for dashboard-affecting changes.
  - Document rerun threshold and flaky-test policy.
- Suggested files:
  - `.github/workflows/ci.yml`
  - `tests/README.md` or root `README.md`
- Acceptance:
  - Protected branch rule references CI workflow including E2E status.
  - Team playbook includes retry/flaky handling guidance.
- Progress:
  - Added `Release Gate — required checks` job to CI to validate required job results and handle conditional E2E execution.
  - Added branch protection and flaky-test policy guidance to `README.md`.

### TD-008 Optional noise reduction in test logs
- Status: `done`
- Scope:
  - Reduce non-actionable warning output while preserving actionable errors.
- Suggested files:
  - backend logging/observability config
- Acceptance:
  - CI logs remain concise and debugging-focused.
- Progress:
  - Added test-aware log level defaults in `backend/src/logger.ts`.
  - Replaced direct `console.*` calls with structured logger usage in DB, Redis, search, and global error handler.
  - Suppressed non-actionable Application Insights missing-connection warnings during tests.
- Validation:
  - `npx jest src/__tests__/auth.middleware.test.ts --runInBand --no-cache`: `8 passed`.
  - `npx jest src/__tests__/orderLifecycle.test.ts --runInBand --no-cache --silent`: `1 passed`.

## Operational Rule
After each phase, publish a clear completion message with:
1. Scope finished
2. Files changed
3. Validation run
4. Result
5. Remaining risks
6. Next phase
