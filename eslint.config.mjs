/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts']
  }
];

export default config;
