import { formatFileSize } from '../lib/humanfilesize'

declare global {
	interface Window {
		OC: any;
	}
}

describe('humanFileSize', () => {
    describe('formatFileSize', () => {
        it('renders file sizes with the correct unit', function() {
            const dataDecimal = [
                [0, '0 B'],
                ["0", '0 B'],
                ["A", 'NaN B'],
                [125, '125 B'],
                [125000, '125 KB'],
                [122100000, '122.1 MB'],
                [119200000000, '119.2 GB'],
                [116400000000000, '116.4 TB'],
                [116400000000000.0, '116.4 TB'],
                [113700000000000000.0, '113.7 PB'],
            ]
            const dataBinary = [
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
            for (var i = 0; i < dataDecimal.length; i++) {
                expect(formatFileSize(dataDecimal[i][0])).toEqual(dataDecimal[i][1])
            }
            for (var i = 0; i < dataBinary.length; i++) {
                expect(formatFileSize(dataBinary[i][0], false, true)).toEqual(dataBinary[i][1])
            }
        })

        it('renders file sizes with the correct unit for small sizes', function() {
            var dataDecimal = [
                [0, '0 KB'],
                [125, '< 1 KB'],
                [125000, '125 KB'],
                [122100000, '122.1 MB'],
                [119200000000, '119.2 GB'],
                [116400000000000, '116.4 TB'],
                [116400000000000.0, '116.4 TB'],
                [113700000000000000.0, '113.7 PB'],
            ]
            var dataBinary = [
                [0, '0 KiB'],
                [125, '< 1 KiB'],
                [128000, '125 KiB'],
                [128000000, '122.1 MiB'],
                [128000000000, '119.2 GiB'],
                [128000000000000, '116.4 TiB'],
                [128000000000000.0, '116.4 TiB'],
                [128000000000000000.0, '113.7 PiB'],
            ]
            for (var i = 0; i < dataDecimal.length; i++) {
                expect(formatFileSize(dataDecimal[i][0], true)).toEqual(dataDecimal[i][1])
            }
            for (var i = 0; i < dataBinary.length; i++) {
                expect(formatFileSize(dataBinary[i][0], true, true)).toEqual(dataBinary[i][1])
            }
        })

        it('renders file sizes with the correct locale', function() {
            document.documentElement.dataset.locale = 'de'
            const dataDecimal = [
                [0, '0 B'],
                ["0", '0 B'],
                ["A", 'NaN B'],
                [125, '125 B'],
                [125000, '125 KB'],
                [122100000, '122,1 MB'],
                [119200000000, '119,2 GB'],
                [116400000000000, '116,4 TB'],
                [116400000000000.0, '116,4 TB'],
                [113700000000000000.0, '113,7 PB'],
            ]
            const dataBinary = [
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
            for (var i = 0; i < dataDecimal.length; i++) {
                expect(formatFileSize(dataDecimal[i][0])).toEqual(dataDecimal[i][1])
            }
            for (var i = 0; i < dataBinary.length; i++) {
                expect(formatFileSize(dataBinary[i][0], false, true)).toEqual(dataBinary[i][1])
            }
        })
    })
})
