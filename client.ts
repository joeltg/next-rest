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
	params: { [key: string]: undefined | string | string[] }
): string {
	const path: string[] = []

	for (const component of route.split("/")) {
		if (restComponentPattern.test(component)) {
			const [{}, param] = restComponentPattern.exec(component)!
			const values = params[param]
			if (Array.isArray(values)) {
				delete params[param]
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
				delete params[param]
				path.push(encodeURIComponent(value))
			} else {
				throw new Error(`Invalid URL parameter: ${param}`)
			}
		} else {
			path.push(encodeURIComponent(component))
		}
	}

	const keys = Object.keys(params)
	if (keys.length > 0) {
		const query: string[] = []
		for (const key of keys) {
			const value = params[key]
			if (typeof value === "string") {
				query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			} else if (value !== undefined) {
				throw new Error(`Invalid URL query parameter: ${key}`)
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
	params: API[R]["params"],
	headers: RequestHeaders<M, R>,
	body: RequestBody<M, R>,
	parser: (res: Response, contentType: string) => Promise<ResponseBody<M, R>>
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
		const contentType = res.headers.get("content-type")

		const responseBody =
			contentType === null
				? (undefined as ResponseBody<M, R>)
				: await parser(res, contentType)

		const responseHeaders = parseHeaders(res.headers) as ResponseHeaders<M, R>
		return [responseHeaders, responseBody]
	} else {
		throw res.status
	}
}

const defaultParser = (res: Response, _: string) => res.json()

const makeMethod = <M extends Method>(method: M) => <
	R extends RoutesByMethod<M>
>(
	route: R,
	params: API[R]["params"],
	headers: RequestHeaders<M, R>,
	body: RequestBody<M, R>,
	parser: (
		res: Response,
		contentType: string
	) => Promise<ResponseBody<M, R>> = defaultParser
) => clientFetch(method, route, params, headers, body, parser)

export default {
	get: makeMethod("GET"),
	put: makeMethod("PUT"),
	post: makeMethod("POST"),
	head: makeMethod("HEAD"),
	patch: makeMethod("PATCH"),
	delete: makeMethod("DELETE"),
}
