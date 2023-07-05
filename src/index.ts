export const DISCRIMINANT = Symbol();

export type AlgebraicDataType<T extends Record<string, any>> = {
  [K in keyof T]: Simplify<{ [DISCRIMINANT]: K } & T[K]>;
}[keyof T];

type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never;

type Payload<Adt extends { [DISCRIMINANT]: string }, K extends Adt[typeof DISCRIMINANT]> = Simplify<
  Omit<Simplify<Adt & { [DISCRIMINANT]: K }>, typeof DISCRIMINANT>
>;

type TypePredicates<Adt extends { [DISCRIMINANT]: string }> = Simplify<{
  [K in Adt[typeof DISCRIMINANT]]: (adt: Adt) => adt is Simplify<Adt & { [DISCRIMINANT]: K }>;
}>;
function createTypePredicates<Adt extends { [DISCRIMINANT]: string }>(): TypePredicates<Adt> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (adt: Adt) => adt[DISCRIMINANT] === key;
      },
    },
  ) as any;
}

export function operatorsOf<Adt extends { [DISCRIMINANT]: string }>(): Simplify<
  {
    match: <
      Matchers extends {
        [K in Adt[typeof DISCRIMINANT]]: (payload: Payload<Adt, K>) => unknown;
      },
    >(
      adt: Adt,
      matchers: Matchers,
    ) => ReturnType<Matchers[keyof Matchers]>;
    is: TypePredicates<Adt>;
  } & {
    [K in Adt[typeof DISCRIMINANT]]: <const T extends Payload<Adt, K>>(
      payload: T,
    ) => Simplify<T & { [DISCRIMINANT]: K }>;
  }
> {
  return new Proxy(
    {
      match: <
        Matchers extends {
          [K in Adt[typeof DISCRIMINANT]]: (payload: Payload<Adt, K>) => unknown;
        },
      >(
        adt: Adt,
        matchers: Matchers,
      ): ReturnType<Matchers[keyof Matchers]> => {
        return (matchers as any)[adt[DISCRIMINANT]](adt);
      },
      is: createTypePredicates<Adt>(),
    },
    {
      get(target, key) {
        if (Reflect.has(target, key)) return Reflect.get(target, key);

        return (value: object) => ({ ...value, [DISCRIMINANT]: key });
      },
    },
  ) as any;
}
