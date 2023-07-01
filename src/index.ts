export const DISCRIMINANT = Symbol();

export type AbstractDataType<T extends Record<string, any>> = {
  [K in keyof T]: Simplify<{ [DISCRIMINANT]: K } & T[K]>;
}[keyof T];

type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never;

