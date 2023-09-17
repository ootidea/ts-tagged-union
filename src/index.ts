/** Default tag key */
export const DEFAULT_TAG_KEY = Symbol('DEFAULT_TAG_KEY')
/** Type of default tag key */
export type DefaultTagKey = typeof DEFAULT_TAG_KEY

/**
 * @example Default tag key
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * is equivalent to
 * type Shape =
 *   | { [DEFAULT_TAG_KEY]: 'circle'; radius: number }
 *   | { [DEFAULT_TAG_KEY]: 'rect'; width: number; height: number }
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
  TagKey extends keyof any = DefaultTagKey,
> = {
  [K in keyof T]: MergeIntersection<Record<TagKey, K> & T[K]>
}[keyof T]

/**
 * @example
 * Simplify<{ a: string } & { b: number }> is equivalent to { a: string; b: number }
 */
type MergeIntersection<T> = T extends T ? { [K in keyof T]: T[K] } : never

export function helperFunctionsOf<
  TaggedUnion extends { [DEFAULT_TAG_KEY]: string | symbol },
>(): HelperFunctions<TaggedUnion> {
  return createHelperFunctionsWithTagKey<TaggedUnion, DefaultTagKey>(DEFAULT_TAG_KEY)
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
 * const Shape = withTagKey('type').helperFunctionsOf<Shape>()
 */
export function withTagKey<TagKey extends keyof any>(
  tagKey: TagKey,
): {
  helperFunctionsOf<TaggedUnion extends Record<TagKey, string | symbol>>(): HelperFunctions<
    TaggedUnion,
    TagKey
  >
} {
  return {
    helperFunctionsOf<TaggedUnion extends Record<TagKey, string | symbol>>(): HelperFunctions<
      TaggedUnion,
      TagKey
    > {
      return createHelperFunctionsWithTagKey<TaggedUnion, TagKey>(tagKey)
    },
  }
}

function createHelperFunctionsWithTagKey<
  TaggedUnion extends Record<TagKey, string | symbol>,
  TagKey extends keyof any = DefaultTagKey,
>(tagKey: TagKey): HelperFunctions<TaggedUnion, TagKey> {
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

type HelperFunctions<
  TaggedUnion extends Record<TagKey, string | symbol>,
  TagKey extends keyof any = DefaultTagKey,
> = MergeIntersection<
  {
    match<
      Cases extends {
        [K in TaggedUnion[TagKey]]: (payload: Extract<TaggedUnion, Record<TagKey, K>>) => unknown
      },
    >(
      taggedUnion: TaggedUnion,
      cases: Cases,
    ): ReturnType<Cases[keyof Cases]>
    match<
      Cases extends {
        [K in TaggedUnion[TagKey]]?: (payload: Extract<TaggedUnion, Record<TagKey, K>>) => unknown
      },
      DefaultCase extends (payload: Extract<TaggedUnion, Record<TagKey, keyof Cases>>) => unknown,
    >(
      taggedUnion: TaggedUnion,
      cases: Cases,
      defaultCase: DefaultCase,
    ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase>

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
  TagKey extends keyof any = DefaultTagKey,
> = MergeIntersection<{
  [K in TaggedUnion[TagKey]]: (
    taggedUnion: TaggedUnion,
  ) => taggedUnion is Extract<TaggedUnion, Record<TagKey, K>>
}>

function createMatch<TaggedUnion extends Record<TagKey, string | symbol>, TagKey extends keyof any>(
  tagKey: TagKey,
) {
  function match<
    Cases extends {
      [K in TaggedUnion[TagKey]]: (payload: Extract<TaggedUnion, Record<TagKey, K>>) => unknown
    },
  >(taggedUnion: TaggedUnion, cases: Cases): ReturnType<Cases[keyof Cases]>
  function match<
    Cases extends {
      [K in TaggedUnion[TagKey]]?: (payload: Extract<TaggedUnion, Record<TagKey, K>>) => unknown
    },
    DefaultCase extends (payload: Extract<TaggedUnion, Record<TagKey, keyof Cases>>) => unknown,
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
    defaultCase: DefaultCase,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase>
  function match<
    Cases extends {
      [K in TaggedUnion[TagKey]]?: (payload: PayloadOf<TaggedUnion, TagKey, K>) => unknown
    },
    DefaultCase extends (payload: Extract<TaggedUnion, Record<TagKey, keyof Cases>>) => unknown,
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
    defaultCase?: DefaultCase,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase> {
    const tagValue = taggedUnion[tagKey]
    if (tagValue in cases) {
      return (cases as any)[tagValue](taggedUnion)
    }
    return (defaultCase as any)(taggedUnion)
  }

  return match
}

/**
 * @example
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * type Payload = PayloadOf<Shape, DEFAULT_TAG_KEY, 'circle'>
 * is equivalent to
 * type Payload = { radius: number }
 */
type PayloadOf<
  TaggedUnion extends Record<TagKey, string | symbol>,
  TagKey extends keyof any,
  K extends TaggedUnion[TagKey],
> = Omit<Extract<TaggedUnion, Record<TagKey, K>>, TagKey>
