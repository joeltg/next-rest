import { StatusCodes, getReasonPhrase } from "http-status-codes"

export class ServerError extends Error {
	constructor(
		status = StatusCodes.INTERNAL_SERVER_ERROR,
		message = getReasonPhrase(status)
	) {
		super(message)
		this.status = status
		this.message = message
	}
}

const hasMethod = (method, methods) => method in methods

const error = (res, code) => res.status(code).end(getReasonPhrase(code))

export const makeHandler = (route, methods) => async (req, res) => {
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

	const result = await implementation
		.exec({ params: req.query, headers: req.headers, body })
		.then((right) => ({ _tag: "Right", right }))
		.catch((left) => ({ _tag: "Left", left }))

	if (result._tag === "Right") {
		const { headers, body } = result.right
		for (const key of Object.keys(headers)) {
			res.setHeader(key, headers[key])
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
