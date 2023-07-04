import { describe, expect, test } from 'vitest';
import { AlgebraicDataType, DISCRIMINANT, operatorsOf } from './index';

describe('operatorsOf', () => {
  type Shape = AlgebraicDataType<{ Rect: { width: number; height: number }; Circle: { radius: number } }>;
  const Shape = operatorsOf<Shape>();
  const circle = Shape.Circle({ radius: 3 }) as Shape;

  test('Data constructors', () => {
    expect(Shape.Circle({ radius: 3 })).toStrictEqual({ [DISCRIMINANT]: 'Circle', radius: 3 });
  });

  test('Type predicates', () => {
    expect(Shape.is.Circle(circle)).toStrictEqual(true);
    expect(Shape.is.Rect(circle)).toStrictEqual(false);
  });

  test('match', () => {
    expect(
      Shape.match(circle, {
        Rect: ({ width, height }) => width * height,
        Circle: ({ radius }) => radius * radius * Math.PI,
      }),
    ).toBe(3 * 3 * Math.PI);
  });
});
