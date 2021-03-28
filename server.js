"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeHandler = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const hasMethod = (method, methods) => method !== undefined && methods.hasOwnProperty(method);
const makeHandler = (config) => async (req, res) => {
    if (!config.params(req.query)) {
        res.status(http_status_codes_1.default.BAD_REQUEST).end();
        return;
    }
    if (!hasMethod(req.method, config.methods)) {
        res.status(http_status_codes_1.default.METHOD_NOT_ALLOWED).end();
        return;
    }
    const signature = config.methods[req.method];
    if (!signature.headers(req.headers)) {
        res.status(http_status_codes_1.default.BAD_REQUEST).end();
        return;
    }
    const body = req.body || undefined;
    if (!signature.body(body)) {
        res.status(http_status_codes_1.default.BAD_REQUEST).end();
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
            res.status(http_status_codes_1.default.NO_CONTENT).end();
        }
        else {
            res.status(http_status_codes_1.default.OK).json(body);
        }
    }
    else if (typeof result.left === "number") {
        res.status(result.left).end();
    }
    else {
        res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).end();
    }
};
exports.makeHandler = makeHandler;
