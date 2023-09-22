import { DEFAULT_TAG_KEY, PayloadOf, TAG_KEY_POINTER, TagKeyOf, VariantOf } from './index'
import { AssertExtends, MergeIntersection } from './utility'

/**
 * Create helper functions for the given tagged union type.
 * If the type has a custom tag key, you need to provide the tag key as an argument.
 * @example Default tag key
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * const Shape = helperFunctionsOf<Shape>()
 * @example Custom tag key
 * type Shape = TaggedUnion<
 *   {
 *     circle: { radius: number }
 *     rect: { width: number; height: number }
 *   },
 *   'type'
 * >
 * const Shape = helperFunctionsOf<Shape>('type')
 */
export function helperFunctionsOf<
  TaggedUnion extends { [TAG_KEY_POINTER]?: typeof DEFAULT_TAG_KEY } & Record<
    typeof DEFAULT_TAG_KEY,
    string | symbol
  >,
>(): HelperFunctions<TaggedUnion>
export function helperFunctionsOf<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion>): HelperFunctions<TaggedUnion>
export function helperFunctionsOf<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion> = DEFAULT_TAG_KEY as any): HelperFunctions<TaggedUnion> {
  return new Proxy(
    {
      match: createMatch<TaggedUnion>(tagKey),
      matchPartial: createMatchPartial<TaggedUnion>(tagKey),
      is: createIs<TaggedUnion>(tagKey),
      isNot: createIsNot<TaggedUnion>(tagKey),
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
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
> = MergeIntersection<
  {
    match: Match<TaggedUnion>
    matchPartial: MatchPartial<TaggedUnion>
    is: Is<TaggedUnion>
    isNot: IsNot<TaggedUnion>
  } & {
    // If the payload is empty ({}), the argument can be omitted.
    [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], string | symbol>]: PayloadOf<
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
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
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
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
> = MergeIntersection<{
  [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], string | symbol>]: (
    taggedUnion: TaggedUnion,
  ) => taggedUnion is Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>
}>

function createIsNot<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion>): Is<TaggedUnion> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (taggedUnion: TaggedUnion) => taggedUnion[tagKey] !== key
      },
    },
  ) as any
}

type IsNot<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
> = MergeIntersection<{
  [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], string | symbol>]: (
    taggedUnion: TaggedUnion,
  ) => taggedUnion is Exclude<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>
}>

function createMatch<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion>): Match<TaggedUnion> {
  function match<
    Cases extends {
      [K in AssertExtends<TagKeyOf<TaggedUnion>, string | symbol>]?: (
        variant: VariantOf<TaggedUnion, K>,
      ) => unknown
    },
    DefaultCase extends (
      taggedUnion: VariantOf<TaggedUnion, Exclude<keyof Cases, number>>,
    ) => unknown,
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
    defaultCase?: DefaultCase,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase> {
    const tagValue = taggedUnion[tagKey] as string | symbol
    if (tagValue in cases) {
      return (cases as any)[tagValue](taggedUnion)
    }
    return (defaultCase as any)(taggedUnion)
  }

  return match
}

type Match<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
> = {
  <
    Cases extends {
      [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], string | symbol>]: (
        payload: Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>,
      ) => unknown
    },
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
  ): ReturnType<Cases[keyof Cases]>
  <
    Cases extends {
      [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], string | symbol>]?: (
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
}

function createMatchPartial<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
>(tagKey: TagKeyOf<TaggedUnion>): MatchPartial<TaggedUnion> {
  function matchPartial<
    Cases extends {
      [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], string | symbol>]?: (
        variant: VariantOf<TaggedUnion, K>,
      ) => unknown
    },
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | undefined {
    const tagValue = taggedUnion[tagKey] as string | symbol
    if (tagValue in cases) {
      return (cases as any)[tagValue](taggedUnion)
    }
    return undefined
  }

  return matchPartial
}

type MatchPartial<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
> = {
  <
    Cases extends {
      [K in AssertExtends<TaggedUnion[TagKeyOf<TaggedUnion>], string | symbol>]?: (
        variant: VariantOf<TaggedUnion, K>,
      ) => unknown
    },
  >(
    taggedUnion: TaggedUnion,
    cases: Cases,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | undefined
}
