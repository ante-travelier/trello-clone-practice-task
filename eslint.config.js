// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      '**/playwright-report/**',
      '**/screenshots/**',
      'server/src/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  // Allow _-prefixed parameters to be unused (e.g. Express error-handler _next,
  // or destructured params where only some are needed).
  {
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['server/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Vitest globals for client test files
  {
    files: ['client/**/__tests__/**/*.{js,jsx}', 'client/**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.vitest },
    },
  },
];
