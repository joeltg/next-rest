import type { IncomingHttpHeaders } from "http"

import { StatusCodes, getReasonPhrase } from "http-status-codes"

import type { NextApiRequest, NextApiResponse } from "next"

import type {
	Params,
	Routes,
	MethodsByRoute,
	RequestBody,
	ResponseBody,
	RequestHeaders,
	ResponseHeaders,
} from "../index.js"

import type { Right, Left, Either } from "./option.js"

import { ServerError } from "./error.js"
export { ServerError } from "./error.js"

type Handler<R extends Routes> = (
	req: NextApiRequest,
	res: NextApiResponse<ResponseBody<MethodsByRoute<R>, R>>
) => void

const hasMethod = <R extends Routes>(
	method: string,
	methods: Methods<R>
): method is MethodsByRoute<R> => method in methods

type Input<R extends Routes, M extends MethodsByRoute<R>> = {
	params: Params<R>
	headers: RequestHeaders<M, R>
	body: RequestBody<M, R>
}

type Output<R extends Routes, M extends MethodsByRoute<R>> = {
	headers: ResponseHeaders<M, R>
	body: ResponseBody<M, R>
}

type MethodImplementation<R extends Routes, M extends MethodsByRoute<R>> = {
	headers: (headers: IncomingHttpHeaders) => headers is RequestHeaders<M, R>
	body: (body: unknown) => body is RequestBody<M, R>
	exec: (request: Input<R, M>) => Promise<Output<R, M>>
}

type Methods<R extends Routes> = {
	[M in MethodsByRoute<R>]: MethodImplementation<R, M>
}

const error = <T>(res: NextApiResponse<T>, code: StatusCodes): void =>
	res.status(code).end(getReasonPhrase(code))

export const makeHandler =
	<R extends Routes>(methods: Methods<R>): Handler<R> =>
	async (req, res) => {
		if (req.method === undefined || !hasMethod(req.method, methods)) {
			return error(res, StatusCodes.METHOD_NOT_ALLOWED)
		}

		const implementation = methods[req.method]

		if (!implementation.headers(req.headers)) {
			return error(res, StatusCodes.BAD_REQUEST)
		}

		const body = req.body || undefined
		if (!implementation.body(body)) {
			return error(res, StatusCodes.BAD_REQUEST)
		}

		type Success = Output<R, MethodsByRoute<R>>
		const result: Either<any, Success> = await implementation
			.exec({ params: req.query as Params<R>, headers: req.headers, body })
			.then((right): Right<Success> => ({ _tag: "Right", right }))
			.catch((left): Left<any> => ({ _tag: "Left", left }))

		if (result._tag === "Right") {
			const { headers, body } = result.right
			for (const key of Object.keys(headers)) {
				res.setHeader(key, headers[key] as string)
			}

			res.status(StatusCodes.OK)
			if (body === undefined) {
				res.end()
			} else {
				res.json(body)
			}
		} else if (result.left instanceof ServerError) {
			const message = result.left.message
			res.status(result.left.status).end(message)
		} else {
			return error(res, StatusCodes.INTERNAL_SERVER_ERROR)
		}
	}
