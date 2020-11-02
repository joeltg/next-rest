"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeHandler = void 0;

var _httpStatusCodes = _interopRequireDefault(require("http-status-codes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const hasMethod = (method, methods) => method !== undefined && methods.hasOwnProperty(method);

const makeHandler = config => async (req, res) => {
  if (!config.params(req.query)) {
    res.status(_httpStatusCodes.default.BAD_REQUEST).end();
    return;
  }

  if (!hasMethod(req.method, config.methods)) {
    res.status(_httpStatusCodes.default.METHOD_NOT_ALLOWED).end();
    return;
  }

  const signature = config.methods[req.method];

  if (!signature.headers(req.headers)) {
    res.status(_httpStatusCodes.default.BAD_REQUEST).end();
    return;
  }

  const body = req.body || undefined;

  if (!signature.body(body)) {
    res.status(_httpStatusCodes.default.BAD_REQUEST).end();
    return;
  }

  const result = await signature.exec(req, req.query, req.headers, body).then(right => ({
    _tag: "Right",
    right
  })).catch(left => ({
    _tag: "Left",
    left
  }));

  if (result._tag === "Right") {
    const [headers, body] = result.right;

    for (const key of Object.keys(headers)) {
      res.setHeader(key, headers[key]);
    }

    if (body === undefined) {
      res.status(_httpStatusCodes.default.OK).end();
    } else if (body !== undefined) {
      res.status(_httpStatusCodes.default.OK).json(body);
    }
  } else if (typeof result.left === "number") {
    res.status(result.left).end();
  } else {
    res.status(_httpStatusCodes.default.INTERNAL_SERVER_ERROR).end();
  }
};

exports.makeHandler = makeHandler;
