import { defaultTagKey, PayloadOf, TagKeyOf, tagKeyPointer, VariantOf } from './index'
import { AssertExtends, MergeIntersection } from './utility'

/**
 * Create helper functions for the given tagged union type.
 * If the type has a custom tag key, you need to provide the tag key as an argument.
 * @example Default tag key
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * const Shape = createHelperFunctions<Shape>()
 * @example Custom tag key
 * type Shape = TaggedUnion<
 *   {
 *     circle: { radius: number }
 *     rect: { width: number; height: number }
 *   },
 *   'type'
 * >
 * const Shape = createHelperFunctions<Shape>('type')
 */
export function createHelperFunctions<
  T extends { [tagKeyPointer]?: typeof defaultTagKey } & Record<typeof defaultTagKey, string | symbol>,
>(): HelperFunctions<T>
export function createHelperFunctions<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>>(
  tagKey: TagKeyOf<T>,
): HelperFunctions<T>
export function createHelperFunctions<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>>(
  tagKey: TagKeyOf<T> = defaultTagKey as any,
): HelperFunctions<T> {
  return new Proxy(
    {
      match: createMatch<T>(tagKey),
      matchPartial: createMatchPartial<T>(tagKey),
      is: createIs<T>(tagKey),
      isNot: createIsNot<T>(tagKey),
      tagKey,
    },
    {
      get(target, key) {
        if (Reflect.has(target, key)) return Reflect.get(target, key)

        return (value?: object) => ({ ...(value ?? {}), [tagKey]: key })
      },
    },
  ) as any
}

type HelperFunctions<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>> =
  MergeIntersection<
    {
      /**
       * Exhaustive pattern matching.
       * @example
       * const area = Shape.match(circle, {
       *   rect: ({ width, height }) => width * height,
       *   circle: ({ radius }) => radius * radius * Math.PI,
       * })
       * @example With default case
       * const isAchromatic = Color.match(
       *   color,
       *   { rgb: ({ r, g, b }) => r === g && g === b },
       *   (other) => false,
       * )
       */
      match: Match<T>
      /**
       * Non-exhaustive pattern matching.
       * @example
       * const width = Shape.matchPartial(shape, {
       *   rect: ({ width }) => width,
       * })
       */
      matchPartial: MatchPartial<T>
      /**
       * A type guard function that checks if the given object matches the specified variant.
       * @example
       * if (Shape.is.circle(shape)) {
       *   console.log(shape.radius)
       * }
       */
      is: Is<T>
      /**
       * A type guard function that checks if the given object does not match the specified variant.
       * @example
       * if (Shape.isNot.circle(shape)) {
       *   console.log(shape)
       * }
       */
      isNot: IsNot<T>
      /**
       * The tag key of the tagged union type.
       * @example
       * type Shape = TaggedUnion<
       *   {
       *     circle: { radius: number }
       *     rect: { width: number; height: number }
       *   },
       *   'type'
       * >
       * const Shape = createHelperFunctions<Shape>('type')
       * console.log(Shape.tagKey) // 'type'
       */
      tagKey: TagKeyOf<T>
    } & {
      // If the payload is empty ({}), the argument can be omitted.
      [K in AssertExtends<T[TagKeyOf<T>], string | symbol>]: PayloadOf<T, K> extends Record<keyof any, never>
        ? {
            (): Extract<T, Record<TagKeyOf<T>, K>>
            (payload: {}): Extract<T, Record<TagKeyOf<T>, K>>
          }
        : (payload: PayloadOf<T, K>) => Extract<T, Record<TagKeyOf<T>, K>>
    }
  >

function createIs<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>>(
  tagKey: TagKeyOf<T>,
): Is<T> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (taggedUnion: T) => taggedUnion[tagKey] === key
      },
    },
  ) as any
}

type Is<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>> = MergeIntersection<{
  [K in AssertExtends<T[TagKeyOf<T>], string | symbol>]: (
    taggedUnion: T,
  ) => taggedUnion is Extract<T, Record<TagKeyOf<T>, K>>
}>

function createIsNot<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>>(
  tagKey: TagKeyOf<T>,
): Is<T> {
  return new Proxy(
    {},
    {
      get(target, key) {
        return (taggedUnion: T) => taggedUnion[tagKey] !== key
      },
    },
  ) as any
}

type IsNot<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>> = MergeIntersection<{
  [K in AssertExtends<T[TagKeyOf<T>], string | symbol>]: (
    taggedUnion: T,
  ) => taggedUnion is Exclude<T, Record<TagKeyOf<T>, K>>
}>

function createMatch<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>>(
  tagKey: TagKeyOf<T>,
) {
  return function <
    Cases extends {
      [K in AssertExtends<TagKeyOf<T>, string | symbol>]?: (variant: VariantOf<T, K>) => unknown
    },
    DefaultCase extends (taggedUnion: VariantOf<T, Exclude<keyof Cases, number>>) => unknown,
  >(
    taggedUnion: T,
    cases: Cases,
    defaultCase?: DefaultCase,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase> {
    const tagValue = taggedUnion[tagKey] as string | symbol
    if (tagValue in cases) {
      return (cases as any)[tagValue](taggedUnion)
    }
    return (defaultCase as any)(taggedUnion)
  }
}

type Match<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>> = {
  <
    Cases extends {
      [K in AssertExtends<T[TagKeyOf<T>], string | symbol>]: (variant: VariantOf<T, K>) => unknown
    },
  >(
    taggedUnion: T,
    cases: Cases,
  ): ReturnType<Cases[keyof Cases]>
  <
    Cases extends {
      [K in AssertExtends<T[TagKeyOf<T>], string | symbol>]?: (variant: VariantOf<T, K>) => unknown
    },
    DefaultCase extends (taggedUnion: VariantOf<T, Exclude<keyof Cases, number>>) => unknown,
  >(
    taggedUnion: T,
    cases: Cases,
    defaultCase: DefaultCase,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | ReturnType<DefaultCase>
}

function createMatchPartial<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>>(
  tagKey: TagKeyOf<T>,
): MatchPartial<T> {
  function matchPartial<
    Cases extends {
      [K in AssertExtends<T[TagKeyOf<T>], string | symbol>]?: (variant: VariantOf<T, K>) => unknown
    },
  >(taggedUnion: T, cases: Cases): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | undefined {
    const tagValue = taggedUnion[tagKey] as string | symbol
    if (tagValue in cases) {
      return (cases as any)[tagValue](taggedUnion)
    }
    return undefined
  }

  return matchPartial
}

type MatchPartial<T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>> = {
  <
    Cases extends {
      [K in AssertExtends<T[TagKeyOf<T>], string | symbol>]?: (variant: VariantOf<T, K>) => unknown
    },
  >(
    taggedUnion: T,
    cases: Cases,
  ): (Cases[keyof Cases] extends (...args: any) => infer R ? R : never) | undefined
}
