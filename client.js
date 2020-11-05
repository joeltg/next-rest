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

  for (const component of route.split("/")) {
    if (restComponentPattern.test(component)) {
      const [{}, param] = restComponentPattern.exec(component);
      const values = params[param];

      if (Array.isArray(values)) {
        delete params[param];

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
        delete params[param];
        path.push(encodeURIComponent(value));
      } else {
        throw new Error(`Invalid URL parameter: ${param}`);
      }
    } else {
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
      } else {
        throw new Error(`Invalid URL query parameter: ${key}`);
      }
    }

    return `${path.join("/")}?${query.join("&")}`;
  } else {
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

async function clientFetch(method, route, params, headers, body, bodyParser) {
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
    const contentType = res.headers.get("content-type");
    const responseBody = contentType === null ? undefined : bodyParser === undefined ? await res.json() : await bodyParser(res, contentType);
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
