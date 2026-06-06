// ESLint flat config (ESLint 9). Type-aware linting for the TS source.
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.cjs', 'legacy/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './tsconfig.json', sourceType: 'module' },
      globals: {
        window: 'readonly', document: 'readonly', location: 'readonly', localStorage: 'readonly',
        indexedDB: 'readonly', crypto: 'readonly', console: 'readonly', fetch: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
        requestAnimationFrame: 'readonly', getComputedStyle: 'readonly', URL: 'readonly', Blob: 'readonly',
        FileReader: 'readonly', TextEncoder: 'readonly', IDBValidKey: 'readonly', IDBDatabase: 'readonly',
        IDBObjectStore: 'readonly', IDBRequest: 'readonly', IDBTransactionMode: 'readonly',
        HTMLElement: 'readonly', HTMLInputElement: 'readonly', HTMLCanvasElement: 'readonly',
        HTMLTextAreaElement: 'readonly', HTMLSelectElement: 'readonly', HTMLButtonElement: 'readonly',
        Event: 'readonly', File: 'readonly', confirm: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },
  {
    // Tests may use non-null assertions on values they have just created.
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  prettier,
];
