import { createRequire } from 'module'
import type { RollupOptions, Plugin } from 'rollup'

const require = createRequire(import.meta.url)

const commonjs = require('@rollup/plugin-commonjs') as () => Plugin
const { nodeResolve } = require('@rollup/plugin-node-resolve') as {
  nodeResolve: (options?: { preferBuiltins?: boolean }) => Plugin
}
const typescript = require('@rollup/plugin-typescript') as (options?: {
  exclude?: string[]
}) => Plugin

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    typescript({
      exclude: ['**/__tests__/**', '**/__fixtures__/**']
    }),
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs()
  ]
} as RollupOptions
