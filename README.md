# ts-tagged-union

`ts-tagged-union` is a TypeScript library for _tagged unions_, also known as _discriminated unions_.  
It offers the following helper functions for any tagged unions:  
1. Data constructors
2. Pattern matching function
3. Type predicates

This library is essentially an implementation of [algebraic data types](https://wikipedia.org/wiki/Algebraic_data_type).  

## Basic example

```typescript
import { type TaggedUnion, helperFunctionsOf } from 'ts-tagged-union'

// Define a tagged union type
export type Color = TaggedUnion<{
  rgb: { r: number; g: number; b: number }
  primary: {}
  secondary: {}
}>
// Get helper functions for the given type
export const Color = helperFunctionsOf<Color>()

// Create with a data constructor
const rgb = Color.rgb({ r: 255, g: 31, b: 0 })
const primary = Color.primary() // {} can be omitted

console.log(rgb) // { r: 255, g: 31, b: 0, [Symbol(DEFAULT_TAG_KEY)]: 'rgb' }
console.log(primary) // { [Symbol(DEFAULT_TAG_KEY)]: 'primary' }
```

## Pattern matching

To perform pattern matching, use the `match` function.  

```typescript
const color = Math.random() < 0.5 ? Color.rgb({ r: 255, g: 31, b: 0 }) : Color.primary()
const cssColor = Color.match(color, {
  rgb: ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`,
  primary: () => '#C0FFEE', 
  secondary: () => 'blue',
})
```

The third argument serves as a default case.  

```typescript
const isAchromatic = Color.match(
  color,
  {
    rgb: ({ r, g, b }) => r === g && g === b,
  },
  () => false,
)
```

To perform non-exhaustive pattern matching, use `matchPartial` instead.  

## Type predicates

To determine if it is a specific variant, you can write as follows.  

```typescript
if (Color.is.rgb(color)) {
  // Here, narrowing is applied, so you can access each property
  console.log(`rgb: ${color.r}, ${color.g}, ${color.b}`)
}
```

You can also use the `isNot` property.  

## Custom tag key

The default tag key is the predefined symbol, exported as `DEFAULT_TAG_KEY`.  
To define a tagged union type with the specified tag key, you can write as follows.  

```typescript
import { type TaggedUnion, helperFunctionsOf } from 'ts-tagged-union'

// Specify a custom tag key as the second argument.
type Response = TaggedUnion<
  {
    Success: { payload: Blob }   // Corresponds to { status: 'Success', payload: Blob }
    Failure: { message: string } // Corresponds to { status: 'Failure', message: string }
  },
  'status' // Either a string literal or symbol type
>
// You need to provide the tag key as an argument due to TypeScript specifications.
const Response = helperFunctionsOf<Response>('status')
```
