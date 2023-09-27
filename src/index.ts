import { MergeIntersection } from './utility'

export { createHelperFunctions } from './createHelperFunctions'

/** Default tag key of the tagged union created with this library */
export const defaultTagKey = Symbol('defaultTagKey')

/**
 * The key of tag-key-pointer property that specify which property is a tag.
 * It exists only at the type level, so it does not affect runtime.
 * @example
 * In the following example, the tag key ('type') is specified by the tag-key-pointer property.
 * type Shape = (
 *   | { type: 'circle'; radius: number }
 *   | { type: 'rect'; width: number; height: number }
 * ) & {
 *   [tagKeyPointer]?: 'type'
 * }
 */
export declare const tagKeyPointer: unique symbol

/**
 * Define a tagged union type.
 * @example Default tag key
 * The type definition:
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * is equivalent to:
 * type Shape = (
 *   | { [defaultTagKey]: 'circle'; radius: number }
 *   | { [defaultTagKey]: 'rect'; width: number; height: number }
 * ) & {
 *   [tagKeyPointer]?: typeof defaultTagKey
 * }
 *
 * @example Custom tag key
 * The type definition:
 * type Shape = TaggedUnion<
 *   {
 *     circle: { radius: number }
 *     rect: { width: number; height: number }
 *   },
 *   'type'
 * >
 * is equivalent to:
 * type Shape = (
 *   | { type: 'circle'; radius: number }
 *   | { type: 'rect'; width: number; height: number }
 * ) & {
 *   [tagKeyPointer]?: 'type'
 * }
 */
export type TaggedUnion<
  Payloads extends Record<string | symbol, any>,
  TagKey extends string | symbol = typeof defaultTagKey,
> = {
  [K in keyof Payloads]: MergeIntersection<Record<TagKey, K> & Payloads[K]>
}[keyof Payloads] & { [tagKeyPointer]?: TagKey }

/**
 * Add the tag-key-pointer property to the given tagged union type.
 * @see tagKeyPointer
 * @see RemoveTagKeyPointer
 * @example
 * Given the type definition:
 * type RawTaggedUnion =
 *   | { type: 'circle', radius: number }
 *   | { type: 'rect', width: number; height: number }
 * The type:
 * AddTagKeyPointer<RawTaggedUnion, 'type'>
 * will resolve to:
 * (
 *   | { type: 'circle'; radius: number }
 *   | { type: 'rect'; width: number; height: number }
 * ) & {
 *   [tagKeyPointer]?: 'type'
 * }
 */
export type AddTagKeyPointer<T, TagKey extends keyof T> = T & {
  [tagKeyPointer]?: TagKey
}

/**
 * Remove the tag-key-pointer property from the given tagged union type.
 * @see tagKeyPointer
 * @see AddTagKeyPointer
 */
export type RemoveTagKeyPointer<T> = Omit<T, typeof tagKeyPointer>

/**
 * Get the tag key of the given tagged union type.
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
export type TagKeyOf<T> = T extends {
  [tagKeyPointer]?: infer TagKey extends keyof T
}
  ? TagKey
  : never

/**
 * @example
 * Given the type definition:
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * The type VariantOf<Shape, 'circle'> will resolve to { [defaultTagKey]: 'circle', radius: number }.
 */
export type VariantOf<
  T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>,
  K extends string | symbol,
> = Omit<Extract<T, Record<TagKeyOf<T>, K>>, typeof tagKeyPointer>

/**
 * @example
 * Given the type definition:
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * The type PayloadOf<Shape, 'circle'> will resolve to { radius: number }.
 */
export type PayloadOf<
  T extends { [tagKeyPointer]?: keyof T } & Record<TagKeyOf<T>, string | symbol>,
  K extends string | symbol,
> = Omit<Extract<T, Record<TagKeyOf<T>, K>>, TagKeyOf<T> | typeof tagKeyPointer>
