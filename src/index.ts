export const TAG_KEY = Symbol()

export type TaggedUnion<T extends Record<string, any>, D extends keyof any = typeof TAG_KEY> = {
  [K in keyof T]: Simplify<Record<D, K> & T[K]>
}[keyof T]

type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never

type Payload<Adt extends { [TAG_KEY]: string }, K extends Adt[typeof TAG_KEY]> = Simplify<
  Omit<Simplify<Adt & { [TAG_KEY]: K }>, typeof TAG_KEY>
>

type Is<Adt extends Record<D, string>, D extends keyof any = typeof TAG_KEY> = Simplify<{
  [K in Adt[D]]: (adt: Adt) => adt is Simplify<Adt & Record<D, K>>
}>
function createIs<Adt extends Record<D, string>, D extends keyof any>(tagKey: D): Is<Adt, D> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (adt: Adt) => adt[tagKey] === key
      },
    },
  ) as any
}

export function operatorsOf<Adt extends { [TAG_KEY]: string }>(): Simplify<
  {
    match: <
      Matchers extends {
        [K in Adt[typeof TAG_KEY]]: (payload: Payload<Adt, K>) => unknown
      },
    >(
      adt: Adt,
      matchers: Matchers,
    ) => ReturnType<Matchers[keyof Matchers]>
    is: Is<Adt>
  } & {
    [K in Adt[typeof TAG_KEY]]: <const T extends Payload<Adt, K>>(payload: T) => Simplify<T & { [TAG_KEY]: K }>
  }
> {
  return new Proxy(
    {
      match: <
        Matchers extends {
          [K in Adt[typeof TAG_KEY]]: (payload: Payload<Adt, K>) => unknown
        },
      >(
        adt: Adt,
        matchers: Matchers,
      ): ReturnType<Matchers[keyof Matchers]> => {
        return (matchers as any)[adt[TAG_KEY]](adt)
      },
      is: createIs<Adt, typeof TAG_KEY>(TAG_KEY),
    },
    {
      get(target, key) {
        if (Reflect.has(target, key)) return Reflect.get(target, key)

        return (value: object) => ({ ...value, [TAG_KEY]: key })
      },
    },
  ) as any
}

export function defineTaggedUnion<const Payloads extends Record<string, any>>(): {
  withTagKey: <const D extends keyof any>(
    tagKey: D,
  ) => Simplify<
    {
      match: <Matchers extends { [K in keyof Payloads]: (payload: Payloads[K]) => unknown }>(
        adt: TaggedUnion<Payloads, D>,
        matchers: Matchers,
      ) => ReturnType<Matchers[keyof Matchers]>
      is: Is<TaggedUnion<Payloads, D>, D>
    } & {
      [K in keyof Payloads]: <const T extends Payloads[K]>(payload: T) => Simplify<T & Record<D, K>>
    }
  >
} {
  return {
    withTagKey: <const D extends keyof any>(tagKey: D) => {
      function match<
        Matchers extends {
          [K in keyof Payloads]: (payload: Payloads[K]) => unknown
        },
      >(adt: TaggedUnion<Payloads, D>, matchers: Matchers): ReturnType<Matchers[keyof Matchers]> {
        return (matchers as any)[adt[tagKey]](adt)
      }

      return new Proxy(
        {
          match,
          is: createIs<TaggedUnion<Payloads, D>, D>(tagKey),
        },
        {
          get(target, key) {
            if (Reflect.has(target, key)) return Reflect.get(target, key)

            return (value: object) => ({ ...value, [tagKey]: key })
          },
        },
      )
    },
  } as any
}

export type ExtractTaggedUnionType<T extends { match: (adt: any, matchers: any) => any }> = Parameters<T['match']>[0]
