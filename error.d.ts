export declare class ApiError extends Error {
    readonly status: number;
    constructor(status?: number, message?: string);
}
