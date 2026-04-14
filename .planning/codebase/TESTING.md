# Testing Patterns

**Analysis Date:** 2026-04-14

## Test Framework

**Smart Contract Tests (Hardhat + Chai):**
- Runner: Hardhat with Mocha (built-in)
- Config: `projects/espacio-bosques/contracts/hardhat.config.ts`
- Assertion: Chai (`expect`) + hardhat-chai-matchers (`.to.be.revertedWith`, `.to.emit`)
- Status: 22/22 tests passing

**E2E / Smoke Tests (Playwright):**
- Runner: Playwright Test
- Config: `projects/espacio-bosques/frontend/playwright.config.ts`
- Assertion: Playwright's built-in `expect`

**Run Commands:**
```bash
# Smart contract tests
cd projects/espacio-bosques/contracts && npx hardhat test

# Playwright smoke tests
cd projects/espacio-bosques/frontend && npx playwright test

# No unit test runner for backend (no jest/vitest configured)
```

## Test File Organization

**Smart Contract Tests:**
- Location: `projects/espacio-bosques/contracts/test/`
- Co-located with contracts directory, separate `test/` folder
- Naming: `{ContractName}.test.ts`
- Files:
  - `projects/espacio-bosques/contracts/test/EscrowVault.test.ts`
  - `projects/espacio-bosques/contracts/test/CommunityToken.test.ts`
  - `projects/espacio-bosques/contracts/test/ProjectRegistry.test.ts`

**Playwright Tests:**
- Location: `projects/espacio-bosques/frontend/tests/`
- Naming: `{feature}.spec.ts`
- Files:
  - `projects/espacio-bosques/frontend/tests/smoke.spec.ts`

## Test Structure

**Smart Contract Suite Organization:**
```typescript
describe("ContractName", function () {
  // Typed variable declarations for contract instances and signers
  let token: CommunityToken;
  let owner: SignerWithAddress;

  // Constants for test data
  const INITIAL_SUPPLY = 1000000;

  // Shared setup — deploy contracts and configure roles
  beforeEach(async function () {
    [owner, validator1, ...] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ContractName");
    contract = await Factory.deploy(args);
  });

  // Nested describe blocks per feature area
  describe("Feature", function () {
    // Optional feature-specific beforeEach for state setup
    beforeEach(async function () { /* seed state */ });

    it("Should [expected behavior]", async function () {
      // Arrange (if needed beyond beforeEach)
      // Act
      // Assert with expect()
    });
  });
});
```

**Patterns:**
- `beforeEach` deploys fresh contract instances per test (full isolation)
- Nested `describe` blocks group by feature: "Deployment", "Deposits", "Release Voting", "Configuration"
- Test names start with "Should" — `it("Should allow deposits to projects")`
- Negative tests explicitly check revert messages: `await expect(...).to.be.revertedWith("message")`

**Playwright Suite Organization:**
```typescript
test.describe('Feature Name', () => {
  test('should [action]', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('selector')).toContainText('expected');
  });
});
```

## Mocking

**Smart Contract Tests:**
- No mocking framework — tests deploy real contracts to Hardhat's in-memory EVM
- `@nomicfoundation/hardhat-network-helpers` provides `time.increase()` for timelock simulation
- Multiple signers simulate different user roles (owner, validator, investor, recipient)

**Backend:**
- No mocking infrastructure detected
- No test files exist for the Express backend

**Playwright:**
- No request mocking — tests hit the live dev server
- Config uses `webServer` to auto-start: `command: 'yarn dev'`

## Fixtures and Factories

**Smart Contract Test Data:**
```typescript
// Constants defined at describe block level
const INITIAL_SUPPLY = 1000000;
const PROJECT_ID = 1;
const MILESTONE_ID = 1;

// Amounts use ethers.parseEther for wei conversion
const amount = ethers.parseEther("1000");
const depositAmount = ethers.parseEther("5000");
```

**Location:**
- Inline in test files — no shared fixture files or factory functions

## Coverage

**Requirements:** None enforced. No coverage tooling configured.

**Smart contract coverage available via:**
```bash
cd projects/espacio-bosques/contracts && npx hardhat coverage
```
(requires `solidity-coverage` plugin — check if installed in package.json)

## Test Types

**Unit Tests:**
- Smart contract tests function as unit tests — each contract tested in isolation with fresh deployments
- No unit tests for backend Express routes
- No unit tests for frontend React components

**Integration Tests:**
- Smart contract tests also serve as integration tests (EscrowVault tests deploy and interact with CommunityToken)
- No backend integration tests

**E2E Tests:**
- Playwright smoke tests cover basic navigation flows (4 tests)
- Scope: landing page load, dashboard navigation, project detail view, create project page
- Shallow — no form submissions, no authentication flows, no data mutations

## Common Patterns

**Async Testing (Hardhat):**
```typescript
it("Should emit event", async function () {
  await expect(contract.connect(signer).method(args))
    .to.emit(contract, "EventName")
    .withArgs(expected, values);
});
```

**Error Testing (Hardhat):**
```typescript
it("Should reject invalid input", async function () {
  await expect(
    contract.connect(signer).method(badArgs)
  ).to.be.revertedWith("ContractName: error message");
});

// For access control (no specific message):
await expect(
  contract.connect(unauthorized).method(args)
).to.be.reverted;
```

**Time Manipulation (Hardhat):**
```typescript
import { time } from "@nomicfoundation/hardhat-network-helpers";
await time.increase(86400); // advance 1 day for timelock tests
```

**Playwright Navigation:**
```typescript
test('should navigate', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('a[href="/path"]');
  await expect(page).toHaveURL('http://localhost:5173/path');
  await expect(page.locator('h1')).toContainText('Expected');
});
```

## Major Gaps

- **No backend tests** — Express routes in `projects/espacio-bosques/backend/src/routes/` have zero test coverage
- **No frontend component tests** — React components have no unit/integration tests (no Jest, Vitest, or React Testing Library configured)
- **No test infrastructure for MCP servers** — `mcp-servers/memory/index.js` has no tests
- **No test infrastructure for mercado-bot** — `projects/mercado-bot-dev/dashboard/` has no test files or config
- **No test infrastructure for brain-viewer** — `tools/brain-viewer/` has no tests
- **Playwright tests are smoke-level only** — cover navigation but not user flows, authentication, or data operations
- **Manual verification via Playwright MCP** is the primary QA method per CLAUDE.md, not automated test suites

---

*Testing analysis: 2026-04-14*
