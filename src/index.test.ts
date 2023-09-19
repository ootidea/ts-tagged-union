import { describe, expect, expectTypeOf, test } from 'vitest'
import {
  AddHiddenTagKey,
  DEFAULT_TAG_KEY,
  DefaultTagKey,
  helperFunctionsOf,
  TaggedUnion,
} from './index'

describe('helperFunctionsOf', () => {
  type Shape = TaggedUnion<{ rect: { width: number; height: number }; circle: { radius: number } }>
  const Shape = helperFunctionsOf<Shape>()
  const circle = Shape.circle({ radius: 3 }) as Shape

  // Recursive type
  type NaturalNumber = TaggedUnion<{ Zero: {}; Succ: { pred: NaturalNumber } }>
  const NaturalNumber = helperFunctionsOf<NaturalNumber>()
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
  const Response = helperFunctionsOf<Response>('status')
  const success = Response.Success({ payload: new Blob() }) as Response

  test('Data constructors', () => {
    expect(circle).toStrictEqual({ [DEFAULT_TAG_KEY]: 'circle', radius: 3 })

    expect(zero).toStrictEqual({ [DEFAULT_TAG_KEY]: 'Zero' })

    expect(success).toStrictEqual({
      status: 'Success',
      payload: new Blob(),
    })
  })

  test('Type predicates', () => {
    expect(Shape.is.circle(circle)).toBe(true)
    expect(Shape.is.rect(circle)).toBe(false)

    expect(NaturalNumber.is.Zero(one)).toBe(false)
    expect(NaturalNumber.is.Succ(one)).toBe(true)

    expect(Response.is.Success(success)).toBe(true)
    expect(Response.is.Failure(success)).toBe(false)
  })

  test('Narrowing', () => {
    if (Shape.is.circle(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddHiddenTagKey<
          {
            [DEFAULT_TAG_KEY]: 'circle'
            radius: number
          },
          DefaultTagKey
        >
      >()
    }

    if (Shape.is.rect(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddHiddenTagKey<
          {
            [DEFAULT_TAG_KEY]: 'rect'
            width: number
            height: number
          },
          DefaultTagKey
        >
      >()
    }

    if (NaturalNumber.is.Succ(one)) {
      expectTypeOf(one).toEqualTypeOf<
        AddHiddenTagKey<
          {
            [DEFAULT_TAG_KEY]: 'Succ'
            pred: NaturalNumber
          },
          DefaultTagKey
        >
      >()
    }
  })

  test('match', () => {
    expect(
      Shape.match(circle, {
        rect: ({ width, height }) => width * height,
        circle: ({ radius }) => radius * radius * Math.PI,
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

  test('match with default case', () => {
    expect(
      Shape.match(
        circle,
        {
          rect: ({ width, height }) => width * height,
        },
        () => NaN,
      ),
    ).toBeNaN()

    expect(
      Response.match(
        success,
        {
          Success: ({ payload }) => payload.size,
        },
        () => 'unknown',
      ),
    ).toBe(0)
  })
})
