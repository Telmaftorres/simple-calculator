import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Node.js CommonJS webhook server — not part of the Next.js app
    'webhook/**',
  ]),
  {
    rules: {
      // French app: apostrophes in JSX text are valid, not a bug
      'react/no-unescaped-entities': 'off',
    },
  },
])

export default eslintConfig
