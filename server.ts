import { IncomingHttpHeaders } from "http"
import StatusCodes from "http-status-codes"

import { NextApiRequest, NextApiResponse } from "next"

import type {
	API,
	Routes,
	MethodsByRoute,
	RequestBody,
	ResponseBody,
	RequestHeaders,
	ResponseHeaders,
} from "."

import type { Right, Left, Either } from "./option"

type Handler<R extends Routes> = (
	req: NextApiRequest,
	res: NextApiResponse<ResponseBody<MethodsByRoute<R>, R>>
) => void

const hasMethod = <R extends Routes>(
	method: undefined | string,
	methods: Methods<R>
): method is MethodsByRoute<R> =>
	method !== undefined && methods.hasOwnProperty(method)

type Result<R extends Routes, M extends MethodsByRoute<R>> = [
	ResponseHeaders<M, R>,
	ResponseBody<M, R>
]

type Methods<R extends Routes> = {
	[M in MethodsByRoute<R>]: {
		headers: (headers: IncomingHttpHeaders) => headers is RequestHeaders<M, R>
		body: (body: unknown) => body is RequestBody<M, R>
		exec: (
			req: NextApiRequest,
			params: API[R]["params"],
			headers: RequestHeaders<M, R>,
			body: RequestBody<M, R>
		) => Promise<Result<R, M>>
	}
}

type ValidateParams<R extends Routes> = (
	params: Record<string, undefined | string | string[]>
) => params is API[R]["params"]

export const makeHandler = <R extends Routes>(config: {
	params: ValidateParams<R>
	methods: Methods<R>
}): Handler<R> => async (req, res) => {
	if (!config.params(req.query)) {
		res.status(StatusCodes.BAD_REQUEST).end()
		return
	}

	if (!hasMethod(req.method, config.methods)) {
		res.status(StatusCodes.METHOD_NOT_ALLOWED).end()
		return
	}

	const signature = config.methods[req.method]

	if (!signature.headers(req.headers)) {
		res.status(StatusCodes.BAD_REQUEST).end()
		return
	}

	const body = req.body || undefined
	if (!signature.body(body)) {
		res.status(StatusCodes.BAD_REQUEST).end()
		return
	}

	type result = Result<R, MethodsByRoute<R>>
	const result: Either<any, result> = await signature
		.exec(req, req.query, req.headers, body)
		.then((right): Right<result> => ({ _tag: "Right", right }))
		.catch((left): Left<any> => ({ _tag: "Left", left }))

	if (result._tag === "Right") {
		const [headers, body] = result.right
		for (const key of Object.keys(headers)) {
			res.setHeader(key, headers[key] as string)
		}

		if (body === undefined) {
			res.status(StatusCodes.NO_CONTENT).end()
		} else {
			res.status(StatusCodes.OK).json(body)
		}
	} else if (typeof result.left === "number") {
		res.status(result.left).end()
	} else {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).end()
	}
}
