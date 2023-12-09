import { describe, expect, expectTypeOf, test } from 'vitest'
import { createHelperFunctions } from './createHelperFunctions'
import { AddTagKeyPointer, defaultTagKey, TaggedUnion } from './index'

type Shape = TaggedUnion<{ rect: { width: number; height: number }; circle: { radius: number } }>
const Shape = createHelperFunctions<Shape>()
const circle = Shape.circle({ radius: 3 }) as Shape

// Recursive type
type NaturalNumber = TaggedUnion<{ Zero: {}; Succ: { pred: NaturalNumber } }>
const NaturalNumber = createHelperFunctions<NaturalNumber>()
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
const Response = createHelperFunctions<Response>('status')
const success = Response.Success({ payload: new Blob() }) as Response
const failure = Response.Failure({ message: 'Something went wrong' }) as Response

test('Data constructors', () => {
  expect(circle).toStrictEqual({ [defaultTagKey]: 'circle', radius: 3 })

  expect(zero).toStrictEqual({ [defaultTagKey]: 'Zero' })

  expect(success).toStrictEqual({
    status: 'Success',
    payload: new Blob(),
  })
})

describe('Type guard functions', () => {
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
            [defaultTagKey]: 'circle'
            radius: number
          },
          typeof defaultTagKey
        >
      >()
    }

    if (Shape.is.rect(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [defaultTagKey]: 'rect'
            width: number
            height: number
          },
          typeof defaultTagKey
        >
      >()
    }

    if (NaturalNumber.is.Succ(one)) {
      expectTypeOf(one).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [defaultTagKey]: 'Succ'
            pred: NaturalNumber
          },
          typeof defaultTagKey
        >
      >()
    }
  })
  test('isNot', () => {
    if (Shape.isNot.circle(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [defaultTagKey]: 'rect'
            width: number
            height: number
          },
          typeof defaultTagKey
        >
      >()
    }

    if (Shape.isNot.rect(circle)) {
      expectTypeOf(circle).toEqualTypeOf<
        AddTagKeyPointer<
          {
            [defaultTagKey]: 'circle'
            radius: number
          },
          typeof defaultTagKey
        >
      >()
    }

    if (NaturalNumber.isNot.Succ(one)) {
      expectTypeOf(one).toEqualTypeOf<never>()
    }
  })
})

describe('Pattern matching', () => {
  test('match without default case', () => {
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

  test('matchPartial without default case', () => {
    expect(
      Shape.matchPartial(circle, {
        rect: ({ width, height }) => width * height,
        circle: ({ radius }) => radius * radius * Math.PI,
      }),
    ).toBe(3 * 3 * Math.PI)

    expect(
      NaturalNumber.matchPartial(zero, {
        Succ: ({ pred }) => pred,
      }),
    ).toBe(undefined)
  })

  test('matchPartial with default case', () => {
    expect(
      Response.matchPartial(
        success,
        {
          Failure: ({ message }) => message,
        },
        () => 'success!',
      ),
    ).toBe('success!')

    expect(
      Response.matchPartial(
        failure,
        {
          Failure: () => 0,
        },
        ({ payload }) => payload.size,
      ),
    ).toBe(0)
  })
})

test('tagKey property', () => {
  expect(Shape.tagKey).toBe(defaultTagKey)
  expect(NaturalNumber.tagKey).toBe(defaultTagKey)
  expect(Response.tagKey).toBe('status')
})
