import { createLibConfig } from '@nextcloud/vite-config'

export default createLibConfig({
	index: 'lib/index.ts',
}, {
	libraryFormats: ['es', 'cjs'],
	nodeExternalsOptions: {
		// Force bundle pure ESM module
		exclude: ['is-svg'],
	},
})
