# Coding Conventions

**Analysis Date:** 2026-04-14

## Naming Patterns

**Files:**
- TypeScript/React components: PascalCase (`Dashboard.tsx`, `CreateProject.tsx`, `Navbar.tsx`) in `projects/espacio-bosques/frontend/src/`
- Backend route files: lowercase singular (`auth.ts`, `projects.ts`, `simulation.ts`) in `projects/espacio-bosques/backend/src/routes/`
- Utility/middleware files: camelCase (`errorHandler.ts`, `rateLimiter.ts`, `logger.ts`)
- Plain JS files: camelCase (`markets.js`, `kelly.js`, `positions.js`) in `projects/mercado-bot-dev/dashboard/src/`
- Shell scripts: kebab-case (`setup-and-run.sh`, `stop-services.sh`, `test-api.sh`)
- Config files: lowercase with dots (`vite.config.ts`, `hardhat.config.ts`, `postcss.config.js`)

**Functions:**
- camelCase throughout: `generateEmbedding()`, `formatResults()`, `createError()`
- Express route handlers: anonymous async arrow functions `async (req, res) => {}`
- React components: PascalCase function names matching file names

**Variables:**
- camelCase for locals: `statusCode`, `releaseAmount`, `depositAmount`
- UPPER_SNAKE_CASE for constants: `INITIAL_SUPPLY`, `PROJECT_ID`, `MILESTONE_ID`, `VECTOR_DIMS`
- Env vars accessed via `process.env.VARIABLE_NAME`

**Types:**
- PascalCase interfaces with descriptive names: `AppError`, `SignerWithAddress`
- Interface extension pattern: `export interface AppError extends Error { statusCode?: number; }`

## Code Style

**Formatting:**
- No shared Prettier or ESLint config at the venture-os root level
- Individual sub-projects may have their own (espacio-bosques frontend has `postcss.config.js`, `tailwind.config.js`)
- Double quotes for strings in TypeScript backend files
- Single quotes in MCP server JS files and frontend imports
- Semicolons used consistently in TypeScript; used in JS files too
- 2-space indentation throughout

**Linting:**
- No global linter configured at the monorepo level
- No `.eslintrc`, `.prettierrc`, or `biome.json` at root
- Each sub-project manages its own tooling independently

## Import Organization

**Order (TypeScript backend — e.g., `projects/espacio-bosques/backend/src/index.ts`):**
1. Framework imports (`express`, `cors`, `helmet`, `morgan`, `dotenv`)
2. Generated clients (`@prisma/client`)
3. Local utilities (`./utils/logger`, `./middleware/errorHandler`)
4. Route modules (`./routes/auth`, `./routes/projects`)

**Order (Solidity tests — e.g., `projects/espacio-bosques/contracts/test/EscrowVault.test.ts`):**
1. Test framework (`chai`, `hardhat`)
2. Hardhat helpers (`@nomicfoundation/hardhat-network-helpers`)
3. Generated types (`../typechain-types`)
4. Hardhat signer types (`@nomicfoundation/hardhat-ethers/signers`)

**Order (MCP servers — e.g., `mcp-servers/memory/index.js`):**
1. MCP SDK imports
2. External SDK clients (`@supabase/supabase-js`)

**Path Aliases:**
- None detected. All imports use relative paths (`../`, `./`)

## Error Handling

**Backend Express pattern (used in all route files):**
```typescript
// Each route handler wraps its body in try/catch
router.get("/", async (req: Request, res: Response) => {
  try {
    // ... business logic
    res.json({ data });
  } catch (error: any) {
    logger.error("Failed to [action]", { error: error.message });
    res.status(500).json({ error: "Failed to [action]" });
  }
});
```
- Errors are caught per-handler, not propagated to the global error handler
- Global `errorHandler` middleware exists at `projects/espacio-bosques/backend/src/middleware/errorHandler.ts` but route handlers swallow errors before it runs
- `createError()` factory function available but not widely used in route files

**Validation pattern:**
```typescript
if (!requiredField) {
  return res.status(400).json({ error: "Missing required fields" });
}
```
- Manual field validation, no schema validation library (no Zod, Joi, etc.)

**MCP server pattern:**
```javascript
if (error) throw new Error(`Supabase insert error: ${error.message}`)
```
- Errors thrown as plain `Error` with prefixed messages

**Smart contract tests:**
```typescript
await expect(action).to.be.revertedWith("EscrowVault: error message");
```

## Logging

**Framework:** Winston (`projects/espacio-bosques/backend/src/utils/logger.ts`)

**Configuration:**
- Production: `info` level, JSON format, file transports only
- Development: `debug` level, adds colorized console transport
- Service meta: `{ service: "espacio-bosques-backend" }`
- File outputs: `logs/error.log` (errors only), `logs/combined.log` (all)

**Patterns:**
- Use `logger.info()` for successful operations with structured context: `logger.info("Project created", { projectId, title })`
- Use `logger.error()` for failures with error message and relevant IDs: `logger.error("Failed to fetch project", { error: error.message, id: req.params.id })`
- Morgan HTTP request logging piped through Winston: `morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } })`

**Other sub-projects:** Use `console.log` / `console.error` directly (mercado-bot, brain-viewer, MCP servers)

## Comments

**When to Comment:**
- JSDoc-style block comments before Express route handlers: `/** GET /api/projects — Get all projects */`
- File-level doc block at top of MCP server files explaining purpose and tools
- Inline comments for non-obvious logic in test files

**JSDoc/TSDoc:**
- Light usage. Route handlers get a brief `/** */` block with HTTP method and path
- No param/return annotations on functions

## Function Design

**Size:** Route handlers are self-contained, typically 20-40 lines including error handling

**Parameters:** Express handlers always typed `(req: Request, res: Response)`. Utility functions use plain parameters.

**Return Values:** Express handlers return via `res.json()` or `res.status().json()`. Always return `{ error: "message" }` for errors, `{ entityName: data }` for success.

## Module Design

**Exports:**
- Backend routes: `export default router` (default export of Express Router)
- Utilities: named exports (`export const logger`, `export const errorHandler`, `export const createError`)
- MCP servers: no exports (entry point scripts)

**Barrel Files:**
- Not used anywhere in the codebase

**Express app pattern:**
- Singleton Prisma client exported from `index.ts`: `export const prisma = new PrismaClient()`
- Routes imported and mounted with `app.use("/api/path", routeModule)`

---

*Convention analysis: 2026-04-14*
