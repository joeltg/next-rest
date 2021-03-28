"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const error_js_1 = require("./error.js");
var error_js_2 = require("./error.js");
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return error_js_2.ApiError; } });
const restComponentPattern = /\[\.\.\.(.+)\]^$/;
const componentPattern = /^\[(.+)\]$/;
function makeURL(route, params) {
    const path = [];
    for (const component of route.split("/")) {
        if (restComponentPattern.test(component)) {
            const [{}, param] = restComponentPattern.exec(component);
            const values = params[param];
            if (Array.isArray(values)) {
                delete params[param];
                for (const value of values) {
                    path.push(encodeURIComponent(value));
                }
            }
            else {
                throw new error_js_1.ApiError(http_status_codes_1.default.BAD_REQUEST, `Invalid URL rest parameter: ${param}`);
            }
        }
        else if (componentPattern.test(component)) {
            const [{}, param] = componentPattern.exec(component);
            const value = params[param];
            if (typeof value === "string") {
                delete params[param];
                path.push(encodeURIComponent(value));
            }
            else {
                throw new error_js_1.ApiError(http_status_codes_1.default.BAD_REQUEST, `Invalid URL parameter: ${param}`);
            }
        }
        else {
            path.push(encodeURIComponent(component));
        }
    }
    const keys = Object.keys(params);
    if (keys.length > 0) {
        const query = [];
        for (const key of keys) {
            const value = params[key];
            if (typeof value === "string") {
                query.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
            else if (value !== undefined) {
                throw new error_js_1.ApiError(http_status_codes_1.default.BAD_REQUEST, `Invalid URL query parameter: ${key}`);
            }
        }
        return `${path.join("/")}?${query.join("&")}`;
    }
    else {
        return path.join("/");
    }
}
function parseHeaders(headers) {
    const result = {};
    for (const [key, value] of headers) {
        result[key] = value;
    }
    return result;
}
async function clientFetch(method, route, params, headers, body, parser) {
    const mode = "same-origin";
    const init = {
        method,
        mode,
        headers: headers,
    };
    if (body !== undefined) {
        init.body = JSON.stringify(body);
    }
    const url = makeURL(route, params);
    const res = await fetch(url, init);
    if (res.status === http_status_codes_1.default.NO_CONTENT) {
        const responseHeaders = parseHeaders(res.headers);
        return [responseHeaders, undefined];
    }
    else if (res.status === http_status_codes_1.default.OK) {
        const responseBody = await parser(res);
        const responseHeaders = parseHeaders(res.headers);
        return [responseHeaders, responseBody];
    }
    else {
        throw new error_js_1.ApiError(res.status);
    }
}
const defaultParser = (res) => res.json();
const makeMethod = (method) => (route, params, headers, body, parser = defaultParser) => clientFetch(method, route, params, headers, body, parser);
exports.default = {
    get: makeMethod("GET"),
    put: makeMethod("PUT"),
    post: makeMethod("POST"),
    head: makeMethod("HEAD"),
    patch: makeMethod("PATCH"),
    delete: makeMethod("DELETE"),
};
