import { API, RequestBody, ResponseBody, RequestHeaders, ResponseHeaders } from ".";
declare const _default: {
    get: <R extends never>(route: R, params: API[R]["params"], headers: RequestHeaders<"GET", R>, body: RequestBody<"GET", R>) => Promise<[ResponseHeaders<"GET", R>, ResponseBody<"GET", R>]>;
    put: <R_1 extends never>(route: R_1, params: API[R_1]["params"], headers: RequestHeaders<"PUT", R_1>, body: RequestBody<"PUT", R_1>) => Promise<[ResponseHeaders<"PUT", R_1>, ResponseBody<"PUT", R_1>]>;
    post: <R_2 extends never>(route: R_2, params: API[R_2]["params"], headers: RequestHeaders<"POST", R_2>, body: RequestBody<"POST", R_2>) => Promise<[ResponseHeaders<"POST", R_2>, ResponseBody<"POST", R_2>]>;
};
export default _default;
