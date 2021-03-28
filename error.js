"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const http_status_codes_1 = require("http-status-codes");
class ApiError extends Error {
    constructor(status = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message) {
        super(message || http_status_codes_1.getReasonPhrase(status));
        this.status = status;
    }
}
exports.ApiError = ApiError;
