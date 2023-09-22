import { MergeIntersection } from './utility'

export { createHelperFunctions } from './createHelperFunctions'

/** Default tag key of the tagged union created with this library */
export const DEFAULT_TAG_KEY = Symbol('DEFAULT_TAG_KEY')

/**
 * The key of tag-key-pointer property that specify which property is a tag.
 * It exists only at the type level, so it does not affect runtime.
 * @example
 * In the following example, the tag key ('type') is specified by the tag-key-pointer property.
 * type Shape = (
 *   | { type: 'circle'; radius: number }
 *   | { type: 'rect'; width: number; height: number }
 * ) & {
 *   [TAG_KEY_POINTER]?: 'type'
 * }
 */
export declare const TAG_KEY_POINTER: unique symbol

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
 *   | { [DEFAULT_TAG_KEY]: 'circle'; radius: number }
 *   | { [DEFAULT_TAG_KEY]: 'rect'; width: number; height: number }
 * ) & {
 *   [TAG_KEY_POINTER]?: typeof DEFAULT_TAG_KEY
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
 *   [TAG_KEY_POINTER]?: 'type'
 * }
 */
export type TaggedUnion<
  Payloads extends Record<string | symbol, any>,
  TagKey extends string | symbol = typeof DEFAULT_TAG_KEY,
> = {
  [K in keyof Payloads]: MergeIntersection<Record<TagKey, K> & Payloads[K]>
}[keyof Payloads] & { [TAG_KEY_POINTER]?: TagKey }

/**
 * Add the tag-key-pointer property to the given tagged union type.
 * @see TAG_KEY_POINTER
 * @see RemoveTagKeyPointer
 * @example
 * Given the type definition:
 * type RawTaggedUnion =
 *   | { type: 'circle', radius: number }
 *   | { type: 'rect', width: number; height: number }
 * The type:
 * type TaggedUnion = AddTagKeyPointer<RawTaggedUnion, 'type'>
 * will resolve to:
 * type TaggedUnion = (
 *   | { type: 'circle'; radius: number }
 *   | { type: 'rect'; width: number; height: number }
 * ) & {
 *   [TAG_KEY_POINTER]?: 'type'
 * }
 */
export type AddTagKeyPointer<TaggedUnion, TagKey extends keyof TaggedUnion> = TaggedUnion & {
  [TAG_KEY_POINTER]?: TagKey
}

/**
 * Remove the tag-key-pointer property from the given tagged union type.
 * @see TAG_KEY_POINTER
 * @see AddTagKeyPointer
 */
export type RemoveTagKeyPointer<TaggedUnion> = Omit<TaggedUnion, typeof TAG_KEY_POINTER>

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
export type TagKeyOf<TaggedUnion> = TaggedUnion extends {
  [TAG_KEY_POINTER]?: infer TagKey extends keyof TaggedUnion
}
  ? TagKey
  : never

export type VariantOf<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
  K extends string | symbol,
> = Omit<Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>, typeof TAG_KEY_POINTER>

/**
 * @example
 * Given the type definition:
 * type Shape = TaggedUnion<{
 *   circle: { radius: number }
 *   rect: { width: number; height: number }
 * }>
 * The type:
 * type Payload = PayloadOf<Shape, 'circle'>
 * will resolve to:
 * type Payload = { radius: number }
 */
export type PayloadOf<
  TaggedUnion extends { [TAG_KEY_POINTER]?: keyof TaggedUnion } & Record<
    TagKeyOf<TaggedUnion>,
    string | symbol
  >,
  K extends string | symbol,
> = Omit<
  Extract<TaggedUnion, Record<TagKeyOf<TaggedUnion>, K>>,
  TagKeyOf<TaggedUnion> | typeof TAG_KEY_POINTER
>
