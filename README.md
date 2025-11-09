# Code Review: `setWaitingInterval.ts`

## Summary

The file implements a custom `setWaitingInterval` function with delays increasing based on a provided timeout list. The implementation has correctness, maintainability, and type-safety problems and should be corrected.

## Key Issues

### 1. Global Shared State

Both `waitingIntervalId` and `map` are global. One interval could overwrite another, or old data might never be cleared. Can cause memory leaks if map keeps growing.

**\*Fix**: Wrap everything inside a function or class.\*


### 2. Argument Passing Bug

```ts
handler(argsInternal);
```

This passes the arguments as a single array.

_Fix:_

```ts
handler(...argsInternal);
```

### 3. Mutation of the timeouts Array

`getLastUntilOneLeft()` uses `arr.pop()`, which mutates the array. Because arrays are passed by reference, this leads to hidden side effects and unpredictable timing.

Fix: Do not mutate input; track an index instead.

```ts
function getLastUntilOneLeft(arr: number[]): number {
  let currentIndex = 0;

  return function getNextTimeout(): number {
    if (currentIndex < arr.length) {
      return arr[currentIndex++];
    }
    return arr[arr.length - 1];
  }
}
```

### 4. Incomplete Cleanup in clearWaitingInterval

The timeout is cleared, but the entry is not removed from map, causing memory leaks.

```ts
map.delete(intervalId);
```

### 5. Inconsistent Use of args

The initial call uses `...args`, while recursive calls use handler return arguments. The behavior is inconsistent and confusing.

_Fix: Always use `...args` or always use the return value of handler, but not both._

### 6. Weak Typing

handler: Function removes type safety.

```ts
handler: (...args: any[]) => void
```

