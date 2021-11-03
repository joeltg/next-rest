import { StatusCodes, getReasonPhrase } from "http-status-codes"

export class ServerError extends Error {
	constructor(
		readonly status: number = StatusCodes.INTERNAL_SERVER_ERROR,
		readonly message: string = getReasonPhrase(status)
	) {
		super(message)
	}
}
