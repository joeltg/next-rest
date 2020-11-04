/// <reference types="node" />
import { IncomingHttpHeaders } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { API, Routes, RoutesByMethod, MethodsByRoute, RequestBody, ResponseBody, RequestHeaders, ResponseHeaders } from ".";
declare type Handler<R extends Routes> = (req: NextApiRequest, res: NextApiResponse<ResponseBody<MethodsByRoute<R>, RoutesByMethod<MethodsByRoute<R>>>>) => void;
declare type Result<R extends Routes, M extends MethodsByRoute<R>> = [
    ResponseHeaders<M, R>,
    ResponseBody<M, R>
];
declare type Methods<R extends Routes> = {
    [M in MethodsByRoute<R>]: {
        headers: (headers: IncomingHttpHeaders) => headers is RequestHeaders<M, R>;
        body: (body: unknown) => body is RequestBody<M, R>;
        exec: (req: NextApiRequest, params: API[R]["params"], headers: RequestHeaders<M, R>, body: RequestBody<M, R>) => Promise<Result<R, M>>;
    };
};
declare type ValidateParams<R extends Routes> = (params: Record<string, string | string[]>) => params is API[R]["params"];
export declare const makeHandler: <R extends never>(config: {
    params: ValidateParams<R>;
    methods: Methods<R>;
}) => Handler<R>;
export {};
