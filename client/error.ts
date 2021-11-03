import { StatusCodes, getReasonPhrase } from "http-status-codes"

export class ClientError extends Error {
	constructor(
		readonly status: number = StatusCodes.INTERNAL_SERVER_ERROR,
		message: string = getReasonPhrase(status)
	) {
		super(message)
	}
}
