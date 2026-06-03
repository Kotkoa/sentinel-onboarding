# APPROACH — SENTINEL Onboarding

Assessment deliverable for the Halcyon Capital Partners SENTINEL programme.
Covers: problem understanding, stakeholder questions, technical decisions, what was deferred and why,
assumptions, AI process, quality approach, and architectural debrief answers.

---

## Problem understanding

Halcyon Capital Partners onboards wealth management clients across four branches (Mayfair, Canary Wharf,
Edinburgh, Aberdeen). Relationship Managers (RMs) record a risk assessment for each client; the
recorded tier must match what the regulatory rules compute. The existing `client_onboarding.csv`
contains ~46 records with known contradictions: misclassifications, missing RMs, KYC approvals
without ID verification, and at least one HIGH-risk client approved without Enhanced Due Diligence.

The prototype demonstrates:
1. Automated detection of those contradictions (findings engine).
2. A new-assessment flow that prevents the same contradictions from being introduced (intake form
   with live classification, EDD guard, Zod validation).
3. Compliance record-keeping that satisfies FCA attributability requirements.
4. An audit dashboard so compliance officers can track the state of the portfolio.

Two things are assessed separately: (a) the AI process (what was prompted, what was accepted, what
was rewritten), and (b) the quality approach (how correctness was verified). Both are documented here.

---

## Stakeholder questions

Questions I would raise before a production build:

**RM / Business**
- Is "SENTINEL" a single fixed ruleset or does each branch run a variant? (Drives whether `rulesets`
  table needs a `branch` partition key.)
- What is the intended UX when connectivity is lost mid-assessment? Should the form be blocked or
  should it queue locally and sync later?
- Is `assessedBy` always the currently logged-in RM, or can one RM submit on behalf of another?

**Head of Compliance**
- Which fields are mandatory for a record to be considered attributable under MLR 2017? (Currently
  modelled as: `assessedBy`, `assessedAt`, `attestation` triad — is that sufficient?)
- Should MISCLASSIFIED records be escalated to a workflow (e.g. re-review queue) or is surfacing
  them in the Findings view enough?
- Is `EDD_SIGN_OFF` a field that needs a second approver signature, or is the RM's own attestation
  sufficient for this prototype?

**Auditor**
- What is the retention period for compliance records? Does the prototype need a soft-delete /
  archive concept, or is append-only sufficient?
- Should the `explanation` field be stored verbatim, or is the `rulesetVersion` + rule hit list
  enough to reconstruct it?

**CTO / Engineering**
- Is Supabase already in the firm's approved vendor list, or do we need to evaluate an on-premise
  alternative?
- What is the expected concurrent user count per branch? (Drives whether Supabase free tier is
  sufficient for the pilot.)
- Are there existing Active Directory / SSO groups to map to the `assessedBy` field, or does the
  prototype ship with a placeholder?

---

## What was built

| Step | Feature |
|------|---------|
| 0 | WORKLOG infrastructure — `UserPromptSubmit` hook + `/worklog` skill |
| 1 | Vite + React 18 + TS strict + Tailwind v4 + jest-axe boilerplate |
| 2 | Domain core: `parseCsv`, `normalizeRow`, `classify` + `defaultRuleset`, `detectFindings`, MVP UI |
| 3 | Design system: Card, Field, Select, Button, StatusPill, Toast, AppShell, DesignSystemDemo |
| 4 | Rules engine hardening: TDD per-operator tests, configurability tests, `RulesetInspector` |
| 5 | `ClientsList`: sorting, filter, keyboard navigation, focus-restore, `aria-sort` |
| 6 | `IntakeForm`: EDD guard, live classification, Zod schema, business-rule guard |
| 7 | Supabase persistence: migration, RLS, `SupabaseComplianceRepository`, `IndexedDBComplianceRepository` stub, `AssessmentsList` |
| 8 | Audit dashboard KPIs: `computeKpis`, `computeBranchDistribution`, branch table |
| 9 | Findings engine: 6 independent detectors, golden-dataset fixtures, `FindingsPanel` with severity grouping |
| 10 | A11y & keyboard: Lighthouse 100/100, jest-axe 11 screens, keyboard E2E test |
| 11 | Build/lint clean, coverage numbers, this document |

