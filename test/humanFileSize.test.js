import { formatFileSize } from '../lib/humanfilesize'

describe('humanFileSize', () => {

    describe('formatFileSize', () => {

        let locale

        beforeEach(() => {
            locale = 'en'
            window.OC = {
                getLocale: () => locale,
            }
        })

        afterEach(() => {
            delete window.OC
        })

        it('renders file sizes with the correct unit', function () {
            const data = [
                [0, '0 B'],
                ["0", '0 B'],
                ["A", 'NaN B'],
                [125, '125 B'],
                [128000, '125 KB'],
                [128000000, '122.1 MB'],
                [128000000000, '119.2 GB'],
                [128000000000000, '116.4 TB']
            ]
            for (var i = 0; i < data.length; i++) {
                expect(formatFileSize(data[i][0])).toEqual(data[i][1]);
            }
        });
        it('renders file sizes with the correct unit for small sizes', function () {
            var data = [
                [0, '0 KB'],
                [125, '< 1 KB'],
                [128000, '125 KB'],
                [128000000, '122.1 MB'],
                [128000000000, '119.2 GB'],
                [128000000000000, '116.4 TB']
            ]
            for (var i = 0; i < data.length; i++) {
                expect(formatFileSize(data[i][0], true)).toEqual(data[i][1]);
            }
        });
        it('renders file sizes with the correct locale', function () {
            locale = 'de'
            const data = [
                [0, '0 B'],
                ["0", '0 B'],
                ["A", 'NaN B'],
                [125, '125 B'],
                [128000, '125 KB'],
                [128000000, '122,1 MB'],
                [128000000000, '119,2 GB'],
                [128000000000000, '116,4 TB']
            ]
            for (var i = 0; i < data.length; i++) {
                expect(formatFileSize(data[i][0])).toEqual(data[i][1]);
            }
        })
    })
})
