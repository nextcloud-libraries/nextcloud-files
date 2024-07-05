<!--
  - SPDX-FileCopyrightText: 2019-2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# @nextcloud/files
[![npm last version](https://img.shields.io/npm/v/@nextcloud/files.svg?style=flat-square)](https://www.npmjs.com/package/@nextcloud/files) [![REUSE status](https://api.reuse.software/badge/github.com/nextcloud-libraries/nextcloud-files)](https://api.reuse.software/info/github.com/nextcloud-libraries/nextcloud-files) [![Code coverage](https://img.shields.io/codecov/c/github/nextcloud-libraries/nextcloud-files?style=flat-square)](https://app.codecov.io/gh/nextcloud-libraries/nextcloud-files) [![Project documentation](https://img.shields.io/badge/documentation-online-blue?style=flat-square)](https://nextcloud-libraries.github.io/nextcloud-files/)

Nextcloud Files helpers for Nextcloud apps and libraries.

The `davGetClient` exported function returns a webDAV client that's a wrapper around [webdav's webDAV client](https://www.npmjs.com/package/webdav); All its methods are available here.

## Usage example

### Using WebDAV to query favorite nodes

```ts
import { davGetClient, davRootPath, getFavoriteNodes } from '@nextcloud/files'

const client = davGetClient()
// query favorites for the root folder (meaning all favorites)
const favorites = await getFavoriteNodes(client)
// which is the same as writing:
const favorites = await getFavoriteNodes(client, '/', davRootPath)
```

### Using WebDAV to list all nodes in directory

```ts
import {
    davGetClient,
    davGetDefaultPropfind,
    davResultToNode,
    davRootPath,
    davRemoteURL
} from '@nextcloud/files'

// Get the DAV client for the default remote
const client = davGetClient()
// which is the same as writing
const client = davGetClient(davRemoteURL)
// of cause you can also configure another WebDAV remote
const client = davGetClient('https://example.com/dav')

const path = '/my-folder/' // the directory you want to list

// Query the directory content using the webdav library
// `davRootPath` is the files root, for Nextcloud this is '/files/USERID', by default the current user is used
const results = client.getDirectoryContents(`${davRootPath}${path}`, {
    details: true,
    // Query all required properties for a Node
    data: davGetDefaultPropfind()
})

// Convert the result to an array of Node
const nodes = results.data.map((result) => davResultToNode(r))
// If you specified a different root in the `getDirectoryContents` you must add this also on the `davResultToNode` call:
const nodes = results.data.map((result) => davResultToNode(r, myRoot))
// Same if you used a different remote URL:
const nodes = results.data.map((result) => davResultToNode(r, myRoot, myRemoteURL))

```

### Using WebDAV to get a Node from a file's name

```ts
	import { davGetClient, davGetDefaultPropfind, davResultToNode, davRootPath } from '@nextcloud/files'
	import { emit } from '@nextcloud/event-bus'
	const client = davGetClient()
	client.stat(`${davRootPath}${filename}`, {
		details: true,
		data: davGetDefaultPropfind(),
	}).then((result) => {
		const node = davResultToNode(result.data)
		emit('files:node:updated', node)
	})
```
