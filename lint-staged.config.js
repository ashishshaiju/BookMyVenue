// @ts-check

/**
 * Lint-staged configuration for BookMyVenue monorepo.
 *
 * Each sub-project has its own pattern and commands:
 * - ESLint runs only on the matched (staged) files
 * - TypeScript check runs on the full project when any TS file changes
 */
export default {
	// Client project — lint changed files only, full tsc
	"client/src/**/*.{ts,tsx}": [
		(files) => `pnpm --filter client exec eslint --max-warnings 0 ${files.join(" ")}`,
		() => "pnpm --filter client exec tsc --noEmit",
	],

	// Admin project — lint changed files only, full tsc
	"admin/src/**/*.{ts,tsx}": [
		(files) => `pnpm --filter admin exec eslint --max-warnings 0 ${files.join(" ")}`,
		() => "pnpm --filter admin exec tsc --noEmit",
	],

	// Server project — lint changed files only, full tsc
	"server/src/**/*.ts": [
		(files) => `pnpm --filter server exec eslint --max-warnings 0 ${files.join(" ")}`,
		() => "pnpm --filter server exec tsc --noEmit",
	],
};