**Not built (deferred, documented)**
- CSV parse-error surfacing for individual rows with formatting problems (scope: "Step 11 if needed"
  per plan; current `parseCsv` throws on file-level errors, row-level errors are silently dropped
  by `normalizeRow` returning `null`).
- Zod alignment on `fromRow` in `mapping.ts` — unsafe cast is acceptable for prototype since all
  data flows through `toInsertRow`; noted in step-7-review WORKLOG entry.
- Duplicate-on-retry protection — append-only design does not permit idempotent upsert without
  schema change; risk is extremely low in prototype context.
- Real authentication — `assessedBy` is a placeholder string; SSO/AD integration is out of scope.

---

## Assumptions

- CSV is a read-only legacy snapshot; new records come only through the intake form.
- Classification is always recomputable from stored inputs + ruleset version; storing the tier
  alone would be insufficient for compliance.
- `WITH CHECK(true)` on Supabase RLS INSERT is intentional for the prototype (no auth layer);
  a production build would add row-level user ID checks.
- "Current User" as `assessedBy` is a placeholder; production would inject the authenticated
  principal from the session.
- Tailwind v4 CSS-first `@theme` (no `tailwind.config.js`) is the correct approach for this stack.

---

## AI process

The entire implementation used Claude (Sonnet) via Claude Code CLI. The process was deliberately
transparent and documented in `WORKLOG.md` line by line.

**How it was used:**
- Each step was prompted with the plan AC + relevant context files. The AI generated a complete
  implementation attempt.
- Code reviews were run after every step using `/code-review` (a multi-agent code review skill).
  Each review surfaced confirmed bugs and plausible issues; all CONFIRMED findings were fixed
  before moving to the next step.
- The AI was not trusted blindly. Examples of what was accepted, rewritten, or rejected:

**Accepted as-is (AI got it right):**
- `nullsLastComparator` generic function and its 8 unit tests — correct on first attempt.
- Supabase migration SQL with 4 indexes and RLS policies.
- `computeKpis` and `computeBranchDistribution` — pure functions, verifiable against the CSV.
- `detectFindings` 6-detector decomposition — clean separation, matched TDD spec.
- Tailwind v4 `@theme` token structure.

**Rewritten after AI output:**
- `RawCsvRow` field names in step-1-review: AI used `nationality` instead of the actual CSV column
  `country_of_tax_residence`; required manual correction after code review surfaced the mismatch.
- `Dialog.tsx` focus management: initial implementation used `previousFocusRef` inside Dialog
  unmount, which raced with React's cleanup order. Rewritten to store trigger ref in `ClientsList`
  and call `triggerElementRef.current.focus()` in `closeDialog`.
- `evaluator.ts` 'in' operator: AI did not add `Array.isArray` guard; added after code review
  identified that a non-array ruleset value would crash the totality guarantee.
- `IntakeForm` live region placement: AI placed `aria-live` inside a step-conditional return;
  moved to component root so it persists across all form steps (code review CONFIRMED finding).
- `assessed_at` in `toInsertRow`: AI included it in the INSERT payload; removed after code review
  noted that server `DEFAULT now()` is the correct contemporaneous timestamp per MLR 2017.

**Rejected outright:**
- Adding Zod parsing to `fromRow` mapping — correct direction but out of scope for the prototype;
  documented as deferred.
- `role="button"` on `<tr>` — Lighthouse flagged a label-content-name-mismatch; the AI's first
  fix added a redundant ARIA role; replaced with `tabIndex={0}` + keyboard handler + sr-only span.

