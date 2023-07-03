import { expect, test } from 'vitest';
import { AlgebraicDataType, createCtors, createTypePredicates, DISCRIMINANT, match } from './index';

test('Ctors', () => {
  type Shape = AlgebraicDataType<{ Rect: { width: number; height: number }; Circle: { radius: number } }>;
  const ctors = createCtors<Shape>();
  expect(ctors.Circle({ radius: 3 })).toStrictEqual({ [DISCRIMINANT]: 'Circle', radius: 3 });
});

test('match', () => {
  type Shape = AlgebraicDataType<{ Rect: { width: number; height: number }; Circle: { radius: number } }>;
  const ctors = createCtors<Shape>();
  const shape = ctors.Circle({ radius: 3 }) as Shape;
  expect(
    match(shape, {
      Rect: ({ width, height }) => width * height,
      Circle: ({ radius }) => radius * radius * Math.PI,
    }),
  ).toBe(3 * 3 * Math.PI);
});

test('Type predicates', () => {
  type Shape = AlgebraicDataType<{ Rect: { width: number; height: number }; Circle: { radius: number } }>;
  const ctors = createCtors<Shape>();
  const circle = ctors.Circle({ radius: 3 }) as Shape;
  const is = createTypePredicates<Shape>();
  expect(is.Circle(circle)).toStrictEqual(true);
  expect(is.Rect(circle)).toStrictEqual(false);
});
