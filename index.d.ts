/// <reference types="node" />
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
export interface API {
}
export declare type Route<T extends RouteSignature> = T;
export declare type Routes = keyof API;
declare type RouteSignature = Partial<Record<Methods, MethodSignature>>;
interface MethodSignature {
    request: {
        headers: IncomingHttpHeaders;
        body?: any;
    };
    response: {
        headers: OutgoingHttpHeaders;
        body?: any;
    };
}
export declare type Methods = "GET" | "PUT" | "POST" | "HEAD" | "PATCH" | "DELETE";
declare type GetMethodSignature<M, R> = R extends Routes ? API[R] extends RouteSignature ? M extends keyof API[R] ? API[R][M] : never : never : never;
export declare type RequestBody<M extends Methods, R extends Routes> = GetMethodSignature<M, R> extends MethodSignature ? GetMethodSignature<M, R>["request"]["body"] : void;
export declare type ResponseBody<M extends Methods, R extends Routes> = GetMethodSignature<M, R> extends MethodSignature ? GetMethodSignature<M, R>["response"]["body"] : void;
export declare type RequestHeaders<M extends Methods, R extends Routes> = GetMethodSignature<M, R> extends MethodSignature ? GetMethodSignature<M, R>["request"]["headers"] extends IncomingHttpHeaders ? GetMethodSignature<M, R>["request"]["headers"] : never : never;
export declare type ResponseHeaders<M extends Methods, R extends Routes> = GetMethodSignature<M, R> extends MethodSignature ? GetMethodSignature<M, R>["response"]["headers"] extends IncomingHttpHeaders ? GetMethodSignature<M, R>["response"]["headers"] : never : never;
export declare type RoutesByMethod<M extends Methods> = {
    [R in Routes]: M extends keyof API[R] ? R : never;
}[Routes];
export declare type MethodsByRoute<R extends Routes> = {
    [M in keyof API[R]]: M extends Methods ? M : never;
}[keyof API[R]];
export declare type Params<R extends string> = R extends `/[[...${infer OptionalCatchAllParam}]]${infer OptionalCatchAllRest}` ? {
    [P in OptionalCatchAllParam]?: string[];
} & Params<OptionalCatchAllRest> : R extends `/[...${infer CatchAllParam}]${infer CatchAllRest}` ? {
    [P in CatchAllParam]: string[];
} & Params<CatchAllRest> : R extends `/[${infer Param}]${infer Rest}` ? {
    [P in Param]: string;
} & Params<Rest> : R extends `/${string}/${infer Rest}` ? Params<`/${Rest}`> : {};
export {};
