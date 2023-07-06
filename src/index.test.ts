import { describe, expect, test } from 'vitest'
import { defineTaggedUnion, ExtractTaggedUnionType, operatorsOf, TAG_KEY, TaggedUnion } from './index'

describe('operatorsOf', () => {
  type Shape = TaggedUnion<{ Rect: { width: number; height: number }; Circle: { radius: number } }>
  const Shape = operatorsOf<Shape>()
  const circle = Shape.Circle({ radius: 3 }) as Shape

  test('Data constructors', () => {
    expect(Shape.Circle({ radius: 3 })).toStrictEqual({ [TAG_KEY]: 'Circle', radius: 3 })
  })

  test('Type predicates', () => {
    expect(Shape.is.Circle(circle)).toStrictEqual(true)
    expect(Shape.is.Rect(circle)).toStrictEqual(false)
  })

  test('match', () => {
    expect(
      Shape.match(circle, {
        Rect: ({ width, height }) => width * height,
        Circle: ({ radius }) => radius * radius * Math.PI,
      }),
    ).toBe(3 * 3 * Math.PI)
  })
})

describe('defineTaggedUnion', () => {
  const Response = defineTaggedUnion<{
    Success: { payload: Blob }
    Failure: { message: string }
  }>().withTagKey('status')
  type Response = ExtractTaggedUnionType<typeof Response>
  const success = Response.Success({ payload: new Blob() }) as Response

  test('Data constructors', () => {
    expect(Response.Success({ payload: new Blob() })).toStrictEqual({ status: 'Success', payload: new Blob() })
    expect(Response.Failure({ message: 'error' })).toStrictEqual({ status: 'Failure', message: 'error' })
  })

  test('Type predicates', () => {
    expect(Response.is.Success(success)).toBe(true)
    expect(Response.is.Failure(success)).toBe(false)
  })

  test('match', () => {
    expect(
      Response.match(success, {
        Success: () => undefined,
        Failure: ({ message }) => message,
      }),
    ).toBe(undefined)
  })
})
