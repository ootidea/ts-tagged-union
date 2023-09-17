/** Default tag key */
export const TAG_KEY = Symbol('TAG_KEY')
/** Type of default tag key */
export type TAG_KEY = typeof TAG_KEY

/**
 * @example Default tag key
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * is equivalent to
 * type Shape =
 *   | { [TAG_KEY]: 'circle'; radius: number }
 *   | { [TAG_KEY]: 'rect'; width: number; height: number }
 *
 * @example Custom tag key
 * type Shape = TaggedUnion<
 *   {
 *     circle: { radius: number }
 *     rect: { width: number; height: number }
 *   },
 *   'type'
 * >
 * is equivalent to
 * type Shape =
 *   | { type: 'circle'; radius: number }
 *   | { type: 'rect'; width: number; height: number }
 */
export type TaggedUnion<
  T extends Record<string | symbol, any>,
  TagKey extends keyof any = TAG_KEY,
> = {
  [K in keyof T]: Simplify<Record<TagKey, K> & T[K]>
}[keyof T]

/**
 * @example
 * Simplify<{ a: string } & { b: number }> is equivalent to { a: string; b: number }
 */
type Simplify<T> = T extends T ? { [K in keyof T]: T[K] } : never

export function createOperators<
  TaggedUnion extends { [TAG_KEY]: string | symbol },
>(): Operators<TaggedUnion> {
  return createOperatorsWithTagKey<TaggedUnion, TAG_KEY>(TAG_KEY)
}

/**
 * @example
 * type Shape = TaggedUnion<
 *   {
 *     circle: { radius: number }
 *     rect: { width: number; height: number }
 *   },
 *   'type'
 * >
 * const Shape = withTagKey('type').createOperators<Shape>()
 */
export function withTagKey<TagKey extends keyof any>(
  tagKey: TagKey,
): {
  createOperators<TaggedUnion extends Record<TagKey, string | symbol>>(): Operators<
    TaggedUnion,
    TagKey
  >
} {
  return {
    createOperators<TaggedUnion extends Record<TagKey, string | symbol>>(): Operators<
      TaggedUnion,
      TagKey
    > {
      return createOperatorsWithTagKey<TaggedUnion, TagKey>(tagKey)
    },
  }
}

function createOperatorsWithTagKey<
  TaggedUnion extends Record<TagKey, string | symbol>,
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
  TaggedUnion extends Record<TagKey, string | symbol>,
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

function createIs<TaggedUnion extends Record<TagKey, string | symbol>, TagKey extends keyof any>(
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

type Is<
  TaggedUnion extends Record<TagKey, string | symbol>,
  TagKey extends keyof any = TAG_KEY,
> = Simplify<{
  [K in TaggedUnion[TagKey]]: (
    taggedUnion: TaggedUnion,
  ) => taggedUnion is Extract<TaggedUnion, Record<TagKey, K>>
}>

const createMatch =
  <TaggedUnion extends Record<TagKey, string | symbol>, TagKey extends keyof any>(tagKey: TagKey) =>
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

/**
 * @example
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * type Payload = PayloadOf<Shape, TAG_KEY, 'circle'>
 * is equivalent to
 * type Payload = { radius: number }
 */
type PayloadOf<
  TaggedUnion extends Record<TagKey, string | symbol>,
  TagKey extends keyof any,
  K extends TaggedUnion[TagKey],
> = Omit<Extract<TaggedUnion, Record<TagKey, K>>, TagKey>
