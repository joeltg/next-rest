"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _httpStatusCodes = _interopRequireDefault(require("http-status-codes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const restComponentPattern = /\[\.\.\.(.+)\]^$/;
const componentPattern = /^\[(.+)\]$/;

function makeURL(route, params) {
  const path = [];

  if (params !== undefined) {
    for (const component of route.split("/")) {
      if (restComponentPattern.test(component)) {
        const [{}, param] = restComponentPattern.exec(component);
        const values = params[param];

        if (Array.isArray(values)) {
          for (const value of values) {
            path.push(encodeURIComponent(value));
          }
        } else {
          throw new Error(`Invalid URL rest parameter: ${param}`);
        }
      } else if (componentPattern.test(component)) {
        const [{}, param] = componentPattern.exec(component);
        const value = params[param];

        if (typeof value === "string") {
          path.push(encodeURIComponent(value));
        } else {
          throw new Error(`Invalid URL parameter: ${param}`);
        }
      } else {
        path.push(encodeURIComponent(component));
      }
    }
  }

  return path.join("/");
}

function parseHeaders(headers) {
  const result = {};

  for (const [key, value] of headers) {
    result[key] = value;
  }

  return result;
}

async function clientFetch(method, route, params, headers, body) {
  const mode = "same-origin";
  const init = {
    method,
    mode,
    headers: headers
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const url = makeURL(route, params);
  const res = await fetch(url, init);

  if (res.status === _httpStatusCodes.default.OK) {
    const responseBody = res.headers.get("content-type") === "application/json" ? await res.json() : undefined;
    const responseHeaders = parseHeaders(res.headers);
    return [responseHeaders, responseBody];
  } else {
    throw res.status;
  }
}

const makeMethod = method => (route, params, headers, body) => clientFetch(method, route, params, headers, body);

var _default = {
  get: makeMethod("GET"),
  put: makeMethod("PUT"),
  post: makeMethod("POST"),
  head: makeMethod("HEAD"),
  patch: makeMethod("PATCH"),
  delete: makeMethod("DELETE")
};
exports.default = _default;
