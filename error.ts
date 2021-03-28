import { StatusCodes, getReasonPhrase } from "http-status-codes"

export class ApiError extends Error {
	constructor(
		readonly status: number = StatusCodes.INTERNAL_SERVER_ERROR,
		message?: string
	) {
		super(message || getReasonPhrase(status))
	}
}
