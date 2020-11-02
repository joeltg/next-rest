import StatusCodes from "http-status-codes"
import {
	API,
	Method,
	RoutesByMethod,
	RequestBody,
	ResponseBody,
	RequestHeaders,
	ResponseHeaders,
} from "."

const restComponentPattern = /\[\.\.\.(.+)\]^$/
const componentPattern = /^\[(.+)\]$/

function makeURL(
	route: string,
	params?: { [key: string]: string | string[] }
): string {
	const path: string[] = []

	if (params !== undefined) {
		for (const component of route.split("/")) {
			if (restComponentPattern.test(component)) {
				const [{}, param] = restComponentPattern.exec(component)!
				const values = params[param]
				if (Array.isArray(values)) {
					for (const value of values) {
						path.push(encodeURIComponent(value))
					}
				} else {
					throw new Error(`Invalid URL rest parameter: ${param}`)
				}
			} else if (componentPattern.test(component)) {
				const [{}, param] = componentPattern.exec(component)!
				const value = params[param]
				if (typeof value === "string") {
					path.push(encodeURIComponent(value))
				} else {
					throw new Error(`Invalid URL parameter: ${param}`)
				}
			} else {
				path.push(encodeURIComponent(component))
			}
		}
	}

	return path.join("/")
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
	params: API[R]["params"],
	headers: RequestHeaders<M, R>,
	body?: RequestBody<M, R>
): Promise<[ResponseHeaders<M, R>, ResponseBody<M, R>]> {
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
	if (res.status === StatusCodes.OK) {
		const responseBody =
			res.headers.get("content-type") === "application/json"
				? await res.json()
				: undefined
		const responseHeaders = parseHeaders(res.headers) as ResponseHeaders<M, R>
		return [responseHeaders, responseBody]
	} else {
		throw res.status
	}
}

const makeMethod = <M extends Method>(method: M) => <
	R extends RoutesByMethod<M>
>(
	route: R,
	params: API[R]["params"],
	headers: RequestHeaders<M, R>,
	body: RequestBody<M, R>
) => clientFetch(method, route, params, headers, body)

export default {
	get: makeMethod("GET"),
	put: makeMethod("PUT"),
	post: makeMethod("POST"),
	head: makeMethod("HEAD"),
	patch: makeMethod("PATCH"),
	delete: makeMethod("DELETE"),
}
