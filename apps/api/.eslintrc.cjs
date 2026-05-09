module.exports = {
  root: true,
  extends: ['@repo/eslint-config/nestjs.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
