import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LUCIDE_RESTRICTION = {
  name: 'lucide-react',
  message: 'Use the shared Icon atom (@/presentation/shared/atoms/Icon) instead.',
};

const INFRASTRUCTURE_RESTRICTION = {
  group: ['@/infrastructure/*', '@/application/*'],
  message:
    'UI code talks to hooks only. Services come from a feature context; repositories are wired in contexts/.',
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Data-flow rule: Component -> Hook -> Service (context) -> Repository -> IHttpClient.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'HTTP goes through IHttpClient (infrastructure/utils/http).' },
      ],
      'no-restricted-imports': ['error', { paths: [LUCIDE_RESTRICTION] }],
    },
  },
  {
    // Pages, organisms, molecules, atoms and layouts may not reach past the hooks.
    files: [
      'src/presentation/**/pages/**',
      'src/presentation/**/organisms/**',
      'src/presentation/**/molecules/**',
      'src/presentation/**/atoms/**',
      'src/presentation/**/layouts/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [LUCIDE_RESTRICTION], patterns: [INFRASTRUCTURE_RESTRICTION] },
      ],
    },
  },
  {
    // The single place allowed to import lucide-react.
    files: ['src/presentation/shared/atoms/Icon/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // The single place allowed to call fetch.
    files: ['src/infrastructure/utils/http/**'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    // Context files export a provider and its accessor hook together (composition root).
    files: ['src/presentation/**/contexts/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  }
);
