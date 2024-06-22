const eslintPluginPrettier = require('eslint-plugin-prettier');
const prettierConfigs = require('eslint-plugin-prettier').configs;

module.exports = [
  {
    ignores: ['node_modules/**', 'api/**'],
  },
  {
    files: ['**/*.js', '**/*.jsx'], // Adjust the file patterns if needed
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...prettierConfigs.recommended.rules,
      'prettier/prettier': 'error',
    },
  },
];
