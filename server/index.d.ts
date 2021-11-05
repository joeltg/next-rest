/// <reference types="node" />

import type { IncomingHttpHeaders } from "http"
import type { NextApiRequest, NextApiResponse } from "next"

import type {
	API,
	Params,
	MethodsByRoute,
	RequestBody,
	ResponseBody,
	RequestHeaders,
	ResponseHeaders,
} from "../index.js"

export declare class ServerError extends Error {
	readonly status: number
	readonly message: string
	constructor(status?: number, message?: string)
}

type Handler<R extends keyof API> = (
	req: NextApiRequest,
	res: NextApiResponse<ResponseBody<MethodsByRoute<R>, R>>
) => void

type Input<R extends keyof API, M extends MethodsByRoute<R>> = {
	params: Params<R>
	headers: RequestHeaders<M, R>
	body: RequestBody<M, R>
}

type Output<R extends keyof API, M extends MethodsByRoute<R>> = {
	headers: ResponseHeaders<M, R>
	body: ResponseBody<M, R>
}

type MethodImplementation<R extends keyof API, M extends MethodsByRoute<R>> = {
	headers: (headers: IncomingHttpHeaders) => headers is RequestHeaders<M, R>
	body: (body: unknown) => body is RequestBody<M, R>
	exec: (request: Input<R, M>) => Promise<Output<R, M>>
}

type Methods<R extends keyof API> = {
	[M in MethodsByRoute<R>]: MethodImplementation<R, M>
}

export declare const makeHandler: <R extends keyof API>(
	route: R,
	methods: Methods<R>
) => Handler<R>
