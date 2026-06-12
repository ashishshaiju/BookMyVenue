import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores — must be a standalone object with only 'ignores' to act globally
  {
    ignores: ['dist/**', 'src/scripts/**', 'eslint.config.mjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked, // stricter than recommended
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // ── TypeScript strictness ──────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // ── Error handling ─────────────────────────────────
      '@typescript-eslint/only-throw-error': 'error',

      // ── General quality ────────────────────────────────
      'no-undef': 'off', // TS handles this
      'no-console': 'off', // use proper logger
      'no-debugger': 'error',
      'no-return-await': 'off', // use TS rule below
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      eqeqeq: ['error', 'always'],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
    },
  },

  // ── Per-file overrides (keep minimal, document why) ───
  {
    files: ['src/types/express.ts'],
    rules: {
      // declare global { namespace Express { ... } } is the only valid TypeScript
      // mechanism for augmenting Express Request types — namespace is required here.
      '@typescript-eslint/no-namespace': 'off',
    },
  }
);
