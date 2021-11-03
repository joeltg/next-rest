import StatusCodes from "http-status-codes"

import type {
	Method,
	RoutesByMethod,
	RequestBody,
	ResponseBody,
	RequestHeaders,
	ResponseHeaders,
	Params,
} from "../api/index.js"

import { ClientError } from "./error.js"
export { ClientError } from "./error.js"

const optionalRestComponentPattern = /\[\[\.\.\.(.+)\]\]^$/
const restComponentPattern = /\[\.\.\.(.+)\]^$/
const componentPattern = /^\[(.+)\]$/

function makeURL<R extends string>(route: R, params: Params<R>): string {
	const p = params as Record<string, string | string[]>
	const path: string[] = []
	for (const component of route.split("/")) {
		if (optionalRestComponentPattern.test(component)) {
			const [{}, param] = restComponentPattern.exec(component)!
			if (param in p) {
				const values = p[param]
				if (Array.isArray(values)) {
					delete p[param]
					for (const value of values) {
						path.push(encodeURIComponent(value))
					}
				} else {
					throw new ClientError(
						StatusCodes.BAD_REQUEST,
						`Invalid URL rest parameter: ${param}`
					)
				}
			}
		} else if (restComponentPattern.test(component)) {
			const [{}, param] = restComponentPattern.exec(component)!
			const values = p[param]
			if (Array.isArray(values)) {
				delete p[param]
				for (const value of values) {
					path.push(encodeURIComponent(value))
				}
			} else {
				throw new ClientError(
					StatusCodes.BAD_REQUEST,
					`Invalid URL rest parameter: ${param}`
				)
			}
		} else if (componentPattern.test(component)) {
			const [{}, param] = componentPattern.exec(component)!
			const value = p[param]
			if (typeof value === "string") {
				delete p[param]
				path.push(encodeURIComponent(value))
			} else {
				throw new ClientError(
					StatusCodes.BAD_REQUEST,
					`Invalid URL parameter: ${param}`
				)
			}
		} else {
			path.push(encodeURIComponent(component))
		}
	}

	const keys = Object.keys(params)
	if (keys.length > 0) {
		const query: string[] = []
		for (const key of keys) {
			const value = p[key]
			if (typeof value === "string") {
				query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			} else if (value !== undefined) {
				throw new ClientError(
					StatusCodes.BAD_REQUEST,
					`Invalid URL query parameter: ${key}`
				)
			}
		}
		return `${path.join("/")}?${query.join("&")}`
	} else {
		return path.join("/")
	}
}

function parseHeaders(headers: Headers): Record<string, string> {
	const result: Record<string, string> = {}
	for (const [key, value] of headers) {
		result[key] = value
	}
	return result
}

async function clientFetch<M extends Method, R extends RoutesByMethod<M>>(
	method: M,
	route: R,
	params: Params<R>,
	headers: RequestHeaders<M, R>,
	body: RequestBody<M, R>
): Promise<{ headers: ResponseHeaders<M, R>; body: ResponseBody<M, R> }> {
	const mode = "same-origin"
	const init: RequestInit = {
		method,
		mode,
		headers: headers as Record<string, string>,
	}

	if (body !== undefined) {
		init.body = JSON.stringify(body)
	}

	const url = makeURL(route, params)
	const res = await fetch(url, init)
	if (res.status === StatusCodes.NO_CONTENT) {
		const responseHeaders = parseHeaders(res.headers) as ResponseHeaders<M, R>
		return { headers: responseHeaders, body: undefined as ResponseBody<M, R> }
	} else if (res.status === StatusCodes.OK) {
		const responseBody = await res.json()
		const responseHeaders = parseHeaders(res.headers) as ResponseHeaders<M, R>
		return { headers: responseHeaders, body: responseBody }
	} else {
		throw new ClientError(res.status)
	}
}

const makeMethod =
	<M extends Method>(method: M) =>
	<R extends RoutesByMethod<M>>(
		route: R,
		request: {
			params: Params<R>
			headers: RequestHeaders<M, R>
			body: RequestBody<M, R>
		}
	) =>
		clientFetch(method, route, request.params, request.headers, request.body)

export default {
	get: makeMethod("GET"),
	put: makeMethod("PUT"),
	post: makeMethod("POST"),
	head: makeMethod("HEAD"),
	patch: makeMethod("PATCH"),
	delete: makeMethod("DELETE"),
}
