# SENTINEL Onboarding — Implementation Plan

## Context

**Task.** Build a prototype single-page web application for client onboarding risk classification at a wealth management firm (Halcyon Capital Partners, SENTINEL programme). The prototype demonstrates the core flow: a relationship manager (RM) logs a client assessment → the system computes a risk classification against SENTINEL rules → a mandatory compliance record is captured. The application loads onboarding data from `client_onboarding.csv` (~46 records, 4 branches).

**Why.** This is an assessment task for a fullstack position. The official candidate instructions evaluate **two things separately and explicitly**, both of which must be documented alongside the approach:
1. **Process / AI usage** — what was prompted, what was accepted, what was rewritten and why.
2. **Quality approach** — how correctness was verified.

Process logs are therefore **part of the deliverable and part of the evaluation**, not a side activity. `WORKLOG.md` is maintained throughout (automatically via hook on every prompt) and forms ~80% of `APPROACH.md` at the end.

**User decisions (recorded):**
- Stack: **Vite + React + TypeScript (strict) + Tailwind v4**.
- Compliance record persistence: **Supabase** (via MCP), but behind a **repository abstraction** — to support the offline-first debrief discussion.
- Building **all features fully** (the 45–60 min timebox in the instructions is ignored per user decision).
- **Mobile-first / tablet-first** (iPad landscape 1024×768, tap targets ≥ 44×44px).
- **A11y audit at every step**, keyboard operability required throughout.
- Halcyon brand: colours (`#1B2A4A` primary etc.), Inter font, specified typography.
- **Code review (`/code-review`) after every step.**
- WORKLOG maintained automatically: **`/worklog` skill + `UserPromptSubmit` hook**.

---

## Architectural Principles (cross-cutting)

1. **Pure domain core, no frameworks.** Rules engine, normalisation, validation — pure TS functions with no React/Supabase imports. Enables testability and an honest answer to the debrief question "how do you change rules without a deploy?".
2. **Rules engine as DATA, not code.** Ruleset = a JSON/TS structure interpreted by a small generic evaluator. Changing a threshold or country list = editing data, not code. In production the ruleset lives in a Supabase table, is versioned, and is fetched at runtime.
3. **Repository abstraction over persistence.** All reads/writes go through `ComplianceRepository`. Supabase is one implementation; `InMemory` and `IndexedDB` (offline) are others. The UI never imports the Supabase client directly.
4. **CSV = read-only legacy data we audit; new RM assessments = writable clean data we write.** Conceptually separate.
5. **Classification is always recomputable, never "truth in the DB".** We store the input snapshot + ruleset version → any classification can be reproduced and is defensible (auditor requirement).

---

## Testing Strategy (cross-cutting)

**Tool: vitest** (+ Testing Library for components, jest-axe for a11y). Tests are a mandatory part of **every** step, not a separate phase.

1. **Tests derived from ACs.** Each verifiable AC for a step has a corresponding test or test group. The AC is the specification; the test is its executable proof. A step is not closed until its ACs are covered by green tests.
2. **Priority: fixing business logic.** The domain core (SENTINEL rules classification, dirty CSV normalisation, findings detectors, KPI selectors) is unit-tested first — this is what a regulator would call "defensible". The known dirty rows from the CSV (CLT-005/017/031 etc.) become permanent regression cases.
3. **Test levels:**
   - *Unit* (domain, pure functions) — the bulk; fast, no React/network.
   - *Component* (Testing Library) — UI behaviour: rendering, keyboard, validation states.
   - *A11y* (jest-axe) — 0 violations on every screen/component.
   - *Integration* (repository layer, Supabase↔domain mapping) — against mock/in-memory, no real network in CI.
4. **Tests co-located** (`*.test.ts` / `*.test.tsx`) + shared fixtures in `src/test/`.
5. **Domain steps (2, 4, 9) follow TDD** (red→green→refactor): test from AC first, then implementation.
6. **CI command `npm run test`** must be green at the end of every step; domain coverage tracked (`vitest --coverage`), goal is high coverage of business logic rather than a formal overall percentage.

---

## Data Model (application backbone)

