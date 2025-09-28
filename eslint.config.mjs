import typescriptEslint from '@typescript-eslint/eslint-plugin'
import jest from 'eslint-plugin-jest'
import prettier from 'eslint-plugin-prettier'
import _import from 'eslint-plugin-import'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import js from '@eslint/js'

export default [
  {
    ignores: ['**/coverage', '**/dist', '**/node_modules']
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: {
      prettier: prettier,
      import: _import
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser
      },
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index'
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      jest: jest,
      prettier: prettier,
      import: _import
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index'
          ]
        }
      ]
    }
  },
  {
    files: ['**/__fixtures__/**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },
  {
    files: ['**/streaming-base64.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },
  {
    files: ['rollup.config.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
]
