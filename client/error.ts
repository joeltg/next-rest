export class ClientError extends Error {
	constructor(readonly status: number, message: string) {
		super(message)
	}
}
