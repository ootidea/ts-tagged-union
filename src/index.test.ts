import { describe, expect, expectTypeOf, test } from 'vitest'
import { AddTagKeyPointer, DEFAULT_TAG_KEY, helperFunctionsOf, TaggedUnion } from './index'

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

describe('Type predicates', () => {
  test('is', () => {
    expect(Shape.is.circle(circle)).toBe(true)
    expect(Shape.is.rect(circle)).toBe(false)

    expect(NaturalNumber.is.Zero(one)).toBe(false)
    expect(NaturalNumber.is.Succ(one)).toBe(true)

    expect(Response.is.Success(success)).toBe(true)
    expect(Response.is.Failure(success)).toBe(false)
  })
  test('isNot', () => {
    expect(Shape.isNot.circle(circle)).toBe(false)
    expect(Shape.isNot.rect(circle)).toBe(true)

    expect(NaturalNumber.isNot.Zero(one)).toBe(true)
    expect(NaturalNumber.isNot.Succ(one)).toBe(false)

    expect(Response.isNot.Success(success)).toBe(false)
    expect(Response.isNot.Failure(success)).toBe(true)
  })
})

describe('Narrowing', () => {
  test('is', () => {
    if (Shape.is.circle(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [DEFAULT_TAG_KEY]: 'circle'
            radius: number
          },
          typeof DEFAULT_TAG_KEY
        >
      >()
    }

    if (Shape.is.rect(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [DEFAULT_TAG_KEY]: 'rect'
            width: number
            height: number
          },
          typeof DEFAULT_TAG_KEY
        >
      >()
    }

    if (NaturalNumber.is.Succ(one)) {
      expectTypeOf(one).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [DEFAULT_TAG_KEY]: 'Succ'
            pred: NaturalNumber
          },
          typeof DEFAULT_TAG_KEY
        >
      >()
    }
  })
  test('isNot', () => {
    if (Shape.isNot.circle(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [DEFAULT_TAG_KEY]: 'rect'
            width: number
            height: number
          },
          typeof DEFAULT_TAG_KEY
        >
      >()
    }

    if (Shape.isNot.rect(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [DEFAULT_TAG_KEY]: 'circle'
            radius: number
          },
          typeof DEFAULT_TAG_KEY
        >
      >()
    }

    if (NaturalNumber.isNot.Succ(one)) {
      expectTypeOf(one).toEqualTypeOf<never>()
    }
  })
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
