export default {
  'client/**/*.{ts,tsx}': () => 'npm run lint -w client',
  'server/**/*.ts': () => 'npm run lint -w server',
};