`src/domain/model/` — types referenced by everything else:
- `RawCsvRow` — all fields `string | undefined` (models dirty data: blank cells, mixed case).
- `ClientRecord` — normalised record; fields that fail coercion → `null` (the row is not discarded, it survives to the findings view). Field `source: 'CSV_IMPORT' | 'INTAKE'`.
- `ClassificationResult` — `tier` + `hits: RuleHit[]` (all fired rules) + `decidingHits` + `rulesetVersion` + `explanation` + `evaluatedAt`.
- `Finding` — `code` (`MISCLASSIFIED` | `MISSING_RM` | `APPROVED_WITHOUT_ID_VERIFICATION` | `HIGH_RISK_APPROVED_WITHOUT_EDD` | `MISSING_REQUIRED_FIELD` | `INVALID_VALUE`) + `severity`.
- `ComplianceRecord` — writable artefact: `assessmentData` (frozen input snapshot) + `classification` + `assessedBy` + `assessedAt` + `rulesetVersion` + `attestation` + `syncStatus`. Immutable-by-convention (append-only audit trail).

Rules engine: `Ruleset { version, effectiveFrom, tierPriority, rules: Rule[] }`, `Rule { ruleId, tier, conditions: Condition[] }` (conditions via AND — models the compound income+SoF rule), `Condition { field, operator: 'eq'|'in'|'gt'|'gte', value }`. `classify(record, ruleset): ClassificationResult` — the single location of classification logic; fires all rules, takes the highest tier by `tierPriority`. The evaluator is **total** (never throws): bad input → non-match, flagging delegated to the validator.

**Folder structure:**
```
src/
  domain/        # PURE: model/, rules/(defaultRuleset, evaluator), validation/(findings), csv/(parse, normalize)
  data/          # repositories/(ComplianceRepository iface + Supabase/InMemory/IndexedDb impls, RulesetRepository), supabase/client
  features/      # clients-list/, intake/, audit/, findings/
  ui/            # tokens, components/(Button, Card, RiskBadge, Field, DataTable, ...)
  app/           # routing, providers, layout shell
  lib/           # formatters, selectors, hooks
  test/          # fixtures (CSV slice)
```

**Dirty data (basis for findings and tests):** misclassified — CLT-005, CLT-017, CLT-031; missing RM — CLT-012, CLT-027, CLT-042; APPROVED without id_verification — CLT-009, CLT-023; HIGH+APPROVED without EDD — CLT-023.

---

## Steps

> Format for each step: **Scope → Skills → Acceptance Criteria (AC) → Testing (vitest) → Code Review**.
> ACs are formulated as verifiable assertions. Each AC is covered by a test. Code review runs locally (`/code-review`) against the step diff; result recorded in `WORKLOG.md`.

### ☑ Step 0 — Worklog infrastructure (process-as-deliverable)
**Scope.** Create the `/worklog` skill (manual decision logging) + `UserPromptSubmit` hook that appends a brief summary to `WORKLOG.md` on every prompt (does not bloat CLAUDE.md, does not consume context tokens). Initialise `WORKLOG.md` with sections: Process / AI-usage / Quality / Decisions.

**AC:**
- ☑ `WORKLOG.md` exists, contains the project heading and 4 sections.
- ☑ After any prompt input a new dated summary line appears in `WORKLOG.md` automatically (verified on 2+ prompts).
- ☑ `/worklog <text>` appends a manual decision entry to the Decisions section.
- ☑ The hook does not block input and does not print noise into the chat.

---

### ☑ Step 1 — Boilerplate & setup
**Scope.** Vite + React + TS (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noImplicitReturns`) + Tailwind v4. ESLint + Prettier. Vitest + Testing Library + jest-axe. Folder skeleton (stub modules with signatures). `src/ui/tokens.ts` + Tailwind `@theme` with all Halcyon colours and Inter typography. Supabase client init from `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). CSV copied to `public/` and `src/test/fixtures`.

**AC:**
- ☑ `npm run dev` starts an empty shell; `npm run build` passes with no type errors.
- ☑ `npm run lint` green; strict flags enabled in `tsconfig`.
- ☑ All Halcyon colours and Inter font available as Tailwind tokens (visual swatch check).
- ☑ Supabase client initialises; keys only from `.env` (not in git).
- ☑ `npm run test` runs (at least 1 smoke test), jest-axe connected.

