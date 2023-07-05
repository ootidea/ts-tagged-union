# algebraic-data-type

A TypeScript library for using algebraic data types, discriminated union types and tagged union types.  
You can generate the following basic functions for the defined algebraic data types.  
1. Data constructors
2. Pattern matching function
3. Type predicates

## Basic example

```typescript
import { type AlgebraicDataType, operatorsOf } from 'algebraic-data-type';

export type Shape = AlgebraicDataType<{
  Circle: { radius: number };
  Rect: { width: number; height: number };
}>;
export const Shape = operatorsOf<Shape>();

// Data constructors
const shape = Math.random() < 0.5 ? Shape.Circle({ radius: 4 }) : Shape.Rect({ width: 6, height: 8 })

// Type predicates
if (Shape.is.Circle(shape)) {
  console.log(`Circle: radius = ${shape.radius}`);
} else if (Shape.is.Rect(shape)) {
  console.log(`Rect: width = ${shape.width}, height = ${shape.height}`);
}

// Pattern matching function
const area = Shape.match(shape, {
  Circle: ({ radius }) => radius * radius * Math.PI,
  Rect: ({ width, height }) => width * height,
});
```
