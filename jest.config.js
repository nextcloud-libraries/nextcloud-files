module.exports = {
	clearMocks: true,
	collectCoverageFrom: ['lib/**/*.ts'],
	coveragePathIgnorePatterns: ['lib/utils/logger.ts'],
	testEnvironment: 'jsdom',
	preset: 'ts-jest/presets/js-with-ts',
	globals: {
		'ts-jest': {
			tsconfig: '__tests__/tsconfig.json',
		},
	},
	transformIgnorePatterns: [
		'node_modules/(?!(abcde|fghij)/)',
	],
}
