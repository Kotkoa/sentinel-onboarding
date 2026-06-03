# Per-step vitest requirements

Every step must end with `npm run test -- --run` passing. Tests are derived from AC.

## Step 1 — Boilerplate
- `sanity.test.ts` — vitest smoke (`expect(true).toBe(true)`) + CSV fixture accessible from `src/test/fixtures`
- `vitest.config.ts` configured: jsdom env, jest-axe setup, coverage script

## Step 2 — MVP (TDD)
- `parse.test.ts` — ~46 rows returned; blank cells → `undefined`; no rows dropped
- `normalize.test.ts` — boolean coercion (`"TRUE"/"true"/"FALSE"/""`→bool|null); income (`"1200000"/""/ garbage`→number|null); invalid enum→null; missing `client_id` dropped
- `evaluator.test.ts` — tabular spec cases: each HIGH trigger alone; MEDIUM (ENTITY / country / income+SoF compound); LOW floor; highest tier wins when multiple rules fire
- Regression: CLT-005 (PEP→HIGH), CLT-017 (Russia+PEP→HIGH), CLT-031 (adverse_media→HIGH)

## Step 3 — Design system
- `RiskBadge.test.tsx` — tier→color/label mapping for LOW/MEDIUM/HIGH
- `Button.test.tsx` — min 44px, onClick on click+Enter+Space
- `Select.test.tsx` / `Dialog.test.tsx` — ARIA roles, keyboard open/close/nav
- jest-axe: `toHaveNoViolations()` for each primitive and demo page

## Step 4 — Rules engine (TDD)
- `evaluator.test.ts` extended — `evaluateCondition` for all operators (eq/in/gt/gte) on valid and null/garbage → correct bool, no throw
- Compound AND rule: fires only when both conditions true; null income short-circuits safely
- **Configurability test (debrief key):** same `classify(record)` + two different rulesets → different tier, no evaluator code change
- `ClassificationResult` has all hits, decidingHits, rulesetVersion, non-empty explanation
- `RulesetRepository.getActive()` returns default ruleset encoding spec 1:1

## Step 5 — Clients list
- `ClientsList.test.tsx` — ~46 rows rendered; rows with `recorded !== computed` have visual marker
- Filter tests: branch, tier, "has findings", combined (row count matches expectation)
- Null-sort comparator unit test: nulls-last
- Drawer: open on click/Enter, shows recorded vs computed + explanation, focus-trap, jest-axe 0 violations

## Step 6 — Intake form
- `IntakeForm.test.tsx` — field change (PEP=TRUE / country=Russia / income+SoF) → tier updates live
- **Business-rule guard:** submit with HIGH + APPROVED (no EDD) → blocked, error visible
- Validation: required fields → `aria-invalid` + `aria-describedby` message; submit with errors → no record
- Successful submit → attestation step → `ComplianceRecord` created with correct fields (mock-repo)
- zod schema unit tests aligned with `normalize.test.ts` expectations
- Keyboard-flow test: fill+submit via keyboard only; jest-axe 0 violations

## Step 7 — Supabase persistence
- Repository contract test suite against `InMemoryComplianceRepository`: `save()` then `list()`/`getByClientId()` returns saved; no update/delete in interface
- `mapping.test.ts` — round-trip domain→row→domain without data loss; DB types don't leak to domain
- `assessedAt`/`assessedBy`/`rulesetVersion` present in saved record
- Real Supabase impl verified manually via MCP `execute_sql` (outside CI; logged in WORKLOG)

## Step 8 — Audit dashboard
- `kpiSelectors.test.ts` — each KPI (total, %HIGH, open findings, records-with-findings, %missing-RM) equals hand-counted value from CSV fixture
- Branch distribution selector: per-branch sums; total = overall count
- `AuditDashboard.test.tsx` — KPI numbers rendered; audit-log shows who/client/when; jest-axe 0 violations (charts have table equivalent)

## Step 9 — Findings engine (TDD)
- Per-detector tests: each detector (`MISCLASSIFIED`, `MISSING_RM`, `APPROVED_WITHOUT_ID_VERIFICATION`, `HIGH_RISK_APPROVED_WITHOUT_EDD`, `MISSING_REQUIRED_FIELD`, `INVALID_VALUE`) — positive (fires) and negative (does not fire)
- **Golden-dataset test:** `detectFindings` on full CSV fixture → exact expected findings by client_id (CLT-005/017/031 misclassified; CLT-012/027/042 missing RM; CLT-009/023 approved-without-id; CLT-023 high-approved-without-edd)
- **False-positive guard:** PENDING without `id_verification_date` → no finding; legitimately empty optional fields not flagged

## Step 10 — A11y hardening
- `a11y.test.tsx` — jest-axe on all main screens (list / intake / audit / findings), 0 violations
- Keyboard-integration test: list → intake → fill → submit, keyboard only (`userEvent.keyboard`)
- Focus-trap test: focus stays inside open dialog/drawer; Esc closes and restores focus to trigger
- Manual Lighthouse run ≥95 — screenshot/score in WORKLOG

## Step 11 — Final
- Full suite `npm run test -- --run` green
- Empty/error/loading state tests (broken CSV → visible error; empty list → empty-state component)
- `vitest --coverage` — domain coverage high; numbers in WORKLOG/APPROACH
- `APPROACH.md` quality section references specific tests as correctness evidence
