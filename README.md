# QA Automation Framework: Playwright + TypeScript

API tests for the **Swagger Petstore** (`/pet` resource) and UI tests for **OrangeHRM**, in one project.

- [Setup and run](#setup-and-run)
- [Configuration](#configuration)
- [Reporting](#reporting)
- [CI pipeline](#ci-pipeline-github-actions)
- [Project layout](#project-layout)
- [Test Design Explanation](#test-design-explanation)

## Setup and run

**Prerequisites:** Node.js 18+ (20 recommended), npm, internet access (both applications are public demo sites).

```bash
npm install                      # installs dependencies and the Chromium browser
npm test                         # API + UI
npm run test:api                 # API only
npm run test:ui                  # UI only
npm run test:headed              # UI with a visible browser
npm run report                   # open the HTML report
```
If the browser download is skipped, run `npx playwright install chromium`.

**Sequential vs parallel:** the suite runs with one worker by default (`workers: 1`) because the OrangeHRM demo is a
shared, slow public site. Override with `npx playwright test --workers=4`.

**Optional runs**
```bash
RUN_A11Y=true npx playwright test --project=ui        # include accessibility (axe-core) scans
CROSS_BROWSER=true npx playwright test --project=ui-firefox
CROSS_BROWSER=true npx playwright test --project=ui-webkit
```
(On Windows PowerShell use `$env:RUN_A11Y="true"; npx playwright test --project=ui`.)

## Configuration

All values are optional; defaults are built in. Override with environment variables (see `.env.example`).

| Variable | Default | Purpose |
|---|---|---|
| `PETSTORE_BASE_URL` | `https://petstore.swagger.io/v2/` | API target (keep the trailing slash) |
| `ORANGEHRM_BASE_URL` | `https://opensource-demo.orangehrmlive.com/` | UI target |
| `ORANGEHRM_USERNAME` / `ORANGEHRM_PASSWORD` | `Admin` / `admin123` | Public demo credentials |
| `RUN_A11Y` | `false` | `true` runs axe-core accessibility scans |
| `CROSS_BROWSER` | `false` | `true` enables Firefox and WebKit UI projects |

## Reporting

- Console: `list` reporter
- HTML: `playwright-report/` (screenshots, video and trace attached on failures/retries; axe results attached as JSON)
- JUnit XML: `test-results/junit.xml`

## CI pipeline (GitHub Actions)

`.github/workflows/tests.yml`:
- **all-tests:** API + UI on Chromium for every push and pull request.
- **cross-browser:** UI on Chromium, Firefox and WebKit as a matrix, run nightly and on manual trigger
  (Actions > tests > Run workflow, with an optional accessibility toggle).
- HTML reports are uploaded as run artifacts.

## Project layout

<!-- Adjust the folder names below to match your repository. -->
```
tests/api/       API tests (Petstore)
tests/ui/        UI tests (OrangeHRM)
pages/ui/        Page objects: BasePage, LoginPage, DashboardPage, AdminPage, PimPage
fixtures/        Playwright fixtures (page objects, API client with cleanup)
data/            Test data and expected validation messages (JSON)
utils/           AxeUtils (accessibility wrapper)
config.ts        Environment-driven configuration
playwright.config.ts
```

---

# Test Design Explanation

## 1. Structure and patterns

| Concern | Choice | Why |
|---|---|---|
| Runner | Playwright Test (TypeScript) | One tool for API and UI, auto-waiting, tracing, built-in reporting |
| Separation | Separate projects for API and UI | Run and fail independently; different speed profiles in CI |
| UI | Page Object Model with a shared `BasePage` | Locators and interactions live in one place; common helpers (dropdowns, field lookup, data generators) are reused |
| Locators | Role, placeholder and label-scoped locators, no positional CSS | Resilient to markup change; readable |
| API | Client wrapper for the `/pet` resource | Tests state intent; the client owns paths, headers and cleanup |
| Data | Generated unique usernames, passwords and employee names; messages in JSON | No dependency on data that the shared demo may reset; no hard-coded text in tests |
| Setup/teardown | Fixtures | Cleanup runs even when a test fails |
| Assertions | Hard assertions for the journey; soft assertions for independent validation checks | A failed validation does not hide the others |
| Opt-in checks | Accessibility scans behind `RUN_A11Y`, cross-browser behind `CROSS_BROWSER` | Keeps the default run stable on a non-compliant demo app |

## 2. Scenarios implemented

### API: `/pet`
**Positive: create, retrieve, delete (smoke).** One lifecycle test proves the core contract end to end: POST echoes the
payload, GET returns the persisted state, DELETE succeeds and a follow-up GET returns 404. Verifying persistence and
removal, not only each call's status code, catches "accepted but not saved" defects.

**Negative:**
1. *Unknown id returns 404 with an error body*: checks the error contract, not just the status.
2. *Non-numeric id returns a 4xx*: path-input type validation.
3. *Malformed JSON returns a 4xx*: parser robustness; a 5xx would indicate unhandled exceptions.

Petstore is a lenient public sandbox whose behaviour can differ from its Swagger spec. I assert the behaviour that matters
(a client error, never a 5xx or 200) rather than hard-coding a status that is not guaranteed.

### UI: OrangeHRM
**Positive journey (smoke):** log in, create a fresh employee, add a system user for that employee with a generated
username and password, log out, then log in as the new user and reach the dashboard. This verifies that the account works,
not just that the form saved. The employee is created in the test so it never depends on existing demo data.

**Negative: login.** Invalid password shows "Invalid credentials" and the user stays on the login page.

**Negative: add user validation.** One test with a separate step per rule, using soft assertions and logging what was shown:
1. Empty mandatory fields show "Required"; no user is created.
2. Password and confirm password differ.
3. Username already exists.
4. Username and password too short.

**Non-functional:** an axe-core accessibility scan (opt-in) attaches violations to the report.

## 3. API layer vs UI layer

Test at the lowest layer that can prove the risk.
- **API:** business rules, validation, status codes, error contracts and permutations. Fast, stable, no rendering noise.
  Twenty invalid payloads cost seconds at this layer.
- **UI:** only what needs a browser: rendering, navigation, client-side behaviour, accessibility and a thin set of
  end-to-end journeys.
- **Setup via API, assert via UI:** creating the employee for the Add User journey would ideally be an API call. The
  OrangeHRM demo's API is internal and undocumented, so the exercise creates it through the PIM form for reliability and
  records the API route as the improvement.
- **Authenticate once:** in a larger suite, reuse a stored login session (`storageState`) instead of logging in through
  the UI in every test; the login UI is tested once.
- **Lower still:** field-level rules (required, length, matching passwords) belong in unit or component tests. The UI
  keeps one case each to prove the wiring. Contract tests (Pact) between consumer and provider avoid full end-to-end runs
  for integration checks.

## 4. Additional scenarios (priority order)

### API (Petstore)
| # | Scenario | Type | Rationale |
|---|---|---|---|
| 1 | PUT /pet updates fields; GET reflects the change | + | Core mutation path |
| 2 | POST with missing required fields (`name`, `photoUrls`) | - | Spec says required; sandbox is lenient, so this documents a defect |
| 3 | GET /pet/findByStatus for each status; invalid status | +/- | Filter correctness, enum validation |
| 4 | Boundary ids (0, negative, int64 max), long strings, unicode names | - | Input-boundary defects |
| 5 | Response schema or Pact contract validation | + | Detects breaking changes early |
| 6 | Idempotency: repeated DELETE/PUT, duplicate POST | +/- | Retry safety |
| 7 | Form update and uploadImage (wrong content type, oversized file) | +/- | Remaining endpoints |
| 8 | Injection strings; missing or invalid `api_key` on DELETE | - | Sanitisation and authorisation |
| 9 | Response-time smoke threshold; concurrent writes | NFR | Early performance and consistency signal |

### UI (OrangeHRM)
| # | Scenario | Type | Rationale |
|---|---|---|---|
| 1 | Login with empty fields shows "Required" | - | Client-side validation |
| 2 | Disabled user cannot log in | - | Status enforcement |
| 3 | New user with wrong password cannot log in | - | Credential check |
| 4 | Logged-out access to a protected URL redirects to login | - | Session security |
| 5 | Create employee via API, then find it in PIM search | + | Setup via API, assert via UI |
| 6 | PIM: add employee with missing or duplicate data | - | Validation and uniqueness |
| 7 | Role-based access: ESS user cannot see Admin menu | +/- | Permissions |
| 8 | Login with SQL/XSS characters | - | Input handling, no error leakage |
| 9 | Job titles: list, add, delete | + | CRUD list verification |
| 10 | Mobile viewport smoke | NFR | Responsive behaviour |

## 5. Trade-offs and challenges
- **Shared public services:** collisions, slowness and resets are possible. Mitigated with generated unique data, own
  test data per run, a single worker, CI retries, and trace/video on failure.
- **Accessibility:** the demo app has known violations, so scans are opt-in and results are attached to the report rather
  than failing the default run. Automated scans find only part of WCAG issues; manual testing (for example with a screen
  reader) is still required.
- **Custom UI components:** OrangeHRM's dropdowns and autocompletes are not native elements, so they go through shared
  helpers instead of `selectOption`.
- **Assertion strictness:** I assert the contract that matters, not undocumented sandbox behaviour.
- **Scope:** one hour of work, so one API lifecycle, one UI journey, and a small set of negatives, with the rest
  prioritised above.
