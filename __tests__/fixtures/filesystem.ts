/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Helpers to create *real* `FileSystemEntry` objects, as they are handed to the
 * uploader when files are dropped or selected using `<input webkitdirectory>`.
 *
 * They are backed by the sandboxed filesystem of the browser (Chromium only),
 * so the entries behave exactly like the ones of a real drag-and-drop operation,
 * including quirks like `readEntries` only returning a limited number of entries per call.
 */

// `FileWriter` is part of the deprecated (but still implemented) filesystem API and thus not typed.
interface FileWriter {
	write(data: Blob): void
	onwriteend: (() => void) | null
	onerror: ((error: unknown) => void) | null
}

/**
 * Create a directory entry containing the given files in the sandboxed filesystem.
 *
 * @param files - Map of file paths (relative to the created directory) to their content
 * @return The entry of the newly created directory
 */
export async function createDirectoryEntry(files: Record<string, string>): Promise<FileSystemDirectoryEntry> {
	const filesystem = await new Promise<FileSystem>((resolve, reject) => {
		// 0 = window.TEMPORARY
		window.webkitRequestFileSystem(0, 32 * 1024 * 1024, resolve, reject)
	})

	// Use a unique name as the sandboxed filesystem is shared between tests
	const root = await getDirectory(filesystem.root as FileSystemDirectoryEntry, `test-${crypto.randomUUID()}`)
	for (const [path, content] of Object.entries(files)) {
		const segments = path.split('/')
		const name = segments.pop()!

		let directory = root
		for (const segment of segments) {
			directory = await getDirectory(directory, segment)
		}
		await writeFile(directory, name, content)
	}
	return root
}

/**
 * Get or create a sub directory of the given directory.
 *
 * @param parent - The parent directory
 * @param name - Name of the sub directory
 */
async function getDirectory(parent: FileSystemDirectoryEntry, name: string): Promise<FileSystemDirectoryEntry> {
	return await new Promise((resolve, reject) => parent.getDirectory(name, { create: true }, resolve, reject))
}

/**
 * Create a file with the given content inside the given directory.
 *
 * @param parent - The directory to create the file in
 * @param name - Name of the file
 * @param content - Content of the file
 */
async function writeFile(parent: FileSystemDirectoryEntry, name: string, content: string): Promise<void> {
	const entry = await new Promise<FileSystemFileEntry>((resolve, reject) => parent.getFile(name, { create: true }, resolve as FileSystemEntryCallback, reject))
	const writer = await new Promise<FileWriter>((resolve, reject) => (entry as unknown as { createWriter(success: (writer: FileWriter) => void, error: (error: unknown) => void): void }).createWriter(resolve, reject))
	await new Promise<void>((resolve, reject) => {
		writer.onwriteend = () => resolve()
		writer.onerror = reject
		writer.write(new Blob([content], { type: 'text/plain' }))
	})
}
