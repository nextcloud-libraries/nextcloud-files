import { createLibConfig } from '@susnux/nextcloud-vite-config'

export default createLibConfig({
	index: 'lib/index.ts',
}, {
	libraryFormats: ['es', 'cjs'],
})
