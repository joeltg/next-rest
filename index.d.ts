import { IncomingHttpHeaders } from "http"

export interface API {}

export type Route<T extends RouteSignature> = T

export type Routes = keyof API

interface RouteSignature {
	params: { [key: string]: string | string[] }
	methods: { [m in Method]?: MethodSignature }
}

interface MethodSignature {
	request: Signature
	response: Signature
}

interface Signature {
	headers: IncomingHttpHeaders
	body: any
}

export type Method = "GET" | "PUT" | "POST" | "HEAD" | "PATCH" | "DELETE"

type GetMethodSignature<M, R> = R extends Routes
	? API[R] extends RouteSignature
		? M extends keyof API[R]["methods"]
			? API[R]["methods"][M]
			: never
		: never
	: never

export type RequestBody<
	M extends Method,
	R extends RoutesByMethod<M>
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["request"]["body"]
	: void

export type ResponseBody<
	M extends Method,
	R extends RoutesByMethod<M>
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["response"]["body"]
	: void

export type RequestHeaders<
	M extends Method,
	R extends RoutesByMethod<M>
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["request"]["headers"] extends IncomingHttpHeaders
		? GetMethodSignature<M, R>["request"]["headers"]
		: never
	: never

export type ResponseHeaders<
	M extends Method,
	R extends RoutesByMethod<M>
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["response"]["headers"] extends IncomingHttpHeaders
		? GetMethodSignature<M, R>["response"]["headers"]
		: never
	: never

export type RoutesByMethod<M extends Method> = {
	[R in Routes]: M extends keyof API[R]["methods"] ? R : never
}[Routes]

export type MethodsByRoute<R extends Routes> = {
	[M in keyof API[R]["methods"]]: M extends Method ? M : never
}[keyof API[R]["methods"]]
