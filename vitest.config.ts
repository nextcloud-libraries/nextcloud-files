import config from './vite.config'

export default async (env) => {
	const cfg = await config(env)
	// Node externals does not work when testing
	cfg.plugins = cfg.plugins!.filter((plugin) => plugin && plugin.name !== 'node-externals')

	cfg.test = {
		environment: 'jsdom',
		coverage: {
			include: ['lib/**'],
			exclude: ['lib/utils/logger.ts'],
			provider: 'istanbul',
			reporter: ['lcov', 'text'],
		},
	}
	delete cfg.define
	return cfg
}
