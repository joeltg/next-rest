import type {
	API,
	RequestBody,
	ResponseBody,
	RequestHeaders,
	ResponseHeaders,
	Params,
} from "../index.js"

export declare class ClientError extends Error {
	readonly status: number
	constructor(status: number, message: string)
}

declare const methods: {
	get: <R extends keyof API>(
		route: R,
		request: {
			params: Params<R>
			headers: RequestHeaders<"GET", R>
			body: RequestBody<"GET", R>
		}
	) => Promise<{
		headers: ResponseHeaders<"GET", R>
		body: ResponseBody<"GET", R>
	}>
	put: <R extends keyof API>(
		route: R,
		request: {
			params: Params<R>
			headers: RequestHeaders<"PUT", R>
			body: RequestBody<"PUT", R>
		}
	) => Promise<{
		headers: ResponseHeaders<"PUT", R>
		body: ResponseBody<"PUT", R>
	}>
	post: <R extends keyof API>(
		route: R,
		request: {
			params: Params<R>
			headers: RequestHeaders<"POST", R>
			body: RequestBody<"POST", R>
		}
	) => Promise<{
		headers: ResponseHeaders<"POST", R>
		body: ResponseBody<"POST", R>
	}>
	head: <R extends keyof API>(
		route: R,
		request: {
			params: Params<R>
			headers: RequestHeaders<"HEAD", R>
			body: RequestBody<"HEAD", R>
		}
	) => Promise<{
		headers: ResponseHeaders<"HEAD", R>
		body: ResponseBody<"HEAD", R>
	}>
	patch: <R extends keyof API>(
		route: R,
		request: {
			params: Params<R>
			headers: RequestHeaders<"PATCH", R>
			body: RequestBody<"PATCH", R>
		}
	) => Promise<{
		headers: ResponseHeaders<"PATCH", R>
		body: ResponseBody<"PATCH", R>
	}>
	delete: <R extends keyof API>(
		route: R,
		request: {
			params: Params<R>
			headers: RequestHeaders<"DELETE", R>
			body: RequestBody<"DELETE", R>
		}
	) => Promise<{
		headers: ResponseHeaders<"DELETE", R>
		body: ResponseBody<"DELETE", R>
	}>
}

export default methods
