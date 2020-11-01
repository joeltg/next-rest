# next-rest

> Typesafe REST APIs for next.js

This library is a minimalist framework for writing typesafe validated REST APIs for next.js in TypeScript.

Features:

- **Modularity**: instead of making you define all of your route types in one place, next-rest uses module augmentation so that you can declare each route's type in their respective file.
- **Minimalism**: the next-rest API client is 100 lines and just calls `fetch` like you'd expect.
- **Safety**: next-rest lets you write APIs where the URL parameters, request headers, request body, response headers, and response body are all (!!) strongly typed for each combination of route and method. These get typechecked both at implementation on the server and at invocation on the client, and get validated at runtime on the server (but not the client).

Non-features:

- **External usage**: next-rest is designed for implementing and calling REST APIs within a single next.js application. You can't export your API types, or import a different project's API types. If _that's_ what you're after, you probably want something like [restyped](https://github.com/rawrmaan/restyped/).

## Table of Contents

- [Runtime validation](#runtime-validation)
- [Examples](#examples)
  - [`GET` request](#get-request)
  - [`POST` request](#post-request)

## Runtime validation

next-rest is designed to be used with a runtime validation library, like [io-ts](https://github.com/gcanti/io-ts), [runtypes](https://github.com/pelotom/runtypes), or [zod](https://github.com/vriad/zod). Anything that supports static type inference and gives you [type predicates](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) for your types will work. The examples here use io-ts, although zod is probably the most user-friendly.

## Examples

### `GET` request

#### Server

`pages/api/people/[id].ts`

```typescript
import { StatusCodes } from "http-status-codes"
import { PrismaClient } from "@prisma/client"

import * as t from "io-ts"

import { getSession } from "next-auth/client"
import { makeHandler } from "next-rest/server"

const prisma = new PrismaClient()

const params = t.type({ id: t.string })
const headers = t.type({ accept: t.literal("application/json") })

declare module "next-rest" {
	interface API {
		"/api/people/[id]": Route<{
			params: t.TypeOf<typeof params>
			methods: {
				GET: {
					request: {
						headers: t.TypeOf<typeof headers>
						body: void
					}
					response: {
						headers: { "content-type": "application/json" }
						body: {
							id: string
							name: string
							age: number
						}
					}
				}
			}
		}>
	}
}

export default makeHandler<"/api/people/[id]">({
	params: params.is,
	methods: {
		GET: {
			headers: headers.is,
			body: t.void.is,
			exec: async (req, { id }, {}, body) => {
				const session = await getSession({ req })
				if (session === null) {
					throw StatusCodes.UNAUTHORIZED
				}

				const schema = await prisma.person.findOne({ where: { id } })
				if (schema === null) {
					throw StatusCodes.NOT_FOUND
				}

				const { name, age } = schema
				return [{ "content-type": "application/json" }, { id, name, age }]
			},
		},
	},
})
```

#### Client

```typescript
import api from "next-rest/client"

api
	.get("/api/people/[id]", { id }, { "content-type": "application/json" })
	.then(([{}, { name, age }]) => console.log(name, age))
	.catch((error) => console.error(error.toString()))
```

### `POST` request

#### Server

`pages/api/people/index.ts`

```typescript
import { StatusCodes } from "http-status-codes"
import { PrismaClient } from "@prisma/client"
import * as t from "io-ts"

import { getSession } from "next-auth/client"

import { makeHandler } from "next-rest/server"

const prisma = new PrismaClient()

const params = t.type({})
const headers = t.type({ "content-type": t.literal("application/json") })
const body = t.type({
	name: t.string,
	age: t.number,
})

declare module "next-rest" {
	interface API {
		"/api/people": Route<{
			params: t.TypeOf<typeof params>
			methods: {
				POST: {
					request: {
						headers: t.TypeOf<typeof headers>
						body: t.TypeOf<typeof body>
					}
					response: {
						headers: { etag: string }
						body: void
					}
				}
			}
		}>
	}
}

export default makeHandler<"/api/people">({
	params: params.is,
	methods: {
		POST: {
			headers: headers.is,
			body: body.is,
			exec: async (req, {}, {}, { name, age }) => {
				const session = await getSession({ req })
				if (session === null) {
					throw StatusCodes.UNAUTHORIZED
				}

				const { id } = await prisma.person.create({ data: { name, age } })

				return [{ etag: id }, undefined]
			},
		},
	},
})
```

#### Client

```typescript
import api from "next-rest/client"

const body = { name: "Alyssa", age: 33 }
api
	.post("/api/person", {}, { "content-type": "application/json" }, body)
	.then(([{ etag }]) => console.log(etag))
	.catch((error) => console.error(error.toString()))
```
