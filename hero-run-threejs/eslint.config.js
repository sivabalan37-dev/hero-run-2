export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly', matchMedia: 'readonly',
        AudioContext: 'readonly', webkitAudioContext: 'readonly', setTimeout: 'readonly',
        clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
        performance: 'readonly', console: 'readonly', URL: 'readonly', ResizeObserver: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error', 'no-unreachable': 'error', 'no-constant-condition': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'], curly: ['error', 'multi-line'],
    },
  },
];