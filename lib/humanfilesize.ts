import { getLanguage } from '@nextcloud/l10n'

const humanList = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatFileSize(size: number, skipSmallSizes: boolean = false): string {

	// Calculate Log with base 1024: size = 1024 ** order
	let order = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
	// Stay in range of the byte sizes that are defined
	order = Math.min(humanList.length - 1, order);
	const readableFormat = humanList[order];
	let relativeSize = (size / Math.pow(1024, order)).toFixed(1);
	if (skipSmallSizes === true && order === 0) {
		if (relativeSize !== "0.0") {
			return '< 1 KB';
		} else {
			return '0 KB';
		}
	}
	if (order < 2) {
		relativeSize = parseFloat(relativeSize).toFixed(0);
	} else if (relativeSize.substr(relativeSize.length - 2, 2) === '.0') {
		relativeSize = relativeSize.substr(0, relativeSize.length - 2);
	} else {
		relativeSize = parseFloat(relativeSize).toLocaleString(getLanguage());
	}
	return relativeSize + ' ' + readableFormat;
}