**Prompting technique:**
- Domain-first: types and tests prompted before components. This kept the AI focused on correctness
  before UI concerns.
- AC-anchored: each step prompt quoted the acceptance criteria verbatim, reducing hallucination of
  unrequested features.
- Code review as a forcing function: `/code-review` after each step produced structured findings
  that guided the next prompt (fix-list rather than open-ended "improve this").

---

## Quality approach

Every step had a test gate. No step was declared done until `npm run test -- --run` was green.

**Test categories and what they prove:**

| Category | Count | What it verifies |
|----------|-------|-----------------|
| Domain unit (rules engine) | ~50 | Every SENTINEL rule fires correctly for valid, null, and garbage inputs; totality guarantee (evaluator never throws) |
| Configurability | 3 | Same evaluator, two different rulesets → different tier; rules change without code deploy |
| Business-rule guard | 2 | HIGH + APPROVED without EDD is blocked at form submit and Zod schema levels |
| Golden-dataset findings | ~10 | CLT-005/017/031 MISCLASSIFIED, CLT-012/027/042 MISSING_RM, CLT-009/023 APPROVED_WITHOUT_ID, CLT-023 HIGH_RISK_APPROVED_WITHOUT_EDD — exact fixtures from the dirty CSV |
| False-positive guard | 1 | PENDING KYC without id_verification_date must NOT generate a finding |
| KPI selectors | ~8 | `computeKpis` and `computeBranchDistribution` results match hand-counted CSV values |
| Repository contract | ~5 | `InMemoryComplianceRepository` satisfies `ComplianceRepository` interface; no `update`/`delete` methods exist (append-only by type) |
| A11y (jest-axe) | 11 | 0 violations across all main screens |
| Keyboard integration | 6 | Full IntakeForm E2E keyboard-only completion; dialog focus-trap + restore; sort buttons via Enter |
| Component behaviour | ~200+ | Rendering, validation errors, state changes |

**Coverage (domain core — `src/domain/`):**

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|---------|----------|-------|
| csv/normalize.ts | 100% | 100% | 100% | 100% |
| csv/parse.ts | 100% | 91.7% | 100% | 100% |
| rules/evaluator.ts | 98.6% | 93.3% | 100% | 98.6% |
| rules/defaultRuleset.ts | 100% | 100% | 100% | 100% |
| validation/findings.ts | 100% | 100% | 100% | 100% |
| **Domain total** | **99.7%** | **97.3%** | **100%** | **99.7%** |

The single uncovered branch in `evaluator.ts` (line 37) is the `default` arm of the operator
switch — an unreachable guard that protects against future ruleset data containing unknown operators.
The single uncovered branch in `parse.ts` (line 8) is a BOM-stripping fallback path that only
triggers on files with a UTF-8 BOM byte.

**Lighthouse Accessibility:** 100/100 (headless Chrome, desktop, `--only-categories=accessibility`).
All automated audits passed. Logged in WORKLOG step-10 entry.

**Code reviews:** `/code-review` after every step, 10 reviews total. Each identified CONFIRMED
findings that were fixed before proceeding. The review of the rules engine + persistence layer
(steps 4 and 7) caught the most critical bugs: the `Array.isArray` guard on the 'in' operator
(totality breach) and the `assessed_at` server-DEFAULT fix (MLR 2017 compliance).

---

## Architectural debrief

### 1. Offline-first

The system is designed for branch environments where connectivity may be unreliable.

`ComplianceRepository` is a pure TypeScript interface with three methods: `save`, `list`, `findById`.
There is no `update` or `delete` — the interface is append-only by design, which maps to FCA
record-keeping requirements.

Three implementations:
- `InMemoryComplianceRepository` — used in tests and during development steps 2–6.
- `SupabaseComplianceRepository` — production path; activated when `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` are present in environment.
- `IndexedDBComplianceRepository` — offline stub (wired, not yet fully implemented). Its purpose
  is to demonstrate the pattern: write locally first, set `syncStatus: 'LOCAL'`, then sync in the
  background when connectivity is restored.

