# WORKLOG — SENTINEL Onboarding

> Live process log. Written **during** the work, not reconstructed after the fact.
> Automatic entries (`- [timestamp] prompt: ...`) are appended by the `UserPromptSubmit` hook
> on every input. Manual decision entries are added via the `/worklog` skill.
> Consolidated into `APPROACH.md` at the end of the project.

Project: SPA prototype for client onboarding risk classification (Halcyon Capital Partners / SENTINEL programme).
Stack: Vite + React + TypeScript (strict) + Tailwind v4 + Supabase (behind repository abstraction).

---

## Process — prompt chronology

<!-- AUTO: hook appends a summary of each user input here -->
- [2026-06-03 21:54] prompt: add a live preview link to README — sentinel-onboarding-peach.vercel.app
- [2026-06-03 21:42] prompt: README.md — add architecture diagram, block-diagrams, screenshots of main pages in a table
- [2026-06-03 21:34] prompt: execute Step 11 — Final polish + deliverables
- [2026-06-03 21:27] prompt: execute Step 10 with /web-design-guidelines skill
- [2026-06-03 21:20] prompt: execute Step 10 (a11y & keyboard hardening)
- [2026-06-03 21:09] prompt: execute Step 9 — Findings engine
- [2026-06-03 21:02] prompt: execute Step 8 — Audit dashboard / KPI
- [2026-06-03 20:41] prompt: additionally validate the app and test via Chrome DevTools
- [2026-06-03 20:36] prompt: proceed with Step 7 — Persistence (Supabase behind repository)
- [2026-06-03 20:22] prompt: Step 6 /code-review
- [2026-06-03 20:14] prompt: execute Step 6 — Intake form with live classification
- [2026-06-03 20:05] prompt: Step 5 /code-review
- [2026-06-03 19:58] prompt: execute Step 5 — Client list from CSV + contradiction highlighting
- [2026-06-03 19:54] prompt: fix critical issues
- [2026-06-03 19:45] prompt: mark Step 3 as complete
- [2026-06-03 19:41] prompt: yes (confirm worklog entries)
- [2026-06-03 19:32] prompt: execute Step 3
- [2026-06-03 19:27] prompt: launch the project and check in the browser
- [2026-06-03 19:14] prompt: Step 2 /code-review
- [2026-06-03 18:31] prompt: execute Step 2

> Entries marked `[retro]` below were reconstructed manually — they relate to prompts made BEFORE the hook was active (Step 0).

