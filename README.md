# ts-tagged-union

This is a TypeScript library designed for working with _tagged union types_, also known as _discriminated union types_.  
It can **generate** the following helper functions for any tagged union type.
1. Data constructors
2. Pattern matching function
3. Type predicates

This library can be described as an implementation of [algebraic data types](https://wikipedia.org/wiki/Algebraic_data_type).

## Basic example

```typescript
import { type TaggedUnion, createOperators } from 'ts-tagged-union'

// Define a tagged union type
export type Shape = TaggedUnion<{
  Circle: { radius: number }
  Rect: { width: number; height: number }
}>
// Obtain helper functions
export const Shape = createOperators<Shape>()

// Data constructors
const shape = Math.random() < 0.5 ? Shape.Circle({ radius: 4 }) : Shape.Rect({ width: 6, height: 8 })

// Type predicates
if (Shape.is.Circle(shape)) {
  console.log(`Circle: radius = ${shape.radius}`)
} else if (Shape.is.Rect(shape)) {
  console.log(`Rect: width = ${shape.width}, height = ${shape.height}`)
}

// Pattern matching function
const area = Shape.match(shape, {
  Circle: ({ radius }) => radius * radius * Math.PI,
  Rect: ({ width, height }) => width * height,
})
```