---

### ☑ Step 2 — First MVP (end-to-end vertical slice)
**Scope.** Parse CSV → normalise → simple client table → click on a row → **computed** classification with the list of fired rules. No polish, no persistence (`InMemoryComplianceRepository`). Domain unit tests (TDD): spec rules → test cases; contradictions CLT-005/017/031 → assertions.

**AC:**
- ☑ App loads the CSV and shows ~46 rows (dirty rows are not lost).
- ☑ Clicking a client shows the computed tier (LOW/MEDIUM/HIGH) and which rules fired.
- ☑ Classification matches the spec on reference cases (tests green, including CLT-005/017/031).
- ☑ Boolean/income parsing covered by tests (`"TRUE"/"true"/""`, blank/garbage income → `null`).
- ☑ Domain core does not import React/Supabase.

---

### ☑ Step 3 — Design system
**Scope.** `ui/` primitives per brand tokens: `AppShell` (header with Halcyon wordmark + SENTINEL subtitle), `Card`, `Button` (≥44px), `RiskBadge` (LOW=success, MEDIUM=warning, HIGH=error), `Field/Label/Input/Select`, `DataTable`, `StatusPill`, `Toast`. Focus ring, 8px radius, card shadow, 16/24px spacing rhythm. Headless behaviour (Radix or manual ARIA) for Select/Dialog.

**AC:**
- ☑ All primitives rendered on a Storybook-like demo/sandbox page.
- ☑ Interactive elements ≥ 44×44px; focus ring visible when keyboard-navigating.
- ☑ `RiskBadge` correctly maps tier→colour; warning text contrast passes WCAG AA (`#E09F3E` for border/icon only, text darker).
- ☑ Select/Dialog have correct ARIA roles and work with the keyboard.
- ☑ jest-axe: 0 violations on the demo page.

---

### ☑ Step 4 — Rules engine (configurable, data-driven)
**Scope.** Migrate the evaluator from step 2 to a full data-driven model (`Ruleset/Rule/Condition`, `RulesetRepository`, `rulesetVersion` in results). Read-only "Active Ruleset" inspector — a table of current rules (visually demonstrates configurability without a code tour).

**AC:**
- ☑ Default ruleset encodes the spec 1:1 (4 HIGH rules, 3 MEDIUM including the compound income+SoF, LOW=floor).
- ☑ `classify` fires all rules and returns the highest tier + full `hits` list + `explanation`.
- ☑ Changing a value in the ruleset data changes the classification **without editing the evaluator code** (proven by test).
- ☑ Evaluator is total: `null`/garbage input → non-match, no exception thrown.
- ☑ Rules inspector displays the active ruleset and its version.

**Key test — Configurability (debrief anchor):** the same `classify(record)` call with two different ruleset objects (e.g. 500k vs 300k threshold, or a country added to the HIGH list) produces a different tier **without changing the evaluator code**. Proves "rules change without code deploy".

---

### ☑ Step 5 — Client list from CSV + contradiction highlighting
**Scope.** Full client table: key columns, `RiskBadge` with **computed** tier, visual indicator for `recorded !== computed` discrepancy, findings count badge. Filters: branch / tier / "has findings". Detail drawer: recorded vs computed side-by-side + rule explanation.

**AC:**
- ☑ Table shows computed tier for each row; recorded↔computed discrepancy visually highlighted.
- ☑ Dirty rows are **not hidden** — all ~46 rows from CSV present; rows with issues have a visible badge/marker rather than just being absent.
- ☑ Filters by branch / tier / "has findings" work and combine.
- ☑ Drawer shows recorded vs computed and plain-text "why" (fired rules).
- ☑ Sorting correct with `null` fields (nulls-last).
- ☑ Fully keyboard-operable; drawer with focus-trap; jest-axe 0 violations.

---

### ☑ Step 6 — Intake form with live classification
**Scope.** Core RM flow (<90s). Form with all assessment inputs; on field change classification recomputes **live** (tier + fired rules + plain-English "why"). Inline validation (required, "HIGH requires EDD" warning). Submit → attestation step → `ComplianceRecord` creation.

