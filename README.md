# next-rest

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme) [![license](https://img.shields.io/github/license/joeltg/next-rest)](https://opensource.org/licenses/MIT) [![NPM version](https://img.shields.io/npm/v/next-rest)](https://www.npmjs.com/package/next-rest) ![TypeScript types](https://img.shields.io/npm/types/next-rest)

Typesafe REST APIs for Next.js.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [Defining runtime types](#defining-runtime-types)
  - [Augmenting the API module](#augmenting-the-api-module)
  - [Exporting the route handler](#exporting-the-route-handler)
  - [Using the API client](#using-the-api-client)
  - [Error handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Background

This library is a framework for writing **end-to-end** typesafe JSON REST APIs for Next.js in TypeScript.

Features:

- **Modularity**. Instead of making you define all of your route types in one place, next-rest uses module augmentation so that you can declare each route's type in their own respective file. All of the logic for an API route `/api/foo/bar` is contained in the `/pages/api/foo/bar.ts` page.
- **Minimalism**. The client API is 150 lines and just calls `fetch` like you'd expect. next-rest has one non-dev dependency on [http-status-codes](https://www.npmjs.com/package/http-status-codes). All validation happens on the server; using next-rest won't cause your validation library to get bundled into the client.
- **Safety**: next-rest lets you write APIs where the URL parameters, request headers, request body, response headers, and response body are all (!!) strongly typed for each combination of route and method. All of your API calls get typechecked at compile-time by TypeScript _and_ validated at runtime on the server.

Limitations:

- **JSON-only**. next-rest is JSON-only.
- **Internal use only**. next-rest is designed for implementing and calling REST APIs **within** a single Next.js application. You can't export your API types, or import a different project's API types. If _that's_ what you're after, you probably want something like [restyped](https://github.com/rawrmaan/restyped/).
- Requires TypeScript 4.4+, Next.js 12+, and React 17+

## Install

```
npm i next-rest
```

## Usage

There are four basic steps. Most of the work happens inside the API route pages - once you've set those up right, you can just `import api from "next-rest/client"` from any client page or component and things will work like magic.

### Defining runtime types

next-rest is designed to be used in conjunction with a validation library like [io-ts](https://github.com/gcanti/io-ts), [runtypes](https://github.com/pelotom/runtypes), or [zod](https://github.com/vriad/zod). Anything that supports a) static type inference and b) gives you [type predicates](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) for your types will work. The code samples here use io-ts.

Let's write a route `/api/widgets/[id]` that supports `GET` and `DELETE` methods. The first thing we have to do is make io-ts codecs for our request headers and response bodies. For methods that don't accept content in the request body, we'll use `t.void`.

```ts
// pages/api/widget/[id].ts

import * as t from "io-ts"

const getRequestHeaders = t.type({ accept: t.literal("application/json") })
const getRequestBody = t.void

const deleteRequestHeaders = t.type({ "if-unmodified-since": t.string })
const deleteRequestBody = t.void
```

These serve as "runtime representations" of types. We also need type-level versions of those types, which we can get with the `t.TypeOf` utility type.

```ts
// pages/api/widget/[id].ts

type GetRequestHeaders = t.TypeOf<typeof getRequestHeaders>
type GetRequestBody = t.TypeOf<typeof getRequestBody>
type DeleteRequestHeaders = t.TypeOf<typeof deleteRequestHeaders>
type DeleteRequestBody = t.TypeOf<typeof deleteRequestBody>
```

Lastly, we need types for our response headers and response bodies. These don't need to be validated at runtime (since it's the server that sends them), so we can just write them as normal TypeScript types.

```ts
// pages/api/widget/[id].ts

type GetResponseHeaders = {
	"content-type": "application/json"
	"last-modified": string
}

type GetResponseBody = {
	id: string
	isGizmo: boolean
}

type DeleteResponseHeaders = {}

type DeleteResponseBody = void
```

### Augmenting the API module

The central problem in designing a end-to-end typesafe API is finding a way to share types between server and client code without sharing anything else (ie without accidentally bundling actual server code into the client). We do this with next-rest by augmenting the `API` type in the `next-rest/api` module inside every API route page. These augmentations get merged and the client code in `next-rest/client` is able to access the merged API type by also importing `next-rest/api`.

```ts
// pages/api/widget/[id].ts

declare module "next-rest/api" {
	interface API {
		"/api/widgets/[id]": Route<{
			GET: {
				request: {
					headers: GetRequestHeaders
					body: GetRequestBody
				}
				response: {
					headers: GetResponseHeaders
					body: GetResponseBody
				}
			}
			DELETE: {
				request: {
					headers: DeleteRequestHeaders
					body: DeleteRequestBody
				}
				response: {
					headers: DeleteResponseHeaders
					body: DeleteResponseBody
				}
			}
		}>
	}
}
```

### Exporting the route handler

The last thing to do in each server-side API route page is export the actual API handler. Next.js expects the default export to be a function `(req: NextApiRequest, res: NextApiResponse) => void` which we create by calling the `makeHandler` method exported frun `next-rest/server`.

`makeHandler` is generic in a single string parameter an **needs to be explicitly parametrized** with the route for the page. We pass `makeHandler` a configuration object that contains, for each method, [custom type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) for the request headers and request bodies, and an `exec` method implementing the actual handler for that method at that route.

You should be able to get custom type predicates from your runtime validation library. For io-ts, they're the `.is` property of the codec, like `getRequestHeaders.is: (value: unknown) => value is { accept: "application/json" })`.

Implementing the exec method is where the magic starts kicking in: it takes a single `{ params, headers, body }` argument, but you don't have to declare any types. TypeScript knows to infer `params` from the route path parametrizing `makeHandler` (!!) and to infer `headers` and `body` from the augmented API module.

The exec method must return a Promise resolving to an object `{ headers, body }`. TypeScript will already know to expect the correct response headers and response body types and will complain if you don't provide them.

```ts
// pages/api/widget/[id].ts

import { makeHandler } from "next-rest/server"

export default makeHandler<"/api/widgets/[id]">({
	GET: {
		headers: getRequestHeaders.is,
		body: getRequestBody.is,
		exec: async ({ params, headers, body }) => {
			// TypeScript knows the types for all of these!
			// - var params: { id: string }
			// - var headers: { accept: "application/json" }
			// - var body: void

			// ... do implementation stuff
			const { isGizmo, updatedAt } = await prisma.widgets.findUnique({
				where: { id: params.id },
				select: { isGizmo: true, updatedAt },
			})

			return {
				headers: {
					"content-type": "application/json",
					"last-modified": new Date(updatedAt).toUTCString(),
				},
				body: { id: params.id, isGizmo },
			}
		},
	},
	DELETE: {
		headers: deleteRequestHeaders.is,
		body: deleteRequestBody.is,
		exec: async ({ params, headers, body }) => {
			// TypeScript knows the types for all of these too!
			// - var params: { id: string }
			// - var headers: { "if-unmodified-since": string }
			// - var body: void

			// ... do implementation stuff
			const updatedAt = new Date(headers["if-unmodified-since"]).toISOString()
			const { count } = await prisma.widgets.deleteMany({
				where: { id: params.id, updatedAt: { lte: updatedAt } },
			})
			return { headers: {}, body: undefined }
		},
	},
})
```

Putting it all together, our complete sample API route page `pages/api/widget/[id].ts` looks like this:

```ts
import * as t from "io-ts"

import { makeHandler } from "next-rest/server"

const getRequestHeaders = t.type({ accept: t.literal("application/json") })
const getRequestBody = t.void

const deleteRequestHeaders = t.type({ "if-unmodified-since": t.string })
const deleteRequestBody = t.void

type GetRequestHeaders = t.TypeOf<typeof getRequestHeaders>
type GetRequestBody = t.TypeOf<typeof getRequestBody>
type GetResponseHeaders = {
	"content-type": "application/json"
	"last-modified": string
}
type GetResponseBody = { id: string; isGizmo: boolean }

type DeleteRequestHeaders = t.TypeOf<typeof deleteRequestHeaders>
type DeleteRequestBody = t.TypeOf<typeof deleteRequestBody>
type DeleteResponseHeaders = {}
type DeleteResponseBody = void

declare module "next-rest/api" {
	interface API {
		"/api/widgets/[id]": Route<{
			GET: {
				request: {
					headers: GetRequestHeaders
					body: GetRequestBody
				}
				response: {
					headers: GetResponseHeaders
					body: GetResponseBody
				}
			}
			DELETE: {
				request: {
					headers: DeleteRequestHeaders
					body: DeleteRequestBody
				}
				response: {
					headers: DeleteResponseHeaders
					body: DeleteResponseBody
				}
			}
		}>
	}
}

export default makeHandler<"/api/widgets/[id]">({
	GET: {
		headers: getRequestHeaders.is,
		body: getRequestBody.is,
		exec: async ({ params, headers, body }) => {
			// ... method implementation
			return {
				headers: { "content-type": "application/json" },
				body: { id: params.id, isGizmo: false },
			}
		},
	},
	DELETE: {
		headers: deleteRequestHeaders.is,
		body: deleteRequestBody.is,
		exec: async ({ params, headers, body }) => {
			// ... method implementation
			return { headers: {}, body: undefined }
		},
	},
})
```

### Using the API client

Now that we've implemented our route on the server and augmented the `next-rest/api` module, we can start using the client API!

The client api is the default export of `next-rest/client`, and it's an object of functions for every HTTP method. This means you invoke the api like this:

```ts
import api from "next-rest/client"

api.get("/api/widgets/[id]", { params: { id }, headers, body })
api.delete("/api/widgets/[id]", { params: { id }, headers, body })
```

The first argument to the method function is the API route **without** any dynamic route parameters - e.g. `/api/widgets/[id]`, not `/api/widgets/81903281`. The second argument is an object with `params`, `headers`, and `body` properties. The `params` object is where you provide values for the dynamic route (`{ id: "81903281" }`).

Here's an example component page at `components/widget.ts` that renders a widget and has a button that lets the user refresh the widget's `.isGizmo` property.

```tsx
// components/widget.ts

import React, { useCallback } from "react"

import api from "next-rest/client"

interface WidgetProps {
	id: string
	isGizmo: boolean
}

export function Widget(props: WidgetProps) {
	const [isGizmo, setIsGizmo] = useState<boolean>(props.isGizmo)
	const [isChecking, setIsChecking] = useState(false)

	const checkGizmoStatus = useCallback(() => {
		setIsChecking(true)
		api
			.get("/api/widgets/[id]", {
				params: { id: params.id },
				headers: { accept: "application/json" },
				body: undefined,
			})
			.then(({ headers, body }) => {
				// TypeScript knows these types!
				// - var headers: { "content-type": "application/json" }
				// - var body: { id: string; isGizmo: boolean }
				setIsGizmo(body.isGizmo)
			})
			.catch(() => alert("could not check gizmo status"))
			.finally(() => setIsChecking(false))
	}, [])

	return (
		<div>
			<p>i'm a widget!</p>
			<p>and i {isGizmo ? "am" : "am NOT"} a gizmo</p>
			<input
				type="button"
				onClick={checkGizmoStatus}
				disabled={isChecking}
				value={isChecking ? "checking..." : "check gizmo status"}
			/>
		</div>
	)
}
```

Notice the total lack of type annotation around the API call! In fact, as soon as you start typing `api.get`, you'll see something like this:

![VSCode autocompleting the API routes that support GET requests](./images/Screen%20Recording%202021-11-04%20at%202.00.46%20PM.gif)

TypeScript knows which API routes support GET requests - in this case there's just one - so it'll offer to autocomplete them for you. And once you select one, TypeScript will parametrize the rest of the API call with the types for that specific method:

![VSCode autocompleting the route params, request headers, and request body](./images/Screen%20Recording%202021-11-04%20at%202.08.22%20PM.gif)

... and when we get our result, TypeScript knows what's inside our response headers and body as well:

![VSCode autocompleting the types of the response headers and response body](./images/Screen%20Recording%202021-11-04%20at%202.13.55%20PM.gif)

### Error handling

If you throw an error from inside a method implementation on the server (ie inside one of your `exec` functions), next-rest will by default respond to the request with status code 500. If you want to control this, you can import `ServerError` from `next-rest/server` and throw one of those instead:

```ts
declare class ServerError extends Error {
	constructor(readonly status: number, readonly message: string)
}
```

For example, we could modify our DELETE implementation to return a more informative status code in cases where the `if-unmodified-since` condition fails:

```ts
// pages/api/widget/[id].ts

import { StatusCodes } from "http-status-codes"
import { makeHandler, ServerError } from "next-rest/server"

export default makeHandler<"/api/widgets/[id]">({
	// ...
	DELETE: {
		headers: deleteRequestHeaders.is,
		body: deleteRequestBody.is,
		exec: async ({ params, headers, body }) => {
			const updatedAt = new Date(headers["if-unmodified-since"]).toISOString()
			const { count } = await prisma.widgets.deleteMany({
				where: { id: params.id, updatedAt: { lte: updatedAt } },
			})

			if (count === 0) {
				// This will cause next-rest to set the response status code to 412
				throw new ServerError(
					StatusCodes.PRECONDITION_FAILED,
					"you've got stale data, man!!"
				)
			}

			return { headers: {}, body: undefined }
		},
	},
})
```

There is a symmetric class `ClientError` exported from `next-rest/client` that we can use to handle this on the client as well.

```ts
declare class ClientError extends Error {
	constructor(readonly status: number, message: string)
}
```

If the client receives any response other than 200, it will throw an instance of `ClientError` containing the status code and the response body as text.

```ts
import { StatusCodes } from "http-status-codes"
import api, { ClientError } from "next-rest/api"

function deleteWidget(id: string, updatedAt: string) {
	api
		.delete("/api/widgets/[id]", {
			params: { id },
			headers: { "if-unmodified-since": new Date(updatedAt).toUTCString() },
			body: undefined,
		})
		.then(({ headers, body }) => alert("widget deleted successfully"))
		.catch((err) => {
			if (
				err instanceof ClientError &&
				err.status === StatusCodes.PRECONDITION_FAILED
			) {
				console.error(err.message) // "you've got stale data, man!!"
				alert(
					"could not delete widget because the request was made with stale data"
				)
			} else {
				alert("unknown error while deleting widget")
			}
		})
}
```

## Contributing

If you find a bug or have a suggestion, feel free to open an issue to discuss it!

## License

MIT © 2020 Joel Gustafson
