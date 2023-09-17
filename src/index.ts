export const TAG_KEY = Symbol('TAG_KEY')
export type TAG_KEY = typeof TAG_KEY

export type TaggedUnion<T extends Record<string, any>, TagKey extends keyof any = TAG_KEY> = {
  [K in keyof T]: Simplify<Record<TagKey, K> & T[K]>
}[keyof T]

type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never

export function createOperators<
  TaggedUnion extends { [TAG_KEY]: string },
>(): Operators<TaggedUnion> {
  return createOperatorsWithTagKey<TaggedUnion, TAG_KEY>(TAG_KEY)
}

export function withTagKey<TagKey extends keyof any>(
  tagKey: TagKey,
): {
  createOperators<TaggedUnion extends Record<TagKey, string>>(): Operators<TaggedUnion, TagKey>
} {
  return {
    createOperators<TaggedUnion extends Record<TagKey, string>>(): Operators<TaggedUnion, TagKey> {
      return createOperatorsWithTagKey<TaggedUnion, TagKey>(tagKey)
    },
  }
}

function createOperatorsWithTagKey<
  TaggedUnion extends Record<TagKey, string>,
  TagKey extends keyof any = TAG_KEY,
>(tagKey: TagKey): Operators<TaggedUnion, TagKey> {
  return new Proxy(
    {
      match: createMatch<TaggedUnion, TagKey>(tagKey),
      is: createIs<TaggedUnion, TagKey>(tagKey),
    },
    {
      get(target, key) {
        if (Reflect.has(target, key)) return Reflect.get(target, key)

        return (value?: object) => ({ ...(value ?? {}), [tagKey]: key })
      },
    },
  ) as any
}

type Operators<
  TaggedUnion extends Record<TagKey, string>,
  TagKey extends keyof any = TAG_KEY,
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
    // If the payload is empty ({}), the argument can be omitted.
    [K in TaggedUnion[TagKey]]: PayloadOf<TaggedUnion, TagKey, K> extends Record<keyof any, never>
      ? {
          (): Extract<TaggedUnion, Record<TagKey, K>>
          (payload: {}): Extract<TaggedUnion, Record<TagKey, K>>
        }
      : (payload: PayloadOf<TaggedUnion, TagKey, K>) => Extract<TaggedUnion, Record<TagKey, K>>
  }
>

function createIs<TaggedUnion extends Record<TagKey, string>, TagKey extends keyof any>(
  tagKey: TagKey,
): Is<TaggedUnion, TagKey> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (taggedUnion: TaggedUnion) => taggedUnion[tagKey] === key
      },
    },
  ) as any
}

type Is<TaggedUnion extends Record<TagKey, string>, TagKey extends keyof any = TAG_KEY> = Simplify<{
  [K in TaggedUnion[TagKey]]: (
    taggedUnion: TaggedUnion,
  ) => taggedUnion is Extract<TaggedUnion, Record<TagKey, K>>
}>

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

type PayloadOf<
  TaggedUnion extends Record<TagKey, string>,
  TagKey extends keyof any,
  K extends TaggedUnion[TagKey],
> = Omit<Extract<TaggedUnion, Record<TagKey, K>>, TagKey>
