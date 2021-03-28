import type { API, RequestBody, ResponseBody, RequestHeaders, ResponseHeaders } from ".";
export declare class ApiError extends Error {
    readonly message: string;
    readonly status?: number | undefined;
    constructor(message: string, status?: number | undefined);
}
declare const _default: {
    get: <R extends never>(route: R, params: API[R]["params"], headers: RequestHeaders<"GET", R>, body: RequestBody<"GET", R>, parser?: (res: Response) => Promise<ResponseBody<"GET", R>>) => Promise<[ResponseHeaders<"GET", R>, ResponseBody<"GET", R>]>;
    put: <R_1 extends never>(route: R_1, params: API[R_1]["params"], headers: RequestHeaders<"PUT", R_1>, body: RequestBody<"PUT", R_1>, parser?: (res: Response) => Promise<ResponseBody<"PUT", R_1>>) => Promise<[ResponseHeaders<"PUT", R_1>, ResponseBody<"PUT", R_1>]>;
    post: <R_2 extends never>(route: R_2, params: API[R_2]["params"], headers: RequestHeaders<"POST", R_2>, body: RequestBody<"POST", R_2>, parser?: (res: Response) => Promise<ResponseBody<"POST", R_2>>) => Promise<[ResponseHeaders<"POST", R_2>, ResponseBody<"POST", R_2>]>;
    head: <R_3 extends never>(route: R_3, params: API[R_3]["params"], headers: RequestHeaders<"HEAD", R_3>, body: RequestBody<"HEAD", R_3>, parser?: (res: Response) => Promise<ResponseBody<"HEAD", R_3>>) => Promise<[ResponseHeaders<"HEAD", R_3>, ResponseBody<"HEAD", R_3>]>;
    patch: <R_4 extends never>(route: R_4, params: API[R_4]["params"], headers: RequestHeaders<"PATCH", R_4>, body: RequestBody<"PATCH", R_4>, parser?: (res: Response) => Promise<ResponseBody<"PATCH", R_4>>) => Promise<[ResponseHeaders<"PATCH", R_4>, ResponseBody<"PATCH", R_4>]>;
    delete: <R_5 extends never>(route: R_5, params: API[R_5]["params"], headers: RequestHeaders<"DELETE", R_5>, body: RequestBody<"DELETE", R_5>, parser?: (res: Response) => Promise<ResponseBody<"DELETE", R_5>>) => Promise<[ResponseHeaders<"DELETE", R_5>, ResponseBody<"DELETE", R_5>]>;
};
export default _default;
