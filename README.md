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
cp .env.example .env             # holds the public demo credentials
npm test                         # API + UI
npm run test:api                 # API only
npm run test:ui                  # UI only
npm run test:headed              # UI with a visible browser
npm run typecheck                # TypeScript check, no tests run
npm run report                   # open the HTML report
```
If the browser download is skipped, run `npx playwright install chromium`.

**Workers:** the suite runs with one worker (`workers: 1`) because the OrangeHRM demo is a shared, slow public site.
Override with `npx playwright test --workers=4`.

**Optional runs**
```bash
RUN_A11Y=true npx playwright test --project=ui          # include accessibility (axe-core) scans
BROWSER=firefox npx playwright test --project=ui --grep @smoke   # run the ui project in another browser
CROSS_BROWSER=true npx playwright test --project=ui-firefox --project=ui-webkit   # smoke tests in Firefox and WebKit
```
Cross-browser runs need the extra browsers installed once: `npx playwright install firefox webkit`.
(On Windows PowerShell use `$env:RUN_A11Y="true"; npx playwright test --project=ui`.)

## Configuration

Copy .env.example to .env before the first run. The OrangeHRM credentials are required; the other values have defaults.

| Variable | Default | Purpose |
|---|---|---|
| `PETSTORE_BASE_URL` | `https://petstore.swagger.io/v2/` | API target |
| `ORANGEHRM_BASE_URL` | `https://opensource-demo.orangehrmlive.com/` | UI target |
| `ORANGEHRM_USERNAME` / `ORANGEHRM_PASSWORD` | none (required) | Public demo credentials, set in .env or as CI secrets |
| `BROWSER` | `chromium` | Browser used by the `ui` project (`chromium`, `firefox` or `webkit`) |
| `RUN_A11Y` | `false` | `true` runs axe-core accessibility scans |
| `CROSS_BROWSER` | `false` | `true` adds the `ui-firefox` and `ui-webkit` projects (`@smoke` tests only) |

## Reporting

- Console: `list` reporter
- HTML: `playwright-report/` (screenshots, video and trace attached on failures/retries; axe results attached as JSON)
- JUnit XML: `test-results/junit.xml`

## CI pipeline (GitHub Actions)

`.github/workflows/tests.yml`:
- **all-tests:** type check, then API + UI on Chromium for pushes and pull requests.
- **cross-browser:** UI on Chromium, Firefox and WebKit as a matrix (using `BROWSER`; Firefox and WebKit run `@smoke`
  tests only), run nightly and on manual trigger (Actions > tests > Run workflow, with an optional accessibility toggle).
- HTML reports are uploaded as run artifacts.

## Project layout

```
src/tests/api/       API tests (Petstore): pet.api.spec.ts
src/tests/ui/        UI tests (OrangeHRM): addEmployee.ui.spec.ts (positive journey), negativeTests.ui.spec.ts (login, add-user and PIM login-details validation)
src/pages/api/       PetClient (API client), petFactory (test-data builder), types
src/pages/ui/        Page objects: BasePage, LoginPage, DashboardPage, AdminPage, PimPage
src/fixtures/        Playwright fixtures (page objects, API client with cleanup)
src/data/            Test data and expected validation messages (JSON)
src/utils/           AxeUtils (accessibility wrapper)
src/config.ts        Environment-driven configuration
playwright.config.ts
```

---

# Test Design Explanation

## 1. Structure and patterns

| Concern | Choice | Why |
|---|---|---|
| Runner | Playwright Test (TypeScript) | One tool for API and UI, auto-waiting, tracing, built-in reporting |
| Separation | Separate projects for API and UI | Run and fail independently; different speed profiles in CI |
| UI | Page Object Model with a shared `BasePage` | Locators and interactions live in one place; common helpers (dropdowns, field lookup, data generators, validation checks) are reused by every page |
| Locators | Role, placeholder and text locators wherever the app exposes them; OrangeHRM's own CSS classes only for custom components with no accessible role (dropdowns, field errors, user menu, login switch), kept in `BasePage` and the page objects | Resilient to markup change where possible, and the fragile parts are isolated in one place |
| API | Client wrapper for the `/pet` resource | Tests state intent; the client owns paths, headers and cleanup |
| Data | Generated unique usernames, passwords (letters plus digits) and employee names; expected messages in JSON | No dependency on data that the shared demo may reset (one exception: the duplicate-username checks use the built-in `Admin` account); no hard-coded text in tests |
| Setup/teardown | Fixtures | API test data is removed even when a test fails |
| Assertions | Hard assertions in the functional tests; soft assertions only in the accessibility scan | A test stops at the first failure instead of continuing from a bad state; accessibility findings are reported without stopping the journey |
| Opt-in checks | Accessibility scans behind `RUN_A11Y`, extra browsers behind `CROSS_BROWSER` | Keeps the default run stable on a non-compliant demo app |

## 2. Scenarios implemented

### API: `/pet`
**Positive: create, retrieve, update, delete (smoke).** One lifecycle test proves the core contract end to end: POST
echoes the payload, GET returns the persisted state, `POST /pet/{id}` updates name and status and a second GET shows the
change, then DELETE succeeds and a follow-up GET returns 404. Verifying persistence and removal, not only each call's
status code, catches "accepted but not saved" defects.

**Negative:**
1. *Unknown id returns 404 with an error body*: checks the error contract, not just the status.
2. *Non-numeric id returns a 4xx*: path-input type validation.
3. *Malformed JSON returns a 4xx*: parser robustness; a 5xx would indicate unhandled exceptions.
4. *Update of an unknown id does not create the pet*: a follow-up GET must still return 404.

