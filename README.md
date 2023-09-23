# ts-tagged-union

`ts-tagged-union` is a modern TypeScript library designed to reduce boilerplate for _tagged unions_, also known as _discriminated unions_.  
This library is essentially an implementation of [algebraic data types](https://wikipedia.org/wiki/Algebraic_data_type).  

## Features

- Define tagged union types easily
- Generate following helper functions for each tagged union type without code generation!
    1. **Data constructors**
    2. **Pattern matching functions**
    3. **Type predicates**
- 0 dependencies
- Works on both browsers and Node.js

## Basic example

```typescript
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

```typescript
const color = Math.random() < 0.5 ? Color.primary() : Color.secondary()

const cssColor = Color.match(color, {
  rgb: ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`,
  primary: () => '#C0FFEE', 
  secondary: () => 'blue',
})
```

The third argument acts as a so-called default case, as follows.  

```typescript
const isAchromatic = Color.match(
  color,
  { rgb: ({ r, g, b }) => r === g && g === b },
  (other) => false,
)
```

To perform **non-exhaustive** pattern matching, use `matchPartial` instead.  

## Type predicates

Type predicates are available as the `is` and `isNot` properties, as shown below.  

```typescript
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

The default tag key is the predefined symbol, exported as `defaultTagKey`.  
To define a tagged union type with the specified tag key, you can write as follows.  

```typescript
// Specify a custom tag key as the second argument.
type Response = TaggedUnion<
  {
    Success: { payload: Blob }   // Corresponds to { status: 'Success', payload: Blob }
    Failure: { message: string } // Corresponds to { status: 'Failure', message: string }
  },
  'status' // Either a string literal or symbol type
>
// You need to provide the tag key as an argument due to TypeScript specifications.
const Response = createHelperFunctions<Response>('status')
```

## Adapting to tagged union types defined without using this library

`createHelperFunctions` and other utilities do not work for tagged union types without a _tag-key-pointer_.  
The _tag-key-pointer_ is a special hidden property that specifies which property is a tag.  
It exists only at the type level, so it does not affect runtime.  
The key of the property is the predefined symbol exported as `tagKeyPointer`.  

The type defined with `TaggedUnion<T>` has the _tag-key-pointer_ property.  
To manually add it to an existing type, use `AddTagKeyPointer` as follows.  

```typescript
import { type AddTagKeyPointer, createHelperFunctions } from 'ts-tagged-union'

type RawTaggedUnion =
  | { type: 'circle', radius: number }
  | { type: 'rect', width: number; height: number }
type Shape = AddTagKeyPointer<RawTaggedUnion, 'type'>
const Shape = createHelperFunctions<TaggedUnion>('type')
```

If you need to remove the _tag-key-pointer_, use `RemoveTagKeyPointer`.  
