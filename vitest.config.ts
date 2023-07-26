import config from './vite.config'

export default async (env) => {
	const cfg = await config(env)
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
