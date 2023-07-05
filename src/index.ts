export const TAG_KEY = Symbol();

export type TaggedUnion<T extends Record<string, any>> = {
  [K in keyof T]: Simplify<{ [TAG_KEY]: K } & T[K]>;
}[keyof T];

type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never;

type Payload<Adt extends { [TAG_KEY]: string }, K extends Adt[typeof TAG_KEY]> = Simplify<
  Omit<Simplify<Adt & { [TAG_KEY]: K }>, typeof TAG_KEY>
>;

type TypePredicates<Adt extends { [TAG_KEY]: string }> = Simplify<{
  [K in Adt[typeof TAG_KEY]]: (adt: Adt) => adt is Simplify<Adt & { [TAG_KEY]: K }>;
}>;
function createTypePredicates<Adt extends { [TAG_KEY]: string }>(): TypePredicates<Adt> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (adt: Adt) => adt[TAG_KEY] === key;
      },
    },
  ) as any;
}

export function operatorsOf<Adt extends { [TAG_KEY]: string }>(): Simplify<
  {
    match: <
      Matchers extends {
        [K in Adt[typeof TAG_KEY]]: (payload: Payload<Adt, K>) => unknown;
      },
    >(
      adt: Adt,
      matchers: Matchers,
    ) => ReturnType<Matchers[keyof Matchers]>;
    is: TypePredicates<Adt>;
  } & {
    [K in Adt[typeof TAG_KEY]]: <const T extends Payload<Adt, K>>(payload: T) => Simplify<T & { [TAG_KEY]: K }>;
  }
> {
  return new Proxy(
    {
      match: <
        Matchers extends {
          [K in Adt[typeof TAG_KEY]]: (payload: Payload<Adt, K>) => unknown;
        },
      >(
        adt: Adt,
        matchers: Matchers,
      ): ReturnType<Matchers[keyof Matchers]> => {
        return (matchers as any)[adt[TAG_KEY]](adt);
      },
      is: createTypePredicates<Adt>(),
    },
    {
      get(target, key) {
        if (Reflect.has(target, key)) return Reflect.get(target, key);

        return (value: object) => ({ ...value, [TAG_KEY]: key });
      },
    },
  ) as any;
}