**AC:**
- ☑ Changing a field immediately updates the displayed tier and rule list.
- ☑ Cannot create a HIGH record with status APPROVED without EDD/sign-off (UI blocks the contradiction).
- ☑ On HIGH classification the form shows an explicit EDD notice: "Enhanced Due Diligence required — senior compliance sign-off needed before approval". `kyc_status` is automatically forced to `ENHANCED_DUE_DILIGENCE` and `APPROVED` cannot be selected.
- ☑ Required validation and error messages are accessible (`aria-describedby`, `aria-invalid`).
- ☑ Classification changes announced via `aria-live="polite"`, form does not jump.
- ☑ Entire flow keyboard-operable (tab order, Enter-advance), submit creates a `ComplianceRecord`.
- ☑ Zod schema aligned with `normalize.ts` intent.

---

### ☑ Step 7 — Compliance record persistence (Supabase behind the repository)
**Scope.** Write submitted records via `SupabaseComplianceRepository`. Table `compliance_records`: queryable columns (`client_id`, `tier`, `assessed_at`, `branch`) + `jsonb` for the full `assessmentData`/`classification` snapshot. `assessed_at` server-default, RLS stub. Persistent assessments visually distinct from CSV legacy data. `IndexedDBRepository` stub for offline-first debrief. Records are immutable-by-convention (no UPDATE/DELETE in the interface; correction = new record).

**AC:**
- ☑ Form submit creates a row in `compliance_records` (verified via MCP `execute_sql`/UI).
- ☑ `assessedAt` (server) + `assessedBy` saved → record is attributable and contemporaneous.
- ☑ UI does not import the Supabase client directly; everything goes through `ComplianceRepository`.
- ☑ Generated DB types do not leak past the repository mapping layer (domain stays clean).
- ☑ `get_advisors` shows no critical security findings (RLS enabled with at least a stub policy).
- ☑ Persistent records visually distinguishable from CSV data in the list.

---

### ☑ Step 8 — Audit dashboard / KPIs
**Scope.** View for compliance/auditor: KPI cards (total assessed, % HIGH, open findings, records with findings, % without attribution), tier distribution by branch, audit-log table "who/which client/when". KPI numbers 700/32px per brand.

**AC:**
- ☑ KPIs computed purely from `ClientRecord[] + ClassificationResult[] + Finding[]` (selectors in `lib/`, covered by tests).
- ☑ KPI numbers and distributions match the dataset (verified against manual count from CSV).
- ☑ Audit log shows who/which client/when assessed.
- ☑ Charts have a text/table a11y equivalent; jest-axe 0 violations.

---

### ☑ Step 9 — Findings engine (data-validation)
**Scope.** `detectFindings()` → `Finding[]` for steps 5 and 8. Detectors verified against the dataset: MISCLASSIFIED (CLT-005/017/031), MISSING_RM (CLT-012/027/042), APPROVED_WITHOUT_ID_VERIFICATION (CLT-009/023), HIGH_RISK_APPROVED_WITHOUT_EDD (CLT-023), MISSING_REQUIRED_FIELD, INVALID_VALUE. Findings view with grouping by severity. Note: blank `id_verification_date` is legitimate for PENDING but a finding for APPROVED.

**AC:**
- ☑ Each detector is a pure `(record, classification) => Finding[]`; covered by tests.
- ☑ All reference dirty rows produce the expected findings (exact match to the list above).
- ☑ No false positives on "legitimately blank" fields (PENDING without id_verification ≠ finding).
- ☑ Findings view groups by severity, sorted CRITICAL→WARNING, exports summary.

**Key tests:**
- Golden-dataset test: running `detectFindings` over the full CSV fixture produces exactly the expected set of findings by client ID.
- False-positive guard: PENDING without `id_verification_date` does NOT produce a finding.

---

### ☑ Step 10 — A11y & keyboard hardening
**Scope.** Full a11y pass: focus management in drawer/dialog (trap + restore), `aria-live` for live classification and toasts, landmarks, skip-link, full keyboard operability (list → intake → submit without a mouse), contrast, 44px audit. jest-axe in tests + Lighthouse via chrome-devtools MCP.

