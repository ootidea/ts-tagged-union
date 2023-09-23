<h1 align="center">ts-tagged-union</h1>

A modern TypeScript library designed to reduce boilerplate for _tagged unions_, also known as _discriminated unions_.  
This library is also an implementation of [algebraic data types](https://wikipedia.org/wiki/Algebraic_data_type).  

## Features

- Define tagged union types easily
- Generate following helper functions for each tagged union type (without code generation 👍)
    1. **Data constructors**
    2. **Pattern matching functions**
    3. **Type guard functions**
- 0 dependencies
- Works on both browsers and Node.js

## Basic example

This is an example of defining a simple tagged union type and creating its values.  

```ts
import { type TaggedUnion, createHelperFunctions } from 'ts-tagged-union'

// Define a tagged union type
export type Color = TaggedUnion<{
  rgb: { r: number; g: number; b: number }
  primary: {}
  secondary: {}
}>

// Get helper functions for the type
export const Color = createHelperFunctions<Color>()

// Create with a data constructor
const rgb = Color.rgb({ r: 255, g: 31, b: 0 })
const primary = Color.primary() // {} can be omitted

console.log(rgb) // { r: 255, g: 31, b: 0, [Symbol(defaultTagKey)]: 'rgb' }
console.log(primary) // { [Symbol(defaultTagKey)]: 'primary' }
```

## Pattern matching

To perform **exhaustive** pattern matching, use the `match` function.  

```ts
const color = Math.random() < 0.5 ? Color.primary() : Color.secondary()

const cssColor = Color.match(color, {
  rgb: ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`,
  primary: () => '#C0FFEE', 
  secondary: () => 'blue',
})
```

The third argument acts as a so-called default case, as follows.  

```ts
const isAchromatic = Color.match(
  color,
  { rgb: ({ r, g, b }) => r === g && g === b },
  (other) => false,
)
```

To perform **non-exhaustive** pattern matching, use `matchPartial` instead.  

## Type guard functions

Type guard functions are available as the `is` and `isNot` properties, as shown below.  

```ts
if (Color.is.rgb(color)) {
  // Here, the variable is narrowed to the rgb variant type.
  console.log(`rgb: ${color.r}, ${color.g}, ${color.b}`)
}

if (Color.isNot.secondary(color)) {
  // Here, the variable is narrowed to the rgb or primary variant type.
  console.log(color)
}
```

## Custom tag key

The key of the property used to distinguish each variant is called _tag key_.  
You can specify a tag key as the second argument to `TaggedUnion<T>` as follows.  

```ts
// Define a tagged union type with a custom tag key, 'status'
type Response = TaggedUnion<
  {
    Success: { payload: Blob }
    Failure: { message: string }
  },
  'status' // Either a string literal or symbol type
>
// You need to provide the tag key as an argument due to TypeScript specifications.
const Response = createHelperFunctions<Response>('status')
```

## Adapters for tagged union types defined without using this library

`createHelperFunctions` and other utilities do not work for tagged union types without a _tag-key-pointer_.  
The _tag-key-pointer_ is a special hidden property that specifies which property is a tag.  
It exists only at the type level, so it does not affect runtime.  

The type defined with `TaggedUnion<T>` has the _tag-key-pointer_ property.  
To manually add it to an existing type, use `AddTagKeyPointer` as follows.  

```ts
import { type AddTagKeyPointer, createHelperFunctions } from 'ts-tagged-union'

type RawTaggedUnion =
  | { type: 'circle', radius: number }
  | { type: 'rect', width: number; height: number }

type Shape = AddTagKeyPointer<RawTaggedUnion, 'type'>
const Shape = createHelperFunctions<TaggedUnion>('type')
```

If you need to remove the _tag-key-pointer_, use `RemoveTagKeyPointer`.  
