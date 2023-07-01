export const DISCRIMINANT = Symbol();

export type AbstractDataType<T extends Record<string, any>> = {
  [K in keyof T]: Simplify<{ [DISCRIMINANT]: K } & T[K]>;
}[keyof T];

type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never;

type Payload<Adt extends { [DISCRIMINANT]: string }, K extends Adt[typeof DISCRIMINANT]> = Simplify<
  Omit<Simplify<Adt & { [DISCRIMINANT]: K }>, typeof DISCRIMINANT>
>;

type Ctors<Adt extends { [DISCRIMINANT]: string }> = Simplify<{
  [K in Adt[typeof DISCRIMINANT]]: (payload: Payload<Adt, K>) => Simplify<Adt & { [DISCRIMINANT]: K }>;
}>;
export function createCtors<Adt extends { [DISCRIMINANT]: string }>(): Ctors<Adt> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (value: object) => ({ ...value, [DISCRIMINANT]: key });
      },
    },
  ) as any;
}

export function match<
  Adt extends { [DISCRIMINANT]: string },
  Matchers extends {
    [K in Adt[typeof DISCRIMINANT]]: (payload: Payload<Adt, K>) => unknown;
  },
>(adt: Adt, matchers: Matchers): ReturnType<Matchers[keyof Matchers]> {
  return (matchers as any)[adt[DISCRIMINANT]](adt);
}
