import { formatFileSize } from '../lib/humanfilesize'

declare global {
	interface Window {
		OC: any;
	}
}

describe('humanFileSize', () => {
    describe('formatFileSize', () => {
        it('renders file sizes with the correct unit', function() {
            const data = [
                [0, '0 B'],
                ["0", '0 B'],
                ["A", 'NaN B'],
                [125, '125 B'],
                [128000, '125 KiB'],
                [128000000, '122.1 MiB'],
                [128000000000, '119.2 GiB'],
                [128000000000000, '116.4 TiB'],
                [128000000000000.0, '116.4 TiB'],
                [128000000000000000.0, '113.7 PiB'],
            ]
            for (var i = 0; i < data.length; i++) {
                expect(formatFileSize(data[i][0])).toEqual(data[i][1])
            }
        })

        it('renders file sizes with the correct unit for small sizes', function() {
            var data = [
                [0, '0 KiB'],
                [125, '< 1 KiB'],
                [128000, '125 KiB'],
                [128000000, '122.1 MiB'],
                [128000000000, '119.2 GiB'],
                [128000000000000, '116.4 TiB'],
                [128000000000000.0, '116.4 TiB'],
                [128000000000000000.0, '113.7 PiB'],
            ]
            for (var i = 0; i < data.length; i++) {
                expect(formatFileSize(data[i][0], true)).toEqual(data[i][1])
            }
        })

        it('renders file sizes with the correct locale', function() {
            document.documentElement.dataset.locale = 'de'
            const data = [
                [0, '0 B'],
                ["0", '0 B'],
                ["A", 'NaN B'],
                [125, '125 B'],
                [128000, '125 KiB'],
                [128000000, '122,1 MiB'],
                [128000000000, '119,2 GiB'],
                [128000000000000, '116,4 TiB'],
                [128000000000000.0, '116,4 TiB'],
                [128000000000000000.0, '113,7 PiB'],
            ]
            for (var i = 0; i < data.length; i++) {
                expect(formatFileSize(data[i][0])).toEqual(data[i][1])
            }
        })
    })
})
