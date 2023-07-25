import { nodeResolve } from '@rollup/plugin-node-resolve'
import clean from '@rollup-extras/plugin-clean'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'

import packageJson from './package.json' assert { type: 'json' }

// Map package dependencies to regex matching modules that should be externalized
const external = Object.keys(packageJson.dependencies).map(dep => new RegExp(`^${dep}`))

const config = output => ({
	input: './lib/index.ts',
	external,
	plugins: [
		nodeResolve(),
		typescript({
			compilerOptions: output.format === 'cjs'
				? { target: 'es5' }
				: {},
		}),
		commonjs(),
		clean(),
	],
	output: [output],
})

export default [
	{
		dir: 'dist',
		format: 'es',
		sourcemap: true,
	},
	{
		file: 'dist/index.cjs',
		format: 'cjs',
		sourcemap: true,
	},
].map(config)
