# SENTINEL Onboarding — CLAUDE.md

## Project

SPA prototype for client onboarding risk classification (Halcyon Capital Partners, SENTINEL programme).
Core flow: RM logs an assessment → system computes risk classification against SENTINEL rules →
captures a compliance record. Data loaded from `client_onboarding.csv` (~46 records, 4 branches).

Assessment task. Two things are evaluated **separately**: (1) AI process/usage, (2) quality approach.
Log everything meaningful in `WORKLOG.md` as you go.

## Stack

- **Vite + React 18 + TypeScript (strict)** — SPA
- **Tailwind v4** — CSS-first `@theme`, NOT v3 `tailwind.config.js`
- **Vitest + Testing Library + jest-axe** — tests
- **Supabase** — persistence behind `ComplianceRepository` (MCP integration)
- **Zod** — form validation / data normalisation

## Architecture — key principles

1. **Pure domain core** in `src/domain/` — no React/Supabase imports. Fully isolated and testable.
2. **Rules engine as data** (`Ruleset/Rule/Condition`), not code. Changing rules = editing JSON.
   Debrief asks "rules change without code deploy" — the data-driven `Ruleset` + configurability test answers this.
3. **Repository abstraction** (`ComplianceRepository` interface) over Supabase. Steps 2–6 use
   `InMemoryComplianceRepository`; Supabase swaps in at step 7 with no UI changes.
4. **CSV = read-only legacy data** (we audit it); new RM assessments = writable clean data (we write it).
5. **Classification is always recomputable** — store input snapshot + rulesetVersion, never the tier alone.

## Folder structure

```
src/
  domain/          # PURE TS — model/, rules/, validation/, csv/
  data/            # repositories/ (interfaces + impls), supabase/client.ts
  features/        # clients-list/, intake/, audit/, findings/
  ui/              # tokens.ts + components/
  app/             # routing, providers, layout shell
  lib/             # formatters, selectors, hooks
  test/            # fixtures (CSV slice, mocks)
```

## Domain types (key)

- `RawCsvRow` — all fields `string | undefined`
- `ClientRecord` — normalised; invalid fields → `null`; `source: 'CSV_IMPORT' | 'INTAKE'`
- `ClassificationResult` — `tier` + `hits: RuleHit[]` + `decidingHits` + `rulesetVersion` + `explanation`
- `Finding` — `code` (`MISCLASSIFIED` | `MISSING_RM` | `APPROVED_WITHOUT_ID_VERIFICATION` | ...) + `severity`
- `ComplianceRecord` — writable; `assessmentData` snapshot + `assessedBy` + `assessedAt` + `attestation` + `syncStatus`

## SENTINEL classification rules

**HIGH** (any): `pep_status=TRUE` | `sanctions_screening_match=TRUE` | `adverse_media_flag=TRUE` |
country in {Russia, Belarus, Venezuela}

**MEDIUM** (no HIGH, any): `client_type=ENTITY` | country in {Brazil, Turkey, South Africa, Mexico,
UAE, China} | (`annual_income > 500 000` AND `source_of_funds` in {Inheritance, Gift, Other})

**LOW**: neither HIGH nor MEDIUM triggers apply

Evaluator fires ALL rules, returns highest tier. Evaluator is TOTAL — never throws; null input → non-match.

> HIGH-risk clients require Enhanced Due Diligence (EDD). The intake form must block submitting
> HIGH + APPROVED without EDD sign-off — preventing the exact contradictions present in the CSV.

## Dirty data — known contradictions (test fixtures & findings)

| client_id | Issue |
|---|---|
| CLT-005, CLT-017, CLT-031 | Recorded risk contradicts computed (PEP/country → HIGH, recorded LOW) |
| CLT-012, CLT-027, CLT-042 | Missing `relationship_manager` (attributability gap) |
| CLT-009, CLT-023 | `kyc_status=APPROVED` without `id_verification_date` |
| CLT-023 | HIGH risk + APPROVED without EDD |

These rows are regression test fixtures. When a user loads the CSV, dirty rows must be surfaced
visually in the clients list (not silently hidden). Error-state handling for unparseable rows is scoped to Step 11.

## Testing strategy

- **vitest** — all tests; `npm run test` must be green after every step
- Domain unit tests first (rules engine, normalize, findings) — TDD on steps 2, 4, 9
- Component tests (Testing Library) — behaviour, keyboard, states
- **jest-axe** — 0 a11y violations on every screen
- `npm run test:coverage` — domain coverage tracked; cited in APPROACH.md as quality evidence
- Tests co-located (`*.test.ts` / `*.test.tsx`) + fixtures in `src/test/`

Per-step test requirements: [.claude/INSTRUCTIONS-TESTS.md](.claude/INSTRUCTIONS-TESTS.md)

## Halcyon brand

| Token | Hex | Usage |
|---|---|---|
| Primary | `#1B2A4A` | Header, primary buttons, nav |
| Primary Light | `#3D5A80` | Hover states, secondary headings |
| Success | `#2D6A4F` | Approved / LOW risk |
| Warning | `#E09F3E` | Borders/icons only — fails contrast as text |
| Error | `#9B2226` | Rejected, HIGH risk, errors |
| Neutral | `#6B7280` | Muted text, disabled |
| Background | `#F8F9FA` | Page background |
| Card | `#FFFFFF` | Card surfaces |
| Text | `#1F2937` | Body text |

Font: **Inter** (Google Fonts). Layout: iPad landscape 1024×768. Cards: 8px radius,
`0 1px 3px rgba(0,0,0,0.08)` shadow. Spacing: 16px gap, 24px page padding.
Touch targets: **min 44×44px** — required on all interactive elements.

## A11y requirements

- Full keyboard operability (no mouse required for any flow)
- Focus trap + restore in all drawers/dialogs
- `aria-live="polite"` for live classification changes and toasts
- Semantic landmarks, skip-link
- WCAG AA contrast on all text/bg pairs
- Lighthouse Accessibility ≥ 95

## Workflow rules

- `WORKLOG.md` is auto-updated by `UserPromptSubmit` hook on every prompt.
- Use `/worklog` skill for manual decision/quality/AI-usage entries.
- `/code-review` after every step diff — result logged in WORKLOG.
- **Git is managed by the user — do NOT run any git commands.**
- Implementation plan: `.claude/plans/client-onboarding-csv-candidate-instruc-glistening-wigderson.md`

## Debrief topics (be ready to discuss)

1. **Offline-first** — `ComplianceRepository` interface + `IndexedDBRepository` stub + `syncStatus` field;
   optimistic write + background sync pattern; branch connectivity unreliable → queue-and-flush design.
2. **Rules without deploy** — data-driven `Ruleset` JSON, versioned + fetched at runtime from Supabase
   `rulesets` table; configurability proven by test (same evaluator, two rulesets → different tier).
3. **FCA record-keeping** — append-only records, `assessedBy`+`assessedAt`+`attestation` triad
   (attributable / contemporaneous / attested per MLR 2017 / SYSC); no UPDATE/DELETE in repository interface.
4. **Multi-branch scale** — same domain core; branch as filter/partition; Supabase RLS per branch;
   `rulesets` table enables per-jurisdiction rule variants without code changes.
