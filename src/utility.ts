/**
 * @example
 * MergeIntersection<{ a: string } & { b: number }> is equivalent to { a: string; b: number }
 */
export type MergeIntersection<T> = T extends T ? { [K in keyof T]: T[K] } : never

export type AssertExtends<T, U> = T extends infer V extends U ? V : never
