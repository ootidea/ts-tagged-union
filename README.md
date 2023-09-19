# ts-tagged-union

This is a TypeScript library for _tagged unions_, also known as _discriminated unions_.  
It offers the following helper functions for any tagged unions:  
1. Data constructors
2. Pattern matching function
3. Type predicates

This library is essentially an implementation of [algebraic data types](https://wikipedia.org/wiki/Algebraic_data_type).  

## Basic example

```typescript
import { type TaggedUnion, helperFunctionsOf } from 'ts-tagged-union'

// Define a tagged union type
export type Shape = TaggedUnion<{
  circle: { radius: number }
  rect: { width: number; height: number }
}>
// Get helper functions for Shape type
export const Shape = helperFunctionsOf<Shape>()

// Data constructors
const shape = Math.random() < 0.5 ? Shape.circle({ radius: 4 }) : Shape.rect({ width: 6, height: 8 })

// Type predicates
if (Shape.is.circle(shape)) {
  console.log(`circle: radius = ${shape.radius}`)
} else if (Shape.is.rect(shape)) {
  console.log(`rect: width = ${shape.width}, height = ${shape.height}`)
}

// Pattern matching function
const area = Shape.match(shape, {
  circle: ({ radius }) => radius * radius * Math.PI,
  rect: ({ width, height }) => width * height,
})
```

## Custom tag key

The default tag key is the symbol, exported as `DEFAULT_TAG_KEY`.  
You can use custom tag key by writing as follows.  

```typescript
import { type TaggedUnion, helperFunctionsOf } from 'ts-tagged-union'

// Specify a custom tag key as the second argument.
type Response = TaggedUnion<
  {
    Success: { payload: Blob }   // Corresponds to { status: 'Success', payload: Blob }
    Failure: { message: string } // Corresponds to { status: 'Failure', message: string }
  },
  'status'
>
// You need to provide a custom tag key as an argument due to TypeScript specifications.
const Response = helperFunctionsOf<Response>('status')
```
