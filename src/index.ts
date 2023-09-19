/** Default tag key */
export const DEFAULT_TAG_KEY = Symbol('DEFAULT_TAG_KEY')
/** Type of default tag key */
export type DefaultTagKey = typeof DEFAULT_TAG_KEY

/**
 * TODO: write comment
 */
export declare const HIDDEN_TAG_KEY: unique symbol

export type HiddenTagKey = typeof HIDDEN_TAG_KEY

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
}[keyof T] & { [HIDDEN_TAG_KEY]?: TagKey }

/**
 * TODO: write comment
 */
export type AddHiddenTagKey<TaggedUnion, TagKey> = TaggedUnion & { [HIDDEN_TAG_KEY]?: TagKey }

/**
 * @example
 * Given the type definition:
 * type Shape = TaggedUnion<
 *   {
 *     circle: { radius: number }
 *     rect: { width: number; height: number }
 *   },
 *   'type'
 * >
 * The type TagKeyOf<Shape> will resolve to 'type'
 */
export type TagKeyOf<TaggedUnion> = TaggedUnion extends {
  [HIDDEN_TAG_KEY]?: infer TagKey extends keyof TaggedUnion
}
  ? TagKey
  : never

/**
 * @example
 * MergeIntersection<{ a: string } & { b: number }> is equivalent to { a: string; b: number }
 */
type MergeIntersection<T> = T extends T ? { [K in keyof T]: T[K] } : never

/**
 * TODO: write comment
 */
export function helperFunctionsOf<
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: DefaultTagKey } & Record<DefaultTagKey, string | symbol>,
>(): HelperFunctions<TaggedUnion>
export function helperFunctionsOf<
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion>): HelperFunctions<TaggedUnion>
export function helperFunctionsOf<
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion> = DEFAULT_TAG_KEY as any): HelperFunctions<TaggedUnion> {
  return new Proxy(
    {
      match: createMatch<TaggedUnion>(tagKey),
      is: createIs<TaggedUnion>(tagKey),
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
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
> = MergeIntersection<
  {
    match<
      Cases extends {
        [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], keyof any>]: (
          payload: Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>,
        ) => unknown
      },
    >(
      taggedUnion: TaggedUnion,
      cases: Cases,
    ): ReturnType<Cases[keyof Cases]>
    match<
      Cases extends {
        [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], keyof any>]?: (
          payload: Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>,
        ) => unknown
      },
      DefaultCase extends (
        payload: Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, keyof Cases>>,
      ) => unknown,
    >(
      taggedUnion: TaggedUnion,
      cases: Cases,
      defaultCase: DefaultCase,
    ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase>

    is: Is<TaggedUnion>
  } & {
    // If the payload is empty ({}), the argument can be omitted.
    [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], keyof any>]: PayloadOf<
      TaggedUnion,
      K
    > extends Record<keyof any, never>
      ? {
          (): Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>
          (payload: {}): Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>
        }
      : (
          payload: PayloadOf<TaggedUnion, K>,
        ) => Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>
  }
>

function createIs<
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion>): Is<TaggedUnion> {
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
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
> = MergeIntersection<{
  [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], keyof any>]: (
    taggedUnion: TaggedUnion,
  ) => taggedUnion is Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>
}>

function createMatch<
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion>) {
  function match<
    Cases extends {
      [K in TagKeyOf<TaggedUnion>]: (taggedUnion: VariantOf<TaggedUnion, K>) => unknown
    },
  >(taggedUnion: TaggedUnion, cases: Cases): ReturnType<Cases[keyof Cases]>
  function match<
    Cases extends {
      [K in TagKeyOf<TaggedUnion>]?: (taggedUnion: VariantOf<TaggedUnion, K>) => unknown
    },
    DefaultCase extends (taggedUnion: VariantOf<TaggedUnion, keyof Cases>) => unknown,
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
    defaultCase: DefaultCase,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase>
  function match<
    Cases extends {
      [K in TagKeyOf<TaggedUnion>]?: (variant: VariantOf<TaggedUnion, K>) => unknown
    },
    DefaultCase extends (taggedUnion: VariantOf<TaggedUnion, keyof Cases>) => unknown,
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
    defaultCase?: DefaultCase,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase> {
    const tagValue = taggedUnion[tagKey] as keyof any
    if (tagValue in cases) {
      return (cases as any)[tagValue](taggedUnion)
    }
    return (defaultCase as any)(taggedUnion)
  }

  return match
}

export type VariantOf<
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
  K extends keyof any,
> = Omit<Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>, HiddenTagKey>

/**
 * @example
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * type Payload = PayloadOf<Shape, 'circle'>
 * is equivalent to
 * type Payload = { radius: number }
 */
export type PayloadOf<
  TaggedUnion extends { [HIDDEN_TAG_KEY]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
  K extends keyof any,
> = Omit<
  Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>,
  TagKeyOf<TaggedUnion> | HiddenTagKey
>

type AssertExtends<T, U> = T extends infer V extends U ? V : never
