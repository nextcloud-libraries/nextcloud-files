module.exports = {
	clearMocks: true,
	collectCoverageFrom: ['lib/**/*.ts'],
	coveragePathIgnorePatterns: ['lib/utils/logger.ts'],
	testEnvironment: 'jsdom',
	preset: 'ts-jest/presets/js-with-ts',
	transformIgnorePatterns: [
		'node_modules',
	],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			tsconfig: '__tests__/tsconfig.json',
		}],
	},
}