**AC:**
- ☑ Entire main flow executable without a mouse (proven by test).
- ☑ Focus-trap and focus restoration in drawer/dialog work.
- ☑ Lighthouse Accessibility ≥ 95 (achieved **98** on isolated context audit); jest-axe 0 violations on all screens.
- ☑ Contrast on all text/background pairs passes WCAG AA.
- ☑ Verified in two iPad landscape modes: touch and keyboard.

**Tests added:**
- `src/test/a11y.test.tsx` — jest-axe on all main screens (ClientsList, IntakeForm, AuditDashboard, FindingsPanel, RulesetInspector, AssessmentsList) + empty states.
- `src/test/keyboard-flow.test.tsx` — keyboard navigation through ClientsList, Dialog focus management, IntakeForm full keyboard path to attestation step.
- `src/ui/components/Dialog.test.tsx` — extended with focus-restore, Esc→cancel, 44px touch-target assertions.

**Fixes applied:**
- `ClientDetailPanel`: findings `<li>` key changed from `index` to `${code}-${field ?? description}` (stable under reorder).
- `AuditDashboard`: removed redundant `<caption class="sr-only">` from both tables that already had `aria-label` (ARIA spec: `aria-label` overrides `<caption>` for AT; duplicate text confuses screen readers).

**Lighthouse result:** Accessibility **98** / Best Practices **96** / SEO **91** (navigation mode, isolated browser context, desktop).

---

### ☐ Step 11 — Final polish + deliverables
**Scope.** Empty/error/loading states, surfacing CSV parse errors, micro-interactions, performance check, demo seed. `APPROACH.md` (consolidation of WORKLOG: problem understanding, stakeholder questions, what was built/deferred and why, assumptions, debrief answers: offline-first, rules-without-deploy, FCA record-keeping, multi-branch scale). `README.md` (how to run locally).

**AC:**
- ☐ Meaningful empty/error/loading states exist; CSV parse error visible to the user.
- ☐ `README.md`: local run steps reproducible from scratch (clone → install → env → dev).
- ☐ `APPROACH.md` covers: problem understanding, stakeholder questions (RM / Head of Compliance / Auditor / CTO), technical decisions/deferred items, assumptions, **AI usage process** and **quality approach**, answers to the 4 architectural debrief topics (offline-first / rules-without-deploy / FCA record-keeping / multi-branch scale).
- ☐ Final `/code-review` on the full diff — no blocking findings.

**Tests:**
- ☐ Full suite green: `npm run test -- --run` passes entirely; `npm run build` and `npm run lint` green.
- ☐ Tests for empty/error/loading states (broken CSV → visible error, empty list → empty state).
- ☐ `vitest --coverage` — domain core coverage (rules/normalize/findings/selectors) high; numbers recorded in WORKLOG/APPROACH as part of the quality narrative.
- ☐ `APPROACH.md` quality section references specific tests (golden-dataset, configurability, business-rule guard) as evidence of correctness.

---

## Deliverables
- **Working prototype** — Vite+React+TS SPA, Supabase backend behind the repository.
- **`WORKLOG.md`** — maintained automatically throughout (hook) + manual decision entries (`/worklog`).
- **`APPROACH.md`** — consolidated from WORKLOG in step 11; covers AI process and quality approach (evaluated separately!).
- **`README.md`** — local run instructions.

## End-to-end Verification
1. `npm install && npm run dev` — app starts, loads CSV.
2. Open client list → verify CLT-005/017/031 highlighted as misclassified.
3. Fill intake form → see live classification → submit → record appears in Supabase (`mcp execute_sql` or UI assessment list).
4. Audit dashboard → KPIs match manual count from CSV.
5. Findings view → reference dirty rows produce expected findings, no false positives.
6. A11y: `npm run test` (jest-axe 0 violations) + Lighthouse Accessibility ≥ 95 + manual keyboard run of full flow.
7. `npm run build && npm run lint` — green.
8. **Tests:** `npm run test -- --run` — full vitest suite green; `vitest --coverage` — domain core coverage high. Tests derived from each step's ACs and fix business logic (golden-dataset findings, rules engine configurability, business-rule guard in the form, KPI verification against CSV).
