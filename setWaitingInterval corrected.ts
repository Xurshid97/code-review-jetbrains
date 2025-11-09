/**
 * Returns a function that sequentially provides delay values
 * from the given array, and then keeps returning the last one
 * once all have been used.
 * window is removed for Node.js compatibility
 *
 * Example:
 *   const nextDelay = getLastUntilOneLeft([1000, 2000, 3000]);
 *   nextDelay(); // 1000
 *   nextDelay(); // 2000
 *   nextDelay(); // 3000
 *   nextDelay(); // 3000
 */
function getLastUntilOneLeft(arr: number[]): () => number {
  let currentIndex = 0;

  return function getNextTimeout(): number {
    // Return next delay until end of array, then repeat the last value
    if (currentIndex < arr.length) {
      return arr[currentIndex++];
    }
    return arr[arr.length - 1];
  };
}

/**
 * Creates a manager for custom interval-like timers that:
 * - behave like `setInterval`, but without overlapping executions
 * - allow custom, *progressively increasing* delays
 * - clean up properly when cleared
 *
 * Usage:
 *   const manager = createWaitingIntervalManager();
 *   const id = manager.setWaitingInterval(
 *     () => console.log("tick"),
 *     [500, 1000, 2000] // delay progression
 *   );
 *   setTimeout(() => manager.clearWaitingInterval(id), 7000);
 */
export function createWaitingIntervalManager() {
  // Keeps track of all active intervals, mapping IDs to their timeout handles

  const map = new Map<number, NodeJS.Timeout>();

  // Unique incremental ID for each created interval
  let waitingIntervalId = 0;

  /**
   * Starts a managed "waiting interval".
   *
   * @param handler - The callback to run each cycle
   * @param timeouts - Array of delay durations to use progressively
   * @param args - Optional arguments passed to the handler
   * @returns A unique interval ID for cleanup
   */
  function setWaitingInterval(
    handler: (...args: any[]) => void,
    timeouts: number[],
    ...args: any[]
  ): number {
    waitingIntervalId += 1;
    const id = waitingIntervalId;

    // Create a delay generator function (preserves state between calls)
    const getNextDelay = getLastUntilOneLeft(timeouts);

    // Recursive timeout-based loop
    function internalHandler(): void {
      handler(...args); // Call user callback
      const delay = getNextDelay(); // Get next delay value
      const timeoutId = setTimeout(internalHandler, delay);
      map.set(id, timeoutId); // Track timeout for cleanup
    }

    // Schedule the first execution
    const firstDelay = getNextDelay();
    const timeoutId = setTimeout(internalHandler, firstDelay);
    map.set(id, timeoutId);

    return id;
  }

  /**
   * Clears a managed waiting interval by ID.
   * Ensures both the timeout and its map entry are removed.
   */
  function clearWaitingInterval(intervalId: number): void {
    const realTimeoutId = map.get(intervalId);
    if (typeof realTimeoutId === "number") {
      clearTimeout(realTimeoutId);
      map.delete(intervalId);
    }
  }

  // Return public API
  return { setWaitingInterval, clearWaitingInterval };
}

/* ---------------- Example Usage ---------------- */

const manager = createWaitingIntervalManager();

const id = manager.setWaitingInterval(
  () => console.log("Hello, world!"),
  [1000, 2000, 3000] // Delay progression
);

// Stop the interval after 10 seconds
setTimeout(() => manager.clearWaitingInterval(id), 10000);