- [retro #1] Develop an implementation plan: each step is a separate feature; step 1 = boilerplate setup, step 2 = first MVP, then design system separately, then features one by one.
- [retro #2] Build an SPA prototype for client onboarding risk assessment in wealth management (core flow: RM logs assessment → system computes classification against regulatory rules → captures compliance record). App loads data from client_onboarding.csv (~46 records, 4 branches).
- [retro #3] Review sentinel-v2-problem-statement.md and extract AC (acceptance criteria) for each major block.
- [retro #4] Use the /business-analyst skill and produce a step-by-step plan. Questions: what is mandatory (Must-Have)? stack? required features? Plan with mobile-first approach and validation at each step, a11y audit. Is keyboard operability required?
- [retro #5] Plan as a document with checkboxes.
- [retro #6] Pick a skill for each step.
- [retro #7] AC for each step.
- [retro #8] Code Review in each step.
- [retro #9] Important: two things are evaluated separately — my process (how I used AI: what I prompted, what I accepted, what I rewrote) and my quality approach (how I verified the app works correctly). Process logs are part of the deliverable and part of the evaluation. Keep WORKLOG.md as we go. Proposal: skill + hook that writes a summary on each input to WORKLOG automatically (no CLAUDE.md bloat, no token waste). Repository: github.com/Kotkoa/sentinel-onboarding.git. Ask questions on underspecified areas.
- [retro #10] Run /worklog skill and retroactively add all prior prompts from this chat.

---

## AI-usage — how AI was used

> What I prompted, what I accepted as-is, what I rewrote and why. Filled in as we go + manual `/worklog` entries.

---

## Quality — quality approach

> How I verified the app works correctly: tests, code reviews, a11y audits, manual checks, CSV cross-checks.

- [step-0] Hook `worklog-prompt.sh` tested on 4 cases (regular prompt, slash command, empty input, malformed JSON) — all exit=0, no noise in chat, multi-line prompt collapsed into a single line under AUTO marker. `/worklog` skill and `UserPromptSubmit` hook registered in `.claude/settings.local.json`. Step 0 AC complete.
- [step-1] `npm run test:run` — 2/2 green (sanity + CSV fixture). `npm run build` — TS check + vite build clean. `npm run lint` — 0 errors, 0 warnings. Strict TS flags: strict, noUncheckedIndexedAccess, noUnusedLocals/Parameters, noImplicitReturns. Tailwind v4 @theme with Halcyon tokens. jest-axe wired via setup.ts.
- [step-1-review] Code review found 2 blockers: `RawCsvRow` fields didn't match actual CSV column names (country_of_tax_residence, risk_classification, documentation_complete — no nationality). Fixed. Also: lazy Supabase init, .gitignore covers .env.*, coverage thresholds 80%, eslint ecmaVersion 2022. All 3 checks green after fixes.
- [step-2] 164/164 tests green. TDD: tests written first (parse/normalize/evaluator), then implementation. `frontend-developer` skill generated full MVP: parseCsv, normalizeRow, classify+defaultRuleset, ClientsList, IntakeForm (with business-rule guard HIGH+APPROVED→block), AuditDashboard, FindingsPanel, KPI selectors. Fixed 8 TS strict errors (noUncheckedIndexedAccess in tests, unused imports, type overlap in evaluator). Build + lint clean.
- [step-2-review] Code review found 2 critical + 5 significant issues. All fixed: (1) top-level await fetch → useEffect in AppShell; (2) double `as unknown as Record` in evaluator → Condition.field: keyof ClientRecord; (3) static id="dialog-title" → useId(); (4) duplicate loadCsvClients in 3 files → src/test/helpers.ts; (5) `undefined as unknown as number` → direct setFormData; (6) Record<string,string> → Record<FindingCode,string>. 164/164 after fixes.
- [step-2-browser] Browser validation of step 2: (1) Clients — 46/46 rows, CLT-005/017/031 with Mismatch badge; (2) Drawer CLT-005 — Computed=HIGH vs Recorded=LOW, 2 CRITICAL findings; (3) IntakeForm — live classification HIGH on PEP=Yes (aria-live working); (4) EDD guard — submit HIGH+APPROVED blocked with error alert; (5) Audit Dashboard — 46 total, 39% HIGH, 14 findings, branch distribution correct; (6) Findings — 14 CRITICAL, benchmark clients CLT-005/009/012/017/023/027/031/039 present. Console: 0 errors.
- [step-3] 210/210 tests green. New components: Card, Field (with hint/error/required), DataTable (generic), StatusPill (5 variants), Toast+ToastContainer (auto-dismiss, aria-live). AppShell extracted to src/app/AppShell.tsx. Demo page /design-system: all primitives, colour tokens, typography, interactive examples (dialog, toasts). Build clean (TS strict). jest-axe 0 violations on each component.
- [step-3-review] Code review found 7 CONFIRMED findings. All fixed: (1) Toast dismiss button 24px → min-h-11 min-w-11 (44px); (2) AppShell `<p>` → `<h1>` — h1 now present on all routes; (3) Toast error-variant role="status" → role="alert" + aria-live="assertive"; (4) repository from module scope → useRef inside component (HMR-safe); (5) Field + Select id from label.replace() → useId() (no collisions); (6) Field + Select removed redundant role="alert" on error-span (duplicated aria-describedby); (7) dead toastId removed. 210/210 after fixes.
- [step-4] 257/257 tests green. TDD: 47 new tests. (1) evaluator.step4.test.ts — per-operator (eq/in/gt/gte on valid, null, garbage inputs), totality, AND-compound short-circuit, 3 configurability tests (threshold, country extension, rule removal); (2) BundledRulesetRepository + 5 tests (4 HIGH, 3 MEDIUM, compound 2-condition); (3) RulesetInspector — read-only table of active ruleset by tier, version, effectiveFrom, operator and condition value formatting, /rules route in nav; (4) Card extended with aria-label/aria-labelledby for correct section semantics. Build clean.
- [step-4-review] Code review found 2 CONFIRMED + 3 PLAUSIBLE. Fixed critical: (1) evaluator.ts 'in' branch — added Array.isArray guard before .some(); without it a ruleset with non-array value broke totality guarantee and crashed the entire classification; (2) RulesetInspector useEffect — added .catch() + cancelled-flag for cleanup; without .catch() any rejected promise left isLoading=true forever, the "Failed to load" branch was unreachable. 258/258 after fixes.
- [step-5] 273/273 tests green. Step 5 extended ClientsList from step 2: (1) nullsLastComparator in src/lib/sort.ts — 8 unit tests; (2) sorting on 5 columns (clientId/branch/computedTier/onboardingDate/findingsCount) with aria-sort + SortableHeader; (3) focus-restore on drawer close — triggerElementRef + closeDialog callback; (4) 7 new tests (sorting ×5, focus management ×2). Non-trivial fix: Dialog unmount races useEffect cleanup — previousFocusRef in Dialog.tsx didn't have time to fire; solution — store trigger ref in ClientsList and call focus explicitly in closeDialog.
- [step-5-review] Code review found 5 CONFIRMED + 5 PLAUSIBLE. All CONFIRMED fixed: (1) TIER_ORDER asc = HIGH first (semantically wrong) → LOW=0/MEDIUM=1/HIGH=2 + constant moved to module level; (2) Badge didn't forward aria-label → added to BadgeProps + forwarded; (3) filterSectionId useId() created but never used → removed; (4) empty-state div remounted on filter→0 — live region wasn't announced → replaced with persistent sr-only role="status" aria-live="polite" above the table; (5) TIER_ORDER inside render — allocation on every render → moved to module level. 273/273 after fixes.
- [step-6] 300/300 tests green. Step 6 improved IntakeForm from step 2: (1) EDD notice — when HIGH live-classification, role="alert" appears explaining that senior sign-off is required; (2) forced kycStatus switch to ENHANCED_DUE_DILIGENCE via useEffect + reset to PENDING when risk drops below HIGH; (3) APPROVED removed from KYC-select options when HIGH; (4) persistent sr-only aria-live="polite" moved to section root above all step-conditionals (always in DOM); (5) intakeSchema.test.ts — 21 Zod unit tests (valid/invalid inputs, defence-in-depth guard documentation, alignment with normalize.ts); (6) keyboard-flow test (full path to attestation without mouse); (7) jest-axe 0 violations on initial/errors/attestation/HIGH states; (8) Button moved outside role="status" in success-step (buttons must not be inside live regions).
- [step-6-review] Code review found 5 CONFIRMED + 2 PLAUSIBLE. All CONFIRMED fixed: (1) submit-guard removed → restored in handleSubmit (defence-in-depth) + unit test documents the gap; (2) test gap on guard → test added; (3) aria-live in form-step-only return → moved to section root (now persistent across all steps); (4) `_` in destructuring → renamed to `_omitted`; (5) useEffect didn't reset KYC on risk decrease → else-branch added. From PLAUSIBLE: Button inside role="status" → moved outside. 300/300 after fixes.
- [step-7-browser] Browser validation via Chrome DevTools MCP: (1) Clients — 46/46 rows, CLT-005 drawer: Computed=HIGH/Recorded=LOW, 2 CRITICAL findings correct; (2) Intake — Russia → live HIGH + EDD notice + KYC=EDD auto-switch + APPROVED removed from options; (3) Full LOW-client submit → Attestation → "Assessment recorded"; (4) Supabase INSERT confirmed via execute_sql (UUID, assessed_at server-default, sync_status=SYNCED); (5) Assessments page shows record with ✓ Synced. Found and fixed: `id: 'CR-${Date.now()}'` → `crypto.randomUUID()` (Supabase UUID constraint), try/catch in handleAttest (form froze on error), createRepository() guard for graceful fallback without .env. Lighthouse a11y: first run = 97 (2 violations: text-primary-light low contrast, label-content-name-mismatch on tr[role=button]). Fixed: subtitle→text-white/75, role=button removed from tr + sr-only span + tests updated. Second run = 100/100. 0 console errors.
- [step-7] 318/318 tests green. Migration `sentinel_compliance_records` applied via MCP (4 indexes: client_id/assessed_at/tier/branch). RLS enabled: SELECT=public, INSERT=public with-check-true (sufficient for a prototype without auth). `get_advisors` — only WARN for the SENTINEL table: `anon_insert_compliance_records` WITH CHECK(true) — expected for a prototype without auth. `SupabaseComplianceRepository` (INSERT+SELECT via Supabase client), `IndexedDBComplianceRepository` (offline-first stub for debrief), `mapping.ts` (domain↔row round-trip without leaking DB types). Contract test runs against InMemoryRepository (CI-safe). AppShell switched from InMemory→Supabase. `AssessmentsList` — separate /assessments route, visually distinct from CSV data (SyncBadge: SYNCED/LOCAL/SYNC_FAILED). `InMemoryComplianceRepository.list()` fixed: returns desc by assessedAt (contract test caught the discrepancy). Manual verification: INSERT via MCP execute_sql passed, assessed_at set by server.

---

## Decisions — key decisions

> Architectural and product decisions with rationale. Appended via `/worklog <text>`.

- [setup] Stack Vite+React+TS+Tailwind v4; Supabase behind `ComplianceRepository`; rules engine as data (data-driven), not code. Steps 2–6 on InMemoryRepository, Supabase in step 7.
- [setup] Process is evaluated separately → Step 0 = worklog infrastructure (hook + skill) before any code starts.
- [testing] Tests (vitest) are a mandatory part of EVERY step, derived from AC, and lock down business logic. A cross-cutting "Testing strategy" section added to the plan + a Testing(vitest) block in each step. Key business tests: golden-dataset findings (CLT-005/017/031 etc.), rules engine configurability (rules change without code deploy), business-rule guard in intake form (cannot submit HIGH+APPROVED without EDD), KPI cross-check with CSV. Domain steps (2,4,9) follow TDD.
- [step-1] Boilerplate created manually (npm create vite doesn't work in a non-empty directory). Chose esbuild over terser as minifier — terser is not bundled in vite v6, esbuild is sufficient for a prototype. vitest.config.ts uses mergeConfig+vite.config.ts to resolve vitest/vite Plugin type conflict.
- [step-7-review] Code review found 2 CONFIRMED + 4 PLAUSIBLE. All CONFIRMED fixed: (1) mapping.ts — `assessed_at` removed from toInsertRow, now the server DEFAULT now() sets the timestamp (MLR 2017 contemporaneous fix); (2) IntakeForm catch — save error no longer lands in errors.kycStatus, separate saveError state with role="alert" banner added. PLAUSIBLE fixed: AssessmentsList useEffect — added localRecords.length to deps for re-fetch when a new record arrives (React Router doesn't unmount the component). Left as PLAUSIBLE: tr without role (Lighthouse 100, axe clean, real AT risk documented); mapping.ts unsafe casts — data is written only by this app via toInsertRow, Zod to add in step 11 if needed; duplicate on retry — extremely rare scenario, append-only design doesn't allow idempotent upsert without schema change.
- [step-8] Audit dashboard / KPI implemented. computeKpis + computeBranchDistribution in lib/kpiSelectors.ts (pure functions). KPIs from CSV: 46 clients, 18 HIGH (39%), 14 findings, 9 clients with findings, 7% missing RM. Branch distribution across 4 branches with hardcoded expected numbers in tests (cross-checked against manual CSV count). AuditDashboard: KPI cards, branch table with tfoot totals, conditional audit log (only when complianceRecords present). 323/323 tests green. Lighthouse Accessibility 100/100.
- [step-9-review] Code review found 1 CONFIRMED + 3 PLAUSIBLE. Fixed: (1) CONFIRMED — duplicate `aria-label="Compliance findings"` on all severity tables replaced with `aria-label={severity + " compliance findings"}` + redundant `<caption>` removed; (2) PLAUSIBLE — row key `clientId-code-index` → `clientId-code-field??description` (stable when same code appears for different fields); (3) PLAUSIBLE — `detectInvalidValues` push-pattern → early-return (consistent with other detectors). Left as PLAUSIBLE: clientType absent from REQUIRED_FIELDS (evaluator is null-safe → no wrong classification, only a gap in the audit trail). Added to WORKLOG for step 11: Zod schema alignment + full REQUIRED_FIELDS coverage. REFUTED: falsy check on relationshipManager — normalize.ts parseStringOrNull guarantees null, "" is impossible. 339/339 after fixes.
- [step-9] Findings engine complete (TDD). detectFindings refactored into 6 independent pure detectors. Added MISSING_REQUIRED_FIELD (required fields: client_name, country, kyc_status, onboarding_date → severity WARNING) and INVALID_VALUE (negative annualIncome → WARNING). Golden-dataset tests: CLT-005/017/031 MISCLASSIFIED, CLT-012/027/042 MISSING_RM, CLT-009/023 APPROVED_WITHOUT_ID_VERIFICATION, CLT-023 HIGH_RISK_APPROVED_WITHOUT_EDD. False-positive guard: PENDING without id_verification → not a finding. FindingsPanel updated with grouping by severity (CRITICAL→WARNING→INFO), sections with h3 headings. 339/339 tests green.
- [step-10] A11y & keyboard hardening complete. Lighthouse Accessibility: 98/100 (desktop, headless Chrome, isolated context, navigation mode). jest-axe 0 violations on all 11 screens: ClientsList, ClientsList-empty, IntakeForm, AuditDashboard×2 (empty + with records), FindingsPanel×2, RulesetInspector, AssessmentsList×2. a11y.test.tsx expanded from 6→11 tests (added RulesetInspector, AuditDashboard with complianceRecords, AssessmentsList empty/with-records). keyboard-flow.test.tsx extended: ClientsList row (Enter/Space), filter-selects via Tab, sort-buttons (Enter→aria-sort), dialog focus-trap + focus-restore, IntakeForm full end-to-end keyboard flow to attestation. AppShell contains skip-link, landmark roles (header/nav/main), aria-live="polite" on live-classification, focus-restore after dialog close. 363/363 tests green (28 test files).
- [step-11] Final polish complete. Fixed all TypeScript/lint errors: `within` unused import (FindingsPanel.test.tsx, keyboard-flow.test.tsx), `_omitted` unused destructuring (intakeSchema.test.ts), `item: unknown` in sort.test.ts (explicit types added), `branch?: string|null` → `branch: string|null` in mapping.test.ts (two tests), `ComplianceRepository as Record<string,unknown>` → cast via `unknown` in contract test. `npm run build` green, `npm run lint` 0 errors, `npm run test -- --run` 363/363 green (28 test files). Domain core coverage: statements 99.7%, branches 97.3%, functions 100%, lines 99.7%. APPROACH.md written (problem understanding, stakeholder questions, what was built/deferred, assumptions, AI process, quality approach, 4 debrief topics). README.md written (setup, env, CSV, scripts, architecture).
