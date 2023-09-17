import { describe, expect, expectTypeOf, test } from 'vitest'
import { createOperators, TAG_KEY, TaggedUnion, withTagKey } from './index'

describe('createOperators', () => {
  type Shape = TaggedUnion<{ Rect: { width: number; height: number }; Circle: { radius: number } }>
  const Shape = createOperators<Shape>()
  const circle = Shape.Circle({ radius: 3 }) as Shape

  // Recursive type
  type NaturalNumber = TaggedUnion<{ Zero: {}; Succ: { pred: NaturalNumber } }>
  const NaturalNumber = createOperators<NaturalNumber>()
  const zero = NaturalNumber.Zero()
  const one = NaturalNumber.Succ({ pred: zero })

  // Custom tag key
  type Response = TaggedUnion<
    {
      Success: { payload: Blob }
      Failure: { message: string }
    },
    'status'
  >
  const Response = withTagKey('status').createOperators<Response>()
  const success = Response.Success({ payload: new Blob() }) as Response

  test('Data constructors', () => {
    expect(circle).toStrictEqual({ [TAG_KEY]: 'Circle', radius: 3 })

    expect(zero).toStrictEqual({ [TAG_KEY]: 'Zero' })

    expect(success).toStrictEqual({
      status: 'Success',
      payload: new Blob(),
    })
  })

  test('Type predicates', () => {
    expect(Shape.is.Circle(circle)).toBe(true)
    expect(Shape.is.Rect(circle)).toBe(false)

    expect(NaturalNumber.is.Zero(one)).toBe(false)
    expect(NaturalNumber.is.Succ(one)).toBe(true)

    expect(Response.is.Success(success)).toBe(true)
    expect(Response.is.Failure(success)).toBe(false)
  })

  test('Narrowing', () => {
    if (Shape.is.Circle(circle)) {
      expectTypeOf(circle).toEqualTypeOf<{
        [TAG_KEY]: 'Circle'
        radius: number
      }>()
    }

    if (Shape.is.Rect(circle)) {
      expectTypeOf(circle).toEqualTypeOf<{
        [TAG_KEY]: 'Rect'
        width: number
        height: number
      }>()
    }

    if (NaturalNumber.is.Succ(one)) {
      expectTypeOf(one).toEqualTypeOf<{
        [TAG_KEY]: 'Succ'
        pred: NaturalNumber
      }>()
    }
  })

  test('match', () => {
    expect(
      Shape.match(circle, {
        Rect: ({ width, height }) => width * height,
        Circle: ({ radius }) => radius * radius * Math.PI,
      }),
    ).toBe(3 * 3 * Math.PI)

    expect(
      NaturalNumber.match(one, {
        Zero: () => undefined,
        Succ: ({ pred }) => pred,
      }),
    ).toStrictEqual(zero)

    expect(
      Response.match(success, {
        Success: () => undefined,
        Failure: ({ message }) => message,
      }),
    ).toBe(undefined)
  })
})
