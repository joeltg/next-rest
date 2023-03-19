/// <reference types="node" />

import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "http"

export interface API {}

export type Route<T extends RouteSignature> = T

type RouteSignature = Partial<Record<Methods, MethodSignature>>

export interface MethodSignature {
	request: {
		headers: IncomingHttpHeaders
		body?: any
	}
	response: {
		headers: OutgoingHttpHeaders
		body?: any
	}
}

export type Methods = "GET" | "PUT" | "POST" | "HEAD" | "PATCH" | "DELETE"

type GetMethodSignature<M, R> = R extends keyof API
	? API[R] extends RouteSignature
		? M extends keyof API[R]
			? API[R][M]
			: never
		: never
	: never

export type RequestBody<
	M extends Methods,
	R extends keyof API
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["request"]["body"]
	: void

export type ResponseBody<
	M extends Methods,
	R extends keyof API
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["response"]["body"]
	: void

export type RequestHeaders<
	M extends Methods,
	R extends keyof API
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["request"]["headers"] extends IncomingHttpHeaders
		? GetMethodSignature<M, R>["request"]["headers"]
		: never
	: never

export type ResponseHeaders<
	M extends Methods,
	R extends keyof API
> = GetMethodSignature<M, R> extends MethodSignature
	? GetMethodSignature<M, R>["response"]["headers"] extends IncomingHttpHeaders
		? GetMethodSignature<M, R>["response"]["headers"]
		: never
	: never

export type RoutesByMethod<M extends Methods> = {
	[R in keyof API]: M extends keyof API[R] ? R : never
}[keyof API]

export type MethodsByRoute<R extends keyof API> = {
	[M in keyof API[R]]: M extends Methods ? M : never
}[keyof API[R]]

export type QueryParams<R extends string> = 
	R extends `${infer Param},${infer Rest}`
		? { [P in Param]: string } & QueryParams<Rest>
		: { [P in R]: string }

export type Params<R extends string> =
	R extends `/[[...${infer OptionalCatchAllParam}]]${infer OptionalCatchAllRest}`
		? { [P in OptionalCatchAllParam]?: string[] } & Params<OptionalCatchAllRest>
		: R extends `/[...${infer CatchAllParam}]${infer CatchAllRest}`
		? { [P in CatchAllParam]: string[] } & Params<CatchAllRest>
		: R extends `/[${infer Param}]${infer Rest}`
		? { [P in Param]: string } & Params<Rest>
		: R extends `/${string}/${infer Rest}`
		? Params<`/${Rest}`>
		: R extends `/${string}?{${infer AllQueryParams}}`
		? QueryParams<AllQueryParams>
		: R extends `?{${infer AllQueryParams}}`
		? QueryParams<AllQueryParams>
		: {}