The `syncStatus` field (`'LOCAL' | 'SYNCED' | 'SYNC_FAILED'`) on every `ComplianceRecord` drives
the queue-and-flush design: the UI can show optimistic local state immediately, and a background
service worker or polling loop transitions records from `LOCAL` → `SYNCED` when the remote accepts
them. This pattern avoids blocking the RM's workflow on network availability.

### 2. Rules without deploy

The rules engine is data-driven. A `Ruleset` is a plain JSON object: `{ version, effectiveFrom,
rules: Rule[] }` where each `Rule` has `{ id, tier, conditions: Condition[] }` and each `Condition`
has `{ field, operator, value }`.

The evaluator (`evaluate(record, ruleset)`) interprets the ruleset at runtime. Changing which
countries trigger HIGH, adjusting the income threshold for MEDIUM, or adding a new HIGH condition
requires only editing the JSON — no code change, no deploy.

Three configurability tests prove this:
1. Adjust the income threshold from 500k to 100k → a previously MEDIUM client becomes MEDIUM.
2. Extend the HIGH-risk country list → a client previously classified LOW becomes HIGH.
3. Remove the PEP rule → a PEP client classified HIGH becomes MEDIUM.

In production, the `rulesets` table in Supabase stores versioned rulesets. `RulesetRepository`
fetches the active ruleset at runtime. Each `ComplianceRecord` stores `rulesetVersion` alongside
the inputs, so a past record can always be audited against the exact rules that were in force when
it was created.

### 3. FCA record-keeping

The `ComplianceRecord` type satisfies three FCA / MLR 2017 requirements:

- **Attributable** — `assessedBy: string` records who performed the assessment.
- **Contemporaneous** — `assessedAt` is set by the Supabase server `DEFAULT now()` at INSERT time,
  not by the client. This prevents clock skew and pre/post-dating.
- **Attested** — `attestation: { attestedBy, attestedAt, statement }` captures the RM's explicit
  confirmation that the assessment is accurate.

The repository interface has no `update` or `delete` methods. This is enforced both at the
TypeScript type level (the interface literally does not define them) and verified by a contract test:

```ts
it('interface has no update or delete methods (append-only by type)', () => {
  const repo = repository as unknown as Record<string, unknown>
  expect(repo['update']).toBeUndefined()
  expect(repo['delete']).toBeUndefined()
  expect(repo['deleteAll']).toBeUndefined()
})
```

Additionally, `assessmentData` stores a full snapshot of the inputs at assessment time, not just a
reference to the client record. If the client's data is later amended, the compliance record remains
a faithful snapshot of what the RM saw when they made the decision.

### 4. Multi-branch scale

The current prototype treats branch as a filter/display field. The architecture is designed to
scale to branch-level isolation:

- **Repository abstraction** — switching from a single Supabase table to per-branch views or
  schemas requires only a new `ComplianceRepository` implementation. The UI and domain core are
  unaffected.
- **Supabase RLS** — production RLS policies can add `WHERE branch = auth.jwt() ->> 'branch'` to
  partition records so that a Mayfair RM only sees Mayfair assessments.
- **Ruleset variants** — the `rulesets` table can store branch-specific rulesets. The `branch`
  column on `rulesets` (or a `branch_overrides` table) allows Edinburgh to run stricter thresholds
  without affecting London branches. The evaluator is unchanged; only the fetched ruleset differs.
- **KPI partitioning** — `computeBranchDistribution` already computes per-branch breakdowns from
  client data. Extending it to filter by authenticated branch is a one-line change.

The four-branch CSV (`Mayfair`, `Canary Wharf`, `Edinburgh`, `Aberdeen`) was used as a test fixture
to validate that the domain and UI handle multiple branches correctly from day one.