Petstore is a lenient public sandbox whose behaviour can differ from its Swagger spec. For the input-validation cases I
assert the behaviour that matters (a client error, never a 5xx or 200) rather than hard-coding a status that is not
guaranteed.

### UI: OrangeHRM
**Positive journey (smoke):** log in as admin and open PIM, create a fresh employee with login details (username and
password), add a system user for the same employee in Admin with a different username, log out, then log in with the
credentials created in PIM and confirm the dashboard loads. This verifies that a new account really works, not just that
the form saved. The employee is created in the test so it never depends on existing demo data.

**Negative: login.** Invalid password shows "Invalid credentials" and the user stays on the login page.

**Negative: add user validation (Admin).** One test with a separate step per rule, using hard assertions, resetting the
form between steps and logging what was shown:
1. Empty mandatory fields show "Required"; no user is created.
2. Password and confirm password differ.
3. Username already exists (uses the built-in `Admin` account).
4. Username and password too short.

**Negative: login details validation (PIM, Add Employee).** The same style, with the "Create Login Details" switch on:
1. Empty login details: username and password show "Required"; an empty confirm password shows "Passwords do not match"
   (asserted as the app behaves); no employee is created.
2. Password and confirm password differ.
3. Username already exists.
4. Username and password too short.
5. Password without a number is rejected.

**Non-functional:** an axe-core accessibility scan (opt-in) attaches violations to the report.

## 3. API layer vs UI layer

Test at the lowest layer that can prove the risk.
- **API:** business rules, validation, status codes, error contracts and permutations. Fast, stable, no rendering noise.
  Twenty invalid payloads cost seconds at this layer.
- **UI:** only what needs a browser: rendering, navigation, client-side behaviour, accessibility and a thin set of
  end-to-end journeys.
- **Setup via API, assert via UI:** creating the employee for the journey would ideally be an API call. The OrangeHRM
  demo's API is internal and undocumented, so the exercise creates it through the PIM form for reliability and records
  the API route as the improvement.
- **Authenticate once:** in a larger suite, reuse a stored login session (`storageState`) instead of logging in through
  the UI in every test; the login UI is tested once.
- **Lower still:** field-level rules (required, length, matching passwords) belong in unit or component tests. The UI
  keeps one case each to prove the wiring. Contract tests (Pact) between consumer and provider avoid full end-to-end runs
  for integration checks.

## 4. Additional scenarios (priority order)

### API (Petstore)
1. PUT /pet (full update): the form update through `POST /pet/{id}` is already covered, but PUT is the other core write
   path.
2. POST with missing required fields: the spec says they're required, so I'd check the API enforces it.
3. findByStatus with each valid status and an invalid one: tests filtering and validation.
4. Boundary ids and unusual input (zero, negative, very long names): common source of defects.
5. Schema/contract check on responses: catches breaking changes early.

### UI (OrangeHRM)
1. Admin-created user can log in: pin down the behaviour noted in section 5 before deciding what to assert.
2. Login with empty fields: client-side validation.
3. Disabled user cannot log in: checks the status is actually enforced.
4. Protected page redirects to login when logged out: session security.
5. Create an employee through the API, then find them in PIM search: faster setup, UI used only for the search.
6. Accessibility scan on key pages: cheap to add and relevant for a government service.

## 5. Trade-offs and challenges
- **Shared public services:** collisions, slowness and resets are possible. Mitigated with generated unique data, a
  single worker, CI retries, and trace/video on failure.
- **Redirect after re-login:** the app can send a user back to the last page the previous user viewed (here an Admin page,
  which an ESS user can’t open). The journey therefore asserts the user is    authenticated, then opens the dashboard
  from the menu.
- **External dependency in CI:** the pipeline calls the live Petstore and OrangeHRM sites, so an outage there can fail a
  build that has nothing wrong with it. In a real project I would run against a controlled test environment or mock
  third-party dependencies.
- **Two ways to create a user:** during development, a user created only through Admin > Add User (for an employee with
  no login details) could not log in on the demo, while one created through the PIM login-details switch could. I did not
  confirm the cause, so the journey logs in with the PIM credentials and the Admin form is covered by validation tests.
  In a real project I would raise this with the product owner. I deliberately do not assert on it.
- **No UI data cleanup:** employees and users created by the UI journey are not deleted, because the demo site is reset
  periodically. Against a real environment I would remove them through an API call in a fixture, as the API tests do.
- **Accessibility:** the demo app has known violations, so scans are opt-in and results are attached to the report rather
  than failing the default run. Automated scans find only part of WCAG issues; manual testing (for example with a screen
  reader) is still required.
- **Custom UI components:** OrangeHRM's dropdowns and autocompletes are not native elements, so they go through shared
  helpers instead of `selectOption`, and rely on the app's CSS classes where no accessible role exists.
- **Validation tests stop at the first failure:** the rules in each validation test are steps in one test, so a failing
  rule prevents the later ones from running. With more time I would make them a data-driven set of separate tests so that
  one failure does not hide the others.
- **Assertion strictness:** for input-validation cases I assert the contract that matters, not undocumented sandbox
  behaviour. Where the demo's message differs from what I expected, I assert what the app does and note it in the test.
- **Scope:** Only one API lifecycle, one happy path UI journey, and a small set of negatives, with the rest prioritised
  above.
