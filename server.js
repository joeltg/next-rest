"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeHandler = exports.ApiError = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_js_1 = require("./error.js");
var error_js_2 = require("./error.js");
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return error_js_2.ApiError; } });
const hasMethod = (method, methods) => method !== undefined && methods.hasOwnProperty(method);
const makeHandler = (config) => async (req, res) => {
    if (!config.params(req.query)) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).end();
        return;
    }
    if (!hasMethod(req.method, config.methods)) {
        res.status(http_status_codes_1.StatusCodes.METHOD_NOT_ALLOWED).end();
        return;
    }
    const signature = config.methods[req.method];
    if (!signature.headers(req.headers)) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).end();
        return;
    }
    const body = req.body || undefined;
    if (!signature.body(body)) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).end();
        return;
    }
    const result = await signature
        .exec(req, req.query, req.headers, body)
        .then((right) => ({ _tag: "Right", right }))
        .catch((left) => ({ _tag: "Left", left }));
    if (result._tag === "Right") {
        const [headers, body] = result.right;
        for (const key of Object.keys(headers)) {
            res.setHeader(key, headers[key]);
        }
        if (body === undefined) {
            res.status(http_status_codes_1.StatusCodes.NO_CONTENT).end();
        }
        else {
            res.status(http_status_codes_1.StatusCodes.OK).json(body);
        }
    }
    else if (result.left instanceof error_js_1.ApiError) {
        const message = result.left.message || http_status_codes_1.getReasonPhrase(result.left.status);
        res.status(result.left.status).end(message);
    }
    else {
        res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .end(http_status_codes_1.ReasonPhrases.INTERNAL_SERVER_ERROR);
    }
};
exports.makeHandler = makeHandler;
