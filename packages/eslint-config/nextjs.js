/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    './index.js',
    'next/core-web-vitals',
    'prettier',
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
