export const TAG_KEY = Symbol()

export type TaggedUnion<T extends Record<string, any>, D extends keyof any = typeof TAG_KEY> = {
  [K in keyof T]: Simplify<Record<D, K> & T[K]>
}[keyof T]

type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never

type PayloadOf<
  TaggedUnion extends Record<TagKey, string>,
  TagKey extends keyof any,
  K extends TaggedUnion[TagKey],
> = Simplify<Omit<Simplify<TaggedUnion & Record<TagKey, K>>, TagKey>>

type Is<TaggedUnion extends Record<D, string>, D extends keyof any = typeof TAG_KEY> = Simplify<{
  [K in TaggedUnion[D]]: (
    taggedUnion: TaggedUnion,
  ) => taggedUnion is Simplify<TaggedUnion & Record<D, K>>
}>
function createIs<TaggedUnion extends Record<D, string>, D extends keyof any>(
  tagKey: D,
): Is<TaggedUnion, D> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (taggedUnion: TaggedUnion) => taggedUnion[tagKey] === key
      },
    },
  ) as any
}

type Operators<
  TaggedUnion extends Record<TagKey, string>,
  TagKey extends keyof any = typeof TAG_KEY,
> = Simplify<
  {
    match: <
      Cases extends {
        [K in TaggedUnion[TagKey]]: (payload: PayloadOf<TaggedUnion, TagKey, K>) => unknown
      },
    >(
      taggedUnion: TaggedUnion,
      cases: Cases,
    ) => ReturnType<Cases[keyof Cases]>
    is: Is<TaggedUnion, TagKey>
  } & {
    [K in TaggedUnion[TagKey]]: (
      payload: PayloadOf<TaggedUnion, TagKey, K>,
    ) => Simplify<PayloadOf<TaggedUnion, TagKey, K> & Record<TagKey, K>>
  }
>

const createMatch =
  <TaggedUnion extends Record<TagKey, string>, TagKey extends keyof any>(tagKey: TagKey) =>
  <
    Cases extends {
      [K in TaggedUnion[TagKey]]: (payload: PayloadOf<TaggedUnion, TagKey, K>) => unknown
    },
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
  ): ReturnType<Cases[keyof Cases]> => {
    return (cases as any)[taggedUnion[tagKey]](taggedUnion)
  }

export function createOperators<
  TaggedUnion extends { [TAG_KEY]: string },
>(): Operators<TaggedUnion> {
  return new Proxy(
    {
      match: createMatch<TaggedUnion, typeof TAG_KEY>(TAG_KEY),
      is: createIs<TaggedUnion, typeof TAG_KEY>(TAG_KEY),
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
  withTagKey: <TagKey extends keyof any>(
    tagKey: TagKey,
  ) => Operators<TaggedUnion<Payloads, TagKey>, TagKey>
} {
  return {
    withTagKey: <D extends keyof any>(tagKey: D) => {
      return new Proxy(
        {
          match: createMatch<TaggedUnion<Payloads, D>, D>(tagKey),
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

export type ExtractTaggedUnionType<T extends { match: (taggedUnion: any, cases: any) => any }> =
  Parameters<T['match']>[0]
