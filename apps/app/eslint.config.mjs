import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/newline-after-import': ['error', { count: 1 }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],
    },
  },
  prettierConfig,
];
